# ADAO FAQ Generator — Design Reference

## Project
AI-powered FAQ generation platform for **ADAO** (Asbestos Disease Awareness Organization).
Users upload documents (PDF, DOCX, TXT, CSV) or paste text → AI generates FAQs.

## Client
- **Organization**: ADAO — Asbestos Disease Awareness Organization
- **Website**: https://www.asbestosdiseaseawareness.org
- **Mission**: Preventing asbestos exposure, education, advocacy

## Design System (based on Texan Insurance Dashboard style)

### Tech Stack
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Lucide React (icons)
- Framer Motion (animations)
- next-themes (dark/light mode)
- Sonner (toast notifications)
- Recharts (charts, if needed)

### Typography
- **Font**: Inter (400, 500, 600, 700, 800)
- **Scale**: 12px → 36px (CSS variables)

### Color Palette
- **Accent (ADAO Blue)**: `#1A80B6` (from ADAO branding)
- **Accent Secondary (ADAO Green)**: `#A0CE4E`
- **Dark backgrounds**: `#060608` → `#131318` hierarchy
- **Light backgrounds**: `#f5f6fa` → `#ffffff`
- **Semantic**: green `#10b981`, amber `#f59e0b`, red `#ef4444`, purple `#8b5cf6`

### Design Principles
1. **Dark-first** with full light mode support
2. **Glassmorphism** cards with backdrop blur
3. **Dot-grid** subtle background pattern
4. **Hover-lift** and glow effects on interactive elements
5. **Collapsible sidebar** navigation
6. **Responsive** mobile-first with overlay sidebar on mobile

### Card Hierarchy
- `card-primary` — Hero stats, main content (glass effect + hover glow)
- `card-secondary` — Info panels, lists (solid bg + subtle border)
- `card-tertiary` — Flat, minimal emphasis

### Branding
- **AdeptiveAI logo**: Text-based `<AdeptiveAI/>` with gradient
- **ADAO logo**: `/public/images/adao-logo.jpg`
- **Footer**: "Built by AdeptiveAI" with gradient text

### Pages (planned)
1. `/` — Dashboard overview (stats + quick upload)
2. `/upload` — Document upload & text paste
3. `/documents` — Uploaded documents list
4. `/faqs` — Generated FAQs (view, edit, export)
5. `/settings` — Configuration

### Key Features
- Drag & drop document upload
- Paste text directly
- CSV file support
- AI-powered FAQ extraction
- FAQ editing and review
- Export to various formats
