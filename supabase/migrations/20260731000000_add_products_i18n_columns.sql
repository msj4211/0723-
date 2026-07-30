-- 상품 페이지의 영어 번역을 저장하기 위한 컬럼. 비워두면 한국어(name/summary)로
-- 자동 대체되므로, 번역이 준비된 상품부터 채워 넣으면 된다.
alter table public.products
  add column if not exists name_en text,
  add column if not exists summary_en text;
