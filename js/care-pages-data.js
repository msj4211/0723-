// 메인 '오늘 어떤 관리가 필요하신가요' 버튼별 추천 이어포인트 페이지 데이터.
// 지금은 문구만 보여준다. 원장님이 정확한 혈자리와 귀 그림을 정리하면 아래처럼 채운다:
//   image: 'images/ear-points/xxx.jpg',
//   points: [{ id: '신문', name: '신문', name_en: 'Shenmen', desc: '쉬운 설명', desc_en: 'Easy description' }, ...]
// image나 points가 비어 있으면 그 부분은 화면에 나오지 않는다.
window.CarePagesData = {
  calm: { image: null, points: [] },
  digest: { image: null, points: [] },
  fatigue: { image: null, points: [] },
  shoulder: { image: null, points: [] },
  women: { image: null, points: [] }
};
