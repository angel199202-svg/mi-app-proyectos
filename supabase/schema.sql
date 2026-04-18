-- PYMS schema — run once in Supabase SQL editor

-- ─── ORGANIZATIONS ────────────────────────────────────────────────────────────
create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  created_at timestamptz default now()
);

-- ─── ORGANIZATION MEMBERS ─────────────────────────────────────────────────────
create table public.organization_members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references public.organizations(id) on delete cascade,
  status               text not null default 'trial' check (status in ('trial', 'active', 'inactive')),
  price_clp            integer not null default 9990,
  current_period_start timestamptz default now(),
  current_period_end   timestamptz default (now() + interval '30 days'),
  created_at           timestamptz default now()
);

-- ─── INVITATIONS ──────────────────────────────────────────────────────────────
create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  email       text not null,
  token       uuid unique not null default gen_random_uuid(),
  invited_by  uuid not null references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz default now(),
  unique(org_id, email)
);

-- ─── PRODUCTS ─────────────────────────────────────────────────────────────────
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations(id) on delete cascade,
  sku               text not null,
  name              text not null,
  unit              text not null default 'unidad',
  stock_quantity    integer not null default 0,
  reorder_threshold integer not null default 0,
  created_at        timestamptz default now(),
  unique(org_id, sku)
);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  reference     text not null,
  customer_name text,
  status        text not null default 'pending'
                  check (status in ('pending','picking','packing','dispatched','cancelled')),
  notes         text,
  created_by    uuid references auth.users(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── ORDER ITEMS ──────────────────────────────────────────────────────────────
create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_id       uuid not null references public.products(id),
  quantity_ordered integer not null check (quantity_ordered > 0),
  quantity_picked  integer not null default 0
);

-- ─── DISPATCH RECORDS ─────────────────────────────────────────────────────────
create table public.dispatch_records (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  tracking_number  text,
  carrier          text,
  dispatched_by    uuid references auth.users(id),
  dispatched_at    timestamptz default now(),
  notes            text
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.invitations          enable row level security;
alter table public.products             enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.dispatch_records     enable row level security;

-- ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
create or replace function public.my_org_id()
returns uuid language sql stable security definer as $$
  select org_id from public.organization_members
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_org_owner()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.organization_members
    where user_id = auth.uid() and role = 'owner'
  );
$$;

-- ─── POLICIES: organizations ──────────────────────────────────────────────────
create policy "read own org"
  on public.organizations for select
  using (id = public.my_org_id());

create policy "owner update own org"
  on public.organizations for update
  using (id = public.my_org_id() and public.is_org_owner());

-- ─── POLICIES: organization_members ──────────────────────────────────────────
create policy "read own org members"
  on public.organization_members for select
  using (org_id = public.my_org_id());

create policy "owner insert members"
  on public.organization_members for insert
  with check (org_id = public.my_org_id() and public.is_org_owner());

create policy "owner delete members (not self)"
  on public.organization_members for delete
  using (org_id = public.my_org_id() and public.is_org_owner() and user_id != auth.uid());

-- allow insert during onboarding (user creates their own first membership)
create policy "self insert first membership"
  on public.organization_members for insert
  with check (user_id = auth.uid() and role = 'owner');

-- ─── POLICIES: subscriptions ──────────────────────────────────────────────────
create policy "read own org subscription"
  on public.subscriptions for select
  using (org_id = public.my_org_id());

-- ─── POLICIES: invitations ────────────────────────────────────────────────────
create policy "read own org invitations"
  on public.invitations for select
  using (org_id = public.my_org_id());

create policy "owner create invitations"
  on public.invitations for insert
  with check (org_id = public.my_org_id() and public.is_org_owner());

create policy "owner delete invitations"
  on public.invitations for delete
  using (org_id = public.my_org_id() and public.is_org_owner());

-- invited user can read their own invite by token (for accept flow)
create policy "read own invitation by email"
  on public.invitations for select
  using (email = auth.jwt() ->> 'email');

create policy "accept own invitation"
  on public.invitations for update
  using (email = auth.jwt() ->> 'email')
  with check (accepted_at is not null);

-- ─── POLICIES: products ───────────────────────────────────────────────────────
create policy "members read products"
  on public.products for select
  using (org_id = public.my_org_id());

create policy "members manage products"
  on public.products for insert
  with check (org_id = public.my_org_id());

create policy "members update products"
  on public.products for update
  using (org_id = public.my_org_id());

create policy "members delete products"
  on public.products for delete
  using (org_id = public.my_org_id());

-- ─── POLICIES: orders ────────────────────────────────────────────────────────
create policy "members read orders"
  on public.orders for select
  using (org_id = public.my_org_id());

create policy "members insert orders"
  on public.orders for insert
  with check (org_id = public.my_org_id());

create policy "members update orders"
  on public.orders for update
  using (org_id = public.my_org_id());

create policy "members delete orders"
  on public.orders for delete
  using (org_id = public.my_org_id());

-- ─── POLICIES: order_items ───────────────────────────────────────────────────
create policy "members read order items"
  on public.order_items for select
  using (order_id in (select id from public.orders where org_id = public.my_org_id()));

create policy "members insert order items"
  on public.order_items for insert
  with check (order_id in (select id from public.orders where org_id = public.my_org_id()));

create policy "members update order items"
  on public.order_items for update
  using (order_id in (select id from public.orders where org_id = public.my_org_id()));

create policy "members delete order items"
  on public.order_items for delete
  using (order_id in (select id from public.orders where org_id = public.my_org_id()));

-- ─── POLICIES: dispatch_records ──────────────────────────────────────────────
create policy "members read dispatch"
  on public.dispatch_records for select
  using (order_id in (select id from public.orders where org_id = public.my_org_id()));

create policy "members insert dispatch"
  on public.dispatch_records for insert
  with check (order_id in (select id from public.orders where org_id = public.my_org_id()));

create policy "members update dispatch"
  on public.dispatch_records for update
  using (order_id in (select id from public.orders where org_id = public.my_org_id()));
