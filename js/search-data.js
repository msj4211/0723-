// 검색이 함께 참조하는 원본 데이터.
// 이어포인트/수면 이어포인트 콘텐츠(이름·설명·이미지)는 730스킨 교육생 전용
// 정보라서 더 이상 이 public JS 파일에 두지 않는다 — js/ear-points-data.js가
// Supabase(RLS로 승인된 교육생만 조회 가능)에서 불러와 window.EarPointsData /
// window.SleepPointsData를 채운다. 세미나 안내와 동의어 사전은 공개 정보라
// 그대로 이 파일에 남겨둔다.
// keywords는 화면에는 표시되지 않고, 검색 매칭에만 쓰이는 연관 증상/부위 단어다.

window.SeminarData = [
  {
    id: 'seminar',
    name: '세미나 신청',
    desc: '이어테라피 세미나와 교육 일정을 확인하고 신청할 수 있어요.',
    name_en: 'Seminar Registration',
    desc_en: 'Check the ear therapy seminar and education schedule and sign up.',
    keywords: ['세미나', '교육', '신청']
  }
];

// 같은 의미로 쓰는 단어를 대표 단어(키) 하나로 연결한다. 검색어가 값(동의어)
// 목록 중 하나와 일치하면, 대표 단어까지 함께 검색해 매칭 범위를 넓힌다.
// 새 동의어가 필요하면 이 객체에 값만 추가하면 된다.
window.SearchSynonyms = {
  '수면': ['잠', '불면', '숙면'],
  '두통': ['머리아픔', '머리 통증', '머리아픈'],
  '소화': ['속쓰림', '체함', '소화불량', '위장'],
  '스트레스': ['긴장', '불안'],
  '무릎': ['무릎 통증', '무릎통증'],
  '이어포인트': ['귀혈자리', '이혈점']
};
