// 관리자 > 회원 방문 기록 (2026-11-27)
// 로그인한 회원이 언제 어떤 페이지에 들어왔는지 본다.
window.AdminActivity = (function () {
  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function fmt(v) {
    var d = new Date(v);
    return (d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function dayKey(v) {
    var d = new Date(v);
    return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate());
  }
  function ago(v) {
    var m = Math.floor((Date.now() - new Date(v).getTime()) / 60000);
    if (m < 1) return '방금';
    if (m < 60) return m + '분 전';
    var h = Math.floor(m / 60);
    if (h < 24) return h + '시간 전';
    return Math.floor(h / 24) + '일 전';
  }
  function who(r) { return r.name || r.nickname || (r.email || '').split('@')[0] || '(이름 없음)'; }
  function label(p) { return window.Activity ? window.Activity.label(p) : p; }

  function render(container) {
    var client = window.supabaseClient;
    var days = 7, member = '', rows = [];
    container.innerHTML =
      '<div class="section-title"><h2>방문 기록</h2></div>' +
      '<div class="admin-card act-stats"><p class="admin-loading">불러오는 중…</p></div>' +
      '<h3 class="act-section">회원 방문 기록</h3>' +
      '<div class="admin-card act-card"><p class="admin-loading">불러오는 중…</p></div>';
    var statsBox = container.querySelector('.act-stats');
    var statDays = 7;

    function drawStats(st) {
      var daily = st.daily || [], pages = st.pages || [];
      var max = Math.max.apply(null, [1].concat(daily.map(function (d) { return d.visitors; })));
      statsBox.innerHTML =
        '<div class="act-tools"><label>기간 <select data-stat-days>' + [[7, '최근 7일'], [30, '최근 30일'], [90, '최근 90일']].map(function (o) {
          return '<option value="' + o[0] + '"' + (o[0] === statDays ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></label></div>' +
        '<div class="act-nums">' +
        '<div><span>오늘 방문자</span><b>' + st.today_visitors + '</b></div>' +
        '<div><span>오늘 조회수</span><b>' + st.today_views + '</b></div>' +
        '<div><span>기간 방문자</span><b>' + st.visitors + '</b></div>' +
        '<div><span>기간 조회수</span><b>' + st.views + '</b></div>' +
        '</div>' +
        '<div class="act-chart" role="img" aria-label="날짜별 방문자 수">' + daily.map(function (d) {
          var md = String(d.d).slice(5).replace('-', '.').replace(/^0/, '');
          return '<div class="act-bar" title="' + esc(md) + ' 방문자 ' + d.visitors + '명 · 조회 ' + d.views + '"><em>' + (d.visitors || '') + '</em>' +
            '<i style="height:' + Math.round(d.visitors / max * 100) + '%"></i><span>' + (daily.length <= 14 ? esc(md) : '') + '</span></div>';
        }).join('') + '</div>' +
        '<h4 class="act-h">많이 본 페이지</h4>' +
        (pages.length ? '<ol class="act-pages">' + pages.map(function (p) {
          return '<li><span>' + esc(label(p.path)) + '</span><b>' + p.views + '회</b><small>' + p.visitors + '명</small></li>';
        }).join('') + '</ol>' : '<p class="admin-empty">아직 기록이 없어요</p>') +
        '<p class="act-note">로그인 안 한 방문자도 포함해요. 방문자는 브라우저마다 따로 셉니다(같은 사람이 휴대폰과 컴퓨터로 들어오면 2명). 관리자 본인 방문은 세지 않아요. 기록은 이 기능이 생긴 뒤부터 쌓입니다</p>';
    }
    function loadStats() {
      client.rpc('admin_site_stats', { p_days: statDays }).then(function (r) {
        if (!statsBox.isConnected) return;
        if (r.error || !r.data) { statsBox.innerHTML = '<p class="admin-empty">방문 숫자를 불러오지 못했어요' + (r.error ? ': ' + esc(r.error.message) : '') + '</p>'; return; }
        drawStats(r.data);
      });
    }
    statsBox.addEventListener('change', function (e) {
      if (e.target.matches('[data-stat-days]')) { statDays = parseInt(e.target.value, 10) || 7; loadStats(); }
    });
    loadStats();
    var card = container.querySelector('.act-card');

    function draw() {
      // 회원별 요약
      var byUser = {}, order = [];
      rows.forEach(function (r) {
        if (!byUser[r.user_id]) { byUser[r.user_id] = { r: r, n: 0, pages: {} }; order.push(r.user_id); }
        var u = byUser[r.user_id];
        u.n++;
        u.pages[r.path] = (u.pages[r.path] || 0) + 1;
      });
      var list = member ? rows.filter(function (r) { return r.user_id === member; }) : rows;

      var html =
        '<div class="act-tools">' +
        '<label>기간 <select data-days>' + [[1, '오늘 포함 1일'], [7, '최근 7일'], [30, '최근 30일'], [90, '최근 90일']].map(function (o) {
          return '<option value="' + o[0] + '"' + (o[0] === days ? ' selected' : '') + '>' + o[1] + '</option>';
        }).join('') + '</select></label>' +
        '<label>회원 <select data-member><option value="">전체 회원</option>' + order.map(function (id) {
          var r = byUser[id].r;
          return '<option value="' + esc(id) + '"' + (id === member ? ' selected' : '') + '>' + esc(who(r)) + '</option>';
        }).join('') + '</select></label>' +
        '</div>';

      if (!rows.length) {
        card.innerHTML = html + '<p class="admin-empty">이 기간에 들어온 회원 기록이 없어요</p>' +
          '<p class="act-note">기록은 이 기능이 생긴 뒤부터 쌓입니다. 관리자 본인 방문은 남기지 않아요</p>';
        return;
      }

      if (!member) {
        html += '<h3 class="act-h">회원별 · ' + order.length + '명</h3><ul class="act-users">' + order.map(function (id) {
          var u = byUser[id];
          var top = Object.keys(u.pages).sort(function (a, b) { return u.pages[b] - u.pages[a]; }).slice(0, 3)
            .map(function (p) { return label(p); });
          return '<li><button type="button" class="act-user" data-pick="' + esc(id) + '">' +
            '<b>' + esc(who(u.r)) + '</b><span class="act-last">마지막 ' + esc(ago(u.r.created_at)) + '</span>' +
            '<span class="act-sub">' + u.n + '번 방문 · ' + esc(top.join(', ')) + '</span></button></li>';
        }).join('') + '</ul>';
      }

      html += '<h3 class="act-h">' + (member ? esc(who(byUser[member].r)) + ' 님 방문 기록' : '최근 기록') + '</h3>';
      var lastDay = '';
      html += '<ul class="act-log">' + list.slice(0, 400).map(function (r) {
        var dk = dayKey(r.created_at), head = '';
        if (dk !== lastDay) { head = '<li class="act-day">' + dk + '</li>'; lastDay = dk; }
        return head + '<li><span class="act-time">' + esc(fmt(r.created_at).split(' ')[1]) + '</span>' +
          (member ? '' : '<b>' + esc(who(r)) + '</b>') + '<span>' + esc(label(r.path)) + '</span></li>';
      }).join('') + '</ul>';
      if (list.length > 400) html += '<p class="act-note">최근 400건만 보여 줍니다</p>';
      html += '<p class="act-note">같은 페이지는 10분에 한 번만 남고, 관리자 본인 방문은 남기지 않아요. 기록은 1년 뒤 지워집니다</p>';
      card.innerHTML = html;
    }

    function load() {
      card.innerHTML = '<p class="admin-loading">불러오는 중…</p>';
      client.rpc('admin_list_page_views', { p_user_id: null, p_days: days }).then(function (r) {
        if (!card.isConnected) return;
        if (r.error) { card.innerHTML = '<p class="admin-empty">불러오지 못했어요: ' + esc(r.error.message) + '</p>'; return; }
        rows = r.data || [];
        if (member && !rows.some(function (x) { return x.user_id === member; })) member = '';
        draw();
      });
    }

    card.addEventListener('change', function (e) {
      if (e.target.matches('[data-days]')) { days = parseInt(e.target.value, 10) || 7; load(); }
      if (e.target.matches('[data-member]')) { member = e.target.value; draw(); }
    });
    card.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pick]');
      if (b) { member = b.getAttribute('data-pick'); draw(); card.scrollIntoView({ behavior: 'smooth' }); }
    });
    load();
  }

  return { render: render };
})();
