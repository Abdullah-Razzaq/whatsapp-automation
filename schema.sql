CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'NEEDS_HUMAN', 'QUALIFIED', 'CLOSED')),
    is_ai_enabled BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('USER', 'AI', 'AGENT')),
    content TEXT,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Note: Depending on your Supabase Row Level Security (RLS) settings, 
-- you may need to add policies to allow your application to read/write to these tables.
-- Alternatively, if you just want it to work during development with the anon key, you can disable RLS:
-- ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
