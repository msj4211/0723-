insert into public.ear_points (id, name, description, image_url) values
  ('ear', '귀 건강', '귀 전체 혈액순환과 청력 관리를 돕는 이어포인트입니다.', 'images/귀.png'),
  ('stomach', '소화 · 위', '소화 기능과 위 컨디션을 관리하는 이어포인트입니다.', 'images/위.png'),
  ('sleep', '숙면', '깊고 편안한 수면을 돕는 이어포인트입니다.', 'images/충분한수면.PNG'),
  ('immune', '면역력 강화', '몸의 면역 밸런스를 강화하는 이어포인트입니다.', 'images/면역력강화.PNG'),
  ('knee', '무릎 통증', '무릎 통증 완화에 도움을 주는 이어포인트입니다.', 'images/무릎통증.PNG'),
  ('hairloss', '탈모 예방', '두피와 모발 건강을 돕는 이어포인트입니다.', 'images/탈모예방.PNG'),
  ('growth', '아이들 키 성장', '성장기 어린이의 건강한 성장을 돕는 이어포인트입니다.', 'images/아이들키성장.png')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url;
