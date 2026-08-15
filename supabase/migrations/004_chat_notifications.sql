-- Chat message notifications
-- When a chat message is inserted into chat_messages, create an in-app
-- notification for the OTHER participant in the conversation (never the sender).
-- Run this in Supabase SQL Editor or via `supabase db push`.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null default 'chat_message',
  job_id uuid,
  conversation_id uuid,
  message_id uuid,
  content text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- One notification per chat message (prevents duplicates)
create unique index if not exists notifications_message_id_key
  on public.notifications (message_id);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, is_read);

-- Notify the non-sender participant whenever a chat message is inserted.
create or replace function public.notify_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_other_user uuid;
  v_job_id uuid;
begin
  select case
           when c.customer_id = new.sender_id then c.carrier_id
           else c.customer_id
         end
    into v_other_user
  from public.conversations c
  where c.id = new.conversation_id;

  select b.job_id
    into v_job_id
  from public.conversations c
  join public.bookings b on b.id = c.booking_id
  where c.id = new.conversation_id;

  if v_other_user is not null and v_other_user is distinct from new.sender_id then
    insert into public.notifications (user_id, type, job_id, conversation_id, message_id, content)
    values (v_other_user, 'chat_message', v_job_id, new.conversation_id, new.id, new.content)
    on conflict (message_id) do nothing;
  end if;

  return new;
exception
  when others then
    raise warning 'notify_chat_message failed: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_chat_message_insert on public.chat_messages;

create trigger on_chat_message_insert
  after insert on public.chat_messages
  for each row execute function public.notify_chat_message();

-- RLS: users can only read/update their own notifications.
alter table public.notifications enable row level security;

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "users can update own notifications" on public.notifications;
create policy "users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

grant select, update on public.notifications to authenticated;
