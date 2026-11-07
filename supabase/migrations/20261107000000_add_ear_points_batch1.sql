-- 730스킨이어테라피 이어포인트 카드 40개 추가 (2026-11-07)
-- Supabase 대시보드 > SQL Editor에 전체를 붙여넣고 Run 한다.
-- 기존 이어포인트는 건드리지 않는다. 같은 id가 이미 있으면 건너뛰므로 두 번 실행해도 안전하다.
-- 이미지(images/ear-points/*.jpg)를 GitHub에 먼저 올려야 카드에 그림이 보인다.

insert into public.ear_points (id, name, description, image_url) values
  ('abdominal-pain', '복통', '배 속 불편감과 복부 긴장을 풀어주는 데 쓰는 이어포인트입니다.', 'images/ear-points/abdominal-pain.jpg'),
  ('reflux-esophagitis', '역류성 식도염', '속쓰림·역류감 등 식도와 위 컨디션 관리를 돕는 이어포인트입니다.', 'images/ear-points/reflux-esophagitis.jpg'),
  ('holiday-syndrome', '명절증후군', '명절 전후 쌓인 피로와 긴장, 소화 불편 관리를 돕는 이어포인트입니다.', 'images/ear-points/holiday-syndrome.jpg'),
  ('acne', '여드름', '피부 트러블과 피지 밸런스 관리를 돕는 이어포인트입니다.', 'images/ear-points/acne.jpg'),
  ('alcohol-addiction', '알코올중독', '음주 욕구 조절과 몸의 회복 관리를 돕는 보조 이어포인트입니다.', 'images/ear-points/alcohol-addiction.jpg'),
  ('adhd', 'ADHD', '산만함을 가라앉히고 집중 리듬을 돕는 보조 이어포인트입니다.', 'images/ear-points/adhd.jpg'),
  ('allergy', '알레르기', '예민해진 면역 반응의 밸런스 관리를 돕는 이어포인트입니다.', 'images/ear-points/allergy.jpg'),
  ('ankle-pain', '발목 통증', '발목의 뻐근함과 통증 완화를 돕는 이어포인트입니다.', 'images/ear-points/ankle-pain.jpg'),
  ('anxiety', '불안', '긴장되고 불안한 마음을 차분히 가라앉히는 데 쓰는 이어포인트입니다.', 'images/ear-points/anxiety.jpg'),
  ('anemia', '빈혈', '어지럼과 기운 저하 등 혈액 순환 컨디션 관리를 돕는 이어포인트입니다.', 'images/ear-points/anemia.jpg'),
  ('appendicitis', '맹장염', '아랫배 불편감 관리에 참고하는 이어포인트입니다. 급성 통증은 병원 진료가 우선입니다.', 'images/ear-points/appendicitis.jpg'),
  ('appetite-control', '식욕조절', '과식 습관과 식욕 리듬 조절을 돕는 이어포인트입니다.', 'images/ear-points/appetite-control.jpg'),
  ('rheumatoid-arthritis', '관절염 · 루마티스', '관절의 붓기와 뻣뻣함 관리를 돕는 이어포인트입니다.', 'images/ear-points/rheumatoid-arthritis.jpg'),
  ('osteoarthritis', '관절염 · 골관절염', '닳고 지친 관절의 통증 관리를 돕는 이어포인트입니다.', 'images/ear-points/osteoarthritis.jpg'),
  ('ascites', '복수', '복부에 차는 수분 정체 관리를 돕는 보조 이어포인트입니다.', 'images/ear-points/ascites.jpg'),
  ('asthma', '천식', '답답한 호흡을 편안하게 하는 호흡기 컨디션 관리 이어포인트입니다.', 'images/ear-points/asthma.jpg'),
  ('attention-deficit', '주의력 결핍 장애', '흩어진 주의력을 모으고 집중을 돕는 보조 이어포인트입니다.', 'images/ear-points/attention-deficit.jpg'),
  ('autism', '자폐증', '정서 안정과 감각 예민함 완화를 돕는 보조 이어포인트입니다.', 'images/ear-points/autism.jpg'),
  ('low-back-pain', '허리통증 · 요통', '허리 아래쪽의 뻐근함과 통증 완화를 돕는 이어포인트입니다.', 'images/ear-points/low-back-pain.jpg'),
  ('mid-back-pain', '허리통증 · 허리중앙', '허리 가운데 척추 라인의 통증 완화를 돕는 이어포인트입니다.', 'images/ear-points/mid-back-pain.jpg'),
  ('balance-disorder', '균형 장애', '어지럼과 균형감 저하 관리를 돕는 이어포인트입니다.', 'images/ear-points/balance-disorder.jpg'),
  ('acute-pain', '긴급통증', '갑작스러운 통증을 빠르게 가라앉히는 데 쓰는 이어포인트입니다.', 'images/ear-points/acute-pain.jpg'),
  ('menstrual-pain', '생리통', '생리 기간의 아랫배 통증과 불편감 완화를 돕는 이어포인트입니다.', 'images/ear-points/menstrual-pain.jpg'),
  ('otitis-media', '중이염', '귀 안쪽 염증과 먹먹함 관리를 돕는 이어포인트입니다.', 'images/ear-points/otitis-media.jpg'),
  ('eczema', '습진', '가렵고 예민한 피부 컨디션 관리를 돕는 이어포인트입니다.', 'images/ear-points/eczema.jpg'),
  ('edema', '부종', '몸이 붓고 무거운 느낌을 덜어주는 순환 관리 이어포인트입니다.', 'images/ear-points/edema.jpg'),
  ('elbow-pain', '팔꿈치 통증', '팔꿈치의 뻐근함과 통증 완화를 돕는 이어포인트입니다.', 'images/ear-points/elbow-pain.jpg'),
  ('emphysema', '폐 기종', '폐 기능과 숨 쉬는 컨디션 관리를 돕는 보조 이어포인트입니다.', 'images/ear-points/emphysema.jpg'),
  ('endometriosis', '자궁내막증', '자궁 주변 통증과 여성 밸런스 관리를 돕는 보조 이어포인트입니다.', 'images/ear-points/endometriosis.jpg'),
  ('enuresis', '야뇨증', '밤사이 소변 조절 관리를 돕는 이어포인트입니다.', 'images/ear-points/enuresis.jpg'),
  ('epilepsy', '간질', '신경 안정 관리를 돕는 보조 이어포인트입니다.', 'images/ear-points/epilepsy.jpg'),
  ('facial-palsy', '안면마비', '얼굴 근육과 신경 회복 관리를 돕는 보조 이어포인트입니다.', 'images/ear-points/facial-palsy.jpg'),
  ('fecal-incontinence', '대변 실금', '장과 배변 조절 관리를 돕는 이어포인트입니다.', 'images/ear-points/fecal-incontinence.jpg'),
  ('fever', '열', '몸에 오른 열을 식히고 컨디션 회복을 돕는 이어포인트입니다.', 'images/ear-points/fever.jpg'),
  ('fibromyalgia', '섬유근육통', '온몸에 퍼진 근육 통증 완화를 돕는 이어포인트입니다.', 'images/ear-points/fibromyalgia.jpg'),
  ('finger-pain', '손가락 통증', '손가락 마디의 뻐근함과 통증 완화를 돕는 이어포인트입니다.', 'images/ear-points/finger-pain.jpg'),
  ('bloating', '복부팽만', '더부룩하고 가스가 찬 배를 편안하게 하는 이어포인트입니다.', 'images/ear-points/bloating.jpg'),
  ('foot-pain', '발 통증', '발바닥과 발가락 통증 완화를 돕는 이어포인트입니다.', 'images/ear-points/foot-pain.jpg'),
  ('frequent-urination', '잦은 배뇨', '소변을 자주 보는 불편함 관리를 돕는 이어포인트입니다.', 'images/ear-points/frequent-urination.jpg'),
  ('infertility', '불임 · 난임', '임신 준비를 위한 호르몬과 여성 밸런스 관리를 돕는 보조 이어포인트입니다.', 'images/ear-points/infertility.jpg')
on conflict (id) do nothing;

-- 확인용: 추가된 개수 (40이 나오면 정상)
select count(*) as added from public.ear_points where image_url like 'images/ear-points/%';
