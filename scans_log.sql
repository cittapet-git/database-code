create table if not exists scans_logs (
  id bigint generated always as identity primary key,

  -- SOLO una de estas dos debe tener valor:
  scans_id bigint references scans(id) on delete cascade,
  scans_testing_id bigint references scans_testing(id) on delete cascade,

  source_table text not null check (source_table in ('scans','scans_testing')),
  barcode text not null,
  delta integer not null,                -- +1 por escaneo normal; puede ser -1/±N
  quantity_after integer not null,       -- total tras el cambio
  actor_uid uuid default auth.uid(),     -- si hay sesión Supabase; null con service-role
  actor_name text,
  created_at timestamptz not null default now(),

  -- exactly one FK must be set
  constraint scans_logs_one_fk check (
    (scans_id is not null and scans_testing_id is null)
    or
    (scans_id is null and scans_testing_id is not null)
  )
);

create index if not exists idx_scans_logs_scans_id on scans_logs(scans_id);
create index if not exists idx_scans_logs_scans_testing_id on scans_logs(scans_testing_id);
create index if not exists idx_scans_logs_barcode on scans_logs(barcode);
create index if not exists idx_scans_logs_created_at on scans_logs(created_at);
