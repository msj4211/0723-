-- 가입할 때 적은 이름·휴대폰 번호·상호명(가입 정보에 같이 저장됨)이
-- 프로필에 빠져 있는 회원은, 빈 칸만 가입 정보로 채운다. 이미 적힌 값은 건드리지 않는다.
update public.profiles p
set
  name = coalesce(nullif(btrim(p.name), ''), nullif(btrim(u.raw_user_meta_data->>'name'), ''), p.name),
  phone = coalesce(nullif(btrim(p.phone), ''), nullif(btrim(u.raw_user_meta_data->>'phone'), ''), p.phone),
  shop_name = coalesce(nullif(btrim(p.shop_name), ''), nullif(btrim(u.raw_user_meta_data->>'shop_name'), ''), p.shop_name)
from auth.users u
where u.id = p.id
  and (
    (nullif(btrim(p.name), '') is null and nullif(btrim(u.raw_user_meta_data->>'name'), '') is not null)
    or (nullif(btrim(p.phone), '') is null and nullif(btrim(u.raw_user_meta_data->>'phone'), '') is not null)
    or (nullif(btrim(p.shop_name), '') is null and nullif(btrim(u.raw_user_meta_data->>'shop_name'), '') is not null)
  );
