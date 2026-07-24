// Header 상태를 변경하기 위해 필요한 누적 스크롤 거리(px)
const SCROLL_THRESHOLD = 40;

// 작은 손떨림이나 트랙패드 움직임을 무시하는 최소 방향 변화량(px)
const DIRECTION_THRESHOLD = 12;

// Header가 동작한 직후 다시 반대 동작하지 않도록 막는 시간(ms)
const ACTION_COOLDOWN = 250;

// 페이지 최상단으로 판단하는 위치(px)
const TOP_VISIBLE_AREA = 20;

let lastScrollY = window.scrollY;
let accumulatedDistance = 0;
let lastDirection = null;
let lastActionTime = 0;
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
  const scrollDelta = currentScrollY - lastScrollY;
  const currentTime = Date.now();

  if (currentScrollY <= TOP_VISIBLE_AREA) {
    showHeader();
    accumulatedDistance = 0;
    lastDirection = null;
    lastScrollY = currentScrollY;
    ticking = false;
    return;
  }

  // 문서 끝(더 스크롤할 곳이 없는 지점) 근처에서는 트랙패드의 관성/탄성 스크롤
  // 때문에 scrollY가 짧은 시간 안에 오르내릴 수 있다. 콘텐츠가 짧은 화면
  // (세미나신청처럼 스크롤 가능 범위 자체가 좁은 페이지)일수록 이 경계 구간이
  // 전체 스크롤에서 차지하는 비중이 커져서, 정상적인 임계값·쿨다운을 통과하는
  // "진짜처럼 보이는" 반복 반전이 생긴다. 이 구간에서는 누적치를 쌓지 않고
  // Header를 지금 상태 그대로 둔다.
  var maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScrollY > 0 && currentScrollY >= maxScrollY - TOP_VISIBLE_AREA) {
    lastScrollY = currentScrollY;
    ticking = false;
    return;
  }

  if (Math.abs(scrollDelta) < DIRECTION_THRESHOLD) {
    lastScrollY = currentScrollY;
    ticking = false;
    return;
  }

  const currentDirection = scrollDelta > 0 ? 'down' : 'up';

  if (currentDirection !== lastDirection) {
    accumulatedDistance = 0;
    lastDirection = currentDirection;
  }

  accumulatedDistance += Math.abs(scrollDelta);

  const cooldownFinished = currentTime - lastActionTime >= ACTION_COOLDOWN;

  if (cooldownFinished && accumulatedDistance >= SCROLL_THRESHOLD) {
    if (currentDirection === 'down') {
      hideHeader();
    }

    if (currentDirection === 'up') {
      showHeader();
    }

    accumulatedDistance = 0;
    lastActionTime = currentTime;
  }

  lastScrollY = currentScrollY;
  ticking = false;
}

function handleScroll() {
  if (ticking) return;

  ticking = true;
  window.requestAnimationFrame(updateHeaderScroll);
}

window.addEventListener('scroll', handleScroll, { passive: true });

// Route가 바뀔 때(js/router.js의 renderRoute에서 호출) Header 상태와
// 스크롤 누적값을 초기 상태로 되돌린다. hashchange 리스너를 새로 등록하지
// 않고, 기존 라우터가 이 reset()만 호출하도록 연결한다.
window.HeaderScroll = {
  reset: function () {
    showHeader();
    lastScrollY = 0;
    accumulatedDistance = 0;
    lastDirection = null;
    lastActionTime = 0;
  }
};
