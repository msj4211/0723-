// 버튼이 나타나기 시작하는 스크롤 거리(px)
const SCROLL_TOP_SHOW_THRESHOLD = 400;

const scrollTopBtn = document.getElementById('scroll-top-btn');
let scrollTopTicking = false;

function updateScrollTopVisibility() {
  if (!scrollTopBtn) return;
  scrollTopBtn.classList.toggle('is-visible', window.scrollY > SCROLL_TOP_SHOW_THRESHOLD);
  scrollTopTicking = false;
}

function handleScrollTopScroll() {
  if (scrollTopTicking) return;
  scrollTopTicking = true;
  window.requestAnimationFrame(updateScrollTopVisibility);
}

if (scrollTopBtn) {
  window.addEventListener('scroll', handleScrollTopScroll, { passive: true });

  scrollTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  updateScrollTopVisibility();
}
