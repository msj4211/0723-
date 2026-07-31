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
  var overlay = document.getElementById('mobile-nav-overlay');

  function openMenu() {
    mainNav.classList.add('is-open');
    overlay.classList.add('is-open');
    hamburgerBtn.classList.add('is-active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.setAttribute('aria-label', window.t ? window.t('hamburgerClose') : '메뉴 닫기');
    document.body.classList.add('no-scroll');
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
  var authLogoutBtn = document.getElementById('auth-logout-btn');
  var instagramLink = document.querySelector('.header-instagram-link');
  var languageSwitcher = document.querySelector('.header-language-switcher');

  // 모바일 드로어 안에서 요구되는 순서: 이메일/로그인 → 내 프로필 → 인스타그램
  // → 언어 선택 → (간격) → 로그아웃.
  var relocatable = [authLoginBtn, authUserEmail, authProfileBtn, instagramLink, languageSwitcher, authLogoutBtn];

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

  // 이어밸런스체크/세미나신청은 모바일 드로어에서만 가독성을 위해 공백이
  // 들어간 문구로 표시한다(데스크톱 헤더 문구·링크·라우팅은 그대로 유지).
  // 영어 번역은 두 화면에서 동일하므로 한국어일 때만 손댄다.
  var mobileNavLabelKo = {
    'ear-check': '이어밸런스 체크',
    'seminar': '세미나 신청'
  };

  function applyMobileNavLabels() {
    if (window.currentLanguage && window.currentLanguage !== 'ko') return;

    document.querySelectorAll('.main-nav > ul a[data-route]').forEach(function (link) {
      var mobileLabel = mobileNavLabelKo[link.dataset.route];
      if (!mobileLabel) return;

      if (isMobileLayout) {
        link.textContent = mobileLabel;
      } else if (link.dataset.i18n) {
        link.textContent = window.t(link.dataset.i18n);
      }
    });
  }

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
})();
