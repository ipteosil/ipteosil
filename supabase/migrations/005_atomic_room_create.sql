-- 방 생성 + 계약 생성을 한 번에 묶어서 처리하는 함수
-- (따로따로 요청을 보내면, 방은 만들어지고 계약은 못 만들어지는 반쪽짜리 상태가 생길 수 있었음.
--  이 함수는 DB 안에서 "둘 다 성공하거나 둘 다 실패"하게 보장해줌)
create or replace function public.create_property_with_contract(p_name text, p_sort_order int default 0)
returns table (property_id uuid, checkin_token text, checkout_token text) as $$
declare
  v_prop_id uuid := gen_random_uuid();
  v_checkin_token text := encode(gen_random_bytes(9), 'hex');
  v_checkout_token text := encode(gen_random_bytes(9), 'hex');
begin
  if auth.uid() is null then
    raise exception '로그인이 필요해요';
  end if;

  insert into public.properties (id, owner_id, name, sort_order)
  values (v_prop_id, auth.uid(), p_name, p_sort_order);

  insert into public.contracts (property_id, checkin_token, checkout_token)
  values (v_prop_id, v_checkin_token, v_checkout_token);

  return query select v_prop_id, v_checkin_token, v_checkout_token;
end;
$$ language plpgsql security definer set search_path = public, extensions;

grant execute on function public.create_property_with_contract(text, int) to authenticated;
