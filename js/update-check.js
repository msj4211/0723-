// 새 버전 자동 반영 (2026-11-26)
// 사이트(GitHub Pages)는 index.html을 브라우저에 최대 10분 동안 저장해 두기 때문에,
// 새로 배포해도 방문자가 새로고침하기 전까지 예전 화면을 볼 수 있다.
// 이 스크립트는 서버의 최신 index.html을 캐시 없이 가져와, 지금 화면이 불러온
// 파일 버전(?v=…)과 다르면 알아서 최신 버전으로 다시 연다.
// - 처음 열었을 때 바로 확인해서 다르면 곧바로 최신으로 다시 연다.
// - 사이트를 켜 둔 채 지내는 동안에는 10분마다, 그리고 탭으로 돌아올 때 확인하고,
//   새 버전이 있으면 다음에 다른 화면으로 넘어갈 때 다시 연다(입력 중인 내용이 날아가지 않게).
// - 같은 버전으로 두 번 이상 다시 열지 않는다(무한 새로고침 방지).
(function () {
  if (!window.fetch || !window.DOMParser) return;
  var START = Date.now();
  var CHECK_EVERY = 10 * 60 * 1000;
  var pendingSig = null;
  var userTyped = false;

  // 주소에 남은 다시 열기 표시(?r=…)는 지운다.
  try {
    if (/[?&]r=\d+/.test(window.location.search)) {
      var clean = window.location.search.replace(/([?&])r=\d+&?/, '$1').replace(/[?&]$/, '');
      history.replaceState(null, '', window.location.pathname + clean + window.location.hash);
    }
  } catch (e) {}

  function signature(doc) {
    var els = doc.querySelectorAll('script[src*="?v="], link[rel="stylesheet"][href*="?v="]');
    var out = [];
    for (var i = 0; i < els.length; i++) out.push(els[i].getAttribute('src') || els[i].getAttribute('href'));
    return out.sort().join('|');
  }
  var mine = signature(document);

  function alreadyTried(sig) {
    try { return sessionStorage.getItem('730-update-target') === sig; } catch (e) { return false; }
  }

  function reloadFresh(sig) {
    if (alreadyTried(sig)) return;
    try { sessionStorage.setItem('730-update-target', sig); } catch (e) {}
    // 주소에 ?r=시간 을 붙여 열면 브라우저가 저장해 둔 예전 index.html을 쓰지 않는다.
    var search = window.location.search.replace(/([?&])r=\d+&?/, '$1').replace(/[?&]$/, '');
    search += (search ? '&' : '?') + 'r=' + Date.now();
    window.location.replace(window.location.pathname + search + window.location.hash);
  }

  function check(first) {
    fetch('/index.html?_=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (text) {
        if (!text) return;
        var sig = signature(new DOMParser().parseFromString(text, 'text/html'));
        if (!sig || sig === mine || alreadyTried(sig)) return;
        // 막 열었고 아직 아무것도 입력하지 않았으면 바로 최신으로 다시 연다.
        if (first && !userTyped && Date.now() - START < 15000) { reloadFresh(sig); return; }
        pendingSig = sig;
      })
      .catch(function () {});
  }

  document.addEventListener('input', function () { userTyped = true; }, true);

  // 새 버전이 있으면 다음 화면 이동 때 다시 연다.
  window.addEventListener('hashchange', function () {
    if (pendingSig) reloadFresh(pendingSig);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') check(false);
  });
  setInterval(function () { if (document.visibilityState === 'visible') check(false); }, CHECK_EVERY);

  if (document.readyState === 'complete') check(true);
  else window.addEventListener('load', function () { check(true); });
})();
