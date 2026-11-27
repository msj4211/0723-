// 방문 기록 · 방문 통계 (2026-11-27)
// 0) 로그인 안 한 방문자까지 포함한 방문 숫자를 Supabase에 센다 (관리자 > 방문 기록 위쪽 숫자)
// 1) 로그인한 회원이 어떤 페이지에 들어왔는지 Supabase에 남긴다 (관리자 > 회원 방문 기록에서 봄)
//    - 주소 뒤 검색어(?q=...)는 남기지 않고 페이지 이름만 남긴다
//    - 같은 페이지는 10분에 한 번만, 관리자 본인은 남기지 않는다 (서버에서 처리)
// 2) 구글 애널리틱스 측정 ID(js/analytics-config.js)가 있으면 방문 통계를 보낸다
//    - 로그인 여부와 상관없이 방문 수 · 많이 본 페이지 · 유입 경로를 숫자로만 본다
//    - 회원 이름이나 이메일은 보내지 않는다
window.Activity = (function () {
  function currentPath() {
    var raw = (window.location.hash || '').replace(/^#\/?/, '');
    var q = raw.indexOf('?');
    return (q === -1 ? raw : raw.slice(0, q)).slice(0, 200);
  }

  var LABELS = [
    ['', '홈'],
    ['ear-point/', '이어포인트 상세'],
    ['ear-point', '이어포인트'],
    ['ear-reading', '이어 리딩 가이드'],
    ['ear-check', '이어 밸런스 체크'],
    ['recommend/sleep', '증상별 추천 · 수면'],
    ['recommend/calm', '증상별 추천 · 마음 안정'],
    ['recommend/digest', '증상별 추천 · 소화'],
    ['recommend/fatigue', '증상별 추천 · 피로'],
    ['recommend/shoulder', '증상별 추천 · 어깨'],
    ['recommend/women', '증상별 추천 · 여성'],
    ['recommend/', '증상별 추천'],
    ['videos', '교육 영상'],
    ['favorites', '관심 혈자리'],
    ['mypage', '마이페이지'],
    ['certified', '공식 인증점'],
    ['shop', '파트너 전용몰'],
    ['product/', '전용몰 상품'],
    ['products', '제품'],
    ['seminar', '세미나'],
    ['apply', '팀 신청'],
    ['search', '검색'],
    ['diary', '다이어리'],
    ['trouble', '트러블'],
    ['consent', '동의서']
  ];
  function label(path) {
    path = path || '';
    for (var i = 0; i < LABELS.length; i++) {
      var k = LABELS[i][0];
      if (k === '' ? path === '' : (k.slice(-1) === '/' ? path.indexOf(k) === 0 : path === k)) {
        var rest = k.slice(-1) === '/' ? path.slice(k.length) : '';
        return LABELS[i][1] + (rest ? ' · ' + decodeURIComponent(rest) : '');
      }
    }
    return path;
  }

  // ---------- 회원 방문 기록 ----------
  var lastLogged = '';
  function logMember() {
    var client = window.supabaseClient;
    if (!client || !client.auth) return;
    var path = currentPath();
    if (path.indexOf('admin') === 0) return; // 관리자 화면은 남기지 않는다
    client.auth.getSession().then(function (res) {
      var session = res && res.data && res.data.session;
      if (!session) return;
      var key = session.user.id + '|' + path;
      if (key === lastLogged) return;
      lastLogged = key;
      client.rpc('log_page_view', { p_path: path }).then(function () {}, function () {});
    }, function () {});
  }

  // ---------- 사이트 전체 방문 숫자 (로그인 안 한 방문자 포함) ----------
  // 방문자는 브라우저마다 한 번 정해지는 무작위 번호로만 구분한다
  function visitorId() {
    try {
      var v = localStorage.getItem('730-visitor');
      if (!v || !/^[A-Za-z0-9-]{8,64}$/.test(v)) {
        v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
          : 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
        localStorage.setItem('730-visitor', v);
      }
      return v;
    } catch (e) { return null; }
  }
  var lastVisit = '';
  function logVisit() {
    var client = window.supabaseClient;
    if (!client) return;
    var path = currentPath();
    if (path.indexOf('admin') === 0 || path === lastVisit) return;
    var vid = visitorId();
    if (!vid) return;
    lastVisit = path;
    client.rpc('log_site_visit', { p_visitor: vid, p_path: path }).then(function () {}, function () {});
  }

  // ---------- 구글 애널리틱스 ----------
  var gaReady = false;
  function setupGa() {
    var id = window.GA_MEASUREMENT_ID;
    if (!id || !/^G-[A-Z0-9]+$/.test(id)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // 한 페이지 사이트라 주소가 바뀔 때마다 직접 페이지뷰를 보낸다
    window.gtag('config', id, { send_page_view: false });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    gaReady = true;
  }
  function sendGa() {
    if (!gaReady) return;
    var path = currentPath();
    if (path.indexOf('admin') === 0) return;
    window.gtag('event', 'page_view', {
      page_title: label(path),
      page_location: window.location.origin + '/' + path,
      page_path: '/' + path
    });
  }

  function onRoute() {
    sendGa();
    logVisit();
    logMember();
  }

  setupGa();
  window.addEventListener('hashchange', onRoute);
  // 첫 화면: 로그인 상태가 정해진 뒤 한 번 남긴다
  setTimeout(onRoute, 1500);
  // 로그인한 직후에도 지금 페이지를 남긴다
  try {
    window.supabaseClient.auth.onAuthStateChange(function (event) {
      if (event === 'SIGNED_IN') { lastLogged = ''; setTimeout(logMember, 500); }
    });
  } catch (e) {}

  return { label: label, currentPath: currentPath };
})();
