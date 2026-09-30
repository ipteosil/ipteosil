-- 사진 저장용 Storage 버킷 생성
-- 지금까지는 사진을 base64 글자로 통째로 DB 컬럼에 넣고 있었는데,
-- 이제부터는 사진 파일 자체는 Storage(파일 저장소)에 올리고, DB에는 그 사진의 URL 주소만 저장함

insert into storage.buckets (id, name, public)
values ('room-photos', 'room-photos', true)
on conflict (id) do nothing;

-- 누구나 사진을 볼 수 있음 (버킷 자체가 public이라 필요하지만, 명시적으로도 열어둠)
create policy "사진 공개 조회" on storage.objects
  for select using (bucket_id = 'room-photos');

-- 임대인(로그인한 사람)은 "landlord/내계정ID/..." 경로 밑에만 올리고 지울 수 있음
create policy "임대인 본인 사진 업로드" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'room-photos' and (storage.foldername(name))[1] = 'landlord' and (storage.foldername(name))[2] = auth.uid()::text
  );
create policy "임대인 본인 사진 삭제" on storage.objects
  for delete to authenticated using (
    bucket_id = 'room-photos' and (storage.foldername(name))[1] = 'landlord' and (storage.foldername(name))[2] = auth.uid()::text
  );

-- 세입자(로그인 없음)는 "tenant/..." 경로 밑에만 올릴 수 있음
-- (링크의 토큰 자체가 비밀번호 역할이라 경로 이름에 토큰을 넣어서 씀 — 토큰을 모르면 어차피 그 경로를 알 수 없음)
create policy "세입자 사진 업로드" on storage.objects
  for insert to anon, authenticated with check (
    bucket_id = 'room-photos' and (storage.foldername(name))[1] = 'tenant'
  );
