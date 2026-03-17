export interface Document {
  id: string;
  title: string;
  source_type: 'pdf' | 'docx' | 'txt' | 'csv' | 'paste';
  file_name: string | null;
  content_preview: string | null;
  character_count: number | null;
  created_at: string;
}

export interface FAQBucket {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface FAQ {
  id: string;
  document_id: string | null;
  bucket_id: string | null;
  question: string;
  answer: string;
  link: string | null;
  status: 'draft' | 'published';
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  bucket?: FAQBucket;
  document?: Document;
}

export interface GeneratedFAQ {
  question: string;
  answer: string;
  category: string;
  selected: boolean;
}

export interface GenerateRequest {
  content: string;
  source_type: string;
  file_name?: string;
  title?: string;
  link?: string;
}

export interface GenerateResponse {
  faqs: GeneratedFAQ[];
  document_id: string;
  document_title: string;
}
