// 교육 자료 보호: 이혈점·이혈 읽기 같은 교육 페이지에서
// 오른쪽 클릭(이미지 저장), 이미지 끌어서 저장, 휴대폰 길게 눌러 저장,
// 글자 드래그 복사, 저장·인쇄 단축키를 막고 화면에 흐린 워터마크를 깐다.
// 스크린샷 자체는 브라우저에서 막을 수 없으므로 워터마크로 출처를 남긴다.
//
// 메인 사이트(index.html)에서는 해시 라우트를 보고, 입력·관리용 페이지
// (관리자·신청서·마이페이지·고객 기록)를 뺀 모든 페이지에서 켠다.
// iframe이나 단독 페이지에서는 <html data-protect="always">로 항상 켠다.
(function () {
  var root = document.documentElement;
  // 메인 사이트 안의 iframe이면 바깥 페이지가 이미 워터마크를 깔고 있으므로
  // 안쪽에서는 워터마크를 다시 깔지 않는다(겹쳐서 진해지는 것 방지).
  var framed = false;
  try { framed = window.parent !== window; } catch (e) { framed = true; }
  if (framed) root.classList.add('cp-framed');
  var ALWAYS = root.getAttribute('data-protect') === 'always';
  // 동의서처럼 '저장·인쇄'가 꼭 필요한 페이지는 <html data-protect-print="allow">로
  // 인쇄만 허용한다(복사·이미지 저장 방지와 화면 워터마크는 그대로).
  var ALLOW_PRINT = root.getAttribute('data-protect-print') === 'allow';
  // 보호를 끄는 라우트(앞부분 일치). 나머지 라우트와 홈은 모두 보호한다.
  var UNPROTECTED_PREFIXES = ['admin', 'apply', 'mypage', 'diary', 'trouble'];
  // 화면 워터마크는 교육 자료 페이지에서만 깐다(2026-11-24). 홈·공식 인증점·상품 같은
  // 공개 페이지는 복사·저장만 막고 워터마크는 깔지 않는다.
  var WATERMARK_PREFIXES = ['ear-point', 'ear-reading', 'recommend/', 'consent'];

  var WM_TEXT = '730스킨이어테라피';
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="170">' +
    '<text x="130" y="95" text-anchor="middle" transform="rotate(-24 130 85)" ' +
    'font-family="Apple SD Gothic Neo, Malgun Gothic, sans-serif" font-size="17" font-weight="700" ' +
    'fill="#000" fill-opacity="0.07">' + WM_TEXT + '</text></svg>';
  var wmUrl = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';

  var css =
    'html.cp-on body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}' +
    'html.cp-on input,html.cp-on textarea,html.cp-on select,html.cp-on [contenteditable="true"]{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}' +
    'html.cp-on img{-webkit-user-drag:none;user-drag:none;-webkit-touch-callout:none}' +
    'html.cp-on.cp-wm:not(.cp-framed) body::after{content:"";position:fixed;top:var(--cp-wm-top,0px);right:0;bottom:0;left:0;z-index:2147483000;pointer-events:none;background-image:' + wmUrl + ';background-repeat:repeat}' +
    (ALLOW_PRINT
      ? '@media print{html.cp-on body::after{display:none}}'
      : '@media print{html.cp-on body>*{display:none!important}html.cp-on body::after{display:none}' +
        'html.cp-on body::before{content:"이 페이지는 인쇄할 수 없습니다. (730스킨이어테라피)";display:block;padding:40px;font-size:16px;color:#333}}');
  var style = document.createElement('style');
  style.setAttribute('data-content-protect', '');
  style.textContent = css;
  (document.head || root).appendChild(style);

  function isOn() {
    return root.classList.contains('cp-on');
  }

  function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    var tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function currentRoute() {
    var raw = window.location.hash.replace(/^#\/?/, '');
    var q = raw.indexOf('?');
    return q === -1 ? raw : raw.slice(0, q);
  }

  function update() {
    var on = ALWAYS;
    if (!on) {
      var r = currentRoute();
      on = true;
      for (var i = 0; i < UNPROTECTED_PREFIXES.length; i++) {
        if (r.indexOf(UNPROTECTED_PREFIXES[i]) === 0) { on = false; break; }
      }
    }
    root.classList.toggle('cp-on', on);
    var wm = ALWAYS;
    if (!wm && on) {
      var rr = currentRoute();
      for (var j = 0; j < WATERMARK_PREFIXES.length; j++) {
        if (rr.indexOf(WATERMARK_PREFIXES[j]) === 0) { wm = true; break; }
      }
    }
    root.classList.toggle('cp-wm', wm);
  }

  document.addEventListener('contextmenu', function (e) {
    if (isOn() && !isEditable(e.target)) e.preventDefault();
  });
  document.addEventListener('dragstart', function (e) {
    if (isOn() && !isEditable(e.target)) e.preventDefault();
  });
  document.addEventListener('copy', function (e) {
    if (isOn() && !isEditable(document.activeElement)) e.preventDefault();
  });
  document.addEventListener('cut', function (e) {
    if (isOn() && !isEditable(document.activeElement)) e.preventDefault();
  });
  document.addEventListener('selectstart', function (e) {
    if (isOn() && !isEditable(e.target)) e.preventDefault();
  });
  document.addEventListener('keydown', function (e) {
    if (!isOn() || !(e.ctrlKey || e.metaKey)) return;
    var k = (e.key || '').toLowerCase();
    if (k === 's' || k === 'u' || (k === 'p' && !ALLOW_PRINT)) e.preventDefault();
  });

  // 상단바(.site-header)에는 워터마크가 겹치지 않도록, 워터마크를 상단바 높이만큼 아래에서 시작한다(2026-11-27).
  function syncHeaderOffset() {
    var header = document.querySelector('.site-header');
    var h = header ? header.offsetHeight : 0;
    root.style.setProperty('--cp-wm-top', h + 'px');
  }

  window.addEventListener('hashchange', update);
  window.addEventListener('resize', syncHeaderOffset);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncHeaderOffset);
  } else {
    syncHeaderOffset();
  }
  window.addEventListener('load', syncHeaderOffset);
  update();
})();
