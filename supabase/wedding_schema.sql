-- ═══════════════════════════════════════════════════════════════
-- La Boda Pandaneiros · Wedding Schema
-- Run in Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════

-- ─── Wedding Guests ──────────────────────────────────────────────
create table public.wedding_guests (
  id                 uuid primary key default gen_random_uuid(),
  code               text unique not null,           -- e.g. "ANGEL-001"
  name               text not null,
  email              text,
  allow_plus_one     boolean not null default false,
  rsvp_attending     boolean,                        -- null = not responded
  rsvp_plus_one      boolean,
  rsvp_plus_one_name text,
  rsvp_dietary       text,
  rsvp_message       text,
  rsvp_at            timestamptz,
  created_at         timestamptz default now()
);

-- ─── Wedding Photos ───────────────────────────────────────────────
create table public.wedding_photos (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null,
  public_url   text not null,
  caption      text,
  is_featured  boolean not null default false,
  sort_order   integer not null default 0,
  uploaded_at  timestamptz default now()
);

-- ─── RLS ─────────────────────────────────────────────────────────
alter table public.wedding_guests enable row level security;
alter table public.wedding_photos  enable row level security;

-- Guests: anyone can read (we filter by code in app code)
create policy "public read guests"
  on public.wedding_guests for select
  using (true);

-- Guests: anyone can update RSVP fields (no auth needed)
create policy "public update rsvp"
  on public.wedding_guests for update
  using (true)
  with check (true);

-- Photos: anyone can read
create policy "public read photos"
  on public.wedding_photos for select
  using (true);

-- Photos: only authenticated (admin) can insert/delete
create policy "auth insert photos"
  on public.wedding_photos for insert
  with check (auth.uid() is not null);

create policy "auth delete photos"
  on public.wedding_photos for delete
  using (auth.uid() is not null);

-- ─── Storage Bucket ──────────────────────────────────────────────
-- Create bucket "wedding-photos" with public access:
--
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('wedding-photos', 'wedding-photos', true);
--
--   CREATE POLICY "public read wedding photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'wedding-photos');
--
--   CREATE POLICY "auth upload wedding photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'wedding-photos' AND auth.uid() IS NOT NULL);
--
-- Or create it via Dashboard > Storage > New bucket (enable "Public bucket")

-- ─── Sample guest codes ───────────────────────────────────────────
-- INSERT INTO public.wedding_guests (code, name, allow_plus_one)
-- VALUES
--   ('ANGEL-001', 'Nombre del Invitado', true),
--   ('ANGEL-002', 'Otro Invitado', false);
