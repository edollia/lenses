-- Provocateur Supabase setup
-- Paste this whole file into the Supabase SQL Editor for a new or existing project.
-- The script is idempotent and preserves existing orders, contacts, and uploads.

begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  checkout_id uuid not null default gen_random_uuid(),

  customer_first text not null check (length(trim(customer_first)) > 0),
  customer_last text not null check (length(trim(customer_last)) > 0),
  customer_phone text not null check (length(trim(customer_phone)) > 0),
  customer_email text not null check (customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),

  cart_total numeric(10,2) not null default 0,
  cart_items text,

  product_key text,
  product text,
  model text,
  lens_type text,
  lens_color text,
  vision text,
  blue_light boolean not null default false,
  qty integer not null default 1 check (qty > 0),
  unit_price numeric(10,2) not null default 0,
  total_price numeric(10,2) not null default 0,
  rx_surcharge numeric(10,2) not null default 0,

  r_sph text,
  r_cyl text,
  r_axis text,
  l_sph text,
  l_cyl text,
  l_axis text,
  pd text,
  pd_right text,
  pd_left text,
  add_value text,

  files text,
  status text not null default 'new' check (
    status in (
      'new',
      'contacted',
      'paid',
      'in_production',
      'shipped',
      'completed',
      'cancelled'
    )
  ),
  notes text,
  created_at timestamptz not null default now()
);

-- Safe upgrade for an existing Provocateur database. CREATE TABLE IF NOT EXISTS
-- does not add new columns to a table that already exists, so these statements
-- make the same full script work for both new and existing projects. Existing
-- rows and order data are preserved.
alter table public.orders add column if not exists product_key text;
alter table public.orders add column if not exists product text;

create index if not exists orders_checkout_id_idx on public.orders (checkout_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_customer_email_idx on public.orders (customer_email);
create index if not exists orders_product_key_idx on public.orders (product_key);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (length(trim(first_name)) > 0),
  last_name text,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  topic text,
  message text not null check (length(trim(message)) > 0),
  status text not null default 'unread' check (status in ('unread', 'read', 'replied', 'archived')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists contacts_created_at_idx on public.contacts (created_at desc);
create index if not exists contacts_status_idx on public.contacts (status);
create index if not exists contacts_email_idx on public.contacts (email);

-- Cleanup from the older setup, if it was ever run.
do $$
begin
  if to_regclass('public.orders') is not null then
    execute 'drop trigger if exists orders_enqueue_notification on public.orders';
  end if;

  if to_regclass('public.contacts') is not null then
    execute 'drop trigger if exists contacts_enqueue_notification on public.contacts';
  end if;
end $$;

drop function if exists public.enqueue_order_notification();
drop function if exists public.enqueue_contact_notification();
-- Keep any legacy notification_events table so rerunning this setup never
-- deletes historical data. The obsolete triggers above are disabled.

alter table public.orders enable row level security;
alter table public.contacts enable row level security;

drop policy if exists "public_can_create_orders" on public.orders;
create policy "public_can_create_orders"
on public.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "public_can_create_contacts" on public.contacts;
create policy "public_can_create_contacts"
on public.contacts
for insert
to anon, authenticated
with check (true);

grant usage on schema public to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant insert on public.contacts to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prescriptions',
  'prescriptions',
  false,
  5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public_can_upload_prescriptions" on storage.objects;
create policy "public_can_upload_prescriptions"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'prescriptions');

-- The site removes files from the bucket when a buyer removes an upload
-- before checkout. The bucket is private and object names are random, but
-- this policy still means anyone who knows an object path can delete it.
drop policy if exists "public_can_delete_prescriptions" on storage.objects;
create policy "public_can_delete_prescriptions"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'prescriptions');

commit;
