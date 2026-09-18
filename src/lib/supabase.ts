import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://sitcsejfybjxsdhgziel.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_7OE9c7BvY5yu-OulCTGh2Q_C3w1VfCZ';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * SQL Schema definition for your Supabase SQL Editor:
 * Run this SQL in your Supabase Dashboard > SQL Editor to initialize all tables!
 */
export const SUPABASE_SCHEMA_SQL = `
-- 1. Organizations & Settings
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT,
  tagline TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  currency TEXT DEFAULT 'BDT',
  logo_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  primary_color TEXT,
  bank_details JSONB,
  bkash_number TEXT,
  nagad_number TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Members & Volunteers Roster
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  member_id TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Volunteer',
  designation TEXT,
  department TEXT,
  blood_group TEXT,
  date_of_birth TEXT,
  joining_date TEXT,
  address TEXT,
  photo_url TEXT,
  emergency_contact TEXT,
  status TEXT DEFAULT 'Active',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Public Volunteer Applications
CREATE TABLE IF NOT EXISTS public_volunteers (
  id TEXT PRIMARY KEY,
  member_id TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Volunteer',
  designation TEXT DEFAULT 'Volunteer Applicant',
  department TEXT,
  blood_group TEXT,
  date_of_birth TEXT,
  joining_date TEXT,
  address TEXT,
  photo_url TEXT,
  emergency_contact TEXT,
  status TEXT DEFAULT 'Pending',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Donations Ledger
CREATE TABLE IF NOT EXISTS donations (
  id TEXT PRIMARY KEY,
  receipt_number TEXT UNIQUE,
  donor_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BDT',
  frequency TEXT DEFAULT 'one-time',
  transaction_id TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  dedication TEXT,
  campaign_id TEXT,
  campaign_name TEXT,
  payment_method TEXT DEFAULT 'card',
  status TEXT DEFAULT 'Pending',
  approved_at TEXT,
  approved_by TEXT,
  approver_role TEXT,
  receipt_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Campaigns & Causes
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  goal_amount NUMERIC DEFAULT 0,
  current_amount NUMERIC DEFAULT 0,
  cover_image TEXT,
  status TEXT DEFAULT 'Active',
  category TEXT,
  donors_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Programs & Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  cover_image TEXT,
  location TEXT,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active',
  budget NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Contact Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT,
  category TEXT,
  entity TEXT,
  entity_id TEXT,
  details TEXT,
  performed_by TEXT,
  performed_by_email TEXT,
  performed_by_role TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) and allow public anonymous read & inserts
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on all tables" ON organizations FOR SELECT USING (true);
CREATE POLICY "Allow public write on organizations" ON organizations FOR ALL USING (true);

CREATE POLICY "Allow public read on members" ON members FOR SELECT USING (true);
CREATE POLICY "Allow public write on members" ON members FOR ALL USING (true);

CREATE POLICY "Allow public all on public_volunteers" ON public_volunteers FOR ALL USING (true);

CREATE POLICY "Allow public all on donations" ON donations FOR ALL USING (true);

CREATE POLICY "Allow public all on campaigns" ON campaigns FOR ALL USING (true);

CREATE POLICY "Allow public all on projects" ON projects FOR ALL USING (true);

CREATE POLICY "Allow public all on messages" ON messages FOR ALL USING (true);

CREATE POLICY "Allow public all on audit_logs" ON audit_logs FOR ALL USING (true);
`;
