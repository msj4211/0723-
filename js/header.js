(function () {
  // 검색창 자체의 동작(입력·제출·자동완성)은 js/search-ui.js가 맡는다.
  // 여기서는 헤더의 나머지 요소(햄버거 드로어, 모바일 레이아웃 재배치)만 다룬다.
  var hamburgerBtn = document.querySelector('.hamburger-btn');
  var mainNav = document.querySelector('.main-nav');
  var overlay = document.getElementById('mobile-nav-overlay');

  function openMenu() {
    mainNav.classList.add('is-open');
    overlay.classList.add('is-open');
    hamburgerBtn.classList.add('is-active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.setAttribute('aria-label', window.t ? window.t('hamburgerClose') : '메뉴 닫기');
    document.body.classList.add('no-scroll');
    // 검색 전체화면이 열려 있는 상태에서 메뉴를 열면 두 오버레이가 겹치므로
    // 먼저 닫아준다.
    if (window.SearchUI) window.SearchUI.closeMobileSearch();
  }

  function closeMenu() {
    mainNav.classList.remove('is-open');
    overlay.classList.remove('is-open');
    hamburgerBtn.classList.remove('is-active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', window.t ? window.t('hamburgerOpen') : '메뉴 열기');
    document.body.classList.remove('no-scroll');
  }

  hamburgerBtn.addEventListener('click', function () {
    if (mainNav.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // 페이지 이동 링크(이어밸런스체크 등)를 누르면 드로어를 닫는다.
  mainNav.querySelectorAll('.main-nav > ul a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  overlay.addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
      closeMenu();
    }
  });

  // ===== 모바일 헤더 정리 =====
  // 768px 이하에서는 로그인/사용자 이메일/내 프로필/인스타그램/언어선택/로그아웃을
  // 헤더 상단 줄에서 빼서 햄버거 드로어 안으로 옮긴다. 요소를 복제하지 않고
  // 실제 DOM 노드를 그대로 이동하므로 기존 id·이벤트 리스너가 그대로 살아있다.
  var mobileAccountSection = document.getElementById('mobile-account-section');
  var authLoginBtn = document.getElementById('auth-login-btn');
  var authUserEmail = document.getElementById('auth-user-email');
  var authProfileBtn = document.getElementById('auth-profile-btn');
  var authFavoritesLink = document.getElementById('auth-favorites-link');
  var authLogoutBtn = document.getElementById('auth-logout-btn');
  var instagramLink = document.querySelector('.header-instagram-link');
  var languageSwitcher = document.querySelector('.header-language-switcher');

  // 모바일 드로어 안에서 요구되는 순서: 이메일/로그인 → 내 프로필 → 관심 이어포인트
  // → 인스타그램 → 언어 선택 → (간격) → 로그아웃.
  var relocatable = [authLoginBtn, authUserEmail, authProfileBtn, authFavoritesLink, instagramLink, languageSwitcher, authLogoutBtn];

  // 데스크톱 상의 원래 위치(부모 + 다음 형제)를 페이지 로드 시 딱 한 번만
  // 기록해둔다. 이후 데스크톱으로 되돌아갈 때 이 값을 그대로 써서 복원한다.
  var originalHomes = relocatable.map(function (el) {
    return { el: el, parent: el.parentNode, nextSibling: el.nextSibling };
  });

  var mobileQuery = window.matchMedia('(max-width: 768px)');
  var isMobileLayout = false;

  function moveToMobile() {
    relocatable.forEach(function (el) {
      mobileAccountSection.appendChild(el);
    });
    isMobileLayout = true;
  }

  function moveToDesktop() {
    // moveToMobile의 역순으로 복원해야, 서로를 기준점(nextSibling)으로 삼는
    // 요소들이 복원 시점에 이미 제자리로 돌아와 있는 상태가 된다.
    originalHomes.slice().reverse().forEach(function (home) {
      home.parent.insertBefore(home.el, home.nextSibling);
    });
    isMobileLayout = false;
  }

  // 이어밸런스체크는 모바일 드로어에서만 가독성을 위해 공백이 들어간
  // 문구로 표시한다(데스크톱 헤더 문구·링크·라우팅은 그대로 유지). 영어
  // 번역은 두 화면에서 동일하므로 한국어일 때만 손댄다.
  // data-route가 아니라 data-i18n 키로 찾는다 — 승인 상태에 따라 같은
  // 라우트(seminar 등)를 가리키는 메뉴 항목이 여러 개 있을 수 있어서,
  // 라우트 하나로는 어떤 항목을 바꿔야 할지 구분할 수 없다.
  var mobileNavLabelKo = {
    navEarCheck: '이어밸런스 체크'
  };

  function applyMobileNavLabels() {
    if (window.currentLanguage && window.currentLanguage !== 'ko') return;

    document.querySelectorAll('.main-nav > ul [data-i18n]').forEach(function (link) {
      var mobileLabel = mobileNavLabelKo[link.dataset.i18n];
      if (!mobileLabel) return;

      if (isMobileLayout) {
        link.textContent = mobileLabel;
      } else {
        link.textContent = window.t(link.dataset.i18n);
      }
    });
  }

  // ===== 로그인/승인 상태별 메뉴 노출 =====
  // 각 메뉴 항목의 data-access-state(공백으로 구분된 상태 목록)에 현재
  // 상태가 포함될 때만 보여준다. 상태가 아직 확인되지 않은 최초 로드
  // 구간에는 모든 항목이 HTML상 hidden으로 시작해, 잘못된 메뉴가 잠깐
  // 보이는 현상(깜빡임)을 막는다.
  function applyAccessStateToNav(state) {
    document.querySelectorAll('[data-access-state]').forEach(function (el) {
      var allowedStates = el.dataset.accessState.split(/\s+/);
      el.hidden = allowedStates.indexOf(state) === -1;
    });
  }

  // header.js는 access-control.js보다 먼저 로드되는 스크립트라(둘 다 동기
  // 실행되는 일반 <script>), 이 시점에는 아직 window.AccessControl이 없다.
  // DOMContentLoaded는 모든 <script>가 실행된 뒤에 발생하므로, 그 시점에
  // 구독해야 실제로 등록된다.
  document.addEventListener('DOMContentLoaded', function () {
    if (window.AccessControl) {
      window.AccessControl.onStateChange(applyAccessStateToNav);
    }
  });

  function applyLayoutForViewport(isMobile) {
    if (isMobile && !isMobileLayout) {
      moveToMobile();
    } else if (!isMobile && isMobileLayout) {
      moveToDesktop();
    }
    applyMobileNavLabels();
  }

  applyLayoutForViewport(mobileQuery.matches);

  // i18n.js는 DOMContentLoaded 시점에 데이터-i18n 문구를 적용하는데, 이
  // 리스너가 header.js의 동기 실행보다 나중에 실행되면서 위의 공백 버전
  // 오버라이드를 다시 원래 문구로 덮어써 버린다. 그 다음 순서로 한 번 더
  // 적용해 최종적으로 모바일 문구가 남도록 한다.
  document.addEventListener('DOMContentLoaded', applyMobileNavLabels);

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener('change', function (e) {
      applyLayoutForViewport(e.matches);
    });
  } else if (mobileQuery.addListener) {
    // 구형 Safari 대응
    mobileQuery.addListener(function (e) {
      applyLayoutForViewport(e.matches);
    });
  }

  if (window.i18nOnLanguageChange) {
    window.i18nOnLanguageChange.push(applyMobileNavLabels);
  }

  // js/search-ui.js가 모바일 검색을 열 때 나비게이션 드로어를 닫을 수 있도록
  // 공개 API로 노출한다.
  window.HeaderNav = { openMenu: openMenu, closeMenu: closeMenu };
})();
