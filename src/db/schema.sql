create extension if not exists "pgcrypto";

create type public.member_role as enum ('owner', 'admin', 'developer', 'viewer');
create type public.ticket_status as enum ('backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled');
create type public.ticket_priority as enum ('critical', 'high', 'medium', 'low', 'none');
create type public.ticket_type as enum ('bug', 'feature', 'task', 'improvement', 'question', 'epic');
create type public.sprint_status as enum ('planned', 'active', 'completed');
create type public.invite_role as enum ('admin', 'developer', 'viewer');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  bio text,
  timezone text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists last_seen_at timestamptz not null default now();
create unique index if not exists idx_profiles_email_unique on public.profiles(email);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  key_prefix text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  color text,
  emoji text,
  start_date date,
  end_date date,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'developer',
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique(project_id, user_id)
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  token text not null unique,
  role public.invite_role not null default 'developer',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  invited_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  status public.sprint_status not null default 'planned',
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status public.ticket_status not null default 'backlog',
  priority public.ticket_priority not null default 'none',
  type public.ticket_type not null default 'task',
  assignee_id uuid references public.profiles(id),
  reporter_id uuid not null references public.profiles(id),
  parent_id uuid references public.tickets(id) on delete set null,
  sprint_id uuid references public.sprints(id) on delete set null,
  due_date date,
  estimate integer,
  ticket_number integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, ticket_number)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  file_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  reference_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(public.profiles.display_name, excluded.display_name);

  -- Auto-accept any pending invitations for this email.
  insert into public.project_members (project_id, user_id, role, joined_at)
  select i.project_id, new.id, i.role::public.member_role, now()
  from public.invitations i
  where lower(i.email) = lower(new.email)
    and i.accepted_at is null
    and i.expires_at > now()
  on conflict (project_id, user_id) do nothing;

  update public.invitations
  set accepted_at = now()
  where lower(email) = lower(new.email)
    and accepted_at is null
    and expires_at > now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_ticket_number()
returns trigger
language plpgsql
as $$
begin
  if new.ticket_number is null or new.ticket_number = 0 then
    select coalesce(max(t.ticket_number), 0) + 1 into new.ticket_number
    from public.tickets t where t.project_id = new.project_id;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tickets_set_number on public.tickets;
create trigger tickets_set_number
before insert or update on public.tickets
for each row execute function public.set_ticket_number();

create index if not exists idx_projects_owner on public.projects(owner_id);
create index if not exists idx_members_project on public.project_members(project_id);
create index if not exists idx_tickets_project on public.tickets(project_id);
create index if not exists idx_comments_ticket on public.comments(ticket_id);
create index if not exists idx_chat_project on public.chat_messages(project_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_dm_sender on public.direct_messages(sender_id);
create index if not exists idx_dm_recipient on public.direct_messages(recipient_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.invitations enable row level security;
alter table public.sprints enable row level security;
alter table public.tickets enable row level security;
alter table public.comments enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.direct_messages enable row level security;

create or replace function public.is_project_member(p_project_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.user_id = p_user_id
  );
$$;

create or replace function public.is_project_admin(p_project_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.user_id = p_user_id
      and pm.role in ('owner', 'admin')
  );
$$;

grant execute on function public.is_project_member(uuid, uuid) to authenticated;
grant execute on function public.is_project_admin(uuid, uuid) to authenticated;

create policy "profiles_select_auth" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid());

create policy "projects_select_member" on public.projects for select to authenticated using (public.is_project_member(id));
create policy "projects_insert_auth" on public.projects for insert to authenticated with check (owner_id = auth.uid());
create policy "projects_update_owner" on public.projects for update to authenticated using (owner_id = auth.uid());
create policy "projects_delete_owner" on public.projects for delete to authenticated using (owner_id = auth.uid());

create policy "members_select_member" on public.project_members for select to authenticated using (public.is_project_member(project_id));
create policy "members_insert_admin" on public.project_members for insert to authenticated with check (
  (
    user_id = auth.uid() and exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  ) or public.is_project_admin(project_id)
);
create policy "members_update_admin" on public.project_members for update to authenticated using (public.is_project_admin(project_id));
create policy "members_delete_admin_or_self" on public.project_members for delete to authenticated using (
  user_id = auth.uid() or public.is_project_admin(project_id)
);

create policy "invitations_select_admin" on public.invitations for select to authenticated using (
  public.is_project_admin(project_id)
);
create policy "invitations_insert_admin" on public.invitations for insert to authenticated with check (
  public.is_project_admin(project_id) and invited_by = auth.uid()
);
create policy "invitations_update_admin" on public.invitations for update to authenticated using (
  public.is_project_admin(project_id)
);

create policy "sprints_member" on public.sprints for all to authenticated using (
  public.is_project_member(project_id)
) with check (
  public.is_project_member(project_id)
);

create policy "tickets_select_member" on public.tickets for select to authenticated using (
  public.is_project_member(project_id)
);
create policy "tickets_insert_member" on public.tickets for insert to authenticated with check (
  exists (
    select 1 from public.project_members m
    where m.project_id = project_id and m.user_id = auth.uid() and m.role in ('owner', 'admin', 'developer')
  ) and reporter_id = auth.uid()
);
create policy "tickets_update_member" on public.tickets for update to authenticated using (
  reporter_id = auth.uid() or assignee_id = auth.uid() or public.is_project_admin(project_id)
);
create policy "tickets_delete_admin" on public.tickets for delete to authenticated using (
  public.is_project_admin(project_id)
);

create policy "comments_member" on public.comments for select to authenticated using (
  exists (
    select 1 from public.tickets t
    join public.project_members m on m.project_id = t.project_id
    where t.id = ticket_id and m.user_id = auth.uid()
  )
);
create policy "comments_insert_member" on public.comments for insert to authenticated with check (
  author_id = auth.uid() and exists (
    select 1 from public.tickets t
    join public.project_members m on m.project_id = t.project_id
    where t.id = ticket_id and m.user_id = auth.uid()
  )
);
create policy "comments_update_own" on public.comments for update to authenticated using (author_id = auth.uid());
create policy "comments_delete_own" on public.comments for delete to authenticated using (author_id = auth.uid());

create policy "dm_select_own" on public.direct_messages for select to authenticated using (
  sender_id = auth.uid() or recipient_id = auth.uid()
);
create policy "dm_insert_own" on public.direct_messages for insert to authenticated with check (
  sender_id = auth.uid()
);
create policy "dm_update_recipient" on public.direct_messages for update to authenticated using (
  recipient_id = auth.uid()
);

create policy "chat_member" on public.chat_messages for all to authenticated using (
  exists (select 1 from public.project_members m where m.project_id = project_id and m.user_id = auth.uid())
) with check (
  sender_id = auth.uid() and exists (
    select 1 from public.project_members m where m.project_id = project_id and m.user_id = auth.uid()
  )
);

create policy "notifications_self" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications_update_self" on public.notifications for update to authenticated using (user_id = auth.uid());
