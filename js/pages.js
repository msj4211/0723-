window.Pages = {
  home: function (container) {
    container.innerHTML = `
      <section class="ad-banner">
        <div class="splide" aria-label="이벤트 배너">
          <div class="splide__track">
            <ul class="splide__list">
              <li class="splide__slide"><img class="banner-img" src="images/귀.png" alt="귀"></li>
              <li class="splide__slide"><img class="banner-img" src="images/위.png" alt="위"></li>
              <li class="splide__slide"><img class="banner-img" src="images/충분한수면.PNG" alt="충분한 수면"></li>
              <li class="splide__slide"><img class="banner-img" src="images/면역력강화.PNG" alt="면역력 강화"></li>
              <li class="splide__slide"><img class="banner-img" src="images/무릎통증.PNG" alt="무릎 통증"></li>
              <li class="splide__slide"><img class="banner-img" src="images/탈모예방.PNG" alt="탈모 예방"></li>
              <li class="splide__slide"><img class="banner-img" src="images/아이들키성장.png" alt="아이들 키 성장"></li>
            </ul>
          </div>
        </div>
      </section>

      <div class="site-main">${window.Pages.renderMenuSections(window.Pages.homeSections)}</div>
    `;

    if (window.initHomeSlider) window.initHomeSlider();
  },

  // 섹션 데이터: 나중에 실제 혈자리를 추가할 때는 이 배열에 항목만 추가/수정하면 된다.
  // title은 섹션 제목, items는 그 섹션 안에 들어갈 카드 3개(name/img/href).
  homeSections: [
    {
      title: '여름에 추천하는 혈자리',
      items: [
        { name: '메뉴 1', img: '', href: '#' },
        { name: '메뉴 2', img: '', href: '#' },
        { name: '메뉴 3', img: '', href: '#' }
      ]
    },
    {
      title: '스트레스 완화 혈자리',
      items: [
        { name: '메뉴 1', img: '', href: '#' },
        { name: '메뉴 2', img: '', href: '#' },
        { name: '메뉴 3', img: '', href: '#' }
      ]
    },
    {
      title: '불면에 추천하는 혈자리',
      items: [
        { name: '메뉴 1', img: '', href: '#' },
        { name: '메뉴 2', img: '', href: '#' },
        { name: '메뉴 3', img: '', href: '#' }
      ]
    }
  ],

  // sections 배열을 받아 <section class="menu-section"> 뭉치의 HTML 문자열을 만들어준다.
  // 다른 페이지(교육 콘텐츠 목록 등)에서도 같은 카드 그리드가 필요하면 재사용할 수 있다.
  renderMenuSections: function (sections) {
    return sections.map(function (section) {
      var cardsHtml = section.items.map(function (item) {
        return '<a class="menu-card" href="' + item.href + '">' +
          '<img src="' + item.img + '" alt="' + item.name + '">' +
          '<span>' + item.name + '</span>' +
          '</a>';
      }).join('');

      return '<section class="menu-section">' +
        '<div class="section-title"><h2>' + section.title + '</h2></div>' +
        '<div class="menu-grid">' + cardsHtml + '</div>' +
        '</section>';
    }).join('');
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
