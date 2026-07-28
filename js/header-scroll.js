// Header 표시 여부는 스크롤 방향이 아니라, 페이지 상단으로부터의
// 절대 위치(scrollY)만으로 결정한다. 이 값 이내일 때만 보이고,
// 그 외에는 스크롤 방향과 무관하게 항상 숨겨진 상태를 유지한다.
// 콘텐츠를 읽는 도중에는 위로 조금 스크롤해도 Header가 끼어들지 않는다.
const NEAR_TOP_THRESHOLD = 80;

let ticking = false;

const header = document.querySelector('.site-header');

function showHeader() {
  if (!header) return;
  header.classList.remove('is-hidden');
}

function hideHeader() {
  if (!header) return;
  header.classList.add('is-hidden');
}

function updateHeaderScroll() {
  const currentScrollY = Math.max(window.scrollY, 0);

  if (currentScrollY <= NEAR_TOP_THRESHOLD) {
    showHeader();
  } else {
    hideHeader();
  }

  ticking = false;
}

function handleScroll() {
  if (ticking) return;

  ticking = true;
  window.requestAnimationFrame(updateHeaderScroll);
}

window.addEventListener('scroll', handleScroll, { passive: true });

// Route가 바뀔 때(js/router.js의 renderRoute에서 호출) Header를 항상
// 보이는 상태로 되돌린다. hashchange 리스너를 새로 등록하지 않고,
// 기존 라우터가 이 reset()만 호출하도록 연결한다.
window.HeaderScroll = {
  reset: function () {
    showHeader();
  }
};
