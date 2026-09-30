-- 입퇴실 도우미 — Supabase 초기 스키마
-- Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run 하면 됩니다.

-- ────────────────────────────────────────────────
-- 1. profiles (임대인 회원 부가정보)
--    로그인 자체는 Supabase Auth(auth.users)가 처리함.
--    회원가입하면 아래 트리거가 자동으로 profiles 한 줄을 만들어줌.
-- ────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text,
  is_admin boolean not null default false,
  joined_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 내 프로필만 보고 수정 가능
create policy "본인 프로필 조회" on public.profiles
  for select using (auth.uid() = id);
create policy "본인 프로필 수정" on public.profiles
  for update using (auth.uid() = id);

-- 회원가입 시 auth.users에 자동으로 생기는 걸 profiles에도 자동 생성
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.raw_user_meta_data->>'phone');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────
-- 2. properties (방)
-- ────────────────────────────────────────────────
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  address text not null default '',
  dong text not null default '',
  ho text not null default '',
  no_pw boolean not null default false,
  password text not null default '',
  spaces jsonb not null default '["거실","방1","화장실","주방"]',
  ref_photos jsonb not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.properties enable row level security;

-- 내가 만든 방만 보고 쓰고 수정하고 지울 수 있음
create policy "본인 방 조회" on public.properties
  for select using (auth.uid() = owner_id);
create policy "본인 방 생성" on public.properties
  for insert with check (auth.uid() = owner_id);
create policy "본인 방 수정" on public.properties
  for update using (auth.uid() = owner_id);
create policy "본인 방 삭제" on public.properties
  for delete using (auth.uid() = owner_id);

-- ────────────────────────────────────────────────
-- 3. contracts (계약)
-- ────────────────────────────────────────────────
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  status text not null default 'active', -- active | submitted | ended
  checkin_token text not null unique default encode(gen_random_bytes(9), 'hex'),
  checkout_token text not null unique default encode(gen_random_bytes(9), 'hex'),
  deposit text not null default '',
  monthly text not null default '',
  start_date date,
  end_date date,
  tenant_name text not null default '',
  tenant_phone text not null default '',
  memo text not null default '',
  checkin_submitted boolean not null default false,
  checkout_submitted boolean not null default false,
  checkin_sent_at timestamptz,
  checkout_sent_at timestamptz,
  checkin_data jsonb,
  checkout_data jsonb,
  baseline jsonb,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.contracts enable row level security;

-- 임대인은 "내 방에 딸린 계약"만 보고 쓰고 수정 가능 (방 테이블을 거쳐서 확인)
create policy "본인 계약 조회" on public.contracts
  for select using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );
create policy "본인 계약 생성" on public.contracts
  for insert with check (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );
create policy "본인 계약 수정" on public.contracts
  for update using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

-- 세입자용 전용 통로: 토큰이 정확히 맞는 계약 하나만 조회/제출
-- (로그인 없이 anon key로 호출됨 — RLS를 우회하는 대신 함수 안에서 직접 토큰을 검사함)
create function public.get_contract_by_token(p_token text)
returns table (
  contract_id uuid, property_id uuid, status text,
  checkin_submitted boolean, checkout_submitted boolean,
  checkin_data jsonb, checkout_data jsonb, baseline jsonb,
  tenant_name text,
  property_name text, property_address text, property_dong text, property_ho text,
  property_password text, property_no_pw boolean, property_spaces jsonb, property_ref_photos jsonb,
  is_checkin_link boolean
) as $$
  select
    c.id, c.property_id, c.status,
    c.checkin_submitted, c.checkout_submitted,
    c.checkin_data, c.checkout_data, c.baseline,
    c.tenant_name,
    p.name, p.address, p.dong, p.ho,
    p.password, p.no_pw, p.spaces, p.ref_photos,
    (c.checkin_token = p_token)
  from public.contracts c
  join public.properties p on p.id = c.property_id
  where c.checkin_token = p_token or c.checkout_token = p_token;
$$ language sql security definer set search_path = public;

grant execute on function public.get_contract_by_token(text) to anon, authenticated;

create function public.submit_checkin(p_token text, p_data jsonb)
returns void as $$
declare
  v_contract_id uuid; v_property_id uuid;
begin
  select c.id, c.property_id into v_contract_id, v_property_id
  from public.contracts c where c.checkin_token = p_token and c.checkin_submitted = false;

  if v_contract_id is null then
    raise exception '이미 제출됐거나 잘못된 링크입니다';
  end if;

  update public.contracts set
    checkin_submitted = true,
    checkin_data = p_data || jsonb_build_object('at', now()),
    baseline = (
      select jsonb_build_object('spaces', p.spaces, 'refPhotos', p.ref_photos)
      from public.properties p where p.id = v_property_id
    )
  where id = v_contract_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.submit_checkin(text, jsonb) to anon, authenticated;

create function public.submit_checkout(p_token text, p_data jsonb)
returns void as $$
declare
  v_contract_id uuid;
begin
  select c.id into v_contract_id
  from public.contracts c where c.checkout_token = p_token and c.checkout_submitted = false;

  if v_contract_id is null then
    raise exception '이미 제출됐거나 잘못된 링크입니다';
  end if;

  update public.contracts set
    checkout_submitted = true,
    checkout_data = p_data || jsonb_build_object('at', now()),
    status = 'submitted'
  where id = v_contract_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.submit_checkout(text, jsonb) to anon, authenticated;

-- ────────────────────────────────────────────────
-- 4. channels (채널 탭 콘텐츠 — 전체 공개, 관리자만 쓰기)
-- ────────────────────────────────────────────────
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'notice', -- notice | content | faq
  title text not null default '',
  body text not null default '',
  url text,
  date text not null default '',
  created_at timestamptz not null default now()
);

alter table public.channels enable row level security;

create policy "채널 전체 공개 조회" on public.channels
  for select using (true);
create policy "관리자만 채널 작성" on public.channels
  for insert with check (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin)
  );
create policy "관리자만 채널 수정" on public.channels
  for update using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin)
  );
create policy "관리자만 채널 삭제" on public.channels
  for delete using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin)
  );

-- ────────────────────────────────────────────────
-- 5. logs (활동 로그 — 본인이 남기고, 관리자만 전체 열람)
-- ────────────────────────────────────────────────
create table public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  created_at timestamptz not null default now()
);

alter table public.logs enable row level security;

create policy "본인 로그 기록" on public.logs
  for insert with check (auth.uid() = user_id);
create policy "관리자 로그 전체 조회" on public.logs
  for select using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin)
  );

-- ────────────────────────────────────────────────
-- 6. reviews (후기 — featured는 랜딩에 비로그인도 보임)
-- ────────────────────────────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null default '',
  stars int not null default 5,
  text text not null default '',
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "추천 후기 공개 조회" on public.reviews
  for select using (featured = true);
create policy "본인 후기 전체 조회" on public.reviews
  for select using (auth.uid() = user_id);
create policy "본인 후기 작성" on public.reviews
  for insert with check (auth.uid() = user_id);
create policy "본인 후기 수정" on public.reviews
  for update using (auth.uid() = user_id);
create policy "관리자 후기 추천 처리" on public.reviews
  for update using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin)
  );
