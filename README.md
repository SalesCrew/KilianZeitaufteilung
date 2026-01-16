# Time Tracker

A minimalist, elegant time tracking app for tracking work across multiple companies. Built with Next.js, Tailwind CSS, Framer Motion, and Supabase.

## Features

- **Clean UI** - White-on-white theme with company-specific color accents
- **Three Companies** - Merchandising (blue), Salescre (orange), Inkognito (red/black)
- **Live Timer** - Flip-clock style animation with smooth digit transitions
- **Seamless Switching** - Switch companies without stopping the timer
- **History View** - Expandable daily summaries with time blocks
- **Vienna Timezone** - All times displayed in Europe/Vienna timezone

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, CSS Variables
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of `supabase-schema.sql`
3. Copy your project URL and anon key from Settings > API

### 3. Configure Environment

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

## Usage

1. **Select a company** by clicking one of the three company buttons
2. **Start the timer** by clicking "START TIMER"
3. **Switch companies** while the timer is running - this creates timestamp entries
4. **Stop the timer** when you're done for the day
5. **View history** in the expandable cards below

## Database Schema

```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY,
  company TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## License

MIT
