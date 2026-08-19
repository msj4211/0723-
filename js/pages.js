window.Pages = (function () {
  // ── 공용 XSS 방어 헬퍼 ──────────────────────────────────────────
  // DB(ear_points/ear_point_details/ear_point_related_points)에서 온 값은
  // 원장님이 Supabase 대시보드/SQL Editor에서 직접 입력한다 — 일반 회원은
  // RLS상 이 테이블들에 쓰기 권한이 전혀 없지만, 그래도 텍스트/속성값에
  // '<'/'"' 등이 실수로 섞여 들어가도 HTML로 해석되지 않도록 innerHTML에
  // 넣기 전에 항상 이 함수를 거친다. 회원이 직접 입력하는 개인 메모는
  // 이 함수를 쓰지 않고 계속 textContent로만 표시한다(초기화 상태 유지).
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // href/src에 쓰기 전 스킴을 검증한다. http/https만 허용하고
  // javascript:/data:/vbscript:/file: 등은 전부 차단한다. images/귀.png
  // 같은 상대 경로도 계속 지원해야 하므로, 브라우저의 실제 URL 파서(new
  // URL)로 현재 페이지를 기준 삼아 해석한 뒤 최종 스킴만 확인한다 —
  // "java\tscript:"처럼 문자를 끼워 넣는 흔한 우회도 URL 파서 자체가
  // 공백류 문자를 제거하고 해석하므로 정규식 방식보다 안전하다. 유효하면
  // 원래 문자열(상대 경로 형태 그대로)을 돌려주고, 아니면 null을 돌려준다.
  function safeUrl(value) {
    if (!value) return null;
    var trimmed = String(value).trim();
    if (!trimmed) return null;
    var parsed;
    try {
      parsed = new URL(trimmed, window.location.href);
    } catch (e) {
      return null;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return trimmed;
  }

  function renderHome(container) {
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

    var rollingBannerPhrases = [
      '오늘의 컨디션을 확인해 보세요',
      '증상에 맞는 귀 혈자리를 찾아보세요',
      '귀로 시작하는 가벼운 셀프케어',
      '나에게 필요한 이어테라피를 만나보세요'
    ];

    // 두 그룹을 나란히 이어붙이고 트랙을 -50% 만큼 옮기면, 그룹1이 화면
    // 밖으로 나가는 순간 그룹2가 정확히 그 자리를 채워서 이음새 없이
    // 무한 반복되는 것처럼 보인다.
    var rollingBannerGroupHtml = rollingBannerPhrases.map(function (phrase) {
      return '<span class="rolling-banner-item">' + phrase + '</span>' +
        '<span class="rolling-banner-dot" aria-hidden="true">●</span>';
    }).join('');

    var rollingBannerHtml =
      '<div class="rolling-banner" aria-hidden="true">' +
      '<div class="rolling-banner-track">' +
      '<div class="rolling-banner-group">' + rollingBannerGroupHtml + '</div>' +
      '<div class="rolling-banner-group">' + rollingBannerGroupHtml + '</div>' +
      '</div>' +
      '</div>';

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

        ${rollingBannerHtml}

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
  }

  function renderEarCheckEmbed(container) {
    // 로컬 개발 환경(localhost/127.0.0.1)에서는 /Users/suji/730skin-check를
    // 직접 띄운 8001번 서버를 iframe으로 쓰고, 그 외(실제 배포 도메인)에서는
    // 원래의 GitHub Pages 주소를 그대로 쓴다. 수동 전환 없이
    // window.location.hostname만으로 자동 판별한다 — 이 판별은 iframe을
    // 처음 만들 때 한 번만 이뤄지고, 언어를 바꿀 때는 다시 실행되지 않는다
    // (아래 sendLanguage()는 이미 만들어진 iframe에 postMessage만 보낸다).
    var isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    var EAR_CHECK_ORIGIN = isLocalDev ? 'http://localhost:8001' : 'https://msj4211.github.io';
    var EAR_CHECK_SRC = isLocalDev ? 'http://localhost:8001/' : 'https://msj4211.github.io/730skin-check/';

    container.innerHTML = `
      <div class="iframe-page">
        <iframe
          class="embed-frame"
          src="${EAR_CHECK_SRC}"
          title="이어밸런스체크 결과지"
          loading="lazy"></iframe>
      </div>
    `;

    var frame = container.querySelector('.embed-frame');
    var hasLoadedOnce = false;
    var myToken = window.__routeToken;
    function isStale() { return myToken !== window.__routeToken; }

    // 이전 라우트 진입 때 등록해둔 리스너/훅이 남아있으면 정리한다(재진입 시 중복 방지).
    if (window.__earCheckMessageHandler) {
      window.removeEventListener('message', window.__earCheckMessageHandler);
      window.__earCheckMessageHandler = null;
    }
    if (window.__earCheckLanguageHook && window.i18nOnLanguageChange) {
      var prevHookIdx = window.i18nOnLanguageChange.indexOf(window.__earCheckLanguageHook);
      if (prevHookIdx !== -1) window.i18nOnLanguageChange.splice(prevHookIdx, 1);
      window.__earCheckLanguageHook = null;
    }

    // 메인 사이트 헤더의 한국어/EN 버튼으로 정해진 현재 언어를 iframe에
    // 그대로 전달한다. targetOrigin을 730skin-check의 실제 배포 주소로
    // 고정해(별표 사용 안 함) 다른 origin으로는 이 메시지가 새어나가지
    // 않게 한다.
    function sendLanguage() {
      if (isStale() || !frame.contentWindow) return;
      frame.contentWindow.postMessage({
        source: '730-main-site',
        type: 'language-change',
        language: window.currentLanguage
      }, EAR_CHECK_ORIGIN);
    }

    // 체크리스트 → 결과지로 iframe 내부에서 페이지가 바뀌면 콘텐츠 높이도 크게
    // 달라진다(체크리스트는 길고, 결과지는 훨씬 짧다). contentDocument 직접 접근은
    // 로컬 개발 서버처럼 부모와 origin이 다른 환경에서 항상 실패하므로, iframe
    // 문서(730skin-check/index.html, result.html)가 보내는 postMessage로 실제
    // 높이를 전달받아 반영한다 — origin에 상관없이 항상 동작한다.
    // 높이 메시지·ready 메시지 둘 다 730skin-check(EAR_CHECK_ORIGIN)에서
    // 왔는지, 그리고 실제로 이 iframe(frame.contentWindow)에서 왔는지
    // 확인한 뒤에만 처리한다. 라우트를 벗어난 뒤에도 이 리스너가 한동안
    // 등록된 채 남아있을 수 있어(다음 진입 시 위에서 정리됨), 메시지가
    // 들어오는 시점에 isStale()이면 스스로 리스너를 제거해 정리한다.
    var messageHandler = function (e) {
      if (isStale()) {
        window.removeEventListener('message', messageHandler);
        return;
      }
      if (e.origin !== EAR_CHECK_ORIGIN) return;
      if (e.source !== frame.contentWindow) return;
      if (!e.data) return;

      if (e.data.source === '730skin-check-embed') {
        if (!frame.isConnected) return;
        if (typeof e.data.height === 'number' && e.data.height > 0) {
          frame.style.minHeight = '0';
          frame.style.height = e.data.height + 'px';
        }
        return;
      }

      // index.html이 처음 뜨거나, "결과 확인하기"로 result.html이 새로
      // 로드될 때마다 730skin-check가 이 메시지를 보내온다 — 그때마다
      // 현재 언어를 다시 알려줘서 result.html도 같은 언어로 보이게 한다.
      if (e.data.source === '730-skin-check' && e.data.type === 'ready') {
        sendLanguage();
      }
    };
    window.__earCheckMessageHandler = messageHandler;
    window.addEventListener('message', messageHandler);

    // 메인 사이트 언어가 바뀌면(헤더의 한국어/EN 버튼) iframe을 새로고침하지
    // 않고 postMessage로만 알려서, 작성 중이던 이름·나이·날짜·성별·응답이
    // 초기화되지 않게 한다. 기존 __earPointLanguageHook 등과 동일하게
    // 라우트를 재방문할 때마다 이전 훅이 계속 쌓이지 않도록 매번 교체한다.
    var languageHook = function () {
      if (isStale()) {
        if (window.i18nOnLanguageChange) {
          var idx = window.i18nOnLanguageChange.indexOf(languageHook);
          if (idx !== -1) window.i18nOnLanguageChange.splice(idx, 1);
        }
        return;
      }
      sendLanguage();
    };
    window.__earCheckLanguageHook = languageHook;
    if (window.i18nOnLanguageChange) window.i18nOnLanguageChange.push(languageHook);

    frame.addEventListener('load', function () {
      if (isStale()) return;

      // 같은 origin으로 배포된 경우, postMessage 스크립트가 실행되기 전
      // 첫 시점에 한 번 더 시도해 초기 여백을 최소화하는 보조 수단이다.
      try {
        var docHeight = frame.contentDocument.documentElement.scrollHeight;
        frame.style.minHeight = '0';
        frame.style.height = docHeight + 'px';
      } catch (e) {
        // cross-origin: 접근 불가, 위 postMessage 응답을 기다린다.
      }

      // iframe 문서가 새로 뜰 때마다(첫 로드, 또는 결과 확인하기로 인한
      // result.html 이동) 현재 언어를 알려준다. iframe 쪽도 ready
      // 메시지로 다시 요청하므로 이중으로 보장된다.
      sendLanguage();

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
  }

  // 이어포인트 이름/설명/이미지는 js/ear-points-data.js가 Supabase(RLS로
  // 승인된 교육생만 조회 가능)에서 불러온다. 실제 ear_points 테이블에는
  // id/name/description/image_url만 있어서(영문 이름·정렬순서·키워드 컬럼
  // 없음), 여기서는 그 4개 필드만 그대로 그린다 — 언어를 영어로 바꿔도
  // 이 DB 기반 이름/설명 자체는 바뀌지 않는다(사이트 UI 문구만 번역됨).
  function renderEarPointList(container, queryString) {
    container.innerHTML =
      '<section class="page-section">' +
      '<div class="section-title"><h2 data-i18n="navEarPoints">' + window.t('navEarPoints') + '</h2></div>' +
      '<div class="point-grid" id="ear-point-grid"><p class="products-loading">' + window.t('productsLoading') + '</p></div>' +
      '</section>';

    var grid = container.querySelector('#ear-point-grid');
    var myToken = window.__routeToken;

    window.EarPointsRepo.load().then(function (points) {
      if (myToken !== window.__routeToken) return;
      renderCards(points);
    });

    function renderCards(points) {
      if (!points || points.length === 0) {
        grid.innerHTML = '<p class="point-grid-empty" data-i18n="earPointsEmpty">' + window.t('earPointsEmpty') + '</p>';
        return;
      }

      var cards = points.map(function (p) {
        var safeImg = safeUrl(p.imageUrl);
        var safeName = escapeHtml(p.name);
        var safeDesc = escapeHtml(p.desc);
        var safeId = escapeHtml(p.id);
        var media = safeImg
          ? '<img src="' + escapeHtml(safeImg) + '" alt="' + safeName + '">'
          : '<div class="point-media-placeholder" aria-hidden="true"></div>';
        var detailHref = '#/ear-point/' + encodeURIComponent(p.id);
        // 하트 버튼은 카드 클릭(상세페이지 이동)과 별개로 동작해야 해서,
        // <a> 안에 <button>을 중첩하지 않고 형제 요소로 둔다 — 이렇게 하면
        // 하트를 눌러도 이벤트가 링크로 버블링되지 않아 stopPropagation
        // 없이도 자연스럽게 분리된다. 위치는 .point-card에 준
        // position:relative로 기존과 동일하게 유지한다(style.css 참고).
        return '<div class="point-card" data-point-id="' + safeId + '" data-point-name="' + safeName + '">' +
          '<a class="point-card-link" href="' + detailHref + '" aria-label="' + safeName + window.t('pointCardDetailAriaSuffix') + '">' +
          '<div class="point-media">' +
          media +
          '</div>' +
          '<p class="point-name">' + safeName + '</p>' +
          '<p class="like-count" aria-live="polite" data-i18n="likeCountLoading">' + window.t('likeCountLoading') + '</p>' +
          '<p class="point-desc">' + safeDesc + '</p>' +
          '</a>' +
          '<button type="button" class="like-btn" aria-label="' + safeName + window.t('likeAriaLabelSuffix') + '" aria-pressed="false">♡</button>' +
          '</div>';
      }).join('');

      grid.innerHTML = cards || '';

      if (window.EarPointLikes) window.EarPointLikes.init(container);

      // 이름/설명은 언어와 무관하게 고정이지만, 하트 버튼의 aria-label
      // 접미사("관심 표시"/"interest")는 언어별로 다르므로 언어가 바뀌면
      // 다시 붙여준다. 라우트를 재방문할 때마다 이전 훅이 계속 쌓이지
      // 않도록 매번 교체한다.
      if (window.__earPointLanguageHook && window.i18nOnLanguageChange) {
        var hookIdx = window.i18nOnLanguageChange.indexOf(window.__earPointLanguageHook);
        if (hookIdx !== -1) window.i18nOnLanguageChange.splice(hookIdx, 1);
      }
      window.__earPointLanguageHook = function () {
        container.querySelectorAll('.point-card').forEach(function (card) {
          var nameText = card.querySelector('.point-name').textContent;
          card.querySelector('.like-btn').setAttribute('aria-label', nameText + window.t('likeAriaLabelSuffix'));
        });
      };
      if (window.i18nOnLanguageChange) window.i18nOnLanguageChange.push(window.__earPointLanguageHook);

      // 검색 결과에서 "point=knee" 같은 쿼리로 들어온 경우, 해당 카드로
      // 스크롤하고 잠깐 강조 표시한다.
      var params = new URLSearchParams(queryString || '');
      var highlightId = params.get('point');
      if (highlightId) {
        var targetCard = container.querySelector('.point-card[data-point-id="' + CSS.escape(highlightId) + '"]');
        if (targetCard) {
          window.requestAnimationFrame(function () {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.classList.add('point-card--highlight');
            window.setTimeout(function () {
              targetCard.classList.remove('point-card--highlight');
            }, 2000);
          });
        }
      }
    }
  }

  // ── 이어포인트 상세페이지 ──────────────────────────────────────
  // js/router.js → Pages.earPointDetail → AccessControl.checkEducationAccess를
  // 거친 뒤에만 이 함수가 호출된다(맨 아래 return의 earPointDetail 참고).
  // 즉 승인 확인 자체가 이 함수 실행 여부를 결정하므로, "승인 상태를
  // 확인하기 전에는 상세정보·이미지·개인 메모를 렌더링하지 않는다"는
  // 요구사항은 호출 순서로 보장된다 — 메뉴에서 숨기는 것과 무관하게,
  // 주소를 직접 입력해 들어와도 항상 이 순서를 거친다.
  //
  // 콘텐츠(선택하는 이유/위치 설명/함께 활용하는 혈자리/적용 순서/관리
  // 참고사항/피해야 하는 상황/영상)는 원장님이 Supabase 대시보드(SQL
  // Editor 또는 Table Editor, service_role 권한)에서 직접 입력한다. 이
  // 파일은 값이 없는 섹션을 숨길 뿐, 어떤 의학 정보도 대신 만들어 채우지
  // 않는다.
  function renderEarPointDetail(container, session, pointId) {
    var userId = session.user.id;
    var myToken = window.__routeToken;
    function isStale() {
      return myToken !== window.__routeToken;
    }

    container.innerHTML = '<div class="epd-page"><p class="epd-loading" data-i18n="epdLoading">' + window.t('epdLoading') + '</p></div>';

    function renderState(modifier, titleKey, descKey) {
      container.innerHTML =
        '<div class="epd-page">' +
        '<div class="epd-state ' + modifier + '">' +
        '<p class="epd-state-title" data-i18n="' + titleKey + '">' + window.t(titleKey) + '</p>' +
        '<p class="epd-state-desc" data-i18n="' + descKey + '">' + window.t(descKey) + '</p>' +
        '<a href="#/ear-point" class="epd-state-btn" data-i18n="epdBackToList">' + window.t('epdBackToList') + '</a>' +
        '</div>' +
        '</div>';
    }

    Promise.all([
      window.EarPointsRepo.load(),
      window.EarPointDetailRepo.loadDetail(pointId),
      window.EarPointDetailRepo.loadRelated(pointId, 3),
      window.EarPointDetailRepo.loadNote(userId, pointId)
    ]).then(function (results) {
      if (isStale()) return;

      var points = results[0] || [];
      var detailRes = results[1];
      var relatedRes = results[2];
      var noteRes = results[3];

      var point = points.filter(function (p) { return p.id === pointId; })[0];
      if (!point) {
        renderState('epd-state--notfound', 'epdNotFoundTitle', 'epdNotFoundDesc');
        return;
      }

      renderDetail(point, points, detailRes, relatedRes, noteRes);
    }).catch(function (err) {
      console.error('[EarPointDetail] 상세페이지 데이터 조회 중 예외:', err);
      if (!isStale()) renderState('epd-state--error', 'epdErrorTitle', 'epdErrorDesc');
    });

    function stepLabel(n) {
      return window.currentLanguage === 'en' ? ('Step ' + n) : (n + '단계');
    }

    function buildHero(point) {
      var safeImg = safeUrl(point.imageUrl);
      var safeName = escapeHtml(point.name);
      var media = safeImg
        ? '<img src="' + escapeHtml(safeImg) + '" alt="' + safeName + '" class="epd-hero-img">'
        : '<div class="point-media-placeholder" aria-hidden="true"></div>';
      return (
        '<section class="epd-hero point-card" data-point-id="' + escapeHtml(point.id) + '" data-point-name="' + safeName + '">' +
        '<div class="epd-hero-media point-media">' + media + '</div>' +
        '<div class="epd-hero-info">' +
        '<h1 class="epd-hero-name">' + safeName + '</h1>' +
        '<p class="epd-hero-desc">' + escapeHtml(point.desc) + '</p>' +
        '<div class="epd-save-row">' +
        '<button type="button" class="like-btn epd-save-heart" aria-pressed="false" aria-label="' + safeName + window.t('likeAriaLabelSuffix') + '">♡</button>' +
        '<span class="like-count epd-save-label" aria-live="polite">' + window.t('likeCountLoading') + '</span>' +
        '</div>' +
        '</div>' +
        '</section>'
      );
    }

    function buildLocationSection(point, detail) {
      var safeImg = safeUrl(point.imageUrl);
      var safeName = escapeHtml(point.name);
      var img = safeImg
        ? '<img src="' + escapeHtml(safeImg) + '" alt="' + safeName + '" class="epd-location-image">'
        : '<div class="point-media-placeholder" aria-hidden="true"></div>';
      var zoomBtn = safeImg
        ? '<button type="button" class="epd-zoom-btn" data-i18n-aria-label="epdImageZoomBtn" aria-label="' + window.t('epdImageZoomBtn') + '"><span aria-hidden="true">⤢</span></button>'
        : '';
      var text = detail.locationGuide ? '<p class="epd-location-text">' + escapeHtml(detail.locationGuide) + '</p>' : '';

      return (
        '<section class="epd-section" aria-labelledby="epd-location-title">' +
        '<h2 id="epd-location-title" class="epd-section-title" data-i18n="epdLocationTitle">' + window.t('epdLocationTitle') + '</h2>' +
        '<div class="epd-location-body">' +
        '<div class="epd-location-image-wrap">' + img + zoomBtn + '</div>' +
        text +
        '</div>' +
        '</section>'
      );
    }

    function buildReasonSection(detail) {
      if (!detail.selectionReason) return '';
      return (
        '<section class="epd-section" aria-labelledby="epd-reason-title">' +
        '<h2 id="epd-reason-title" class="epd-section-title" data-i18n="epdReasonTitle">' + window.t('epdReasonTitle') + '</h2>' +
        '<p class="epd-reason-text">' + escapeHtml(detail.selectionReason) + '</p>' +
        '</section>'
      );
    }

    function buildComboSection(detail) {
      if (!detail.comboPoints.length) return '';
      var items = detail.comboPoints.map(function (item, idx) {
        var panelId = 'epd-combo-panel-' + idx;
        return (
          '<div class="epd-accordion-item">' +
          '<button type="button" class="epd-accordion-trigger" aria-expanded="false" aria-controls="' + panelId + '">' +
          '<span class="epd-accordion-name">' + escapeHtml(item.name) + '</span>' +
          '<span class="epd-accordion-icon" aria-hidden="true">+</span>' +
          '</button>' +
          '<div class="epd-accordion-panel" id="' + panelId + '" hidden>' +
          '<p>' + escapeHtml(item.reason || '') + '</p>' +
          '</div>' +
          '</div>'
        );
      }).join('');
      return (
        '<section class="epd-section" aria-labelledby="epd-combo-title">' +
        '<h2 id="epd-combo-title" class="epd-section-title" data-i18n="epdComboTitle">' + window.t('epdComboTitle') + '</h2>' +
        '<div class="epd-accordion">' + items + '</div>' +
        '</section>'
      );
    }

    function buildStepsSection(detail) {
      if (!detail.usageSteps.length) return '';
      var items = detail.usageSteps.map(function (step, idx) {
        return (
          '<li class="epd-step-item">' +
          '<span class="epd-step-number">' + stepLabel(idx + 1) + '</span>' +
          '<span class="epd-step-text">' + escapeHtml(step) + '</span>' +
          '</li>'
        );
      }).join('');
      return (
        '<section class="epd-section" aria-labelledby="epd-steps-title">' +
        '<h2 id="epd-steps-title" class="epd-section-title" data-i18n="epdStepsTitle">' + window.t('epdStepsTitle') + '</h2>' +
        '<ol class="epd-steps-list">' + items + '</ol>' +
        '</section>'
      );
    }

    function buildTipsSection(detail) {
      if (!detail.managementTips.length) return '';
      var items = detail.managementTips.map(function (tip) { return '<li>' + escapeHtml(tip) + '</li>'; }).join('');
      return (
        '<section class="epd-section" aria-labelledby="epd-tips-title">' +
        '<h2 id="epd-tips-title" class="epd-section-title" data-i18n="epdTipsTitle">' + window.t('epdTipsTitle') + '</h2>' +
        '<ul class="epd-tips-list">' + items + '</ul>' +
        '</section>'
      );
    }

    function buildAvoidSection(detail) {
      if (!detail.avoidWhen.length) return '';
      var items = detail.avoidWhen.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
      return (
        '<section class="epd-section" aria-labelledby="epd-avoid-title">' +
        '<div class="epd-avoid-box">' +
        '<h2 id="epd-avoid-title" class="epd-avoid-title"><span class="epd-avoid-icon" aria-hidden="true">△</span><span data-i18n="epdAvoidTitle">' + window.t('epdAvoidTitle') + '</span></h2>' +
        '<ul class="epd-avoid-list">' + items + '</ul>' +
        '</div>' +
        '</section>'
      );
    }

    // video_url은 http/https로 확인된 안전한 값일 때만 섹션 전체를 그린다 —
    // safeUrl()이 null을 돌려주면(javascript:/data: 등 위험한 스킴, 빈 값,
    // 파싱 실패 등) 영상 섹션을 아예 표시하지 않는다.
    function buildVideoSection(detail) {
      var safeVideoUrl = safeUrl(detail.videoUrl);
      if (!safeVideoUrl) return '';
      var titleHtml = detail.videoTitle ? '<p class="epd-video-title">' + escapeHtml(detail.videoTitle) + '</p>' : '';
      var descHtml = detail.videoDescription ? '<p class="epd-video-desc">' + escapeHtml(detail.videoDescription) + '</p>' : '';
      return (
        '<section class="epd-section" aria-labelledby="epd-video-title">' +
        '<h2 id="epd-video-title" class="epd-section-title" data-i18n="epdVideoTitle">' + window.t('epdVideoTitle') + '</h2>' +
        '<a class="epd-video-card" href="' + escapeHtml(safeVideoUrl) + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="epd-video-play" aria-hidden="true">▶</span>' +
        '<span class="epd-video-info">' + titleHtml + descHtml + '<span class="epd-video-link-label" data-i18n="epdVideoPlayBtn">' + window.t('epdVideoPlayBtn') + '</span></span>' +
        '</a>' +
        '</section>'
      );
    }

    function buildNotesSection() {
      return (
        '<section class="epd-section epd-notes-section" aria-labelledby="epd-notes-title">' +
        '<h2 id="epd-notes-title" class="epd-section-title" data-i18n="epdNoteTitle">' + window.t('epdNoteTitle') + '</h2>' +
        '<p class="epd-notes-desc" data-i18n="epdNoteDesc">' + window.t('epdNoteDesc') + '</p>' +
        '<p class="epd-notes-privacy" data-i18n="epdNotePrivacyNotice">' + window.t('epdNotePrivacyNotice') + '</p>' +
        '<div class="epd-note-view" hidden>' +
        '<p class="epd-note-view-text"></p>' +
        '<div class="epd-note-view-actions">' +
        '<button type="button" class="epd-note-edit-btn" data-i18n="epdNoteEditBtn">' + window.t('epdNoteEditBtn') + '</button>' +
        '<button type="button" class="epd-note-delete-btn" data-i18n="epdNoteDeleteBtn">' + window.t('epdNoteDeleteBtn') + '</button>' +
        '</div>' +
        '</div>' +
        '<div class="epd-note-edit">' +
        '<textarea class="epd-note-textarea" maxlength="1000" data-i18n-placeholder="epdNotePlaceholder" placeholder="' + window.t('epdNotePlaceholder') + '"></textarea>' +
        '<div class="epd-note-edit-footer">' +
        '<span class="epd-note-char-count">0 / 1000</span>' +
        '<div class="epd-note-edit-actions">' +
        '<button type="button" class="epd-note-cancel-btn" data-i18n="epdNoteCancelBtn" hidden>' + window.t('epdNoteCancelBtn') + '</button>' +
        '<button type="button" class="epd-note-save-btn" data-i18n="epdNoteSaveBtn">' + window.t('epdNoteSaveBtn') + '</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<p class="epd-note-status" aria-live="polite"></p>' +
        '</section>'
      );
    }

    function buildRelatedPointsSection(relatedRows, allPoints) {
      var cards = relatedRows.map(function (rel) {
        var basePoint = allPoints.filter(function (p) { return p.id === rel.id; })[0];
        if (!basePoint) return '';
        var safeImg = safeUrl(basePoint.imageUrl);
        var safeName = escapeHtml(basePoint.name);
        var media = safeImg
          ? '<img src="' + escapeHtml(safeImg) + '" alt="' + safeName + '">'
          : '<div class="point-media-placeholder" aria-hidden="true"></div>';
        return (
          '<a class="epd-related-card" href="#/ear-point/' + encodeURIComponent(basePoint.id) + '">' +
          '<div class="epd-related-media">' + media + '</div>' +
          '<p class="epd-related-name">' + safeName + '</p>' +
          '</a>'
        );
      }).join('');

      if (!cards) return '';

      return (
        '<section class="epd-section" aria-labelledby="epd-related-title">' +
        '<h2 id="epd-related-title" class="epd-section-title" data-i18n="epdRelatedPointsTitle">' + window.t('epdRelatedPointsTitle') + '</h2>' +
        '<div class="epd-related-grid">' + cards + '</div>' +
        '</section>'
      );
    }

    function initAccordion(root) {
      root.querySelectorAll('.epd-accordion-trigger').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var expanded = btn.getAttribute('aria-expanded') === 'true';
          var panel = root.querySelector('#' + btn.getAttribute('aria-controls'));
          btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          if (panel) panel.hidden = expanded;
        });
      });
    }

    function initImageZoom(root) {
      var zoomBtn = root.querySelector('.epd-zoom-btn');
      var img = root.querySelector('.epd-location-image');
      if (!zoomBtn || !img) return;

      zoomBtn.addEventListener('click', function () {
        // img.src/img.alt는 렌더링된 DOM에서 다시 읽어온 "순수 텍스트"라
        // innerHTML 문자열 조합에 그대로 넣으면 또 이스케이프가 필요해진다
        // — 이 함수는 애초에 innerHTML 대신 DOM 프로퍼티 대입만 써서
        // HTML 파싱 자체가 일어나지 않게 한다(이스케이프가 필요 없는 방식).
        var overlay = document.createElement('div');
        overlay.className = 'epd-lightbox';

        var backdrop = document.createElement('div');
        backdrop.className = 'epd-lightbox-backdrop';

        var closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'epd-lightbox-close';
        closeBtn.setAttribute('data-i18n-aria-label', 'epdImageZoomClose');
        closeBtn.setAttribute('aria-label', window.t('epdImageZoomClose'));
        closeBtn.textContent = '×';

        var lightboxImg = document.createElement('img');
        lightboxImg.className = 'epd-lightbox-img';
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;

        overlay.appendChild(backdrop);
        overlay.appendChild(closeBtn);
        overlay.appendChild(lightboxImg);
        document.body.appendChild(overlay);
        document.body.classList.add('no-scroll');

        function close() {
          overlay.remove();
          document.body.classList.remove('no-scroll');
          document.removeEventListener('keydown', onKeydown);
          zoomBtn.focus();
        }
        function onKeydown(e) {
          if (e.key === 'Escape') close();
        }

        backdrop.addEventListener('click', close);
        closeBtn.addEventListener('click', close);
        document.addEventListener('keydown', onKeydown);
      });
    }

    // 메모는 회원 1명 x 이어포인트 1개당 1개(user_ear_point_notes의
    // (user_id, ear_point_id) 기본키)뿐이라, 다른 회원의 메모는 RLS로도
    // 애초에 조회되지 않는다 — 이 함수는 그 위에 화면 상태(보기/편집)만
    // 관리한다. 표시는 항상 textContent로 채워, 회원이 직접 입력한 메모
    // 내용이 실수로 HTML로 해석되는 일이 없게 한다.
    function initNotes(root, noteRes) {
      var viewBox = root.querySelector('.epd-note-view');
      var viewText = root.querySelector('.epd-note-view-text');
      var editBox = root.querySelector('.epd-note-edit');
      var textarea = root.querySelector('.epd-note-textarea');
      var charCount = root.querySelector('.epd-note-char-count');
      var statusEl = root.querySelector('.epd-note-status');
      var saveBtn = root.querySelector('.epd-note-save-btn');
      var cancelBtn = root.querySelector('.epd-note-cancel-btn');
      var editBtn = root.querySelector('.epd-note-edit-btn');
      var deleteBtn = root.querySelector('.epd-note-delete-btn');
      var MAX_LEN = 1000;

      var currentNoteText = noteRes.data ? noteRes.data.note : '';

      function setStatus(text, isError) {
        statusEl.textContent = text || '';
        statusEl.className = 'epd-note-status' + (isError ? ' epd-note-status--error' : text ? ' epd-note-status--success' : '');
      }

      function updateCharCount() {
        charCount.textContent = textarea.value.length + ' / ' + MAX_LEN;
      }

      function showViewMode(text) {
        currentNoteText = text;
        viewText.textContent = text;
        viewBox.hidden = false;
        editBox.hidden = true;
      }

      function showEditMode(prefill, showCancel) {
        textarea.value = prefill || '';
        updateCharCount();
        viewBox.hidden = true;
        editBox.hidden = false;
        cancelBtn.hidden = !showCancel;
      }

      if (noteRes.error) {
        setStatus(window.t('epdNoteLoadError'), true);
      }

      if (currentNoteText) {
        showViewMode(currentNoteText);
      } else {
        showEditMode('', false);
      }

      textarea.addEventListener('input', updateCharCount);

      editBtn.addEventListener('click', function () {
        showEditMode(currentNoteText, true);
        setStatus('');
      });

      cancelBtn.addEventListener('click', function () {
        showViewMode(currentNoteText);
        setStatus('');
      });

      saveBtn.addEventListener('click', function () {
        if (saveBtn.dataset.busy === 'true') return;
        var value = textarea.value.trim();
        if (!value) {
          setStatus(window.t('epdNoteEmptyError'), true);
          return;
        }

        saveBtn.dataset.busy = 'true';
        saveBtn.disabled = true;
        setStatus(window.t('epdNoteSaving'), false);

        window.EarPointDetailRepo.saveNote(userId, pointId, value).then(function (res) {
          saveBtn.dataset.busy = 'false';
          saveBtn.disabled = false;
          if (res.error) {
            console.error('[EarPointDetail] 메모 저장 실패:', res.error);
            // 저장 실패 시 입력값은 textarea에 그대로 남겨 다시 시도할 수 있게 한다.
            setStatus(window.t('epdNoteError'), true);
            return;
          }
          showViewMode(value);
          setStatus(window.t('epdNoteSaved'), false);
        });
      });

      deleteBtn.addEventListener('click', function () {
        if (deleteBtn.dataset.busy === 'true') return;
        if (!window.confirm(window.t('epdNoteConfirmDelete'))) return;

        deleteBtn.dataset.busy = 'true';
        deleteBtn.disabled = true;

        window.EarPointDetailRepo.deleteNote(userId, pointId).then(function (res) {
          deleteBtn.dataset.busy = 'false';
          deleteBtn.disabled = false;
          if (res.error) {
            console.error('[EarPointDetail] 메모 삭제 실패:', res.error);
            setStatus(window.t('epdNoteDeleteError'), true);
            return;
          }
          showEditMode('', false);
          setStatus(window.t('epdNoteDeleted'), false);
        });
      });
    }

    function renderDetail(point, allPoints, detailRes, relatedRes, noteRes) {
      var detail = detailRes.data || {
        selectionReason: '',
        locationGuide: '',
        comboPoints: [],
        usageSteps: [],
        managementTips: [],
        avoidWhen: [],
        videoTitle: '',
        videoUrl: '',
        videoDescription: ''
      };
      var relatedRows = relatedRes.data || [];

      // ear_point_details에 아직 행 자체가 없는 경우(row가 null)는 "콘텐츠
      // 준비 전"이라 정상 상태이므로 오류로 취급하지 않는다. detailRes.error가
      // 실제로 채워진 경우만 조회 실패로 보고 작게 안내한다 — 기존 카드
      // 정보(이름/설명/이미지)는 이 경우에도 그대로 정상 표시한다.
      var detailErrorHtml = detailRes.error
        ? '<p class="epd-inline-error" data-i18n="epdDetailLoadError">' + window.t('epdDetailLoadError') + '</p>'
        : '';

      container.innerHTML =
        '<div class="epd-page">' +
        '<a href="#/ear-point" class="epd-back-link">' +
        '<span aria-hidden="true">‹</span> ' +
        '<span data-i18n="epdBackToList">' + window.t('epdBackToList') + '</span>' +
        '</a>' +
        buildHero(point) +
        detailErrorHtml +
        buildLocationSection(point, detail) +
        buildReasonSection(detail) +
        buildComboSection(detail) +
        buildStepsSection(detail) +
        buildTipsSection(detail) +
        buildAvoidSection(detail) +
        buildVideoSection(detail) +
        buildNotesSection() +
        buildRelatedPointsSection(relatedRows, allPoints) +
        '</div>';

      if (window.EarPointLikes) window.EarPointLikes.init(container);
      initAccordion(container);
      initImageZoom(container);
      initNotes(container, noteRes);

      // 언어를 바꿔도 대부분의 정적 문구는 위 마크업의 data-i18n 속성 덕분에
      // (router.js가 호출하는 applyTranslations 경로를 통해) 자동으로
      // 갱신된다. 다만 "1단계"/"Step 1" 같은 순서 라벨과 하트 버튼의
      // aria-label 접미사는 window.t() 결과를 렌더링 시점에 문자열로
      // 합쳐서 만든 값이라 data-i18n만으로는 안 바뀐다 — 이 두 가지만
      // 별도로 갱신한다. renderEarPointList의 __earPointLanguageHook과
      // 동일한 패턴: 라우트를 재방문할 때마다 이전 훅이 계속 쌓이지 않도록
      // 먼저 제거한 뒤 다시 등록하고, isStale()로 다른 라우트/다른
      // pointId로 이동한 뒤에는 실행되지 않게 막는다. Supabase 조회를
      // 전혀 하지 않으므로 메모를 중복 저장·삭제할 일도 없다.
      if (window.__earPointDetailLanguageHook && window.i18nOnLanguageChange) {
        var epdHookIdx = window.i18nOnLanguageChange.indexOf(window.__earPointDetailLanguageHook);
        if (epdHookIdx !== -1) window.i18nOnLanguageChange.splice(epdHookIdx, 1);
      }
      window.__earPointDetailLanguageHook = function () {
        if (isStale()) return;
        // setAttribute는 HTML을 파싱하지 않는 DOM API라 escapeHtml을 쓰면
        // 안 된다(썼다간 "A &amp; B"처럼 엔티티가 그대로 노출된다) — 원본
        // 텍스트를 그대로 넣는다.
        var heartBtn = container.querySelector('.epd-save-heart');
        if (heartBtn) heartBtn.setAttribute('aria-label', point.name + window.t('likeAriaLabelSuffix'));
        container.querySelectorAll('.epd-step-number').forEach(function (el, idx) {
          el.textContent = stepLabel(idx + 1);
        });
      };
      if (window.i18nOnLanguageChange) window.i18nOnLanguageChange.push(window.__earPointDetailLanguageHook);
    }
  }

  // 신문/교감/내분비/뇌간 4개는 public.ear_points에 실제로 존재하는 행이
  // 아니다(이번 작업 지침상 ear_points에 새 데이터를 추가하지 않으므로).
  // 그래서 이 페이지는 Supabase를 거치지 않고, 원래대로 정적 텍스트를
  // data-i18n으로 렌더링한다 — 이 페이지 자체는 여전히 승인된 교육생만
  // 접근 가능하도록 checkEducationAccess()로 감싸져 있다(아래 return 참고).
  function renderSleepDetail(container, queryString) {
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

    // 검색 결과에서 "point=shenmen" 같은 쿼리로 들어온 경우, 해당 탭을
    // 자동으로 선택한다(기존 탭 클릭 로직을 그대로 재사용).
    var sleepParams = new URLSearchParams(queryString || '');
    var sleepHighlightId = sleepParams.get('point');
    if (sleepHighlightId) {
      var matchingTab = container.querySelector('.sd-point-tab[data-target="sd-point-' + CSS.escape(sleepHighlightId) + '"]');
      if (matchingTab) matchingTab.click();
    }
  }

  // 개인정보 수집·이용 동의 버전. 동의 문구(seminarPrivacyConsentText 번역
  // 키)를 실제로 바꿀 때만 이 값도 함께 갱신한다 — DB의
  // seminar_applications.privacy_policy_version에 그대로 저장되어, 나중에
  // "어떤 버전의 문구에 동의했는지" 신청 시점 기준으로 추적할 수 있게 한다.
  var SEMINAR_PRIVACY_POLICY_VERSION = '2026-08-14-v1';

  function renderSeminarPage(container) {
    var myToken = window.__routeToken;
    function isStale() {
      return myToken !== window.__routeToken;
    }

    // 언어 훅은 라우트를 재방문할 때마다 새로 등록되므로, 이전 방문에서
    // 남은 훅이 계속 쌓이지 않도록 먼저 제거한다(이어포인트 상세페이지와
    // 동일한 패턴).
    if (window.__seminarLanguageHook && window.i18nOnLanguageChange) {
      var prevSeminarHookIdx = window.i18nOnLanguageChange.indexOf(window.__seminarLanguageHook);
      if (prevSeminarHookIdx !== -1) window.i18nOnLanguageChange.splice(prevSeminarHookIdx, 1);
    }
    window.__seminarLanguageHook = null;

    container.innerHTML =
      '<div class="seminar-page">' +
      '<p class="seminar-loading" data-i18n="seminarLoading">' + window.t('seminarLoading') + '</p>' +
      '</div>';

    function renderMessageState(modifier, textKey) {
      if (isStale()) return;
      container.innerHTML =
        '<div class="seminar-page">' +
        '<div class="seminar-state ' + modifier + '">' +
        '<p class="seminar-state-text" data-i18n="' + textKey + '">' + window.t(textKey) + '</p>' +
        '</div>' +
        '</div>';
    }

    window.SeminarRepo.loadPublishedSeminars().then(function (res) {
      if (isStale()) return;

      if (res.error) {
        // Supabase 오류 객체를 그대로 출력하지 않는다 — 고정 문구만 남긴다.
        console.error('[Seminar] 세미나 목록 조회에 실패했습니다.');
        renderMessageState('seminar-state--error', 'seminarLoadError');
        return;
      }

      var seminars = res.data || [];
      if (seminars.length === 0) {
        renderMessageState('seminar-state--empty', 'seminarEmpty');
        return;
      }

      renderSeminarList(seminars);
    }).catch(function () {
      console.error('[Seminar] 세미나 목록 조회 중 예외가 발생했습니다.');
      renderMessageState('seminar-state--error', 'seminarLoadError');
    });

    // ── 언어별 표시값 선택 헬퍼 ──
    // 영문 컬럼이 null이거나 빈 문자열이면 한국어 값으로 대체한다. DB
    // 원본(starts_at/ends_at 등)은 이 함수들이 전혀 수정하지 않는다.
    function pickLang(koValue, enValue) {
      if (window.currentLanguage === 'en' && enValue && String(enValue).trim()) return enValue;
      return koValue || '';
    }

    function formatDateTime(iso) {
      if (!iso) return '';
      var d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      var locale = window.currentLanguage === 'en' ? 'en-US' : 'ko-KR';
      try {
        return d.toLocaleString(locale, {
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit'
        });
      } catch (e) {
        return d.toISOString();
      }
    }

    function scheduleText(seminar) {
      var start = formatDateTime(seminar.starts_at);
      if (!seminar.ends_at) return start;
      return start + ' ~ ' + formatDateTime(seminar.ends_at);
    }

    // price가 양수일 때만 언어별로 다시 포맷해야 하므로(문의/무료는 고정
    // 번역 키), 이 함수는 그 경우에만 호출한다.
    function positivePriceText(seminar) {
      var num = Number(seminar.price);
      return window.currentLanguage === 'en'
        ? num.toLocaleString('en-US') + ' KRW'
        : num.toLocaleString('ko-KR') + '원';
    }

    function statusLabelKey(status) {
      if (status === 'open') return 'seminarStatusOpen';
      if (status === 'closed') return 'seminarStatusClosed';
      if (status === 'cancelled') return 'seminarStatusCancelled';
      return 'seminarStatusUpcoming';
    }

    function applyButtonKey(status) {
      if (status === 'open') return 'seminarApplyBtn';
      if (status === 'closed') return 'seminarApplyClosedBtn';
      if (status === 'cancelled') return 'seminarApplyCancelledBtn';
      return 'seminarApplyUpcomingBtn';
    }

    function buildForm(seminar, idx) {
      return (
        '<form class="seminar-apply-form" data-seminar-form="' + idx + '" novalidate>' +
        '<h3 class="seminar-form-title" data-i18n="seminarFormTitle">' + window.t('seminarFormTitle') + '</h3>' +

        '<div class="seminar-field">' +
        '<label class="seminar-field-label" for="seminar-name-' + idx + '" data-i18n="seminarNameLabel">' + window.t('seminarNameLabel') + '</label>' +
        '<input type="text" class="seminar-input" id="seminar-name-' + idx + '" name="name" maxlength="50" autocomplete="name" required ' +
        'data-i18n-placeholder="seminarNamePlaceholder" placeholder="' + escapeHtml(window.t('seminarNamePlaceholder')) + '">' +
        '<p class="seminar-field-error" data-field-error="name"></p>' +
        '</div>' +

        '<div class="seminar-field">' +
        '<label class="seminar-field-label" for="seminar-phone-' + idx + '" data-i18n="seminarPhoneLabel">' + window.t('seminarPhoneLabel') + '</label>' +
        '<input type="tel" class="seminar-input" id="seminar-phone-' + idx + '" name="phone" maxlength="30" autocomplete="tel" required ' +
        'data-i18n-placeholder="seminarPhonePlaceholder" placeholder="' + escapeHtml(window.t('seminarPhonePlaceholder')) + '">' +
        '<p class="seminar-field-error" data-field-error="phone"></p>' +
        '</div>' +

        '<div class="seminar-field">' +
        '<span class="seminar-field-label" data-i18n="seminarApplicantTypeLabel">' + window.t('seminarApplicantTypeLabel') + '</span>' +
        '<div class="seminar-radio-group">' +
        '<label class="seminar-radio-option"><input type="radio" name="seminar-applicant-type-' + idx + '" value="business"> ' +
        '<span data-i18n="seminarApplicantTypeBusiness">' + window.t('seminarApplicantTypeBusiness') + '</span></label>' +
        '<label class="seminar-radio-option"><input type="radio" name="seminar-applicant-type-' + idx + '" value="general"> ' +
        '<span data-i18n="seminarApplicantTypeGeneral">' + window.t('seminarApplicantTypeGeneral') + '</span></label>' +
        '</div>' +
        '<p class="seminar-field-error" data-field-error="applicantType"></p>' +
        '</div>' +

        '<div class="seminar-field">' +
        '<span class="seminar-field-label" data-i18n="seminarPurposeLabel">' + window.t('seminarPurposeLabel') + '</span>' +
        '<div class="seminar-checkbox-group">' +
        '<label class="seminar-checkbox-option"><input type="checkbox" name="purpose" value="personal_learning"> ' +
        '<span data-i18n="seminarPurposePersonalLearning">' + window.t('seminarPurposePersonalLearning') + '</span></label>' +
        '<label class="seminar-checkbox-option"><input type="checkbox" name="purpose" value="clinic_review"> ' +
        '<span data-i18n="seminarPurposeClinicReview">' + window.t('seminarPurposeClinicReview') + '</span></label>' +
        '<label class="seminar-checkbox-option"><input type="checkbox" name="purpose" value="product_inquiry"> ' +
        '<span data-i18n="seminarPurposeProductInquiry">' + window.t('seminarPurposeProductInquiry') + '</span></label>' +
        '<label class="seminar-checkbox-option"><input type="checkbox" name="purpose" value="other"> ' +
        '<span data-i18n="seminarPurposeOther">' + window.t('seminarPurposeOther') + '</span></label>' +
        '</div>' +
        '<p class="seminar-field-error" data-field-error="purpose"></p>' +
        '</div>' +

        '<div class="seminar-field seminar-field--consent">' +
        '<label class="seminar-consent-option">' +
        '<input type="checkbox" name="consent">' +
        '<span data-i18n="seminarPrivacyConsentLabel">' + window.t('seminarPrivacyConsentLabel') + '</span>' +
        '</label>' +
        '<p class="seminar-consent-text" data-i18n="seminarPrivacyConsentText">' + window.t('seminarPrivacyConsentText') + '</p>' +
        '<p class="seminar-field-error" data-field-error="consent"></p>' +
        '</div>' +

        '<button type="submit" class="seminar-submit-btn" data-i18n="seminarSubmitBtn">' + window.t('seminarSubmitBtn') + '</button>' +
        '<p class="seminar-form-status" data-form-status="' + idx + '" aria-live="polite"></p>' +
        '</form>'
      );
    }

    function buildCard(seminar, idx) {
      var titleText = pickLang(seminar.title, seminar.title_en);
      var descText = pickLang(seminar.description, seminar.description_en);
      var locationText = pickLang(seminar.location, seminar.location_en);
      var notesText = pickLang(seminar.notes, seminar.notes_en);
      var safeStatus = escapeHtml(seminar.status || 'upcoming');
      var statusKey = statusLabelKey(seminar.status);

      var priceHtml;
      if (seminar.price === null || seminar.price === undefined) {
        priceHtml = '<span class="seminar-card-value" data-i18n="seminarPriceTBD">' + window.t('seminarPriceTBD') + '</span>';
      } else if (Number(seminar.price) === 0) {
        priceHtml = '<span class="seminar-card-value" data-i18n="seminarPriceFree">' + window.t('seminarPriceFree') + '</span>';
      } else {
        priceHtml = '<span class="seminar-card-value" data-seminar-price="' + idx + '">' + escapeHtml(positivePriceText(seminar)) + '</span>';
      }

      var capacityHtml = (seminar.capacity === null || seminar.capacity === undefined)
        ? '<span class="seminar-card-value" data-i18n="seminarCapacityUnlimited">' + window.t('seminarCapacityUnlimited') + '</span>'
        : '<span class="seminar-card-value">' + escapeHtml(String(seminar.capacity)) + '</span>';

      var descHtml = descText
        ? '<p class="seminar-card-desc" data-seminar-desc="' + idx + '">' + escapeHtml(descText) + '</p>'
        : '';

      var locationHtml = locationText
        ? '<div class="seminar-card-row"><span class="seminar-card-label" data-i18n="seminarLocationLabel">' + window.t('seminarLocationLabel') + '</span>' +
          '<span class="seminar-card-value" data-seminar-location="' + idx + '">' + escapeHtml(locationText) + '</span></div>'
        : '';

      var notesHtml = notesText
        ? '<div class="seminar-card-row"><span class="seminar-card-label" data-i18n="seminarNotesLabel">' + window.t('seminarNotesLabel') + '</span>' +
          '<p class="seminar-card-value" data-seminar-notes="' + idx + '">' + escapeHtml(notesText) + '</p></div>'
        : '';

      var safeKakao = safeUrl(seminar.kakao_url);
      var kakaoHtml = safeKakao
        ? '<a class="seminar-kakao-btn" href="' + escapeHtml(safeKakao) + '" target="_blank" rel="noopener noreferrer" data-i18n="seminarKakaoBtn">' + window.t('seminarKakaoBtn') + '</a>'
        : '';

      var actionHtml = seminar.status === 'open'
        ? buildForm(seminar, idx)
        : '<button type="button" class="seminar-apply-btn seminar-apply-btn--disabled" disabled data-i18n="' + applyButtonKey(seminar.status) + '">' + window.t(applyButtonKey(seminar.status)) + '</button>';

      return (
        '<section class="seminar-card" data-seminar-card="' + idx + '">' +
        '<span class="seminar-card-status seminar-card-status--' + safeStatus + '" data-i18n="' + statusKey + '">' + window.t(statusKey) + '</span>' +
        '<h2 class="seminar-card-title" data-seminar-title="' + idx + '">' + escapeHtml(titleText) + '</h2>' +
        descHtml +
        '<div class="seminar-card-row"><span class="seminar-card-label" data-i18n="seminarScheduleLabel">' + window.t('seminarScheduleLabel') + '</span>' +
        '<span class="seminar-card-value" data-seminar-schedule="' + idx + '">' + escapeHtml(scheduleText(seminar)) + '</span></div>' +
        locationHtml +
        '<div class="seminar-card-row"><span class="seminar-card-label" data-i18n="seminarPriceLabel">' + window.t('seminarPriceLabel') + '</span>' + priceHtml + '</div>' +
        '<div class="seminar-card-row"><span class="seminar-card-label" data-i18n="seminarCapacityLabel">' + window.t('seminarCapacityLabel') + '</span>' + capacityHtml + '</div>' +
        notesHtml +
        kakaoHtml +
        actionHtml +
        '</section>'
      );
    }

    function renderSeminarList(seminars) {
      container.innerHTML =
        '<div class="seminar-page">' +
        '<div class="section-title">' +
        '<h1 data-i18n="seminarPageTitle">' + window.t('seminarPageTitle') + '</h1>' +
        '<p class="seminar-page-desc" data-i18n="seminarPageDesc">' + window.t('seminarPageDesc') + '</p>' +
        '</div>' +
        '<div class="seminar-card-list">' +
        seminars.map(function (seminar, idx) { return buildCard(seminar, idx); }).join('') +
        '</div>' +
        '</div>';

      seminars.forEach(function (seminar, idx) {
        if (seminar.status !== 'open') return;
        var form = container.querySelector('[data-seminar-form="' + idx + '"]');
        if (form) initSeminarForm(form, seminar);
      });

      // 언어를 바꿔도 대부분의 문구는 data-i18n 덕분에 자동으로 갱신된다.
      // 다만 title/description/location/notes(한영 컬럼 중 선택)와
      // 일정·가격(로케일에 맞춰 새로 포맷한 문자열)은 렌더링 시점에 만든
      // 값이라 별도로 갱신해야 한다. innerHTML로 폼 전체를 다시 그리면
      // 입력 중이던 값이 사라지므로, textContent만 바꾸는 이 훅으로
      // 처리한다(이어포인트 상세페이지의 언어 훅과 동일한 접근).
      window.__seminarLanguageHook = function () {
        if (isStale()) return;
        seminars.forEach(function (seminar, idx) {
          var titleEl = container.querySelector('[data-seminar-title="' + idx + '"]');
          if (titleEl) titleEl.textContent = pickLang(seminar.title, seminar.title_en);

          var descEl = container.querySelector('[data-seminar-desc="' + idx + '"]');
          if (descEl) descEl.textContent = pickLang(seminar.description, seminar.description_en);

          var locationEl = container.querySelector('[data-seminar-location="' + idx + '"]');
          if (locationEl) locationEl.textContent = pickLang(seminar.location, seminar.location_en);

          var notesEl = container.querySelector('[data-seminar-notes="' + idx + '"]');
          if (notesEl) notesEl.textContent = pickLang(seminar.notes, seminar.notes_en);

          var scheduleEl = container.querySelector('[data-seminar-schedule="' + idx + '"]');
          if (scheduleEl) scheduleEl.textContent = scheduleText(seminar);

          var priceEl = container.querySelector('[data-seminar-price="' + idx + '"]');
          if (priceEl) priceEl.textContent = positivePriceText(seminar);
        });

        // 검증 오류/신청 상태 문구는 el.dataset.i18nKey에 저장해 둔 번역
        // 키로만 다시 그린다 — 키가 없는(=현재 아무 메시지도 없는) 요소는
        // 건드리지 않으므로, 숨겨져 있던 오류가 언어 전환만으로 새로
        // 나타나지는 않는다. 이름/연락처/선택값/동의 체크박스는 이 훅이
        // 전혀 건드리지 않는다.
        container.querySelectorAll('.seminar-field-error, .seminar-form-status').forEach(function (el) {
          var key = el.dataset.i18nKey;
          if (key) el.textContent = window.t(key);
        });
      };
      if (window.i18nOnLanguageChange) window.i18nOnLanguageChange.push(window.__seminarLanguageHook);
    }

    function initSeminarForm(form, seminar) {
      var nameInput = form.querySelector('input[name="name"]');
      var phoneInput = form.querySelector('input[name="phone"]');
      var typeInputs = form.querySelectorAll('input[type="radio"]');
      var purposeInputs = form.querySelectorAll('input[name="purpose"]');
      var consentInput = form.querySelector('input[name="consent"]');
      var submitBtn = form.querySelector('.seminar-submit-btn');
      var statusEl = form.querySelector('[data-form-status]');
      var PHONE_CHARSET = /^[0-9+\-() ]+$/;
      var ALLOWED_PURPOSES = ['personal_learning', 'clinic_review', 'product_inquiry', 'other'];

      function fieldError(field) {
        return form.querySelector('[data-field-error="' + field + '"]');
      }

      // 오류 문구는 번역된 텍스트가 아니라 번역 키를 el.dataset.i18nKey에
      // 저장해 두고, 그 키로 window.t()를 호출해 화면에 그린다. 언어 전환
      // 훅(__seminarLanguageHook)이 이 키를 읽어 다시 그릴 수 있게 하기
      // 위함이다. key가 없으면(빈 값) 문구와 키를 모두 지운다 — 언어
      // 전환 과정에서 숨겨진 오류가 새로 나타나지 않는 이유이기도 하다.
      function setFieldError(field, key) {
        var el = fieldError(field);
        if (!el) return;
        if (key) {
          el.dataset.i18nKey = key;
          el.textContent = window.t(key);
        } else {
          delete el.dataset.i18nKey;
          el.textContent = '';
        }
      }

      function clearErrors() {
        form.querySelectorAll('.seminar-field-error').forEach(function (el) {
          delete el.dataset.i18nKey;
          el.textContent = '';
        });
      }

      // 제출 상태 문구(제출 중/성공/실패)도 필드 오류와 동일하게 번역
      // 키를 저장해 두고 그 키로만 다시 그린다.
      function setStatus(key, isError) {
        if (key) {
          statusEl.dataset.i18nKey = key;
          statusEl.textContent = window.t(key);
        } else {
          delete statusEl.dataset.i18nKey;
          statusEl.textContent = '';
        }
        statusEl.className = 'seminar-form-status' + (isError ? ' seminar-form-status--error' : key ? ' seminar-form-status--success' : '');
      }

      // DB의 CHECK 제약과 동일한 조건으로 프론트에서 먼저 검증한다 —
      // 여기서 막지 못한 값도 최종적으로는 DB CHECK가 다시 막아준다.
      function validate() {
        clearErrors();
        var valid = true;

        var name = nameInput.value.trim();
        if (!name) {
          setFieldError('name', 'seminarValidationNameRequired');
          valid = false;
        } else if (name.length > 50) {
          setFieldError('name', 'seminarValidationNameLength');
          valid = false;
        }

        var phone = phoneInput.value.trim();
        var digitCount = phone.replace(/[^0-9]/g, '').length;
        if (!phone) {
          setFieldError('phone', 'seminarValidationPhoneRequired');
          valid = false;
        } else if (phone.length > 30 || !PHONE_CHARSET.test(phone)) {
          setFieldError('phone', 'seminarValidationPhoneCharset');
          valid = false;
        } else if (digitCount < 7 || digitCount > 15) {
          setFieldError('phone', 'seminarValidationPhoneDigitCount');
          valid = false;
        }

        var applicantType = null;
        typeInputs.forEach(function (el) { if (el.checked) applicantType = el.value; });
        if (!applicantType) {
          setFieldError('applicantType', 'seminarValidationApplicantTypeRequired');
          valid = false;
        }

        // 허용된 4개 코드만 통과시키고(화이트리스트), Set으로 중복을
        // 제거한 뒤 1~4개 범위인지 명시적으로 검사한다 — DB CHECK
        // (purposes <@ 허용 배열, cardinality 1~4)와 동일한 조건을 코드에도
        // 명시해 둔다. 현재 체크박스가 4개뿐이라 4개 초과는 실제로는
        // 발생하지 않지만, 방어 목적으로 명시적으로 막는다.
        var purposesSeen = new Set();
        var purposes = [];
        purposeInputs.forEach(function (el) {
          if (el.checked && ALLOWED_PURPOSES.indexOf(el.value) !== -1 && !purposesSeen.has(el.value)) {
            purposesSeen.add(el.value);
            purposes.push(el.value);
          }
        });
        if (purposes.length === 0 || purposes.length > 4) {
          setFieldError('purpose', 'seminarValidationPurposeRequired');
          valid = false;
        }

        if (!consentInput.checked) {
          setFieldError('consent', 'seminarValidationConsentRequired');
          valid = false;
        }

        if (!valid) return null;

        return {
          seminar_id: seminar.id,
          name: name,
          phone: phone,
          applicant_type: applicantType,
          purposes: purposes,
          privacy_agreed: true,
          privacy_policy_version: SEMINAR_PRIVACY_POLICY_VERSION
        };
      }

      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (submitBtn.dataset.busy === 'true') return;

        var payload = validate();
        if (!payload) return;

        submitBtn.dataset.busy = 'true';
        submitBtn.disabled = true;
        setStatus('seminarSubmitting', false);

        try {
          var res = await window.SeminarRepo.submitApplication(payload);

          if (res.error) {
            // Supabase 오류 객체를 그대로 출력하지 않는다 — 고정 문구만 남긴다.
            console.error('[Seminar] 신청 저장에 실패했습니다.');
            setStatus('seminarSubmitError', true);
            return;
          }

          setStatus('seminarSubmitSuccess', false);
          // 신청 성공 후 개인정보가 담긴 입력값을 화면에서 지운다.
          form.reset();
          clearErrors();
        } catch (err) {
          console.error('[Seminar] 신청 저장 중 예외가 발생했습니다.');
          setStatus('seminarSubmitError', true);
        } finally {
          // 성공/실패/예외 여부와 관계없이 항상 이 폼의 잠금만 해제한다.
          submitBtn.dataset.busy = 'false';
          submitBtn.disabled = false;
        }
      });
    }
  }

  function renderProductsList(container) {
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
  }

  // 통합 검색 결과 페이지. 검색어는 js/search-engine.js가 관리하는 색인을
  // 그대로 쓰고, 여기서는 결과를 화면에 그리기만 한다. 검색어와 상품
  // 데이터는 사용자가 제어할 수 있는 값이라 innerHTML 문자열 조합이 아니라
  // DOM API(textContent)로만 채워서, 어떤 값이 와도 텍스트로만 표시되게 한다.
  function renderSearchResults(container, queryString) {
    var params = new URLSearchParams(queryString || '');
    var query = (params.get('q') || '').trim();

    container.innerHTML =
      '<section class="page-section search-results-page">' +
      '<div class="section-title"><h2 id="search-results-heading"></h2></div>' +
      '<div id="search-results-body"></div>' +
      '</section>';

    var headingEl = container.querySelector('#search-results-heading');
    var bodyEl = container.querySelector('#search-results-body');

    if (!query) {
      headingEl.textContent = window.t('searchNoResultsTitle');
      renderEmptyState(bodyEl, '');
      return;
    }

    var results = window.Search ? window.Search.search(query) : [];

    var headingTemplate = window.t('searchResultHeading');
    headingEl.textContent = headingTemplate
      .replace('{query}', query)
      .replace('{count}', String(results.length))
      .replace('{resultWord}', results.length === 1 ? 'result' : 'results');

    if (results.length === 0) {
      renderEmptyState(bodyEl, query);
      return;
    }

    renderResultList(bodyEl, results);

    function renderResultList(root, list) {
      root.innerHTML = '';
      var grid = document.createElement('div');
      grid.className = 'search-results-grid';

      list.forEach(function (item) {
        var card = document.createElement('article');
        card.className = 'search-result-card';

        var typeEl = document.createElement('p');
        typeEl.className = 'search-result-type';
        typeEl.textContent = item.typeLabel;
        card.appendChild(typeEl);

        var titleEl = document.createElement('h3');
        titleEl.className = 'search-result-title';
        titleEl.textContent = item.title;
        card.appendChild(titleEl);

        if (item.desc) {
          var descEl = document.createElement('p');
          descEl.className = 'search-result-desc';
          descEl.textContent = item.desc;
          card.appendChild(descEl);
        }

        if (item.keywords && item.keywords.length > 0) {
          var symptomEl = document.createElement('p');
          symptomEl.className = 'search-result-symptoms';
          symptomEl.textContent = item.keywords.slice(0, 4).join(', ');
          card.appendChild(symptomEl);
        }

        var btn = document.createElement('a');
        btn.className = 'search-result-btn';
        btn.href = item.route;
        btn.textContent = window.t('searchDetailBtn');
        card.appendChild(btn);

        grid.appendChild(card);
      });

      root.appendChild(grid);
    }

    function renderEmptyState(root, q) {
      root.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.className = 'search-empty-state';

      if (q) {
        var title = document.createElement('p');
        title.className = 'search-empty-title';
        title.textContent = window.t('searchNoResultsTitle');
        wrap.appendChild(title);
      }

      var desc = document.createElement('p');
      desc.className = 'search-empty-desc';
      desc.textContent = window.t('searchNoResultsDesc');
      wrap.appendChild(desc);

      var popularHeading = document.createElement('p');
      popularHeading.className = 'search-panel-heading';
      popularHeading.textContent = window.t('searchPopularHeading');
      wrap.appendChild(popularHeading);

      var list = document.createElement('div');
      list.className = 'search-recent-list';
      ['수면', '스트레스', '두통', '소화', '면역', '무릎'].forEach(function (term) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'search-recent-chip-label search-popular-term';
        chip.textContent = term;
        chip.addEventListener('click', function () {
          window.Search.addRecent(term);
          window.location.hash = '#/search?q=' + encodeURIComponent(term);
        });
        list.appendChild(chip);
      });
      wrap.appendChild(list);

      root.appendChild(wrap);
    }
  }

  // 로그인 + 승인된 교육생만 볼 수 있는 관심 이어포인트 목록. 접근 판정은
  // checkEducationAccess()가 이미 끝낸 뒤 호출되므로, 여기서는 즐겨찾기
  // 데이터 로딩/표시만 담당한다.
  function renderFavoritesList(container, session) {
    var client = window.supabaseClient;
    var myToken = window.__routeToken;

    container.innerHTML =
      '<section class="page-section favorites-page">' +
      '<div class="section-title"><h2 data-i18n="navFavorites">' + window.t('navFavorites') + '</h2></div>' +
      '<div id="favorites-body"></div>' +
      '</section>';

    var bodyEl = container.querySelector('#favorites-body');

    function renderState(className, titleKey, descKey, action) {
      bodyEl.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.className = 'favorites-state ' + className;

      if (titleKey) {
        var title = document.createElement('p');
        title.className = 'favorites-state-title';
        title.textContent = window.t(titleKey);
        wrap.appendChild(title);
      }

      var desc = document.createElement('p');
      desc.className = 'favorites-state-desc';
      desc.textContent = window.t(descKey);
      wrap.appendChild(desc);

      if (action) wrap.appendChild(action);
      bodyEl.appendChild(wrap);
    }

    function renderLoading() {
      bodyEl.innerHTML = '';
      var p = document.createElement('p');
      p.className = 'favorites-loading';
      p.textContent = window.t('favoritesLoadingText');
      bodyEl.appendChild(p);
    }

    function renderError() {
      renderState('favorites-state--error', null, 'favoritesErrorText', null);
    }

    function renderEmpty() {
      var btn = document.createElement('a');
      btn.href = '#/ear-point';
      btn.className = 'favorites-state-btn';
      btn.textContent = window.t('favoritesBrowseBtn');
      renderState('favorites-state--empty', 'favoritesEmptyTitle', 'favoritesEmptyDesc', btn);
    }

    function renderList(items, userId) {
      bodyEl.innerHTML = '<div class="point-grid" id="favorites-grid"></div>';
      var grid = bodyEl.querySelector('#favorites-grid');

      items.forEach(function (p) {
        var name = p.name;
        var desc = p.desc;

        var card = document.createElement('div');
        card.className = 'point-card';
        card.dataset.pointId = p.id;

        var media = document.createElement('div');
        media.className = 'point-media';

        if (p.imageUrl) {
          var img = document.createElement('img');
          img.src = p.imageUrl;
          img.alt = name;
          media.appendChild(img);
        } else {
          var placeholder = document.createElement('div');
          placeholder.className = 'point-media-placeholder';
          placeholder.setAttribute('aria-hidden', 'true');
          media.appendChild(placeholder);
        }

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'like-btn';
        removeBtn.setAttribute('aria-pressed', 'true');
        removeBtn.setAttribute('aria-label', name + ' ' + window.t('favoritesRemoveAriaLabel'));
        removeBtn.textContent = '♥';
        removeBtn.addEventListener('click', function () {
          if (removeBtn.dataset.busy === 'true') return;
          removeBtn.dataset.busy = 'true';
          removeBtn.disabled = true;

          client.from('user_favorites').delete().eq('user_id', userId).eq('ear_point_id', p.id).then(function (res) {
            if (res.error) {
              removeBtn.dataset.busy = 'false';
              removeBtn.disabled = false;
              return;
            }
            card.remove();
            if (grid.children.length === 0) renderEmpty();
          });
        });
        media.appendChild(removeBtn);

        var nameEl = document.createElement('p');
        nameEl.className = 'point-name';
        nameEl.textContent = name;

        var descEl = document.createElement('p');
        descEl.className = 'point-desc';
        descEl.textContent = desc;

        card.appendChild(media);
        card.appendChild(nameEl);
        card.appendChild(descEl);
        grid.appendChild(card);
      });
    }

    if (!client) {
      renderError();
      return;
    }

    renderLoading();

    Promise.all([
      client.from('user_favorites').select('ear_point_id').eq('user_id', session.user.id),
      window.EarPointsRepo.load()
    ]).then(function (results) {
      if (myToken !== window.__routeToken) return;
      var favRes = results[0];
      var allPoints = results[1];

      if (favRes.error) {
        renderError();
        return;
      }
      var ids = favRes.data.map(function (row) { return row.ear_point_id; });
      if (ids.length === 0) {
        renderEmpty();
        return;
      }
      var items = allPoints.filter(function (p) { return ids.indexOf(p.id) !== -1; });
      renderList(items, session.user.id);
    }).catch(function () {
      if (myToken === window.__routeToken) renderError();
    });
  }

  // 마이페이지: 승인된 교육생의 기본 정보 요약 + 관심 혈자리 바로가기.
  // 세미나 신청 내역 확인은 실제 연동된 데이터가 없어 준비 중 안내만 표시한다.
  function renderMyPage(container, session, profile) {
    var lang = window.currentLanguage;

    function escapeText(str) {
      var div = document.createElement('div');
      div.textContent = str == null || str === '' ? '-' : String(str);
      return div.innerHTML;
    }

    var genderLabelKey = profile.gender === 'female' ? 'profileGenderFemale'
      : profile.gender === 'male' ? 'profileGenderMale'
      : 'profileGenderNone';

    var approvedSinceHtml = '';
    if (profile.approved_at) {
      var approvedDate = new Date(profile.approved_at);
      var formatted = isNaN(approvedDate.getTime())
        ? ''
        : approvedDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR');
      if (formatted) {
        approvedSinceHtml = '<p class="mypage-approved-since">' + window.t('mypageApprovedSince').replace('{date}', formatted) + '</p>';
      }
    }

    container.innerHTML =
      '<section class="page-section mypage-page">' +
      '<div class="section-title"><h2 data-i18n="mypageTitle">' + window.t('mypageTitle') + '</h2></div>' +
      '<div class="mypage-card">' +
      '<dl class="mypage-info-list">' +
      '<div><dt data-i18n="profileNameLabel">' + window.t('profileNameLabel') + '</dt><dd>' + escapeText(profile.name) + '</dd></div>' +
      '<div><dt data-i18n="profilePhoneLabel">' + window.t('profilePhoneLabel') + '</dt><dd>' + escapeText(profile.phone) + '</dd></div>' +
      '<div><dt data-i18n="profileGenderLabel">' + window.t('profileGenderLabel') + '</dt><dd data-i18n="' + genderLabelKey + '">' + window.t(genderLabelKey) + '</dd></div>' +
      '<div><dt data-i18n="profileAgeLabel">' + window.t('profileAgeLabel') + '</dt><dd>' + escapeText(profile.age) + '</dd></div>' +
      '</dl>' +
      approvedSinceHtml +
      '<div class="mypage-actions">' +
      '<button type="button" class="mypage-edit-btn" id="mypage-edit-btn" data-i18n="mypageEditProfileBtn">' + window.t('mypageEditProfileBtn') + '</button>' +
      '<a class="mypage-favorites-link" href="#/favorites" data-i18n="mypageFavoritesLink">' + window.t('mypageFavoritesLink') + '</a>' +
      '</div>' +
      '<p class="mypage-seminar-note" data-i18n="mypageSeminarNote">' + window.t('mypageSeminarNote') + '</p>' +
      '</div>' +
      '</section>';

    var editBtn = container.querySelector('#mypage-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        // 기존 헤더의 "내 프로필" 버튼과 완전히 같은 흐름(모달 열기)을
        // 그대로 재사용해서, 프로필 수정 로직을 두 곳에 따로 두지 않는다.
        var headerProfileBtn = document.getElementById('auth-profile-btn');
        if (headerProfileBtn) headerProfileBtn.click();
      });
    }
  }

  return {
    home: renderHome,

    // 이어밸런스 체크의 질문 응답과 일반적인 결과 안내는 비로그인 사용자도
    // 이용할 수 있어야 하므로 checkEducationAccess()로 감싸지 않는다.
    // (구체적인 이어포인트 이름/혈자리 위치 등 교육생 전용 상세 정보는
    // 이 페이지가 불러오는 외부 사이트 자체의 콘텐츠라, 그 부분의 공개
    // 범위 조정은 이 저장소 밖의 별도 작업이 필요하다 — 아래 보고 참고.)
    earCheck: renderEarCheckEmbed,

    earPoint: function (container, queryString) {
      window.AccessControl.checkEducationAccess(container, function (c) {
        renderEarPointList(c, queryString);
      });
    },

    // "#/ear-point/sleep" 같은 상세페이지. checkEducationAccess()가 로그인
    // 세션 + profiles.education_status === 'approved'를 모두 확인한 뒤에만
    // renderEarPointDetail을 호출하므로, 메뉴를 숨기는 것과 무관하게 주소를
    // 직접 입력해 들어와도 비로그인/pending/suspended는 각각 안내 화면만
    // 보게 된다.
    earPointDetail: function (container, queryString, pointId) {
      window.AccessControl.checkEducationAccess(container, function (c, session) {
        renderEarPointDetail(c, session, pointId);
      });
    },

    // 비로그인 사용자도 조회·신청이 가능해야 하므로 checkEducationAccess로
    // 감싸지 않는다(요구사항 4).
    seminar: renderSeminarPage,

    products: renderProductsList,

    recommendSleep: function (container, queryString) {
      window.AccessControl.checkEducationAccess(container, function (c) {
        renderSleepDetail(c, queryString);
      });
    },

    search: renderSearchResults,

    favorites: function (container) {
      window.AccessControl.checkEducationAccess(container, function (c, session) {
        renderFavoritesList(c, session);
      });
    },

    mypage: function (container) {
      window.AccessControl.checkEducationAccess(container, function (c, session, profile) {
        renderMyPage(c, session, profile);
      });
    }
  };
})();
