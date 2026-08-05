(function () {
  var routes = {
    '': window.Pages.home,
    'ear-check': window.Pages.earCheck,
    'ear-point': window.Pages.earPoint,
    'seminar': window.Pages.seminar,
    'products': window.Pages.products,
    'recommend/sleep': window.Pages.recommendSleep,
    'search': window.Pages.search,
    'favorites': window.Pages.favorites,
    'mypage': window.Pages.mypage
  };

  var app = document.getElementById('app');

  // #app 엘리먼트 자체는 라우트가 바뀌어도 DOM에서 사라지지 않고 계속
  // 재사용되기 때문에, "이 렌더링이 아직 화면에 유효한가"를 isConnected로
  // 판단할 수 없다. 라우트가 바뀔 때마다 값을 올려서, 비동기 작업(예:
  // 교육생 승인 상태 확인) 도중 다른 페이지로 이동했는지 감지하는 데 쓴다.
  window.__routeToken = 0;

  // "#/ear-point?point=knee"처럼 라우트 뒤에 쿼리 문자열이 붙을 수 있어,
  // 라우트 이름과 쿼리 문자열을 분리해서 돌려준다.
  function parseHash() {
    var raw = window.location.hash.replace(/^#\/?/, '');
    var qIndex = raw.indexOf('?');
    var routeName = qIndex === -1 ? raw : raw.slice(0, qIndex);
    var queryString = qIndex === -1 ? '' : raw.slice(qIndex + 1);
    return {
      routeName: routes.hasOwnProperty(routeName) ? routeName : '',
      queryString: queryString
    };
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
    window.__routeToken++;
    var parsed = parseHash();
    routes[parsed.routeName](app, parsed.queryString);
    updateActiveNav(parsed.routeName);
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
