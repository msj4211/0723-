(function () {
  // 언어를 바꿀 때 함께 갱신해야 하는 동적 UI(로그인 모달 등)가 있으면
  // 이 배열에 콜백을 등록해두면 setLanguage가 호출해준다.
  window.i18nOnLanguageChange = window.i18nOnLanguageChange || [];

  function applyTranslations(root) {
    var scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      var text = window.t(el.dataset.i18n);
      if (text) el.innerHTML = text;
    });

    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var text = window.t(el.dataset.i18nPlaceholder);
      if (text) el.setAttribute('placeholder', text);
    });

    scope.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var text = window.t(el.dataset.i18nAriaLabel);
      if (text) el.setAttribute('aria-label', text);
    });

    scope.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var text = window.t(el.dataset.i18nAlt);
      if (text) el.setAttribute('alt', text);
    });
  }

  function updateLanguageButtons() {
    document.querySelectorAll('.header-language-button').forEach(function (btn) {
      var isActive = btn.dataset.lang === window.currentLanguage;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  // 라우트 콘텐츠는 매번 innerHTML로 새로 그려지므로, 페이지가 바뀔 때마다
  // 새로 생긴 data-i18n 요소들도 현재 언어로 다시 적용해야 한다.
  // router.js가 매 렌더링 후 이 함수를 호출한다.
  window.applyTranslations = applyTranslations;

  window.setLanguage = function (lang) {
    if (!window.translations[lang]) lang = 'ko';
    window.currentLanguage = lang;
    document.documentElement.lang = lang === 'en' ? 'en' : 'ko';

    applyTranslations(document);
    updateLanguageButtons();

    window.i18nOnLanguageChange.forEach(function (cb) {
      try { cb(lang); } catch (e) {}
    });
  };

  function initLanguageSwitcher() {
    document.querySelectorAll('.header-language-button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.setLanguage(btn.dataset.lang);
      });
    });
    updateLanguageButtons();
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTranslations(document);
    initLanguageSwitcher();
  });
})();
