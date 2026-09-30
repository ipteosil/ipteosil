-- 방(properties)에 입실/퇴실 메시지 저장 컬럼 추가
-- (앱 코드에는 있었는데 최초 스키마에는 빠졌던 부분)
alter table public.properties add column if not exists checkin_msg text;
alter table public.properties add column if not exists checkout_msg text;

-- 계약(contracts) 삭제 권한 추가
-- (지난 보고서 개별 삭제, 방 삭제 시 계약 같이 삭제되는 기능에 필요)
create policy "본인 계약 삭제" on public.contracts
  for delete using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );
grant delete on public.contracts to authenticated;
