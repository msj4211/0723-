window.Landing = (function () {
  var observer = null;

  function template() {
    return `
      <section class="landing" aria-label="730 스킨이어테라피 소개" data-i18n-aria-label="landingAriaLabel">
        <div class="landing-block reveal">
          <h2 class="landing-title" data-i18n="landingIntroTitle">당신의 몸은<br>작은 신호를 보내고 있습니다.</h2>
          <p class="landing-body" data-i18n="landingIntroBody">
            피곤함, 스트레스, 수면 부족,<br>
            몸은 늘 작은 신호를 보내지만<br>
            우리는 쉽게 지나치곤 합니다.
            <br><br>
            이어테라피는 귀를 통해<br>
            몸의 균형을 이해하고<br>
            건강한 일상을 위한 셀프케어를 제안합니다.
          </p>
        </div>
      </section>

      <section class="offer-section">
        <div class="offer-card offer-card--product reveal">
          <h3 data-i18n="offerProductTitle">이어테라피를 위한 제품</h3>
          <p data-i18n="offerProductDesc">셀프케어와 전문 관리를 위한<br>이어테라피 제품을 확인해보세요</p>
          <a href="#/products" class="offer-card-btn" data-i18n="offerProductBtn">상품 보러가기</a>
        </div>
        <div class="offer-card offer-card--seminar reveal">
          <h3 data-i18n="offerSeminarTitle">이어테라피를 더 깊이 배우고 싶다면</h3>
          <p data-i18n="offerSeminarDesc">현재 진행 중인 세미나와<br>교육 일정을 확인해보세요</p>
          <a href="#/seminar" class="offer-card-btn" data-i18n="offerSeminarBtn">세미나 일정 보기</a>
        </div>
      </section>
    `;
  }

  // 라우트를 옮겼다 홈으로 돌아올 때마다 섹션이 새로 그려지므로, 기존
  // observer를 먼저 끊어서 이전 렌더링의 요소를 계속 들고 있지 않게 한다.
  function initReveal(container) {
    if (observer) observer.disconnect();

    var revealEls = container.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  function init(container) {
    container.insertAdjacentHTML('beforeend', template());
    initReveal(container);
  }

  return { init: init };
})();
