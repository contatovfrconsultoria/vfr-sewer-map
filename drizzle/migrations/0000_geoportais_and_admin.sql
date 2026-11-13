CREATE TABLE public.geoportais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  state text NOT NULL DEFAULT '',
  thumbnail_url text NOT NULL DEFAULT '',
  portal_url text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.geoportais TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.geoportais TO authenticated;
GRANT ALL ON public.geoportais TO service_role;
ALTER TABLE public.geoportais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública" ON public.geoportais FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.geoportais (city_name, state, thumbnail_url, portal_url, display_order) VALUES
('Campinas','SP','/mapa-exemplo.jpg','https://example.com/geoportal/campinas',1),
('Ribeirão Preto','SP','/mapa-exemplo.jpg','https://example.com/geoportal/ribeirao-preto',2),
('Uberlândia','MG','/mapa-exemplo.jpg','https://example.com/geoportal/uberlandia',3),
('Londrina','PR','/mapa-exemplo.jpg','https://example.com/geoportal/londrina',4),
('Goiânia','GO','/mapa-exemplo.jpg','https://example.com/geoportal/goiania',5);

create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Ver próprio papel" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.grant_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_first_admin after insert on auth.users
for each row execute function public.grant_first_admin();

create policy "Admin insere" on public.geoportais for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin edita" on public.geoportais for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin exclui" on public.geoportais for delete to authenticated using (public.has_role(auth.uid(), 'admin'));