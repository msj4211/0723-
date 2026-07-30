window.Pages = {
  home: function (container) {
    var purposeCards = [
      { key: 'purposeSleep', tone: 'lavender', href: '#/recommend/sleep' },
      { key: 'purposeCalm', tone: 'mint' },
      { key: 'purposeDigest', tone: 'yellow' },
      { key: 'purposeFatigue', tone: 'coral' },
      { key: 'purposeShoulder', tone: 'blue' },
      { key: 'purposeWomen', tone: 'pink' }
    ];

    var purposeCardsHtml = purposeCards.map(function (card) {
      return '<a href="' + (card.href || '#/ear-point') + '" class="purpose-card purpose-card--' + card.tone + ' reveal">' +
        '<p data-i18n="' + card.key + '">' + window.t(card.key) + '</p>' +
        '</a>';
    }).join('');

    container.innerHTML = `
      <div class="home-page">
        <section class="hero">
          <div class="hero-inner">
            <div class="hero-content">
              <p class="hero-eyebrow" data-i18n="heroEyebrow">730 SKIN EAR THERAPY</p>
              <h2 class="hero-title" data-i18n="heroTitle">귀에서 시작하는<br>가벼운 웰니스 루틴</h2>
              <p class="hero-desc" data-i18n="heroDesc">오늘의 몸 상태를 확인하고<br>나에게 필요한 귀 혈자리를 찾아보세요</p>
              <div class="hero-actions">
                <a href="#/ear-check" class="hero-btn-primary" data-i18n="heroBtnPrimary">이어밸런스 시작하기</a>
                <a href="#/ear-point" class="hero-btn-secondary" data-i18n="heroBtnSecondary">이어포인트 둘러보기</a>
              </div>
            </div>
            <div class="hero-visual">
              <img
                src="./images/hero-ear-photo.jpg"
                alt="꽃과 함께 연출된 귀 이미지"
                data-i18n-alt="heroVisualAlt"
                class="hero-visual-image"
              >
            </div>
          </div>
        </section>

        <section class="purpose-section">
          <div class="section-heading">
            <h2 data-i18n="purposeHeading">오늘 어떤 관리가 필요하신가요</h2>
            <p data-i18n="purposeDesc">지금 필요한 관리를 선택하면<br>관련 이어포인트를 쉽게 확인할 수 있어요</p>
          </div>
          <div class="purpose-grid">${purposeCardsHtml}</div>
        </section>
      </div>
    `;

    if (window.Landing) window.Landing.init(container.querySelector('.home-page'));

    // Landing.init이 .home-page 끝에 자기 섹션을 추가로 붙이므로, 푸터는
    // 그 뒤에 삽입해야 항상 페이지 맨 마지막에 온다.
    container.querySelector('.home-page').insertAdjacentHTML('beforeend', `
      <footer class="home-footer">
        <div class="home-footer-top">
          <div class="home-footer-brand">730 SKIN EAR THERAPY</div>

          <div class="home-footer-nav">
            <p class="home-footer-heading" data-i18n="footerNavHeading">메뉴 바로가기</p>
            <ul class="home-footer-nav-list">
              <li><a href="#/ear-check" data-i18n="footerNavEarCheck">이어밸런스 체크</a></li>
              <li><a href="#/ear-point" data-i18n="navEarPoints">이어포인트</a></li>
              <li><a href="#/products" data-i18n="navProducts">상품</a></li>
              <li><a href="#/seminar" data-i18n="footerNavSeminar">세미나 신청</a></li>
            </ul>
          </div>

          <div class="home-footer-social">
            <p class="home-footer-heading" data-i18n="footerSocialHeading">외부 채널</p>
            <ul class="home-footer-social-list">
              <li><a href="https://www.instagram.com/730_skin/" target="_blank" rel="noopener" data-i18n="instagram">Instagram</a></li>
              <li><a href="https://smartstore.naver.com/730pelises" target="_blank" rel="noopener" data-i18n="smartStore">Naver Smart Store</a></li>
            </ul>
          </div>
        </div>

        <div class="home-footer-divider"></div>

        <div class="home-footer-bottom">
          <ul class="home-footer-legal">
            <li data-i18n="terms">이용약관</li>
            <li data-i18n="privacy">개인정보 처리방침</li>
          </ul>
          <p class="home-footer-copyright">© 2026 730 SKIN EAR THERAPY All rights reserved</p>
        </div>
      </footer>
    `);
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

    // 이전 라우트 진입 때 등록해둔 리스너가 남아있으면 정리한다(재진입 시 중복 방지).
    if (window.__earCheckMessageHandler) {
      window.removeEventListener('message', window.__earCheckMessageHandler);
    }

    // 체크리스트 → 결과지로 iframe 내부에서 페이지가 바뀌면 콘텐츠 높이도 크게
    // 달라진다(체크리스트는 길고, 결과지는 훨씬 짧다). contentDocument 직접 접근은
    // 로컬 개발 서버처럼 부모와 origin이 다른 환경에서 항상 실패하므로, iframe
    // 문서(730skin-check/index.html, result.html)가 보내는 postMessage로 실제
    // 높이를 전달받아 반영한다 — origin에 상관없이 항상 동작한다.
    window.__earCheckMessageHandler = function (e) {
      if (!e.data || e.data.source !== '730skin-check-embed') return;
      if (!frame.isConnected) return;
      if (typeof e.data.height === 'number' && e.data.height > 0) {
        frame.style.minHeight = '0';
        frame.style.height = e.data.height + 'px';
      }
    };
    window.addEventListener('message', window.__earCheckMessageHandler);

    frame.addEventListener('load', function () {
      // 같은 origin으로 배포된 경우, postMessage 스크립트가 실행되기 전
      // 첫 시점에 한 번 더 시도해 초기 여백을 최소화하는 보조 수단이다.
      try {
        var docHeight = frame.contentDocument.documentElement.scrollHeight;
        frame.style.minHeight = '0';
        frame.style.height = docHeight + 'px';
      } catch (e) {
        // cross-origin: 접근 불가, 위 postMessage 응답을 기다린다.
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
    var lang = window.currentLanguage;

    // id는 Firestore 문서 ID와 그대로 짝지어진다(js/ear-point-likes.js, earPoints 컬렉션).
    // name/desc는 표시용 한국어, name_en/desc_en은 영어 버전이다.
    var points = [
      { id: 'ear', img: '귀.png', name: '귀 건강', desc: '귀 전체 혈액순환과 청력 관리를 돕는 이어포인트입니다.', name_en: 'Ear Health', desc_en: 'An ear point that supports overall ear circulation and hearing care.' },
      { id: 'stomach', img: '위.png', name: '소화 · 위', desc: '소화 기능과 위 컨디션을 관리하는 이어포인트입니다.', name_en: 'Digestion · Stomach', desc_en: 'An ear point that helps manage digestive function and stomach condition.' },
      { id: 'sleep', img: '충분한수면.PNG', name: '숙면', desc: '깊고 편안한 수면을 돕는 이어포인트입니다.', name_en: 'Restful Sleep', desc_en: 'An ear point that supports deep, comfortable sleep.' },
      { id: 'immune', img: '면역력강화.PNG', name: '면역력 강화', desc: '몸의 면역 밸런스를 강화하는 이어포인트입니다.', name_en: 'Immune Support', desc_en: "An ear point that helps strengthen your body's immune balance." },
      { id: 'knee', img: '무릎통증.PNG', name: '무릎 통증', desc: '무릎 통증 완화에 도움을 주는 이어포인트입니다.', name_en: 'Knee Pain', desc_en: 'An ear point that may help ease knee discomfort.' },
      { id: 'hairloss', img: '탈모예방.PNG', name: '탈모 예방', desc: '두피와 모발 건강을 돕는 이어포인트입니다.', name_en: 'Hair Loss Prevention', desc_en: 'An ear point that supports scalp and hair health.' },
      { id: 'growth', img: '아이들키성장.png', name: '아이들 키 성장', desc: '성장기 어린이의 건강한 성장을 돕는 이어포인트입니다.', name_en: "Children's Growth", desc_en: "An ear point that supports healthy growth during a child's growing years." }
    ];

    var cards = points.map(function (p) {
      var name = lang === 'en' ? p.name_en : p.name;
      var desc = lang === 'en' ? p.desc_en : p.desc;
      return '<div class="point-card" data-point-id="' + p.id + '" data-point-name="' + p.name + '">' +
        '<div class="point-media">' +
        '<img src="images/' + p.img + '" alt="' + name + '">' +
        '<button type="button" class="like-btn" aria-label="' + name + window.t('likeAriaLabelSuffix') + '" aria-pressed="false">♡</button>' +
        '</div>' +
        '<p class="point-name">' + name + '</p>' +
        '<p class="like-count" aria-live="polite" data-i18n="likeCountLoading">' + window.t('likeCountLoading') + '</p>' +
        '<p class="point-desc">' + desc + '</p>' +
        '</div>';
    }).join('');

    container.innerHTML =
      '<section class="page-section">' +
      '<div class="section-title"><h2 data-i18n="navEarPoints">' + window.t('navEarPoints') + '</h2></div>' +
      '<div class="point-grid">' + cards + '</div>' +
      '</section>';

    if (window.EarPointLikes) window.EarPointLikes.init(container);

    // 좋아요 상태/개수는 그대로 두고, 이름·설명·대체 텍스트만 새 언어로 갱신한다.
    // 라우트를 재방문할 때마다 이전 훅이 계속 쌓이지 않도록 매번 교체한다.
    if (window.__earPointLanguageHook && window.i18nOnLanguageChange) {
      var hookIdx = window.i18nOnLanguageChange.indexOf(window.__earPointLanguageHook);
      if (hookIdx !== -1) window.i18nOnLanguageChange.splice(hookIdx, 1);
    }
    window.__earPointLanguageHook = function () {
      if (!container.isConnected) return;
      var nextLang = window.currentLanguage;
      container.querySelectorAll('.point-card').forEach(function (card) {
        var p = points.filter(function (item) { return item.id === card.dataset.pointId; })[0];
        if (!p) return;
        var name = nextLang === 'en' ? p.name_en : p.name;
        var desc = nextLang === 'en' ? p.desc_en : p.desc;
        card.querySelector('.point-name').textContent = name;
        card.querySelector('.point-desc').textContent = desc;
        card.querySelector('.point-media img').setAttribute('alt', name);
        card.querySelector('.like-btn').setAttribute('aria-label', name + window.t('likeAriaLabelSuffix'));
      });
    };
    if (window.i18nOnLanguageChange) window.i18nOnLanguageChange.push(window.__earPointLanguageHook);
  },

  recommendSleep: function (container) {
    container.innerHTML = `
      <main class="sd-page">
        <article class="sd-detail-card">
          <header class="sd-hero">
            <button class="sd-back-button" type="button" aria-label="이전 페이지로 이동" data-i18n-aria-label="sdBackAriaLabel">
              <span aria-hidden="true">‹</span>
            </button>

            <div class="sd-hero-content">
              <h1 data-i18n="sdHeroTitle">편안한 수면을 위한<br>이어포인트</h1>
              <p data-i18n="sdHeroDesc">
                잠들기 어렵거나 자주 깨는 날 활용할 수 있는<br>
                셀프케어 정보를 확인해 보세요
              </p>
            </div>
          </header>

          <div class="sd-content">
            <section aria-labelledby="sd-recommended-points-title">
              <h2 class="sd-section-title" id="sd-recommended-points-title" data-i18n="sdSectionTitle">추천 이어포인트</h2>

              <div class="sd-point-tabs" role="tablist" aria-label="추천 이어포인트" data-i18n-aria-label="sdSectionTitle">
                <button class="sd-point-tab sd-is-active" type="button" data-target="sd-point-shenmen" data-i18n="sdTabShenmen">신문</button>
                <button class="sd-point-tab" type="button" data-target="sd-point-sympathetic" data-i18n="sdTabSympathetic">교감</button>
                <button class="sd-point-tab" type="button" data-target="sd-point-endocrine" data-i18n="sdTabEndocrine">내분비</button>
                <button class="sd-point-tab" type="button" data-target="sd-point-brainstem" data-i18n="sdTabBrainstem">뇌간</button>
              </div>

              <div class="sd-map-section">
                <div class="sd-map-image-wrap">
                  <img
                    class="sd-map-image"
                    src="images/sleep-ear-map.png"
                    alt="신문 교감 내분비 뇌간 위치가 표시된 귀 혈자리 이미지"
                    data-i18n-alt="sdMapAlt">

                  <div class="sd-map-placeholder">
                    <div>
                      <strong data-i18n="sdMapPlaceholderStrong">귀 혈자리 이미지를 넣어 주세요</strong>
                      <span data-i18n="sdMapPlaceholderBody">이미지 파일명을<br>
                      images/sleep-ear-map.png<br>
                      로 맞추면 자동으로 표시돼요</span>
                    </div>
                  </div>
                </div>

                <div class="sd-point-list">
                  <article class="sd-point-item sd-is-active" id="sd-point-shenmen">
                    <div class="sd-point-heading">
                      <span class="sd-point-dot" aria-hidden="true"></span>
                      <h3 data-i18n="sdTabShenmen">신문</h3>
                    </div>
                    <p data-i18n="sdPointDescShenmen">긴장된 상태를 편안하게 가라앉히고 휴식을 준비하는 데 참고할 수 있는 이어포인트예요</p>
                  </article>

                  <article class="sd-point-item" id="sd-point-sympathetic">
                    <div class="sd-point-heading">
                      <span class="sd-point-dot" aria-hidden="true"></span>
                      <h3 data-i18n="sdTabSympathetic">교감</h3>
                    </div>
                    <p data-i18n="sdPointDescSympathetic">몸이 예민하고 긴장된 날 편안한 이완을 돕는 셀프케어 포인트로 활용할 수 있어요</p>
                  </article>

                  <article class="sd-point-item" id="sd-point-endocrine">
                    <div class="sd-point-heading">
                      <span class="sd-point-dot" aria-hidden="true"></span>
                      <h3 data-i18n="sdTabEndocrine">내분비</h3>
                    </div>
                    <p data-i18n="sdPointDescEndocrine">일상적인 신체 리듬과 균형을 관리하는 셀프케어 과정에서 함께 살펴볼 수 있어요</p>
                  </article>

                  <article class="sd-point-item" id="sd-point-brainstem">
                    <div class="sd-point-heading">
                      <span class="sd-point-dot" aria-hidden="true"></span>
                      <h3 data-i18n="sdTabBrainstem">뇌간</h3>
                    </div>
                    <p data-i18n="sdPointDescBrainstem">과도한 각성 상태를 낮추고 휴식 리듬을 준비하는 관리에 참고할 수 있는 포인트예요</p>
                  </article>
                </div>
              </div>
            </section>

            <section class="sd-reason-section">
              <div class="sd-reason-icon" aria-hidden="true">◌</div>
              <div>
                <h2 data-i18n="sdReasonTitle">왜 이 이어포인트를 추천하나요</h2>
                <p data-i18n="sdReasonDesc">신문, 교감, 내분비, 뇌간은 긴장과 각성 상태를 편안하게 조절하고 휴식을 준비하는 셀프케어 흐름으로 함께 구성하기 좋은 이어포인트예요</p>
              </div>
            </section>

            <aside class="sd-notice">
              <span class="sd-notice-symbol" aria-hidden="true">△</span>
              <span data-i18n="sdNotice">본 정보는 일상적인 셀프케어를 위한 참고 자료이며 질환의 진단이나 치료를 대신하지 않습니다</span>
            </aside>
          </div>
        </article>
      </main>
    `;

    var backBtn = container.querySelector('.sd-back-button');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        window.history.back();
      });
    }

    var mapImg = container.querySelector('.sd-map-image');
    var mapPlaceholder = container.querySelector('.sd-map-placeholder');
    if (mapImg && mapPlaceholder) {
      mapImg.addEventListener('error', function () {
        mapImg.style.display = 'none';
        mapPlaceholder.style.display = 'grid';
      });
    }

    var tabs = container.querySelectorAll('.sd-point-tab');
    var items = container.querySelectorAll('.sd-point-item');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = container.querySelector('#' + tab.dataset.target);

        tabs.forEach(function (button) { button.classList.remove('sd-is-active'); });
        items.forEach(function (item) { item.classList.remove('sd-is-active'); });

        tab.classList.add('sd-is-active');
        if (target) target.classList.add('sd-is-active');

        if (window.innerWidth <= 840 && target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  },

  seminar: function (container) {
    container.innerHTML = `
      <section class="seminar-embed-page">
        <iframe
          class="seminar-signup-frame"
          src="https://msj4211.github.io/730skin-check/signup/"
          title="730스킨 이어테라피 세미나 신청"
          loading="eager"
          allow="clipboard-write"
        ></iframe>
      </section>
    `;
  },

  products: function (container) {
    container.innerHTML =
      '<section class="page-section products-page">' +
      '<div class="section-title"><h2 data-i18n="navProducts">' + window.t('navProducts') + '</h2></div>' +
      '<div class="products-state" id="products-state">' +
      '<p class="products-loading" data-i18n="productsLoading">' + window.t('productsLoading') + '</p>' +
      '</div>' +
      '</section>';

    var stateEl = container.querySelector('#products-state');
    var client = window.supabaseClient;
    var lastProducts = null;

    function formatPrice(price) {
      var num = Number(price);
      if (isNaN(num)) return price;
      return window.currentLanguage === 'en'
        ? '$' + num.toLocaleString('en-US')
        : num.toLocaleString('ko-KR') + '원';
    }

    function renderUnavailable() {
      stateEl.innerHTML = '<p class="products-empty" data-i18n="productsEmpty">' + window.t('productsEmpty') + '</p>';
    }

    function renderProducts(products) {
      lastProducts = products;

      if (!products || products.length === 0) {
        renderUnavailable();
        return;
      }

      var lang = window.currentLanguage;

      stateEl.innerHTML = '<div class="products-grid">' +
        products.map(function (p) {
          var thumb = p.thumbnail_url || p.image_url || '';
          var name = (lang === 'en' && p.name_en) ? p.name_en : (p.name || '');
          var summary = (lang === 'en' && p.summary_en) ? p.summary_en : p.summary;
          return '<div class="product-card">' +
            '<div class="product-thumb">' +
            (p.is_featured ? '<span class="product-badge" data-i18n="productsFeaturedBadge">' + window.t('productsFeaturedBadge') + '</span>' : '') +
            (thumb ? '<img src="' + thumb + '" alt="' + name + '">' : '') +
            '</div>' +
            '<p class="product-name">' + name + '</p>' +
            (summary ? '<p class="product-summary">' + summary + '</p>' : '') +
            (p.price != null ? '<p class="product-price">' + formatPrice(p.price) + '</p>' : '') +
            (p.purchase_url
              ? '<a class="product-buy-btn" href="' + p.purchase_url + '" target="_blank" rel="noopener" data-i18n="productsBuyBtn">' + window.t('productsBuyBtn') + '</a>'
              : '') +
            '</div>';
        }).join('') +
        '</div>';
    }

    // 언어를 바꿨을 때, 이미 불러온 상품 목록을 새 요청 없이 다시 그려서
    // 이름/요약(및 통화 표기)이 즉시 바뀌도록 한다. 라우트를 재방문할 때마다
    // 이전 훅이 계속 쌓이지 않도록 매번 교체한다.
    if (window.__productsLanguageHook && window.i18nOnLanguageChange) {
      var idx = window.i18nOnLanguageChange.indexOf(window.__productsLanguageHook);
      if (idx !== -1) window.i18nOnLanguageChange.splice(idx, 1);
    }
    window.__productsLanguageHook = function () {
      if (!container.isConnected) return;
      if (lastProducts) renderProducts(lastProducts);
    };
    if (window.i18nOnLanguageChange) window.i18nOnLanguageChange.push(window.__productsLanguageHook);

    if (!client) {
      renderUnavailable();
      return;
    }

    client
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .then(function (res) {
        if (res.error) {
          console.error('[Products] 상품을 불러오지 못했습니다:', res.error);
          renderUnavailable();
          return;
        }
        renderProducts(res.data);
      });
  },
};
