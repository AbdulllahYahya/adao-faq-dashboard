import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    const q = question.trim();

    // Extract meaningful keywords (3+ chars, skip common words)
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'has',
      'was', 'one', 'our', 'out', 'are', 'how', 'what', 'when', 'where',
      'which', 'who', 'why', 'this', 'that', 'with', 'from', 'have', 'does',
      'about', 'been', 'will', 'more', 'some', 'than', 'them', 'then',
      'into', 'also', 'just', 'tell',
    ]);

    const keywords = q
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 2 && !stopWords.has(w));

    if (keywords.length === 0) {
      return NextResponse.json({ videos: [] });
    }

    // Search by title and summary using ilike for each keyword
    // Use OR across keywords to find any relevant match
    const searchPattern = keywords.slice(0, 5).map((k: string) => `%${k}%`);

    let orConditions = searchPattern
      .map((p: string) => `title.ilike.${p},summary.ilike.${p}`)
      .join(',');

    const { data: videos } = await supabase
      .from('yt_knowledge_base')
      .select('id, title, link, summary, faqs, year')
      .or(orConditions)
      .limit(3);

    if (!videos || videos.length === 0) {
      return NextResponse.json({ videos: [] });
    }

    // Format response
    const results = videos.map((v: any) => ({
      title: v.title,
      link: v.link,
      summary: v.summary,
      faqs: v.faqs,
      year: v.year,
    }));

    return NextResponse.json({ videos: results });
  } catch (error) {
    console.error('YT match error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
