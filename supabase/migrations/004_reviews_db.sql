-- 후기(reviews)를 실제로 DB에 연결하기 위한 준비
-- 한 사람당 후기 하나만 쓰도록(덮어쓰기) 유니크 제약 추가
alter table public.reviews add constraint reviews_user_id_key unique (user_id);

-- 관리자는 추천 여부와 상관없이 모든 후기를 볼 수 있어야 함 (관리자 탭 "후기 관리")
create policy "관리자 후기 전체 조회" on public.reviews
  for select using (
    exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_admin)
  );
