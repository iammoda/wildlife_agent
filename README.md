# Wildlife Intake

A modern web application for wildlife rehabilitation centers to track animal intakes, care logs, and outcomes. Features an AI-powered conversational interface that allows rehabilitators to record intakes through natural language, voice recordings, or document scanning.

## Features

### AI-Powered Chat Interface
- **Natural Language Processing** - Describe intakes conversationally ("I found an injured squirrel in Central Park")
- **Intent Classification** - Automatically detects what you're trying to do
- **Context-Aware Responses** - Understands follow-up questions and provides relevant information

### Multi-Modal Input
- **Text Chat** - Type messages naturally
- **Voice Recording** - Press-and-hold to record, automatically transcribed via OpenAI Whisper
- **Document Scanning** - Capture paper intake forms with your camera, OCR powered by GPT-4o Vision

### Intake Management
- Create, view, edit, and delete animal intakes
- Auto-incrementing intake numbers (YYYY-NNN format)
- Track species, quantity, sex, finder information, and location
- Disposition tracking (Under Care, Released, Transferred, etc.)

### Care Logging
- Daily weight tracking
- Food and feeding records
- Medication and treatment notes

### Analytics Dashboard
- Total intakes and animals under care
- Weekly/monthly intake statistics
- Species-filtered analytics
- Visual charts (bar, line, pie)

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | OpenAI GPT-4o, Whisper |
| Charts | Recharts |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/your-repo/wildlife-intake-web.git
cd wildlife-intake-web
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file based on `.env.example`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

4. Set up your Supabase database (see Database Schema below)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

Set up the following tables in your Supabase project:

### `intakes`
```sql
create table intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  intake_number text,
  species text,
  quantity integer default 1,
  sex text,
  intake_date timestamp with time zone default now(),
  intake_reason text,
  found_location text,
  finder_name text,
  finder_phone text,
  how_description text,
  distress_code text,
  distress_subcode text,
  disposition text default 'UC',
  disposition_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, intake_number)
);
```

### `patient_exams`
```sql
create table patient_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  intake_id uuid references intakes(id) on delete cascade,
  exam_date timestamp with time zone default now(),
  weight text,
  age text,
  distress_code text,
  distress_subcode text,
  treatment_notes text,
  created_at timestamp with time zone default now()
);
```

### `daily_care_logs`
```sql
create table daily_care_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  intake_id uuid references intakes(id) on delete cascade,
  log_date timestamp with time zone default now(),
  weight text,
  food_fed text,
  amount text,
  meds_and_comments text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

If your existing `daily_care_logs` table was created without `updated_at`, run:

```sql
alter table public.daily_care_logs
add column if not exists updated_at timestamptz default now();

update public.daily_care_logs
set updated_at = created_at
where updated_at is null;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_daily_care_logs_updated_at on public.daily_care_logs;

create trigger trg_daily_care_logs_updated_at
before update on public.daily_care_logs
for each row execute function public.set_updated_at();
```

### `dispositions`
```sql
create table dispositions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  intake_id uuid references intakes(id) on delete cascade,
  disposition_code text,
  disposition_date timestamp with time zone,
  release_location text,
  transfer_destination text,
  notes text,
  created_at timestamp with time zone default now()
);
```

### `user_settings`
```sql
create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique,
  last_intake_number text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── analytics/     # Dashboard statistics
│   │   ├── auth/          # Authentication endpoints
│   │   ├── chat/          # AI chat processing
│   │   ├── extract-document/  # Document OCR
│   │   ├── intakes/       # Intake CRUD
│   │   ├── parse-care-log/    # AI care log parsing
│   │   ├── parse-intake/  # AI intake parsing
│   │   └── transcribe/    # Voice transcription
│   ├── login/             # Login page
│   ├── settings/          # Settings page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main chat interface
├── components/
│   ├── analytics/         # Charts and statistics
│   ├── auth/              # Login/register forms
│   ├── chat/              # Chat interface
│   ├── intake/            # Intake management
│   ├── ui/                # Reusable UI components
│   └── voice/             # Voice/document capture
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts         # Authentication state
│   ├── useChat.ts         # Chat functionality
│   ├── useSummary.ts      # Dashboard stats
│   └── useTheme.ts        # Theme management
└── lib/                   # Utilities
    ├── auth.ts            # Server auth helpers
    ├── constants.ts       # App constants
    ├── openai.ts          # OpenAI client
    ├── prompts.ts         # AI prompts
    ├── supabase/          # Supabase clients
    ├── types.ts           # TypeScript types
    └── utils.ts           # Utility functions
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/me` | GET | Get current user |
| `/api/chat` | POST | Process chat messages |
| `/api/transcribe` | POST | Voice-to-text transcription |
| `/api/extract-document` | POST | Document OCR |
| `/api/parse-intake` | POST | Parse intake from text |
| `/api/parse-care-log` | POST | Parse care log from text |
| `/api/intakes` | GET | List all intakes |
| `/api/intakes` | POST | Create new intake |
| `/api/intakes/[id]` | GET | Get single intake |
| `/api/intakes/[id]` | PUT | Update intake |
| `/api/intakes/[id]` | DELETE | Delete intake |
| `/api/intakes/[id]/logs` | GET | Get care logs |
| `/api/intakes/[id]/logs` | POST | Add care log |
| `/api/intakes/next-number` | GET | Get next intake number |
| `/api/analytics/summary` | GET | Dashboard statistics |

## Authentication

- Auth uses HTTP-only cookies (`sb-access-token`, `sb-refresh-token`).
- Cookies persist for 90 days and are refreshed on authenticated API calls.
- Users remain signed in until they clear cookies or the 90-day window expires.

## Scripts

```bash
# Development with type checking
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking (watch mode)
npm run typecheck:watch
```

## AI Intent Classification

The chat system classifies user messages into these intents:

| Intent | Description | Example |
|--------|-------------|---------|
| `new_intake` | Create new animal intake | "I found an injured hawk" |
| `find_animal` | Look up existing records | "Find the squirrel from yesterday" |
| `add_care_log` | Log daily care | "Update weight to 250g for 2024-042" |
| `view_care_logs` | View care history | "Show care logs for the raccoon" |
| `statistics` | Query analytics | "How many birds this month?" |
| `help` | Get assistance | "What can you help me with?" |
| `general_question` | Wildlife questions | "What do baby opossums eat?" |

## Disposition Codes

| Code | Description |
|------|-------------|
| UC | Under Care |
| REL | Released |
| TRN | Transferred |
| DOA | Dead on Arrival |
| EUTH | Euthanized |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- AWS Amplify
- Netlify
- Railway
- Self-hosted with Node.js

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- AI powered by [OpenAI](https://openai.com/)
- Charts by [Recharts](https://recharts.org/)
