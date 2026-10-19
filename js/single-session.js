// 730스킨 이어테라피 "한 계정 = 한 기기" 동시 로그인 차단.
//
// 동작 방식
// - 로그인에 성공하면 그 로그인의 세션 ID(Supabase 토큰 안의 session_id)를
//   public.active_sessions에 "지금 쓰는 기기"로 등록한다.
//   동시에 같은 계정의 다른 기기 세션을 서버에서 끊는다(signOut scope:'others').
// - 각 기기는 페이지를 열 때, 화면으로 돌아올 때, 페이지를 옮길 때, 1분마다
//   등록된 세션 ID와 자기 세션 ID를 비교한다. 다르면 다른 기기에서 새로
//   로그인한 것이므로 이 기기는 로그아웃하고 안내 문구를 띄운다.
// - 실제 데이터 차단은 서버(Supabase RLS의 is_approved_student)가 한다.
//   여기 로직은 화면을 정리하고 안내하는 역할이다.
// - 테이블이 아직 없거나 네트워크 오류처럼 판단이 불가능한 경우에는
//   로그아웃시키지 않는다(잘못 튕기는 일이 없도록). 보호는 서버가 맡는다.
(function () {
  var CHECK_INTERVAL_MS = 60 * 1000;
  var NOTICE_ID = 'single-session-notice';

  var kicking = false;
  var timer = null;

  function client() {
    return window.supabaseClient;
  }

  function t(key, fallback) {
    return window.t ? window.t(key) : fallback;
  }

  // access_token(JWT) 안의 session_id를 꺼낸다. 로그인할 때마다 새로 생기는 값이라
  // 기기를 구분하는 데 그대로 쓸 수 있다.
  function sessionIdOf(session) {
    if (!session || !session.access_token) return null;
    try {
      var part = session.access_token.split('.')[1];
      var json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json).session_id || null;
    } catch (e) {
      return null;
    }
  }

  function fetchActive(userId) {
    return client().from('active_sessions').select('session_id').eq('user_id', userId).maybeSingle();
  }

  function writeActive(userId, sid) {
    return client().from('active_sessions').upsert(
      { user_id: userId, session_id: sid, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  }

  // 로그인 직후 호출: 이 기기를 "지금 쓰는 기기"로 등록하고 다른 기기를 끊는다.
  function claim(session) {
    var sid = sessionIdOf(session);
    if (!client() || !session || !sid) return Promise.resolve();
    return writeActive(session.user.id, sid).then(function () {
      // 다른 기기의 갱신 토큰을 서버에서 폐기한다. 실패해도 위 등록만으로
      // 다른 기기는 다음 확인 때 로그아웃된다.
      return client().auth.signOut({ scope: 'others' }).catch(function () {});
    }).catch(function () {});
  }

  // 현재 기기가 유효한지 확인한다.
  // resolve(true): 계속 사용 가능 / resolve(false): 다른 기기 로그인으로 로그아웃됨
  function ensure(session) {
    if (!client() || !session) return Promise.resolve(true);
    var sid = sessionIdOf(session);
    if (!sid) return Promise.resolve(true);

    return fetchActive(session.user.id).then(function (res) {
      if (res.error) return true; // 테이블 없음·권한·네트워크 문제 → 판단 보류
      if (!res.data) {
        // 기능 도입 전부터 로그인해 있던 기기: 지금 기기를 등록해준다.
        return writeActive(session.user.id, sid).then(function () { return true; }, function () { return true; });
      }
      if (res.data.session_id === sid) return true;
      kick();
      return false;
    }).catch(function () {
      return true;
    });
  }

  function kick() {
    if (kicking) return;
    kicking = true;
    client().auth.signOut({ scope: 'local' }).catch(function () {}).then(function () {
      kicking = false;
      showNotice();
      if (window.location.hash && window.location.hash !== '#/') window.location.hash = '#/';
    });
  }

  function showNotice() {
    var existing = document.getElementById(NOTICE_ID);
    if (existing) existing.remove();

    var box = document.createElement('div');
    box.id = NOTICE_ID;
    box.className = 'single-session-notice';
    box.setAttribute('role', 'alertdialog');
    box.setAttribute('aria-live', 'assertive');
    box.innerHTML =
      '<div class="single-session-card">' +
        '<p class="single-session-title"></p>' +
        '<p class="single-session-body"></p>' +
        '<div class="single-session-actions">' +
          '<button type="button" class="access-state-btn" data-ss="login"></button>' +
          '<button type="button" class="access-state-btn access-state-btn--secondary" data-ss="close"></button>' +
        '</div>' +
      '</div>';
    box.querySelector('.single-session-title').textContent = t('singleSessionTitle', '다른 기기에서 로그인되었습니다');
    box.querySelector('.single-session-body').innerHTML = t('singleSessionBody', '한 계정은 한 기기에서만 사용할 수 있어<br>이 기기에서는 로그아웃되었습니다.');
    box.querySelector('[data-ss="login"]').textContent = t('singleSessionLogin', '이 기기에서 다시 로그인');
    box.querySelector('[data-ss="close"]').textContent = t('singleSessionClose', '닫기');

    box.querySelector('[data-ss="login"]').addEventListener('click', function () {
      box.remove();
      if (window.Auth) window.Auth.openModal();
    });
    box.querySelector('[data-ss="close"]').addEventListener('click', function () {
      box.remove();
    });
    document.body.appendChild(box);
  }

  function checkNow() {
    if (!client() || kicking) return;
    client().auth.getSession().then(function (res) {
      if (res.data && res.data.session) ensure(res.data.session);
    }).catch(function () {});
  }

  function init() {
    if (!client()) return;
    checkNow();
    timer = setInterval(checkNow, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') checkNow();
    });
    window.addEventListener('focus', checkNow);
    window.addEventListener('hashchange', checkNow);
  }

  window.SingleSession = {
    claim: claim,
    ensure: ensure,
    checkNow: checkNow
  };

  init();
})();
