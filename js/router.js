(function () {
  var routes = {
    '': window.Pages.home,
    'ear-check': window.Pages.earCheck,
    'ear-point': window.Pages.earPoint,
    'seminar': window.Pages.seminar
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
    window.scrollTo(0, 0);
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
