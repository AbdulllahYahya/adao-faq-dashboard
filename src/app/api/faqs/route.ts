import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const bucketId = searchParams.get('bucket_id');

    let query = supabase
      .from('faqs')
      .select('*, bucket:faq_buckets(*), document:documents(*)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (bucketId) {
      query = query.eq('bucket_id', bucketId);
    }

    if (search) {
      query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/faqs error:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database is not configured. Please set up Supabase credentials in .env.local' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { document_id, faqs, link, category } = body;

    if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one FAQ' },
        { status: 400 }
      );
    }

    // Look up bucket by category name
    let bucketId: string | null = null;
    if (category) {
      const { data: bucket } = await supabase
        .from('faq_buckets')
        .select('id')
        .eq('name', category)
        .single();
      bucketId = bucket?.id || null;
    }

    const faqRows = faqs.map((faq: { question: string; answer: string }, index: number) => ({
      document_id: document_id || null,
      bucket_id: bucketId,
      question: faq.question,
      answer: faq.answer,
      link: link || null,
      status: 'draft' as const,
      sort_order: index,
    }));

    const { data, error } = await supabase
      .from('faqs')
      .insert(faqRows)
      .select('*, bucket:faq_buckets(*), document:documents(*)');

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('POST /api/faqs error:', error);
    return NextResponse.json({ error: 'Failed to save FAQs' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database is not configured.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No FAQ IDs provided' }, { status: 400 });
    }

    if (!['draft', 'published'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('faqs')
      .update({ status })
      .in('id', ids)
      .select('*, bucket:faq_buckets(*), document:documents(*)');

    if (error) {
      console.error('Supabase bulk update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH /api/faqs error:', error);
    return NextResponse.json({ error: 'Failed to update FAQs' }, { status: 500 });
  }
}
