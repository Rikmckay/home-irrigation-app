-- ============================================================
-- Irrigation Manager - Supabase Schema
-- Single-user app: RLS disabled for simplicity.
-- If you ever expose this project publicly, re-enable RLS and
-- add appropriate policies.
-- ============================================================

create table controllers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

create table valve_boxes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

create table connection_boxes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

create table valves (
  id uuid primary key default gen_random_uuid(),
  controller_id uuid references controllers(id) on delete cascade,
  valve_box_id uuid references valve_boxes(id),
  name text not null,
  zone_name text,
  notes text,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

create table watering_heads (
  id uuid primary key default gen_random_uuid(),
  valve_id uuid references valves(id) on delete cascade,
  connection_box_id uuid references connection_boxes(id),
  name text not null,
  head_type text check (head_type in ('Rotor','Popup','Mister','Drip','Other')),
  area_description text,
  notes text,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);
