(function () {
  var routes = {
    '': window.Pages.home,
    'ear-check': window.Pages.earCheck,
    'ear-point': window.Pages.earPoint,
    'seminar': window.Pages.seminar,
    'products': window.Pages.products,
    'recommend/sleep': window.Pages.recommendSleep
  };

  var app = document.getElementById('app');

  function currentRouteName() {
    var hash = window.location.hash.replace(/^#\/?/, '');
    return routes.hasOwnProperty(hash) ? hash : '';
  }

  function updateActiveNav(routeName) {
    var activeRoute = routeName === '' ? 'home' : routeName;
    document.querySelectorAll('[data-route]').forEach(function (link) {
      if (link.dataset.route === activeRoute) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function renderRoute() {
    var routeName = currentRouteName();
    routes[routeName](app);
    updateActiveNav(routeName);
    // 라우트 콘텐츠는 매번 innerHTML로 새로 그려지므로, 현재 선택된 언어를
    // 새로 생긴 data-i18n 요소에도 다시 적용해야 한다.
    if (window.applyTranslations) window.applyTranslations(app);
    window.scrollTo(0, 0);
    if (window.HeaderScroll) window.HeaderScroll.reset();
  }

  window.addEventListener('hashchange', renderRoute);
  renderRoute();

  var header = document.querySelector('.site-header');
  function syncHeaderHeight() {
    document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
  }
  syncHeaderHeight();

  if (window.ResizeObserver) {
    new ResizeObserver(syncHeaderHeight).observe(header);
  } else {
    window.addEventListener('resize', syncHeaderHeight);
  }
})();
