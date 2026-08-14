(function () {
  var routes = {
    '': window.Pages.home,
    'ear-check': window.Pages.earCheck,
    'ear-point': window.Pages.earPoint,
    'ear-point-detail': window.Pages.earPointDetail,
    'seminar': window.Pages.seminar,
    'products': window.Pages.products,
    'recommend/sleep': window.Pages.recommendSleep,
    'search': window.Pages.search,
    'favorites': window.Pages.favorites,
    'mypage': window.Pages.mypage
  };

  // "#/ear-point/sleep"처럼 이어포인트 id가 뒤에 붙는 상세페이지 주소.
  // 나머지 라우트는 전부 고정 문자열이라 routes 맵 조회만으로 충분하지만,
  // 이 라우트만 id가 가변적이라 별도로 접두사를 떼어내 처리한다.
  var EAR_POINT_DETAIL_PREFIX = 'ear-point/';

  var app = document.getElementById('app');

  // #app 엘리먼트 자체는 라우트가 바뀌어도 DOM에서 사라지지 않고 계속
  // 재사용되기 때문에, "이 렌더링이 아직 화면에 유효한가"를 isConnected로
  // 판단할 수 없다. 라우트가 바뀔 때마다 값을 올려서, 비동기 작업(예:
  // 교육생 승인 상태 확인) 도중 다른 페이지로 이동했는지 감지하는 데 쓴다.
  window.__routeToken = 0;

  // "#/ear-point?point=knee"처럼 라우트 뒤에 쿼리 문자열이 붙을 수 있어,
  // 라우트 이름과 쿼리 문자열을 분리해서 돌려준다. "#/ear-point/sleep"
  // 같은 상세페이지 주소는 routeName을 'ear-point-detail'로 정규화하고
  // id를 pointId로 따로 돌려준다.
  function parseHash() {
    var raw = window.location.hash.replace(/^#\/?/, '');
    var qIndex = raw.indexOf('?');
    var routeName = qIndex === -1 ? raw : raw.slice(0, qIndex);
    var queryString = qIndex === -1 ? '' : raw.slice(qIndex + 1);

    if (routeName.indexOf(EAR_POINT_DETAIL_PREFIX) === 0) {
      var pointId = routeName.slice(EAR_POINT_DETAIL_PREFIX.length);
      if (pointId && pointId.indexOf('/') === -1) {
        return { routeName: 'ear-point-detail', queryString: queryString, pointId: pointId };
      }
    }

    return {
      routeName: routes.hasOwnProperty(routeName) ? routeName : '',
      queryString: queryString,
      pointId: null
    };
  }

  function updateActiveNav(routeName) {
    var activeRoute = routeName === '' ? 'home' : routeName;
    if (activeRoute === 'ear-point-detail') activeRoute = 'ear-point';
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
    routes[parsed.routeName](app, parsed.queryString, parsed.pointId);
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
