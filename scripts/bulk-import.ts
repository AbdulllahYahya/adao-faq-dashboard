import { createClient } from '@supabase/supabase-js';
import * as Papa from 'papaparse';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Load .env.local manually
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = value;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Normalize category names (e.g., "Events and Advocacy" → "Events & Advocacy")
const CATEGORY_ALIASES: Record<string, string> = {
  'events and advocacy': 'Events & Advocacy',
  'regulation and policy': 'Regulation & Policy',
  'legal and compensation': 'Legal & Compensation',
  'safety and abatement': 'Safety & Abatement',
  'adao org and leadership': 'ADAO Org & Leadership',
  'medical management': 'Medical Management',
  'health effects': 'Health Effects',
  'exposure contexts': 'Exposure Contexts',
  'fundamentals': 'Fundamentals',
};

function normalizeCategory(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  return CATEGORY_ALIASES[lower] || trimmed;
}

// Get a column value from a row, trying multiple key variations
function getCol(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    // Try exact match first, then trimmed match
    if (row[key] !== undefined) return (row[key] || '').trim();
    // Try with trailing/leading spaces
    for (const rowKey of Object.keys(row)) {
      if (rowKey.trim().toLowerCase() === key.toLowerCase()) {
        return (row[rowKey] || '').trim();
      }
    }
  }
  return '';
}

async function main() {
  const csvDir = join(__dirname, '..', '..');
  const csvFiles = readdirSync(csvDir)
    .filter((f) => f.startsWith('2026 ChatBot FAQs') && f.endsWith('.csv'))
    .sort();

  if (csvFiles.length === 0) {
    console.error('No CSV files found in', csvDir);
    process.exit(1);
  }

  console.log(`Found ${csvFiles.length} CSV files\n`);

  // Fetch existing buckets for category→bucket_id mapping
  const { data: buckets, error: bucketsErr } = await supabase
    .from('faq_buckets')
    .select('id, name');

  if (bucketsErr) {
    console.error('Failed to fetch buckets:', bucketsErr.message);
    process.exit(1);
  }

  const bucketMap = new Map<string, string>();
  for (const b of buckets || []) {
    bucketMap.set(b.name.toLowerCase().trim(), b.id);
  }
  console.log(`Loaded ${bucketMap.size} category buckets:`, [...bucketMap.keys()].join(', '), '\n');

  let grandImported = 0;
  let grandSkipped = 0;

  for (const fileName of csvFiles) {
    const filePath = join(csvDir, fileName);
    const csvText = readFileSync(filePath, 'utf-8');
    const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const rows = result.data as Record<string, string>[];

    console.log(`--- ${fileName} ---`);
    console.log(`  Parsed ${rows.length} rows`);

    // Create document record
    const { data: doc } = await supabase
      .from('documents')
      .insert({
        title: fileName.replace(/\.csv$/i, ''),
        source_type: 'csv',
        file_name: fileName,
        content_preview: `CSV import: ${rows.length} rows`,
        character_count: csvText.length,
      })
      .select()
      .single();

    const documentId = doc?.id || null;

    let imported = 0;
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
      const question = getCol(row, 'FAQ', 'faq', 'Question', 'question');
      const answer = getCol(row, 'ANSWER', 'Answer', 'answer');
      const url = getCol(row, 'URL', 'url', 'Url', 'link');
      const rawCategory = getCol(row, 'CATEGORY', 'Category', 'category', 'TYPE', 'Type', 'type');
      const category = normalizeCategory(rawCategory);

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

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < faqRows.length; i += batchSize) {
      const batch = faqRows.slice(i, i + batchSize);
      const { error } = await supabase.from('faqs').insert(batch);
      if (error) {
        console.error(`  ERROR inserting batch at row ${i}:`, error.message);
        imported += i; // count what was inserted before error
        break;
      }
      imported += batch.length;
    }

    skipped += rows.length - faqRows.length - skipped; // shouldn't change, but just in case
    console.log(`  Imported: ${imported}, Skipped: ${rows.length - faqRows.length}`);

    grandImported += imported;
    grandSkipped += rows.length - faqRows.length;
  }

  console.log(`\n=== TOTAL ===`);
  console.log(`Imported: ${grandImported}`);
  console.log(`Skipped: ${grandSkipped}`);
  console.log(`Grand total rows: ${grandImported + grandSkipped}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
