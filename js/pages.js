window.Pages = {
  home: function (container) {
    // 슬라이드 데이터: 순서대로 배너에 표시된다. 여름 시즌에 맞춰 고른 3개만 유지한다.
    var bannerSlides = [
      {
        img: '면역력강화.PNG',
        title: '면역력 강화',
        desc: '무더운 계절,<br>몸의 균형을 위한 이어테라피'
      },
      {
        img: '충분한수면.PNG',
        title: '충분한 수면',
        desc: '열대야에도<br>편안한 휴식을 위한 혈자리'
      },
      {
        img: '무릎통증.PNG',
        title: '무릎 통증',
        desc: '활동량이 많은 여름,<br>가벼운 움직임을 위한 관리'
      }
    ];

    var slidesHtml = bannerSlides.map(function (slide) {
      return '<li class="splide__slide">' +
        '<div class="banner-slide">' +
        '<img class="banner-img" src="images/' + slide.img + '" alt="' + slide.title + '">' +
        '<div class="banner-caption">' +
        '<p class="banner-caption-title">' + slide.title + '</p>' +
        '<p class="banner-caption-desc">' + slide.desc + '</p>' +
        '</div>' +
        '</div>' +
        '</li>';
    }).join('');

    container.innerHTML = `
      <section class="ad-banner">
        <div class="banner-content">
          <div class="section-title"><h2>여름에 추천하는 혈자리</h2></div>
          <div class="splide" aria-label="여름 추천 이어테라피">
            <div class="splide__track">
              <ul class="splide__list">${slidesHtml}</ul>
            </div>
          </div>
        </div>
      </section>
    `;

    if (window.initHomeSlider) window.initHomeSlider();
    if (window.Landing) window.Landing.init(container);
  },

  earCheck: function (container) {
    container.innerHTML = `
      <div class="iframe-page">
        <iframe
          class="embed-frame"
          src="https://msj4211.github.io/730skin-check/"
          title="이어밸런스체크 결과지"
          loading="lazy"></iframe>
      </div>
    `;

    var frame = container.querySelector('.embed-frame');
    var hasLoadedOnce = false;

    frame.addEventListener('load', function () {
      // 배포 후에는 이 사이트와 730skin-check가 같은 origin(msj4211.github.io)이라
      // 실제 문서 높이를 읽어와 iframe이 내용만큼만 커지도록 맞출 수 있다.
      // 로컬 개발 서버(localhost)에서는 origin이 달라 접근이 막히므로,
      // 이 경우 CSS의 min-height(넉넉한 고정값)가 그대로 대체 역할을 한다.
      try {
        var docHeight = frame.contentDocument.documentElement.scrollHeight;
        frame.style.minHeight = '0';
        frame.style.height = docHeight + 'px';
      } catch (e) {
        // cross-origin: 접근 불가, CSS min-height 폴백을 그대로 사용
      }

      // 730skin-check는 "결과 확인하기" 클릭 시 result.html로 실제 페이지
      // 이동을 하므로, 그 순간 iframe에도 load 이벤트가 다시 발생한다.
      // cross-origin이라 iframe 내부(#ear-check-result 같은 요소)에는
      // 접근할 수 없지만, 이 load 이벤트 자체는 부모 문서에서 항상 감지되므로
      // 이걸 "결과 화면이 떴다"는 신호로 사용해 iframe을 화면 안으로 스크롤한다.
      // 첫 로드(설문 화면이 처음 뜨는 시점)는 라우터가 이미 맨 위로 스크롤해둔
      // 상태라 건너뛴다.
      if (hasLoadedOnce) {
        window.requestAnimationFrame(function () {
          frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      hasLoadedOnce = true;
    });
  },

  earPoint: function (container) {
    // id는 Firestore 문서 ID와 그대로 짝지어진다(js/ear-point-likes.js, earPoints 컬렉션).
    var points = [
      { id: 'ear', img: '귀.png', name: '귀 건강', desc: '귀 전체 혈액순환과 청력 관리를 돕는 이어포인트입니다.' },
      { id: 'stomach', img: '위.png', name: '소화 · 위', desc: '소화 기능과 위 컨디션을 관리하는 이어포인트입니다.' },
      { id: 'sleep', img: '충분한수면.PNG', name: '숙면', desc: '깊고 편안한 수면을 돕는 이어포인트입니다.' },
      { id: 'immune', img: '면역력강화.PNG', name: '면역력 강화', desc: '몸의 면역 밸런스를 강화하는 이어포인트입니다.' },
      { id: 'knee', img: '무릎통증.PNG', name: '무릎 통증', desc: '무릎 통증 완화에 도움을 주는 이어포인트입니다.' },
      { id: 'hairloss', img: '탈모예방.PNG', name: '탈모 예방', desc: '두피와 모발 건강을 돕는 이어포인트입니다.' },
      { id: 'growth', img: '아이들키성장.png', name: '아이들 키 성장', desc: '성장기 어린이의 건강한 성장을 돕는 이어포인트입니다.' }
    ];

    var cards = points.map(function (p) {
      return '<div class="point-card" data-point-id="' + p.id + '" data-point-name="' + p.name + '">' +
        '<div class="point-media">' +
        '<img src="images/' + p.img + '" alt="' + p.name + '">' +
        '<button type="button" class="like-btn" aria-label="' + p.name + ' 관심 표시" aria-pressed="false">♡</button>' +
        '</div>' +
        '<p class="point-name">' + p.name + '</p>' +
        '<p class="like-count" aria-live="polite">불러오는 중...</p>' +
        '<p class="point-desc">' + p.desc + '</p>' +
        '</div>';
    }).join('');

    container.innerHTML =
      '<section class="page-section">' +
      '<div class="section-title"><h2>이어포인트</h2></div>' +
      '<div class="point-grid">' + cards + '</div>' +
      '</section>';

    if (window.EarPointLikes) window.EarPointLikes.init(container);
  },

  seminar: function (container) {
    container.innerHTML = `
      <section class="page-section">
        <div class="section-title"><h2>세미나 신청</h2></div>
        <form class="app-form" id="seminar-form">
          <div class="form-field">
            <label for="sm-name">이름</label>
            <input type="text" id="sm-name" name="name" required>
          </div>
          <div class="form-field">
            <label for="sm-phone">연락처</label>
            <input type="tel" id="sm-phone" name="phone" placeholder="010-0000-0000" required>
          </div>
          <div class="form-field">
            <label for="sm-email">이메일</label>
            <input type="email" id="sm-email" name="email" required>
          </div>
          <div class="form-field">
            <label for="sm-date">참석 희망 일정</label>
            <input type="date" id="sm-date" name="date" required>
          </div>
          <div class="form-field">
            <label for="sm-message">문의사항</label>
            <textarea id="sm-message" name="message" rows="4"></textarea>
          </div>
          <button type="submit" class="app-btn">신청하기</button>
        </form>
        <div class="form-result" id="sm-result" hidden></div>
      </section>
    `;

    var form = container.querySelector('#seminar-form');
    var result = container.querySelector('#sm-result');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('#sm-name').value.trim();
      result.hidden = false;
      result.textContent = (name || '고객') + '님, 세미나 신청이 접수되었습니다. 담당자가 연락드리겠습니다.';
    });
  }
};
