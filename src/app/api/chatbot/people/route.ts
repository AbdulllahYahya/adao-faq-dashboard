import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    }

    const searchName = name.trim();

    // Try exact match first
    const { data: exactMatch } = await supabase
      .from('people')
      .select('*')
      .ilike('name', `%${searchName}%`)
      .limit(1);

    if (exactMatch && exactMatch.length > 0) {
      const p = exactMatch[0];
      return NextResponse.json({
        found: true,
        person: {
          name: p.name,
          title: p.title,
          board_role: p.board_role,
          information: p.information,
          ai_bio: p.ai_bio,
          link: p.link,
          image_url: p.image_url,
        },
      });
    }

    // Try searching by individual words (first name or last name)
    const nameParts = searchName.split(/\s+/).filter((w: string) => w.length > 2);
    for (const part of nameParts) {
      const { data: partialMatch } = await supabase
        .from('people')
        .select('*')
        .ilike('name', `%${part}%`)
        .limit(3);

      if (partialMatch && partialMatch.length > 0) {
        if (partialMatch.length === 1) {
          const p = partialMatch[0];
          return NextResponse.json({
            found: true,
            person: {
              name: p.name,
              title: p.title,
              board_role: p.board_role,
              information: p.information,
              ai_bio: p.ai_bio,
              link: p.link,
              image_url: p.image_url,
            },
          });
        }
        // Multiple matches — return list
        return NextResponse.json({
          found: true,
          multiple: true,
          people: partialMatch.map((p: any) => ({
            name: p.name,
            title: p.title,
            board_role: p.board_role,
            ai_bio: p.ai_bio,
            link: p.link,
          })),
        });
      }
    }

    return NextResponse.json({ found: false });
  } catch (error) {
    console.error('People lookup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
