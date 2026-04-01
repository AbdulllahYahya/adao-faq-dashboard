import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Category mapping: AI categorizer output -> bucket name in Supabase
const CATEGORY_TO_BUCKET: Record<string, string> = {
  FUNDAMENTALS: 'Fundamentals',
  EXPOSURE: 'Exposure Contexts',
  HEALTH_EFFECTS: 'Health Effects',
  MEDICAL_MANAGEMENT: 'Medical Management',
  SAFETY_ABATEMENT: 'Safety & Abatement',
  REGULATION_POLICY: 'Regulation & Policy',
  LEGAL_COMPENSATION: 'Legal & Compensation',
  ADAO: 'ADAO Org & Leadership',
  EVENTS_ADVOCACY: 'Events & Advocacy',
  PEOPLE: 'PEOPLE', // special case — handled separately
};

// Simple keyword-based categorizer (avoids needing AI for categorization)
function categorize(question: string): string {
  const q = question.toLowerCase();

  // PEOPLE — "who is" pattern
  if (/^who is\b/.test(q)) return 'PEOPLE';

  // MEDICAL_MANAGEMENT
  if (/\b(diagnos|screening|treatment|therap|surgery|chemotherapy|radiation|clinical trial|immunotherapy|specialist|oncologist|biopsy|ct scan|x-ray|treatment center)\b/.test(q)) return 'MEDICAL_MANAGEMENT';

  // SAFETY_ABATEMENT
  if (/\b(test for asbestos|removal|abatement|encapsulat|contractor|disposal|renovation|demolition|inspect|safely remov|ppe|protective equipment)\b/.test(q)) return 'SAFETY_ABATEMENT';

  // LEGAL_COMPENSATION
  if (/\b(lawsuit|sue|lawyer|attorney|litigation|trust fund|compensation|settlement|verdict|statute|claim|bankruptcy|legal option|legal right)\b/.test(q)) return 'LEGAL_COMPENSATION';

  // REGULATION_POLICY
  if (/\b(epa|osha|tsca|regulation|ban|arban|legislation|permissible limit|pel|compliance|ahera|congress|senate|toxic substance|policy|rule)\b/.test(q)) return 'REGULATION_POLICY';

  // EVENTS_ADVOCACY
  if (/\b(gaaw|global asbestos awareness|conference|aapc|awareness week|vigil|memorial|campaign|poster series|badges|selikoff|warren zevon|asbestonomy|candle ?light|event)\b/.test(q)) return 'EVENTS_ADVOCACY';

  // ADAO org
  if (/\b(adao|donate|donation|volunteer|get involved|leadership|board|linda reinstein|mission|fact sheet|sponsor|share your story|founded)\b/.test(q)) return 'ADAO';

  // HEALTH_EFFECTS
  if (/\b(mesothelioma|lung cancer|asbestosis|pleural|symptom|latency|disease|health risk|dangerous|inflammation|scarring|fibrosis|malignant|cancer)\b/.test(q)) return 'HEALTH_EFFECTS';

  // EXPOSURE
  if (/\b(expos|where found|high.risk|occupation|veteran|firefighter|construction|shipyard|home|school|workplace|building|hurricane|wildfire|disaster|brake pad|talc|cosmetic)\b/.test(q)) return 'EXPOSURE';

  // Default: FUNDAMENTALS
  return 'FUNDAMENTALS';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    const q = question.trim();

    // ============================================================
    // STEP 1: Try full-text search across ALL published FAQs
    // ============================================================
    const searchTerms = q
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 2)
      .join(' & ');

    let matchedFaq = null;

    if (searchTerms) {
      // Full-text search
      const { data: ftsResults } = await supabase
        .from('faqs')
        .select('id, question, answer, link, bucket_id, bucket:faq_buckets(name)')
        .eq('status', 'published')
        .textSearch('fts', searchTerms, { type: 'plain' })
        .limit(5);

      if (ftsResults && ftsResults.length > 0) {
        // Pick best match using trigram similarity on question
        const { data: trigramResults } = await supabase
          .rpc('match_faq', { search_query: q, match_limit: 1 });

        if (trigramResults && trigramResults.length > 0 && trigramResults[0].similarity > 0.15) {
          matchedFaq = trigramResults[0];
        } else {
          // Use first FTS result
          const r = ftsResults[0];
          matchedFaq = {
            id: r.id,
            question: r.question,
            answer: r.answer,
            link: r.link,
            bucket_name: (r.bucket as any)?.name || null,
          };
        }
      }
    }

    // Also try trigram if FTS found nothing
    if (!matchedFaq) {
      const { data: trigramResults } = await supabase
        .rpc('match_faq', { search_query: q, match_limit: 1 });

      if (trigramResults && trigramResults.length > 0 && trigramResults[0].similarity > 0.15) {
        matchedFaq = trigramResults[0];
      }
    }

    // ============================================================
    // MATCH FOUND → Return direct answer
    // ============================================================
    if (matchedFaq) {
      return NextResponse.json({
        matched: true,
        faq: {
          question: matchedFaq.question,
          answer: matchedFaq.answer,
          link: matchedFaq.link || null,
          category: matchedFaq.bucket_name || null,
        },
      });
    }

    // ============================================================
    // NO MATCH → Categorize + return all FAQs from that bucket
    // ============================================================
    const category = categorize(q);

    // Special case: PEOPLE
    if (category === 'PEOPLE') {
      return NextResponse.json({
        matched: false,
        category: 'PEOPLE',
        faqs: [],
      });
    }

    const bucketName = CATEGORY_TO_BUCKET[category];

    // Get bucket ID
    const { data: bucket } = await supabase
      .from('faq_buckets')
      .select('id')
      .eq('name', bucketName)
      .single();

    if (!bucket) {
      return NextResponse.json({
        matched: false,
        category,
        faqs: [],
      });
    }

    // Pull all published FAQs from that bucket
    const { data: categoryFaqs } = await supabase
      .from('faqs')
      .select('question, answer, link')
      .eq('bucket_id', bucket.id)
      .eq('status', 'published')
      .order('sort_order');

    return NextResponse.json({
      matched: false,
      category,
      bucket_name: bucketName,
      faqs: categoryFaqs || [],
    });
  } catch (error) {
    console.error('FAQ match error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
