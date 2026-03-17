import * as mammoth from 'mammoth';
import * as Papa from 'papaparse';

export async function parsePDF(buffer: Buffer): Promise<string> {
  // Import from lib directly to avoid pdf-parse's index.js test file loader
  const pdfParse = await import('pdf-parse/lib/pdf-parse.js');
  const parse = pdfParse.default || pdfParse;
  const data = await (parse as (buf: Buffer) => Promise<{ text: string }>)(buffer);
  return data.text;
}

export async function parseDOCX(buffer: Buffer): Promise<string> {
  const extract = typeof (mammoth as any).extractRawText === 'function'
    ? (mammoth as any).extractRawText
    : (mammoth as any).default?.extractRawText;
  const result = await extract({ buffer });
  return result.value;
}

export async function parseTXT(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

export async function parseCSV(buffer: Buffer): Promise<string> {
  const csvText = buffer.toString('utf-8');
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (result.errors.length > 0) {
    console.warn('CSV parse warnings:', result.errors);
  }

  // Convert rows to readable text
  const rows = result.data as Record<string, string>[];
  if (rows.length === 0) return csvText;

  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers.map((h) => `${h}: ${row[h]}`).join(', ')
  );

  return lines.join('\n');
}

export async function parseFile(buffer: Buffer, fileName: string): Promise<{ text: string; type: string }> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  switch (ext) {
    case 'pdf':
      return { text: await parsePDF(buffer), type: 'pdf' };
    case 'docx':
      return { text: await parseDOCX(buffer), type: 'docx' };
    case 'txt':
      return { text: await parseTXT(buffer), type: 'txt' };
    case 'csv':
      return { text: await parseCSV(buffer), type: 'csv' };
    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
}
