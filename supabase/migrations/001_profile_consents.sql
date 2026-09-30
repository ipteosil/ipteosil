-- 수정 1: profiles 테이블에 개인정보 동의 시각 컬럼 추가
-- (schema.sql 최초 실행 후 회원가입 로직을 만들면서 빠졌던 부분을 보완)

alter table public.profiles add column if not exists privacy_agreed_at timestamptz;
alter table public.profiles add column if not exists phone_agreed_at timestamptz;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, privacy_agreed_at, phone_agreed_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'phone',
    now(),
    case when coalesce(new.raw_user_meta_data->>'phone','') <> '' then now() else null end
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 수정 2: 테이블 접근 권한(GRANT) 부여
-- "Automatically expose new tables"를 꺼둔 채로 만들어서, RLS 정책은 있는데
-- 테이블 자체에 대한 기본 접근 권한이 없어 "permission denied" 에러가 났던 부분을 고침.
-- (RLS 정책 = "이 중에 어느 줄을 볼 수 있는지", GRANT = "이 테이블에 접근 자체를 허용할지" — 둘 다 있어야 함)

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update on public.contracts to authenticated;
grant select, insert, update, delete on public.channels to authenticated;
grant select on public.channels to anon;
grant select, insert on public.logs to authenticated;
grant select, insert, update on public.reviews to authenticated;
grant select on public.reviews to anon;
