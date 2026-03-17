import { NextResponse } from 'next/server';
import { parseFile } from '@/lib/parsers';
import { generateFAQs } from '@/lib/openai';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;
    const title = formData.get('title') as string | null;
    const link = formData.get('link') as string | null;

    let content: string;
    let sourceType: string;
    let fileName: string | null = null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;
      const parsed = await parseFile(buffer, fileName);
      content = parsed.text;
      sourceType = parsed.type;
    } else if (text && text.trim().length > 0) {
      content = text.trim();
      sourceType = 'paste';
    } else {
      return NextResponse.json(
        { error: 'Please provide either a file or text content' },
        { status: 400 }
      );
    }

    if (content.length < 50) {
      return NextResponse.json(
        { error: 'Content is too short. Please provide at least 50 characters.' },
        { status: 400 }
      );
    }

    // Truncate very long content to avoid token limits
    const maxChars = 100000;
    if (content.length > maxChars) {
      content = content.substring(0, maxChars);
    }

    // Generate FAQs with OpenAI
    const result = await generateFAQs(content, link || undefined);

    // Determine document title
    const docTitle = title || fileName || 'Pasted text';

    const faqsResponse = result.faqs.map((faq) => ({
      ...faq,
      category: result.category,
      selected: true,
    }));

    // Save document metadata to Supabase (skip if not configured)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        faqs: faqsResponse,
        document_id: null,
        document_title: docTitle,
        category: result.category,
      });
    }

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        title: docTitle,
        source_type: sourceType,
        file_name: fileName,
        content_preview: content.substring(0, 500),
        character_count: content.length,
      })
      .select()
      .single();

    if (docError) {
      console.error('Supabase document insert error:', docError);
      return NextResponse.json({
        faqs: faqsResponse,
        document_id: null,
        document_title: docTitle,
        category: result.category,
      });
    }

    return NextResponse.json({
      faqs: faqsResponse,
      document_id: doc.id,
      document_title: docTitle,
      category: result.category,
    });
  } catch (error) {
    console.error('Generate error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate FAQs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
