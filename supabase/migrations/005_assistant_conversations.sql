-- TerraTrust AI Persistent Assistant Conversations & Messages Schema
-- Migration: 005_assistant_conversations.sql

create extension if not exists "pgcrypto";

-- 1. ASSISTANT CONVERSATIONS
create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text default 'Property Intelligence Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. ASSISTANT MESSAGES
create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  actor_role text default 'citizen' check (actor_role in ('citizen', 'surveyor', 'government', 'community', 'bank', 'admin', 'system')),
  property_uuid uuid references public.properties(id) on delete set null,
  message text not null,
  sources jsonb not null default '[]'::jsonb,
  structured_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for lightning fast lookups
create index if not exists idx_assistant_conv_user_id on public.assistant_conversations(user_id);
create index if not exists idx_assistant_msg_conv_id on public.assistant_messages(conversation_id);
create index if not exists idx_assistant_msg_user_id on public.assistant_messages(user_id);
create index if not exists idx_assistant_msg_prop_id on public.assistant_messages(property_uuid);

-- Enable RLS
alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;

-- Strict Multi-Role RLS Policies: Users only see/create their own conversations
create policy "Users can view own conversations"
  on public.assistant_conversations for select
  using (auth.uid() = user_id or public.get_current_user_role() = 'admin');

create policy "Users can insert own conversations"
  on public.assistant_conversations for insert
  with check (auth.uid() = user_id or public.get_current_user_role() = 'admin');

create policy "Users can delete own conversations"
  on public.assistant_conversations for delete
  using (auth.uid() = user_id or public.get_current_user_role() = 'admin');

create policy "Users can view own messages"
  on public.assistant_messages for select
  using (auth.uid() = user_id or public.get_current_user_role() = 'admin');

create policy "Users can insert own messages"
  on public.assistant_messages for insert
  with check (auth.uid() = user_id or public.get_current_user_role() = 'admin');
