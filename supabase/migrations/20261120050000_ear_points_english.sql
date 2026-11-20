-- 이어포인트 영어 이름·설명 (영어 모드에서 보이는 글)
-- 한국어 칸(name, description)은 건드리지 않는다.
alter table public.ear_points add column if not exists name_en text;
alter table public.ear_points add column if not exists description_en text;

alter table public.ear_point_details add column if not exists selection_reason_en text;
alter table public.ear_point_details add column if not exists location_guide_en text;
alter table public.ear_point_details add column if not exists combo_points_en jsonb;
alter table public.ear_point_details add column if not exists usage_steps_en jsonb;
alter table public.ear_point_details add column if not exists management_tips_en jsonb;
alter table public.ear_point_details add column if not exists avoid_when_en jsonb;
alter table public.ear_point_details add column if not exists video_title_en text;
alter table public.ear_point_details add column if not exists video_description_en text;

alter table public.ear_point_related_points add column if not exists reason_en text;

update public.ear_points p
set name_en = v.name_en, description_en = v.description_en
from (values
  ('ear', 'Ear Health', 'An ear point that supports circulation around the ear and hearing care.'),
  ('stomach', 'Digestion · Stomach', 'An ear point for digestive function and stomach comfort.'),
  ('sleep', 'Deep Sleep', 'An ear point that supports deep, restful sleep.'),
  ('immune', 'Immune Boost', 'An ear point that supports the body''s immune balance.'),
  ('knee', 'Knee Pain', 'An ear point that helps ease knee pain.'),
  ('hairloss', 'Hair Loss Care', 'An ear point that supports scalp and hair health.'),
  ('growth', 'Children''s Growth', 'An ear point that supports healthy growth in children.'),
  ('abdominal-pain', 'Abdominal Pain', 'An ear point used to ease stomach discomfort and abdominal tension.'),
  ('reflux-esophagitis', 'Acid Reflux', 'An ear point that supports esophagus and stomach care, such as heartburn and reflux.'),
  ('holiday-syndrome', 'Holiday Fatigue', 'An ear point for fatigue, tension and indigestion that build up around holidays.'),
  ('acne', 'Acne', 'An ear point that supports skin breakouts and sebum balance.'),
  ('alcohol-addiction', 'Alcohol Dependence', 'A supporting ear point for managing the urge to drink and helping the body recover.'),
  ('adhd', 'ADHD', 'A supporting ear point that helps calm restlessness and support focus.'),
  ('allergy', 'Allergy', 'An ear point that supports balance in an over-sensitive immune response.'),
  ('ankle-pain', 'Ankle Pain', 'An ear point that helps ease ankle stiffness and pain.'),
  ('anxiety', 'Anxiety', 'An ear point used to calm a tense, anxious mind.'),
  ('anemia', 'Anemia', 'An ear point for circulation-related care such as dizziness and low energy.'),
  ('appendicitis', 'Appendicitis', 'An ear point for lower abdominal discomfort. For acute pain, see a doctor first.'),
  ('appetite-control', 'Appetite Control', 'An ear point that helps with overeating habits and appetite rhythm.'),
  ('rheumatoid-arthritis', 'Arthritis · Rheumatoid', 'An ear point that supports care for swollen, stiff joints.'),
  ('osteoarthritis', 'Arthritis · Osteoarthritis', 'An ear point that supports pain care for worn, tired joints.'),
  ('ascites', 'Ascites', 'A supporting ear point for fluid build-up in the abdomen.'),
  ('asthma', 'Asthma', 'An ear point for respiratory care that helps ease tight breathing.'),
  ('attention-deficit', 'Attention Deficit', 'A supporting ear point that helps gather scattered attention and focus.'),
  ('autism', 'Autism', 'A supporting ear point for emotional stability and easing sensory sensitivity.'),
  ('low-back-pain', 'Back Pain · Lower Back', 'An ear point that helps ease stiffness and pain in the lower back.'),
  ('mid-back-pain', 'Back Pain · Mid Back', 'An ear point that helps ease pain along the middle of the spine.'),
  ('balance-disorder', 'Balance Disorder', 'An ear point for dizziness and loss of balance.'),
  ('acute-pain', 'Acute Pain', 'An ear point used to calm sudden pain quickly.'),
  ('menstrual-pain', 'Menstrual Pain', 'An ear point that helps ease lower abdominal pain and discomfort during periods.'),
  ('otitis-media', 'Middle Ear Infection', 'An ear point for inner-ear inflammation and a blocked feeling.'),
  ('eczema', 'Eczema', 'An ear point for itchy, sensitive skin.'),
  ('edema', 'Swelling', 'A circulation ear point that eases a swollen, heavy feeling in the body.'),
  ('elbow-pain', 'Elbow Pain', 'An ear point that helps ease elbow stiffness and pain.'),
  ('emphysema', 'Emphysema', 'A supporting ear point for lung function and breathing comfort.'),
  ('endometriosis', 'Endometriosis', 'A supporting ear point for pelvic pain and female hormonal balance.'),
  ('enuresis', 'Bedwetting', 'An ear point that supports bladder control at night.'),
  ('epilepsy', 'Epilepsy', 'A supporting ear point for nervous system stability.'),
  ('facial-palsy', 'Facial Palsy', 'A supporting ear point for facial muscle and nerve recovery.'),
  ('fecal-incontinence', 'Fecal Incontinence', 'An ear point that supports bowel control.'),
  ('fever', 'Fever', 'An ear point that helps cool a fever and support recovery.'),
  ('fibromyalgia', 'Fibromyalgia', 'An ear point that helps ease muscle pain spread through the body.'),
  ('finger-pain', 'Finger Pain', 'An ear point that helps ease stiffness and pain in finger joints.'),
  ('bloating', 'Bloating', 'An ear point that relieves a full, gassy stomach.'),
  ('foot-pain', 'Foot Pain', 'An ear point that helps ease pain in the soles and toes.'),
  ('frequent-urination', 'Frequent Urination', 'An ear point for the discomfort of urinating often.'),
  ('infertility', 'Infertility', 'A supporting ear point for hormonal and female balance when preparing for pregnancy.')
) as v(id, name_en, description_en)
where p.id = v.id and (p.name_en is null or p.name_en = '');
