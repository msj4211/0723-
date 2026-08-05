// 730스킨 이어테라피 교육생 전용 콘텐츠 접근 제어.
// - 보호된 페이지는 전부 checkEducationAccess()를 통해서만 실제 콘텐츠를 그린다.
// - 실제 권한 판단은 Supabase RLS(서버 쪽)에서 이뤄지고, 여기 로직은 어떤
//   화면을 보여줄지(로딩/로그인 필요/승인 대기/정지/승인됨)만 결정한다.
// - 오류·오프라인 등 상태를 알 수 없는 경우는 항상 "접근 불가"로 처리한다.
(function () {
  var REDIRECT_KEY = '730-post-login-redirect';

  var currentState = 'loggedOut'; // loggedOut | pending | approved | suspended
  var currentProfile = null;
  var currentSession = null;
  var stateListeners = [];
  // header.js 등 구독자는 access-control.js보다 먼저 로드되는 스크립트라,
  // 첫 getSession() 응답(마이크로태스크)이 구독자 등록보다 먼저 끝나버릴 수
  // 있다. 상태가 한 번이라도 확정된 뒤에는, 새로 구독하는 쪽에 마지막 상태를
  // 즉시 한 번 재생(replay)해줘서 구독 시점과 무관하게 항상 최신 상태를
  // 받도록 한다.
  var stateResolvedOnce = false;

  function client() {
    return window.supabaseClient;
  }

  function notifyStateChange() {
    stateResolvedOnce = true;
    stateListeners.forEach(function (cb) {
      try {
        cb(currentState, currentProfile, currentSession);
      } catch (e) {
        // 구독자 쪽 오류가 다른 구독자나 접근 제어 흐름을 막지 않도록 무시한다.
      }
    });
  }

  function fetchOwnProfile(userId) {
    return client().from('profiles').select('*').eq('id', userId).maybeSingle();
  }

  function statusToState(educationStatus) {
    if (educationStatus === 'approved') return 'approved';
    if (educationStatus === 'suspended') return 'suspended';
    return 'pending';
  }

  // 세션이 바뀔 때마다(로그인/로그아웃/토큰 갱신) 헤더 메뉴 등에서 쓰는
  // 전역 상태를 다시 계산한다. 보호된 페이지 자체의 접근 판정은 이 값을
  // 재사용하지 않고 checkEducationAccess()에서 매번 새로 확인한다.
  function refreshGlobalState(session) {
    currentSession = session;

    if (!session) {
      currentProfile = null;
      currentState = 'loggedOut';
      clearProtectedDataCache();
      notifyStateChange();
      return;
    }

    fetchOwnProfile(session.user.id).then(function (res) {
      if (res.error || !res.data) {
        currentProfile = null;
        currentState = 'loggedOut';
        clearProtectedDataCache();
        notifyStateChange();
        return;
      }
      currentProfile = res.data;
      currentState = statusToState(res.data.education_status);
      if (currentState !== 'approved') clearProtectedDataCache();
      notifyStateChange();
    }).catch(function () {
      currentProfile = null;
      currentState = 'loggedOut';
      clearProtectedDataCache();
      notifyStateChange();
    });
  }

  // 계정이 바뀌거나(로그아웃 후 다른 계정 로그인) 승인 상태가 approved가
  // 아니게 되면, 이전 세션에서 캐시해둔 교육생 전용 데이터가 새 사용자
  // 화면에 그대로 남아있으면 안 되므로 즉시 비운다.
  function clearProtectedDataCache() {
    if (window.EarPointsRepo) window.EarPointsRepo.clearCache();
  }

  function init() {
    if (!client()) return;
    client().auth.onAuthStateChange(function (_event, session) {
      refreshGlobalState(session);
    });
    client().auth.getSession().then(function (res) {
      refreshGlobalState(res.data.session);
    });
  }

  // ── 로그인 후 원래 보려던 페이지로 복귀 ──
  function stashRedirect(hash) {
    try {
      sessionStorage.setItem(REDIRECT_KEY, hash);
    } catch (e) {
      // sessionStorage를 못 쓰는 환경이면 그냥 복귀 기능만 생략한다.
    }
  }

  function popRedirect() {
    try {
      var hash = sessionStorage.getItem(REDIRECT_KEY);
      sessionStorage.removeItem(REDIRECT_KEY);
      return hash;
    } catch (e) {
      return null;
    }
  }

  // auth.js가 로그인 성공 직후 호출한다. 실제 승인 상태는 대상 라우트의
  // checkEducationAccess()가 다시 확인해서 알맞은 화면을 그려준다 — 여기서는
  // "승인됨이면 원래 페이지(or 이어포인트)로, 그 외에는 이어포인트 라우트로"
  // 이동만 시켜주면 된다(그 라우트가 pending/suspended 안내를 대신 그려줌).
  function redirectAfterLogin(userId) {
    return fetchOwnProfile(userId).then(function (res) {
      var storedHash = popRedirect();
      var approved = !res.error && res.data && res.data.education_status === 'approved';

      if (approved && storedHash && /^#\//.test(storedHash)) {
        window.location.hash = storedHash;
        return;
      }
      window.location.hash = '#/ear-point';
    }).catch(function () {
      window.location.hash = '#/ear-point';
    });
  }

  // ── 화면 렌더링 ──
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function renderChecking(container) {
    container.innerHTML =
      '<section class="access-state-page">' +
        '<div class="access-state access-state--checking">' +
          '<div class="access-spinner" aria-hidden="true"></div>' +
          '<p class="access-state-title">' + escapeHtml(window.t('accessCheckingText')) + '</p>' +
        '</div>' +
      '</section>';
  }

  function renderMessageState(container, modifierClass, titleKey, bodyKeys, actions) {
    var html = '<section class="access-state-page"><div class="access-state ' + modifierClass + '">';
    html += '<p class="access-state-title">' + escapeHtml(window.t(titleKey)) + '</p>';
    bodyKeys.forEach(function (key) {
      // 사전 문구는 우리가 직접 관리하는 안내 텍스트(줄바꿈 포함)라 innerHTML로 넣는다.
      html += '<p class="access-state-body">' + window.t(key) + '</p>';
    });
    html += '<div class="access-state-actions"></div></div></section>';
    container.innerHTML = html;

    var actionsEl = container.querySelector('.access-state-actions');
    (actions || []).forEach(function (action) {
      var el = document.createElement(action.href ? 'a' : 'button');
      el.className = 'access-state-btn' + (action.secondary ? ' access-state-btn--secondary' : '');
      el.textContent = action.label;
      if (action.href) {
        el.href = action.href;
        if (action.external) {
          el.target = '_blank';
          el.rel = 'noopener noreferrer';
        }
      } else {
        el.type = 'button';
        el.addEventListener('click', action.onClick);
      }
      actionsEl.appendChild(el);
    });
  }

  function renderLoginRequired(container) {
    stashRedirect(window.location.hash || '#/');
    renderMessageState(container, 'access-state--login', 'accessLoginTitle', ['accessLoginDesc'], [
      {
        label: window.t('accessLoginBtn'),
        onClick: function () {
          if (window.Auth) window.Auth.openModal();
        }
      }
    ]);
  }

  function renderPending(container) {
    renderMessageState(container, 'access-state--pending', 'accessPendingTitle', ['accessPendingBody1', 'accessPendingBody2'], [
      { label: window.t('accessGoHomeBtn'), href: '#/' }
    ]);
  }

  function renderSuspended(container) {
    renderMessageState(container, 'access-state--suspended', 'accessSuspendedTitle', ['accessSuspendedBody'], [
      { label: window.t('accessContactLink'), href: 'https://www.instagram.com/730_skin/', external: true },
      { label: window.t('accessGoHomeBtn'), href: '#/', secondary: true }
    ]);
  }

  function renderErrorState(container, titleKey) {
    renderMessageState(container, 'access-state--error', titleKey, [], [
      { label: window.t('accessGoHomeBtn'), href: '#/' }
    ]);
  }

  // 보호된 페이지가 공통으로 호출하는 진입점.
  // renderApproved(container, session, profile)는 승인된 사용자에게만 호출된다.
  function checkEducationAccess(container, renderApproved) {
    if (!client()) {
      renderErrorState(container, 'accessStatusCheckFailed');
      return;
    }

    var myToken = window.__routeToken;
    function isStale() {
      return myToken !== window.__routeToken;
    }

    renderChecking(container);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      renderErrorState(container, 'accessOffline');
      return;
    }

    client().auth.getSession().then(function (res) {
      if (isStale()) return;
      var session = res.data.session;

      if (!session) {
        renderLoginRequired(container);
        return;
      }

      fetchOwnProfile(session.user.id).then(function (profRes) {
        if (isStale()) return;

        if (profRes.error) {
          renderErrorState(container, 'accessStatusCheckFailed');
          return;
        }
        if (!profRes.data) {
          renderErrorState(container, 'accessProfileNotFound');
          return;
        }

        var status = profRes.data.education_status;

        if (status === 'suspended') {
          renderSuspended(container);
          return;
        }
        if (status !== 'approved') {
          renderPending(container);
          return;
        }

        // 승인된 사용자에게만 실제 콘텐츠를 그린다. 이후 로그아웃되거나
        // 세션이 만료되면 즉시 공개 홈으로 이동시킨다.
        var authListener = client().auth.onAuthStateChange(function (_event, newSession) {
          if (isStale()) {
            authListener.data.subscription.unsubscribe();
            return;
          }
          if (!newSession) {
            authListener.data.subscription.unsubscribe();
            window.location.hash = '#/';
          }
        });

        renderApproved(container, session, profRes.data);
      }).catch(function () {
        if (!isStale()) renderErrorState(container, 'accessStatusCheckFailed');
      });
    }).catch(function () {
      if (!isStale()) renderErrorState(container, 'accessSessionExpired');
    });
  }

  window.AccessControl = {
    checkEducationAccess: checkEducationAccess,
    onStateChange: function (cb) {
      stateListeners.push(cb);
      if (stateResolvedOnce) cb(currentState, currentProfile, currentSession);
    },
    getCurrentState: function () { return currentState; },
    getCurrentProfile: function () { return currentProfile; },
    redirectAfterLogin: redirectAfterLogin,
    stashRedirect: stashRedirect
  };

  init();
})();
