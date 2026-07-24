window.Landing = (function () {
  var RECOMMEND_ITEMS = [
    '잠이 잘 오지 않는 분',
    '목과 어깨가 자주 뭉치는 분',
    '스트레스로 몸과 마음이 지친 분',
    '건강을 미리 관리하고 싶은 분',
    '가족과 함께 셀프케어를 하고 싶은 분',
    '하루 5분 건강 습관을 만들고 싶은 분'
  ];

  var observer = null;

  function renderRecommendCards() {
    return RECOMMEND_ITEMS.map(function (text) {
      return '<div class="recommend-card reveal"><p>' + text + '</p></div>';
    }).join('');
  }

  function template() {
    return `
      <section class="landing" aria-label="730 스킨이어테라피 소개">
        <div class="landing-block reveal">
          <h2 class="landing-title">당신의 몸은<br>작은 신호를 보내고 있습니다.</h2>
          <p class="landing-body">
            피곤함, 스트레스, 수면 부족,<br>
            몸은 늘 작은 신호를 보내지만<br>
            우리는 쉽게 지나치곤 합니다.
            <br><br>
            이어테라피는 귀를 통해<br>
            몸의 균형을 이해하고<br>
            건강한 일상을 위한 셀프케어를 제안합니다.
          </p>
        </div>

        <div class="landing-block reveal">
          <h2 class="landing-subtitle">이런 분들에게 추천합니다</h2>
          <div class="recommend-grid">${renderRecommendCards()}</div>
        </div>

        <div class="landing-block reveal">
          <h2 class="landing-subtitle">지금 가장 많은 관심을 받고 있어요</h2>
          <ol class="top-list" id="landing-top-list">
            <li class="top-list-loading">데이터를 불러오는 중...</li>
          </ol>
        </div>

        <div class="landing-block reveal">
          <h2 class="landing-subtitle">숫자로 보는 이어테라피</h2>
          <div class="stat-grid">
            <div class="stat-card">
              <p class="stat-value" id="stat-points">-</p>
              <p class="stat-label">이어포인트 수</p>
            </div>
            <div class="stat-card">
              <p class="stat-value" id="stat-likes">-</p>
              <p class="stat-label">누적 좋아요</p>
            </div>
            <div class="stat-card">
              <p class="stat-value">준비중</p>
              <p class="stat-label">누적 조회수</p>
            </div>
          </div>
        </div>

        <div class="landing-block reveal">
          <h2 class="landing-title">하루 5분의 작은 습관이<br>건강한 내일을 만듭니다.</h2>
          <p class="landing-body">오늘도 나에게 맞는<br>이어포인트를 찾아보세요.</p>
          <a href="#/ear-point" class="landing-cta-btn" aria-label="이어포인트 페이지로 이동">이어포인트 찾기 →</a>
        </div>
      </section>
    `;
  }

  function loadTopList() {
    var db = window.earPointsDb;
    var listEl = document.getElementById('landing-top-list');
    if (!db || !listEl) return;

    db.collection('earPoints').orderBy('likeCount', 'desc').limit(5).get()
      .then(function (snapshot) {
        if (snapshot.empty) return;

        var rank = 0;
        listEl.innerHTML = snapshot.docs.map(function (doc) {
          rank++;
          var data = doc.data();
          return '<li class="top-list-item">' +
            '<span class="top-list-rank">' + rank + '</span>' +
            '<span class="top-list-name">' + data.name + '</span>' +
            '<span class="top-list-count">' + (data.likeCount || 0) + '명</span>' +
            '</li>';
        }).join('');
      })
      .catch(function (err) {
        console.error('[Landing] 인기 이어포인트를 불러오지 못했습니다:', err);
      });
  }

  function loadStats() {
    var db = window.earPointsDb;
    var pointsEl = document.getElementById('stat-points');
    var likesEl = document.getElementById('stat-likes');
    if (!db || !pointsEl || !likesEl) return;

    db.collection('earPoints').get()
      .then(function (snapshot) {
        var totalLikes = 0;
        snapshot.forEach(function (doc) {
          totalLikes += doc.data().likeCount || 0;
        });
        pointsEl.textContent = snapshot.size;
        likesEl.textContent = totalLikes;
      })
      .catch(function (err) {
        console.error('[Landing] 통계를 불러오지 못했습니다:', err);
      });
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
    loadTopList();
    loadStats();
  }

  return { init: init };
})();
