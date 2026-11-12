-- 화면 오른쪽 위에 이메일 대신 보여줄 '별명' 칸 추가 (2026-11-12)
-- Supabase 대시보드 > SQL Editor에 붙여넣고 Run 한다. 두 번 실행해도 안전하다.
-- 기존 회원 정보는 바뀌지 않는다. 별명이 비어 있으면 화면에는 '이름+님'이 보인다.
alter table public.profiles add column if not exists nickname text;
