import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as Papa from 'papaparse';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database is not configured. Please set up Supabase credentials.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Please provide a CSV file' }, { status: 400 });
    }

    const csvText = await file.text();
    const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    if (result.errors.length > 0 && result.data.length === 0) {
      return NextResponse.json({ error: 'Failed to parse CSV file' }, { status: 400 });
    }

    const rows = result.data as Record<string, string>[];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Fetch all buckets for category lookup
    const { data: buckets } = await supabase
      .from('faq_buckets')
      .select('id, name');

    const bucketMap = new Map<string, string>();
    if (buckets) {
      for (const b of buckets) {
        bucketMap.set(b.name.toLowerCase().trim(), b.id);
      }
    }

    // Create a document record for this import
    const { data: doc } = await supabase
      .from('documents')
      .insert({
        title: file.name.replace(/\.csv$/i, ''),
        source_type: 'csv',
        file_name: file.name,
        content_preview: `CSV import: ${rows.length} rows`,
        character_count: csvText.length,
      })
      .select()
      .single();

    const documentId = doc?.id || null;

    // Map CSV rows to FAQ records, skip rows without question or answer
    let skipped = 0;
    const faqRows: Array<{
      document_id: string | null;
      bucket_id: string | null;
      question: string;
      answer: string;
      link: string | null;
      status: 'published';
      sort_order: number;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Try multiple possible column names (case-insensitive)
      const question = (row['FAQ'] || row['faq'] || row['Question'] || row['question'] || '').trim();
      const answer = (row['ANSWER'] || row['Answer'] || row['answer'] || '').trim();
      const url = (row['URL'] || row['url'] || row['Url'] || row['link'] || '').trim();
      const category = (row['CATEGORY'] || row['Category'] || row['category'] || '').trim();

      if (!question || !answer) {
        skipped++;
        continue;
      }

      const bucketId = category ? (bucketMap.get(category.toLowerCase().trim()) || null) : null;

      faqRows.push({
        document_id: documentId,
        bucket_id: bucketId,
        question,
        answer,
        link: url || null,
        status: 'published',
        sort_order: i,
      });
    }

    if (faqRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid FAQ rows found. Make sure your CSV has FAQ and ANSWER columns.' },
        { status: 400 }
      );
    }

    // Insert in batches of 100 to avoid hitting Supabase limits
    let imported = 0;
    const batchSize = 100;
    for (let i = 0; i < faqRows.length; i += batchSize) {
      const batch = faqRows.slice(i, i + batchSize);
      const { error } = await supabase.from('faqs').insert(batch);
      if (error) {
        console.error('Supabase batch insert error:', error);
        return NextResponse.json(
          { error: `Import failed after ${imported} rows: ${error.message}`, imported, skipped },
          { status: 500 }
        );
      }
      imported += batch.length;
    }

    return NextResponse.json({
      imported,
      skipped,
      total: rows.length,
      document_id: documentId,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
