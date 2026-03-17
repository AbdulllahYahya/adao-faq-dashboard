import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ buckets: [], totalCount: 0 });
    }

    // Fetch buckets with FAQ counts
    const { data: buckets, error } = await supabase
      .from('faq_buckets')
      .select('*, faqs(count)')
      .order('name');

    if (error) {
      console.error('Supabase buckets fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get total FAQ count
    const { count: totalCount } = await supabase
      .from('faqs')
      .select('*', { count: 'exact', head: true });

    // Transform to include faq_count
    const bucketsWithCounts = (buckets || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      faq_count: b.faqs?.[0]?.count || 0,
    }));

    return NextResponse.json({ buckets: bucketsWithCounts, totalCount: totalCount || 0 });
  } catch (error) {
    console.error('GET /api/buckets error:', error);
    return NextResponse.json({ error: 'Failed to fetch buckets' }, { status: 500 });
  }
}
