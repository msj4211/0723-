// 메인 '오늘 어떤 관리가 필요하신가요' 버튼별 추천 이어포인트 페이지 데이터.
// - image: 이어포인트 메뉴의 해당 증상 카드 그림(730스킨 이혈도)
// - points: 그림에 표시된 혈자리(이름은 그림에 적힌 그대로)
// - desc/desc_en: 이어 리딩 가이드(ear-reading/index.html의 D.points, en.js)의 한 줄 설명을 그대로 가져온 것
// 이어 리딩 가이드 설명을 고치면 이 파일도 다시 만들어야 한다.
window.CarePagesData = {
  "sleep": {
    "image": "images/충분한수면.PNG",
    "card": "충분한 수면",
    "points": [
      {
        "id": "신문",
        "name": "신문",
        "name_en": "Shenmen",
        "desc": "마음을 가라앉히는 이어테라피의 대표 자리다. 긴장이 쌓이면 불안, 잠 못 듦, 통증에 예민함으로 신호를 보낸다.",
        "desc_en": "The signature calming point of ear therapy. When tension builds up, it signals with anxiety, sleeplessness and sensitivity to pain."
      },
      {
        "id": "신장C",
        "name": "신장",
        "name_en": "Kidney",
        "desc": "몸의 정수기이자 타고난 생명력을 저장하는 창고다(중국식 위치). 흐름이 막히면 붓기, 허리 시큰거림, 쉽게 지치는 몸으로 신호를 보낸다.",
        "desc_en": "The body's water filter and storehouse of inborn vitality (Chinese location). When the flow is blocked, it signals with swelling, an aching lower back and tiring easily."
      },
      {
        "id": "위",
        "name": "위",
        "name_en": "Stomach",
        "desc": "먹은 음식을 받아 잘게 부수는 몸의 첫 번째 주방이다. 흐름이 막히면 더부룩함, 속쓰림, 입맛 변화, 스트레스성 폭식으로 신호가 온다.",
        "desc_en": "The body's first kitchen that receives and breaks down food. When the flow is blocked, it signals with bloating, heartburn, appetite changes and stress eating."
      },
      {
        "id": "심장C",
        "name": "심장",
        "name_en": "Heart",
        "desc": "온몸에 피를 보내는 펌프이자 마음이 머무는 집이다(중국식 위치). 부담이 쌓이면 두근거림, 잠 못 듦, 얼굴빛 변화로 신호를 보낸다.",
        "desc_en": "The pump sending blood around the body and the home of the mind (Chinese location). When strain builds up, it signals with palpitations, sleeplessness and changes in complexion."
      },
      {
        "id": "ACTH",
        "name": "ACTH",
        "name_en": "ACTH",
        "desc": "뇌가 부신에게 내리는 '스트레스 명령서' 자리다. 부담이 쌓이면 늘 곤두서 있는 긴장·얕은 잠·풀리지 않는 피로로 먼저 신호를 보낸다.",
        "desc_en": "The brain's 'stress order' to the adrenal glands. When strain builds up, it signals first with constant edginess, light sleep and fatigue that won't lift."
      },
      {
        "id": "우울감",
        "name": "우울",
        "name_en": "Low Mood",
        "desc": "처진 기분과 의욕을 살피는 자리다. 마음이 지치면 아무것도 하기 싫고, 좋아하던 것도 재미없어지는 신호로 나타난다.",
        "desc_en": "Checks low mood and motivation. When the mind is worn out, you don't want to do anything and even things you loved stop being fun."
      },
      {
        "id": "흥분",
        "name": "흥분",
        "name_en": "Excitement",
        "desc": "뇌가 깨어 있는 정도(각성)를 조율하는 자리다. 각성이 처지면 졸리고 무기력하며, 지나치면 들뜨고 긴장하는 신호로 나타난다.",
        "desc_en": "Coordinates how awake the brain is (alertness). When alertness drops you feel sleepy and lethargic; when it's too high you feel wired and tense."
      },
      {
        "id": "접형골",
        "name": "접형골",
        "name_en": "Sphenoid Bone",
        "desc": "접형골(Sphenoid bone) 상응점은 단순한 머리뼈의 일부가 아니라 '호르몬 밸런스'와 '안면 구조의 중심'을 다스리는 핵심 컨트롤 타워로 해석된다.",
        "desc_en": "The sphenoid point is read not just as part of the skull but as a key control tower for hormone balance and the center of facial structure."
      },
      {
        "id": "감정의뇌",
        "name": "감정의뇌",
        "name_en": "Emotional Brain (Amygdala)",
        "desc": "뇌 속 감정 경보기가 비치는 자리다. 리듬이 깨지면 잘 놀라고, 욱하고, 이유 없이 불안한 신호로 나타난다.",
        "desc_en": "Reflects the brain's emotional alarm. When the rhythm breaks, you startle easily, flare up and feel anxious for no reason."
      },
      {
        "id": "이첨",
        "name": "이첨",
        "name_en": "Ear Apex",
        "desc": "몸의 열을 빼 주는 밸브 같은 자리다. 리듬이 깨지면 얼굴 열감·붉은 트러블·가려움으로 먼저 신호를 보낸다.",
        "desc_en": "Works like a valve that releases body heat. When the rhythm breaks, it signals first with facial heat, red breakouts and itching."
      }
    ]
  },
  "calm": {
    "image": "images/ear-points/anxiety.jpg",
    "card": "불안",
    "points": [
      {
        "id": "신문",
        "name": "신문",
        "name_en": "Shenmen",
        "desc": "마음을 가라앉히는 이어테라피의 대표 자리다. 긴장이 쌓이면 불안, 잠 못 듦, 통증에 예민함으로 신호를 보낸다.",
        "desc_en": "The signature calming point of ear therapy. When tension builds up, it signals with anxiety, sleeplessness and sensitivity to pain."
      },
      {
        "id": "심장F",
        "name": "심장",
        "name_en": "Heart",
        "desc": "온몸에 피를 보내는 펌프이자 마음이 머무는 집이다(유럽식 위치). 균형이 흐트러지면 두근거림, 잠 못 듦, 얼굴빛 변화로 신호를 보낸다.",
        "desc_en": "The pump sending blood around the body and the home of the mind (European location). When balance is off, it signals with palpitations, sleeplessness and changes in complexion."
      },
      {
        "id": "교감신경",
        "name": "교감신경",
        "name_en": "Sympathetic",
        "desc": "몸의 긴장과 이완 시소를 맞추는 자리다. 리듬이 깨지면 손발 차가움·스트레스성 체함·굳은 어깨로 먼저 신호를 보낸다.",
        "desc_en": "Balances the body's seesaw of tension and relaxation. When the rhythm breaks, it signals first with cold hands and feet, stress-related indigestion and stiff shoulders."
      },
      {
        "id": "포인트0",
        "name": "포인트0",
        "name_en": "Point Zero",
        "desc": "귀 전체의 균형을 영점으로 맞추는 기준점이다. 몸과 마음이 한쪽으로 치우쳐 컨디션이 들쭉날쭉할 때 가장 먼저 짚는 자리다.",
        "desc_en": "The reference point that zeroes the balance of the whole ear. The first point to touch when body and mind lean to one side and condition swings up and down."
      },
      {
        "id": "심장C",
        "name": "심장C",
        "name_en": "Heart",
        "desc": "온몸에 피를 보내는 펌프이자 마음이 머무는 집이다(중국식 위치). 부담이 쌓이면 두근거림, 잠 못 듦, 얼굴빛 변화로 신호를 보낸다.",
        "desc_en": "The pump sending blood around the body and the home of the mind (Chinese location). When strain builds up, it signals with palpitations, sleeplessness and changes in complexion."
      },
      {
        "id": "부신C",
        "name": "부신C",
        "name_en": "Adrenal",
        "desc": "스트레스에 맞서는 몸의 비상 대응팀이다(중국식 위치). 리듬이 깨지면 아침에 못 일어나고, 오후에 급격히 방전되고, 피부가 쉽게 뒤집히는 신호로 나타난다.",
        "desc_en": "The body's emergency team against stress (Chinese location). When the rhythm breaks, you can't get up in the morning, crash in the afternoon and the skin flares easily."
      },
      {
        "id": "진정",
        "name": "진정",
        "name_en": "Tranquilizer",
        "desc": "몸과 마음의 과열을 식혀 주는 브레이크 자리다. 리듬이 깨지면 가슴 두근거림·초조함·잠 못 드는 밤으로 먼저 신호를 보낸다.",
        "desc_en": "The brake that cools an overheated body and mind. When the rhythm breaks, it signals first with a pounding heart, restlessness and sleepless nights."
      },
      {
        "id": "미주신경",
        "name": "미주신경",
        "name_en": "Vagus Nerve",
        "desc": "몸에 '이제 쉬어도 된다'는 신호를 전하는 부교감신경의 대표 자리다. 부담이 쌓이면 늘 긴장되고, 소화가 안 되고, 잠이 얕은 느낌으로 나타난다.",
        "desc_en": "The main parasympathetic point that tells the body 'you can rest now'. When strain builds up, you feel constantly tense, digestion stalls and sleep is light."
      },
      {
        "id": "후아",
        "name": "후아",
        "name_en": "Hou Ya (Calming)",
        "desc": "귀에서 가장 많이 쓰이는 역동적인 혈자리로, 뇌와 척수(중추신경계)에 직접 연결되는 자리로 본다.",
        "desc_en": "One of the most dynamic points on the ear, seen as directly connected to the brain and spinal cord (central nervous system)."
      },
      {
        "id": "마스터대뇌",
        "name": "마스터대뇌",
        "name_en": "Master Cerebral",
        "desc": "생각하고 판단하는 뇌 앞쪽(전두엽)을 다스리는 자리다. 예민해지면 걱정이 꼬리를 물고, 집중이 안 되고, 잠이 얕아지는 느낌으로 나타난다.",
        "desc_en": "Governs the front of the brain that thinks and judges. When it is overactive, worries chain together, focus drops and sleep becomes light."
      }
    ]
  },
  "digest": {
    "image": "images/ear-points/bloating.jpg",
    "card": "복부팽만",
    "points": [
      {
        "id": "복부",
        "name": "복부",
        "name_en": "Abdomen",
        "desc": "배 전체의 움직임을 살피는 자리다. 리듬이 깨지면 배가 묵직하게 더부룩하고, 허리까지 뻐근한 신호로 나타난다.",
        "desc_en": "Checks movement of the whole belly. When the rhythm breaks, the belly feels heavy and bloated, with stiffness reaching the lower back."
      },
      {
        "id": "흉선",
        "name": "흉선",
        "name_en": "Thymus",
        "desc": "면역세포를 훈련시키는 흉선이 비치는 자리다. 부담이 쌓이면 감기·구내염·입술 물집이 잦아지는 신호로 나타난다.",
        "desc_en": "Reflects the thymus that trains immune cells. When strain builds up, colds, mouth ulcers and cold sores become frequent."
      },
      {
        "id": "소장",
        "name": "소장",
        "name_en": "Small Intestine",
        "desc": "음식에서 영양을 거둬들이는 몸의 흡수 공장이다. 흐름이 막히면 더부룩함, 묽은 변, 먹어도 기운이 안 나는 느낌으로 신호를 보낸다.",
        "desc_en": "The body's absorption factory that takes nutrients from food. When the flow is blocked, it signals with bloating, loose stools and no energy even after eating."
      },
      {
        "id": "대장",
        "name": "대장",
        "name_en": "Large Intestine",
        "desc": "수분을 거둬들이고 노폐물을 내보내는 장의 마지막 구간 자리다. 리듬이 깨지면 변비·설사·더부룩함, 그리고 피부 트러블로 신호를 보낸다.",
        "desc_en": "The last section of the gut that reabsorbs water and expels waste. When the rhythm breaks, it signals with constipation, diarrhea, bloating and skin breakouts."
      },
      {
        "id": "자율신경",
        "name": "자율신경",
        "name_en": "Autonomic Nerve",
        "desc": "심장·호흡·소화·체온·땀을 자동으로 조절하는 신경의 시소 균형을 잡는 자리다. 신문과 함께 이어테라피의 '투 톱' 포인트다.",
        "desc_en": "Balances the seesaw of nerves that automatically control the heart, breathing, digestion, body temperature and sweat. With Shenmen, one of the 'top two' points of ear therapy."
      },
      {
        "id": "삼초",
        "name": "삼초",
        "name_en": "San Jiao (Triple Burner)",
        "desc": "몸통 전체에 기운과 수분이 오가는 길이다. 길이 막히면 붓기, 위는 덥고 아래는 찬 느낌, 가슴 답답함으로 신호를 보낸다.",
        "desc_en": "The pathway for energy and fluids through the whole torso. When it is blocked, it signals with swelling, feeling hot above and cold below, and chest tightness."
      }
    ]
  },
  "fatigue": {
    "image": "images/ear-points/holiday-syndrome.jpg",
    "card": "명절증후군",
    "points": [
      {
        "id": "신문",
        "name": "신문",
        "name_en": "Shenmen",
        "desc": "마음을 가라앉히는 이어테라피의 대표 자리다. 긴장이 쌓이면 불안, 잠 못 듦, 통증에 예민함으로 신호를 보낸다.",
        "desc_en": "The signature calming point of ear therapy. When tension builds up, it signals with anxiety, sleeplessness and sensitivity to pain."
      },
      {
        "id": "교감신경",
        "name": "교감신경",
        "name_en": "Sympathetic",
        "desc": "몸의 긴장과 이완 시소를 맞추는 자리다. 리듬이 깨지면 손발 차가움·스트레스성 체함·굳은 어깨로 먼저 신호를 보낸다.",
        "desc_en": "Balances the body's seesaw of tension and relaxation. When the rhythm breaks, it signals first with cold hands and feet, stress-related indigestion and stiff shoulders."
      },
      {
        "id": "비장C",
        "name": "비장",
        "name_en": "Spleen",
        "desc": "먹은 것을 기운과 혈로 바꿔 온몸에 실어 나르는 운반 본부다(중국식 위치). 균형이 흐트러지면 식후에 졸리고, 몸이 무겁게 붓고, 단것이 당기는 신호로 나타난다.",
        "desc_en": "The transport center that turns food into energy and blood and carries it around the body (Chinese location). When balance is off, you get sleepy after meals, feel heavy and swollen and crave sweets."
      },
      {
        "id": "위",
        "name": "위",
        "name_en": "Stomach",
        "desc": "먹은 음식을 받아 잘게 부수는 몸의 첫 번째 주방이다. 흐름이 막히면 더부룩함, 속쓰림, 입맛 변화, 스트레스성 폭식으로 신호가 온다.",
        "desc_en": "The body's first kitchen that receives and breaks down food. When the flow is blocked, it signals with bloating, heartburn, appetite changes and stress eating."
      },
      {
        "id": "식도",
        "name": "식도",
        "name_en": "Esophagus",
        "desc": "입에서 위까지 음식을 내려보내는 길이다. 균형이 흐트러지면 속쓰림, 신물, 목에 뭔가 걸린 느낌으로 신호를 보낸다.",
        "desc_en": "The passage that carries food from mouth to stomach. When balance is off, it signals with heartburn, acid and a feeling of something stuck in the throat."
      },
      {
        "id": "시상",
        "name": "시상",
        "name_en": "Thalamus",
        "desc": "몸의 감각 정보를 모아 대뇌로 보내는 중계소다. 과부하가 걸리면 예민함, 불안, 잘 가라앉지 않는 통증으로 신호를 보낸다.",
        "desc_en": "The relay that gathers sensory information and sends it to the cerebrum. When overloaded, it signals with sensitivity, anxiety and pain that won't settle."
      },
      {
        "id": "경추",
        "name": "경추",
        "name_en": "Cervical Spine",
        "desc": "무거운 머리를 받치는 목뼈 자리다. 부담이 쌓이면 뒷목 뻐근함·두통·어깨 결림으로 먼저 신호를 보낸다.",
        "desc_en": "The neck vertebrae that hold up the heavy head. When strain builds up, it signals first with a stiff back of the neck, headaches and tight shoulders."
      }
    ]
  },
  "shoulder": {
    "image": "images/ear-points/fibromyalgia.jpg",
    "card": "섬유근육통",
    "points": [
      {
        "id": "경추",
        "name": "경추",
        "name_en": "Cervical Spine",
        "desc": "무거운 머리를 받치는 목뼈 자리다. 부담이 쌓이면 뒷목 뻐근함·두통·어깨 결림으로 먼저 신호를 보낸다.",
        "desc_en": "The neck vertebrae that hold up the heavy head. When strain builds up, it signals first with a stiff back of the neck, headaches and tight shoulders."
      },
      {
        "id": "흉추",
        "name": "흉추",
        "name_en": "Thoracic Spine",
        "desc": "등 한가운데를 받치는 척추, 흉추가 비치는 자리다. 많이 쓰면 날개뼈 사이가 결리고 등이 굽는 신호로 나타난다.",
        "desc_en": "Reflects the thoracic spine supporting the middle of the back. With heavy use, it signals with tension between the shoulder blades and a rounded back."
      },
      {
        "id": "근육이완",
        "name": "근육이완",
        "name_en": "Muscle Relaxation",
        "desc": "온몸의 뭉친 근육을 한 번에 풀어 주는 자리다. 부담이 쌓이면 뻐근함·뛰뛰함·눌러도 안 풀리는 뜨뭉함으로 먼저 신호를 보낸다.",
        "desc_en": "Releases knotted muscles all over the body at once. When strain builds up, it signals first with stiffness, tightness and knots that won't loosen even when pressed."
      },
      {
        "id": "신문",
        "name": "신문",
        "name_en": "Shenmen",
        "desc": "마음을 가라앉히는 이어테라피의 대표 자리다. 긴장이 쌓이면 불안, 잠 못 듦, 통증에 예민함으로 신호를 보낸다.",
        "desc_en": "The signature calming point of ear therapy. When tension builds up, it signals with anxiety, sleeplessness and sensitivity to pain."
      },
      {
        "id": "신장C",
        "name": "신장",
        "name_en": "Kidney",
        "desc": "몸의 정수기이자 타고난 생명력을 저장하는 창고다(중국식 위치). 흐름이 막히면 붓기, 허리 시큰거림, 쉽게 지치는 몸으로 신호를 보낸다.",
        "desc_en": "The body's water filter and storehouse of inborn vitality (Chinese location). When the flow is blocked, it signals with swelling, an aching lower back and tiring easily."
      },
      {
        "id": "포인트0",
        "name": "포인트0",
        "name_en": "Point Zero",
        "desc": "귀 전체의 균형을 영점으로 맞추는 기준점이다. 몸과 마음이 한쪽으로 치우쳐 컨디션이 들쭉날쭉할 때 가장 먼저 짚는 자리다.",
        "desc_en": "The reference point that zeroes the balance of the whole ear. The first point to touch when body and mind lean to one side and condition swings up and down."
      },
      {
        "id": "시상",
        "name": "시상",
        "name_en": "Thalamus",
        "desc": "몸의 감각 정보를 모아 대뇌로 보내는 중계소다. 과부하가 걸리면 예민함, 불안, 잘 가라앉지 않는 통증으로 신호를 보낸다.",
        "desc_en": "The relay that gathers sensory information and sends it to the cerebrum. When overloaded, it signals with sensitivity, anxiety and pain that won't settle."
      },
      {
        "id": "활력",
        "name": "활력",
        "name_en": "Vitality",
        "desc": "몸 전체의 에너지 수준을 살피는 자리다. 부담이 쌓이면 자도 자도 피곤하고, 오래 아프고 난 뒤 기운이 돌아오지 않는 신호로 나타난다.",
        "desc_en": "Checks the body's overall energy level. When strain builds up, you're tired no matter how much you sleep and energy doesn't return after a long illness."
      },
      {
        "id": "마스터진동",
        "name": "마스터진동",
        "name_en": "Master Oscillation",
        "desc": "흐트러진 몸의 좌우 박자를 다시 맞추는 '조율 버튼' 자리다. 리듬이 깨지면 몸이 한쪽으로 틀어지고, 눈밑이 떨리고, 관리를 해도 몸이 잘 받아들이지 못하는 느낌으로 나타난다.",
        "desc_en": "A 'tuning button' that resets the body's left-right rhythm. When the rhythm breaks, the body twists to one side, the eyelids twitch and the body doesn't respond well to care."
      },
      {
        "id": "진정",
        "name": "진정",
        "name_en": "Tranquilizer",
        "desc": "몸과 마음의 과열을 식혀 주는 브레이크 자리다. 리듬이 깨지면 가슴 두근거림·초조함·잠 못 드는 밤으로 먼저 신호를 보낸다.",
        "desc_en": "The brake that cools an overheated body and mind. When the rhythm breaks, it signals first with a pounding heart, restlessness and sleepless nights."
      },
      {
        "id": "심신반응F",
        "name": "심신반응F",
        "name_en": "Psychosomatic",
        "desc": "몸에 쌓인 마음의 짐을 살피는 자리다. 오래 눌러 둔 감정은 이유 모를 답답함, 생생한 꿈, 몸 곳곳의 불편함으로 신호를 보낸다.",
        "desc_en": "Checks emotional burdens stored in the body. Long-suppressed feelings signal as unexplained heaviness, vivid dreams and discomfort here and there."
      },
      {
        "id": "우울감",
        "name": "우울",
        "name_en": "Low Mood",
        "desc": "처진 기분과 의욕을 살피는 자리다. 마음이 지치면 아무것도 하기 싫고, 좋아하던 것도 재미없어지는 신호로 나타난다.",
        "desc_en": "Checks low mood and motivation. When the mind is worn out, you don't want to do anything and even things you loved stop being fun."
      }
    ]
  },
  "women": {
    "image": "images/ear-points/menstrual-pain.jpg",
    "card": "생리통",
    "points": [
      {
        "id": "자궁C",
        "name": "자궁",
        "name_en": "Uterus",
        "desc": "(중국식 위치) 여성 몸의 한 달 리듬을 만드는 방이다. 균형이 흐트러지면 생리통·생리 전 예민함·아랫배 냉기로 먼저 신호를 보낸다.",
        "desc_en": "(Chinese location) The room that creates the female body's monthly rhythm. When balance is off, it signals first with period pain, PMS irritability and a cold lower belly."
      },
      {
        "id": "골반",
        "name": "골반",
        "name_en": "Pelvis",
        "desc": "몸의 중심을 받치는 바구니 자리다. 리듬이 깨지면 허리 뻐근함·아랫배 냉기·생리통으로 먼저 신호를 보낸다.",
        "desc_en": "The basket that supports the body's center. When the rhythm breaks, it signals first with low back stiffness, a cold lower belly and period pain."
      },
      {
        "id": "복부",
        "name": "복부",
        "name_en": "Abdomen",
        "desc": "배 전체의 움직임을 살피는 자리다. 리듬이 깨지면 배가 묵직하게 더부룩하고, 허리까지 뻐근한 신호로 나타난다.",
        "desc_en": "Checks movement of the whole belly. When the rhythm breaks, the belly feels heavy and bloated, with stiffness reaching the lower back."
      },
      {
        "id": "신문",
        "name": "신문",
        "name_en": "Shenmen",
        "desc": "마음을 가라앉히는 이어테라피의 대표 자리다. 긴장이 쌓이면 불안, 잠 못 듦, 통증에 예민함으로 신호를 보낸다.",
        "desc_en": "The signature calming point of ear therapy. When tension builds up, it signals with anxiety, sleeplessness and sensitivity to pain."
      },
      {
        "id": "외음부C",
        "name": "외음부C",
        "name_en": "External Genitals",
        "desc": "외음부·음낭 등 몸의 가장 민감한 부위와 성 기능을 살피는 자리다(중국식 위치). 흐름이 막히면 성욕 저하, 아랫배·허리 무거움, 가려움 같은 불편으로 신호가 온다.",
        "desc_en": "Checks the most sensitive areas, such as the vulva and scrotum, and sexual function (Chinese location). When the flow is blocked, it signals with low libido, a heavy lower belly and back, and itching."
      },
      {
        "id": "자율신경",
        "name": "자율신경",
        "name_en": "Autonomic Nerve",
        "desc": "심장·호흡·소화·체온·땀을 자동으로 조절하는 신경의 시소 균형을 잡는 자리다. 신문과 함께 이어테라피의 '투 톱' 포인트다.",
        "desc_en": "Balances the seesaw of nerves that automatically control the heart, breathing, digestion, body temperature and sweat. With Shenmen, one of the 'top two' points of ear therapy."
      },
      {
        "id": "난소&고환",
        "name": "난소&고환",
        "name_en": "Ovary & Testis",
        "desc": "성호르몬을 만드는 난소·고환을 살피는 자리다(유럽식 위치). 부담이 쌓이면 생리 주기 흔들림, 활력 저하, 피부 변화로 신호를 보낸다.",
        "desc_en": "Checks the ovaries and testes that make sex hormones (European location). When strain builds up, it signals with an unsteady cycle, low energy and skin changes."
      },
      {
        "id": "포인트0",
        "name": "포인트0",
        "name_en": "Point Zero",
        "desc": "귀 전체의 균형을 영점으로 맞추는 기준점이다. 몸과 마음이 한쪽으로 치우쳐 컨디션이 들쭉날쭉할 때 가장 먼저 짚는 자리다.",
        "desc_en": "The reference point that zeroes the balance of the whole ear. The first point to touch when body and mind lean to one side and condition swings up and down."
      },
      {
        "id": "시상",
        "name": "시상",
        "name_en": "Thalamus",
        "desc": "몸의 감각 정보를 모아 대뇌로 보내는 중계소다. 과부하가 걸리면 예민함, 불안, 잘 가라앉지 않는 통증으로 신호를 보낸다.",
        "desc_en": "The relay that gathers sensory information and sends it to the cerebrum. When overloaded, it signals with sensitivity, anxiety and pain that won't settle."
      },
      {
        "id": "후아",
        "name": "후아",
        "name_en": "Hou Ya (Calming)",
        "desc": "귀에서 가장 많이 쓰이는 역동적인 혈자리로, 뇌와 척수(중추신경계)에 직접 연결되는 자리로 본다.",
        "desc_en": "One of the most dynamic points on the ear, seen as directly connected to the brain and spinal cord (central nervous system)."
      },
      {
        "id": "성선자극혈",
        "name": "성선자극혈",
        "name_en": "Gonadotropin Point",
        "desc": "난소·고환에 '성호르몬을 만들라'는 신호를 보내는 상위 호르몬(FSH·LH)의 자리다. 난소가 공장이라면 이 자리는 발주 부서다.",
        "desc_en": "The point for upstream hormones (FSH, LH) that tell the ovaries and testes to make sex hormones. If the ovaries are the factory, this point is the ordering department."
      },
      {
        "id": "내분비",
        "name": "내분비",
        "name_en": "Endocrine",
        "desc": "몸속 호르몬 균형을 한눈에 살피는 총괄 자리다. 흔들리면 생리 주기, 감정 기복, 피부 컨디션이 먼저 들쑥날쑥해진다.",
        "desc_en": "The overall point for the body's hormone balance. When it wavers, the menstrual cycle, mood swings and skin condition become uneven first."
      }
    ]
  }
};
