(function () {
  var searchArea = document.querySelector('.search-area');
  var searchInput = document.querySelector('.search-box');

  function goToSearchPage() {
    window.location.hash = '#/ear-check';
  }

  searchArea.addEventListener('click', goToSearchPage);
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      goToSearchPage();
    }
  });

  var hamburgerBtn = document.querySelector('.hamburger-btn');
  var mainNav = document.querySelector('.main-nav');

  function openMenu() {
    mainNav.classList.add('is-open');
    hamburgerBtn.classList.add('is-active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.setAttribute('aria-label', '메뉴 닫기');
    document.body.classList.add('no-scroll');
  }

  function closeMenu() {
    mainNav.classList.remove('is-open');
    hamburgerBtn.classList.remove('is-active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', '메뉴 열기');
    document.body.classList.remove('no-scroll');
  }

  hamburgerBtn.addEventListener('click', function () {
    if (mainNav.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  mainNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', function (e) {
    if (!mainNav.classList.contains('is-open')) return;
    if (mainNav.contains(e.target) || hamburgerBtn.contains(e.target)) return;
    closeMenu();
  });
})();
