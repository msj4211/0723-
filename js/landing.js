window.Landing = (function () {
  var observer = null;

  function template() {
    return `
      <section class="feature-section">
        <div class="section-heading">
          <h2>필요한 기능을 바로 시작해보세요</h2>
        </div>
        <div class="feature-grid">
          <div class="feature-card reveal">
            <span class="feature-icon" aria-hidden="true">🩺</span>
            <h3>이어밸런스체크</h3>
            <p>간단한 질문을 통해 오늘 필요한 관리 방향을 확인해보세요</p>
            <a href="#/ear-check" class="feature-card-btn">체크 시작하기</a>
          </div>
          <div class="feature-card reveal">
            <span class="feature-icon" aria-hidden="true">📍</span>
            <h3>이어포인트</h3>
            <p>증상과 관리 목적에 맞는 귀 혈자리를 쉽게 찾아보세요</p>
            <a href="#/ear-point" class="feature-card-btn">이어포인트 보기</a>
          </div>
          <div class="feature-card reveal">
            <span class="feature-icon" aria-hidden="true">🎓</span>
            <h3>이어테라피 배우기</h3>
            <p>이어테라피 세미나와 교육 일정을 확인해보세요</p>
            <a href="#/seminar" class="feature-card-btn">세미나 확인하기</a>
          </div>
        </div>
      </section>

      <section class="offer-section">
        <div class="offer-card offer-card--product reveal">
          <h3>이어테라피를 위한 제품</h3>
          <p>셀프케어와 전문 관리를 위한<br>이어테라피 제품을 확인해보세요</p>
          <a href="#/products" class="offer-card-btn">상품 보러가기</a>
        </div>
        <div class="offer-card offer-card--seminar reveal">
          <h3>이어테라피를 더 깊이 배우고 싶다면</h3>
          <p>현재 진행 중인 세미나와<br>교육 일정을 확인해보세요</p>
          <a href="#/seminar" class="offer-card-btn">세미나 일정 보기</a>
        </div>
      </section>

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
      </section>
    `;
  }

  /* Firestore 기반 백업 — Supabase 전환 테스트가 끝나면 이 블록과
     firebase-config.js, Firebase 스크립트 태그를 함께 제거한다.

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

  */

  // Supabase 기반 구현. user_favorites 행 수를 이어포인트별로 집계해서 쓴다.
  function loadTopList() {
    var client = window.supabaseClient;
    var listEl = document.getElementById('landing-top-list');
    if (!client || !listEl) return;

    Promise.all([
      client.from('ear_points').select('id, name'),
      client.from('user_favorites').select('ear_point_id')
    ]).then(function (results) {
      var pointsRes = results[0];
      var favoritesRes = results[1];
      if (pointsRes.error || favoritesRes.error) {
        console.error('[Landing] 인기 이어포인트를 불러오지 못했습니다:', pointsRes.error || favoritesRes.error);
        return;
      }

      var counts = {};
      favoritesRes.data.forEach(function (row) {
        counts[row.ear_point_id] = (counts[row.ear_point_id] || 0) + 1;
      });

      var ranked = pointsRes.data
        .map(function (point) {
          return { name: point.name, count: counts[point.id] || 0 };
        })
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, 5);

      listEl.innerHTML = ranked.map(function (item, index) {
        return '<li class="top-list-item">' +
          '<span class="top-list-rank">' + (index + 1) + '</span>' +
          '<span class="top-list-name">' + item.name + '</span>' +
          '<span class="top-list-count">' + item.count + '명</span>' +
          '</li>';
      }).join('');
    });
  }

  function loadStats() {
    var client = window.supabaseClient;
    var pointsEl = document.getElementById('stat-points');
    var likesEl = document.getElementById('stat-likes');
    if (!client || !pointsEl || !likesEl) return;

    Promise.all([
      client.from('ear_points').select('id', { count: 'exact', head: true }),
      client.from('user_favorites').select('ear_point_id', { count: 'exact', head: true })
    ]).then(function (results) {
      var pointsRes = results[0];
      var favoritesRes = results[1];
      if (pointsRes.error || favoritesRes.error) {
        console.error('[Landing] 통계를 불러오지 못했습니다:', pointsRes.error || favoritesRes.error);
        return;
      }
      pointsEl.textContent = pointsRes.count || 0;
      likesEl.textContent = favoritesRes.count || 0;
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
