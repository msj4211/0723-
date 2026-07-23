(function () {
  // Header가 숨겨지거나 나타나는 최소 스크롤 거리(px)
  const SCROLL_THRESHOLD = 15;

  // Header 애니메이션 시간(ms)
  const HEADER_TRANSITION = 350;

  document.documentElement.style.setProperty('--header-transition', HEADER_TRANSITION + 'ms');

  var lastY = window.scrollY;
  var accumulated = 0;
  var direction = null;
  var hidden = false;

  function setHidden(next) {
    if (next === hidden) return;
    hidden = next;
    document.body.classList.toggle('header-hidden', hidden);
  }

  function onScroll() {
    var currentY = window.scrollY;
    var delta = currentY - lastY;
    lastY = currentY;

    if (currentY <= 0) {
      accumulated = 0;
      direction = null;
      setHidden(false);
      return;
    }

    if (delta === 0) return;

    var newDirection = delta > 0 ? 'down' : 'up';

    if (newDirection !== direction) {
      direction = newDirection;
      accumulated = 0;
    }

    accumulated += Math.abs(delta);

    if (accumulated >= SCROLL_THRESHOLD) {
      setHidden(direction === 'down');
      accumulated = 0;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();
