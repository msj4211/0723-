// 730스킨이어테라피 공식 인증점 (2026-11-24)
// - #/certified : 누구나 보는 공식 인증점 목록 + 인증번호 조회
// - #/admin-certified : 관리자 전용 인증점 추가·수정 (마이페이지 관리자 메뉴)
// 데이터는 Supabase 함수(list_certified_shops, verify_certificate,
// admin_list_certified_shops, admin_save_certified_shop)로만 주고받는다.
window.Certified = (function () {
  var BRAND = '730스킨이어테라피';
  var STATUS_LABEL = { active: '인증 유지', paused: '일시 중지', revoked: '인증 취소' };

  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fullName(s) { return BRAND + ' ' + s.branch + ' ' + s.shop_name; }
  function fmtDate(v) {
    if (!v) return '';
    var p = String(v).split('-');
    return p.length === 3 ? p[0] + '.' + p[1] + '.' + p[2] : String(v);
  }
  function todayLocal() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function safeUrl(u) { return /^https:\/\//i.test(u || '') ? u : ''; }

  // 카카오맵 SDK를 한 번만 불러온다. 키가 없거나 불러오지 못하면 실패로 끝난다.
  var kakaoPromise = null;
  function loadKakao() {
    if (kakaoPromise) return kakaoPromise;
    kakaoPromise = new Promise(function (resolve, reject) {
      var key = window.KAKAO_MAP_JS_KEY;
      if (!key) { reject(new Error('no key')); return; }
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) { resolve(window.kakao); return; }
      var sc = document.createElement('script');
      sc.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' + encodeURIComponent(key) + '&autoload=false&libraries=services';
      sc.async = true;
      sc.onload = function () {
        if (!window.kakao || !window.kakao.maps) { reject(new Error('sdk')); return; }
        window.kakao.maps.load(function () { resolve(window.kakao); });
      };
      sc.onerror = function () { reject(new Error('sdk')); };
      document.head.appendChild(sc);
    });
    kakaoPromise.catch(function () { kakaoPromise = null; });
    return kakaoPromise;
  }

  // 주소 → 위치(위도·경도). 못 찾으면 null.
  function geocode(address) {
    return loadKakao().then(function (kakao) {
      return new Promise(function (resolve) {
        var g = new kakao.maps.services.Geocoder();
        g.addressSearch(address, function (res, status) {
          if (status === kakao.maps.services.Status.OK && res && res[0]) {
            resolve({ lat: parseFloat(res[0].y), lng: parseFloat(res[0].x) });
            return;
          }
          // 도로명·지번으로 못 찾으면 장소 이름으로 한 번 더 찾는다.
          var ps = new kakao.maps.services.Places();
          ps.keywordSearch(address, function (r2, st2) {
            if (st2 === kakao.maps.services.Status.OK && r2 && r2[0]) resolve({ lat: parseFloat(r2[0].y), lng: parseFloat(r2[0].x) });
            else resolve(null);
          });
        });
      });
    }, function () { return null; });
  }

  // ===================== 공개 페이지 =====================
  function renderPublic(container) {
    var client = window.supabaseClient;
    var region = 'all', shops = [];
    container.innerHTML =
      '<section class="page-section cert-page">' +
      '<div class="cert-hero">' +
      '<p class="cert-kicker">730 SKIN EAR THERAPY</p>' +
      '<h2 class="cert-title">공식 인증점</h2>' +
      '<p class="cert-lead">730스킨이어테라피 팀으로 합류해 교육을 마치고<br>인증을 받은 샵입니다. 같은 제품, 같은 프로토콜로 관리합니다.</p>' +
      '</div>' +
      '<form class="cert-verify" novalidate>' +
      '<label class="cert-verify-label" for="cert-verify-input">인증번호 조회</label>' +
      '<p class="cert-verify-help">인증 현판이나 디플로마에 적힌 번호를 넣으면 공식 인증인지 바로 확인할 수 있습니다</p>' +
      '<div class="cert-verify-row">' +
      '<input id="cert-verify-input" type="text" inputmode="text" autocomplete="off" placeholder="예: 730ER-2612-001" maxlength="30">' +
      '<button type="submit" class="cert-verify-btn">조회</button>' +
      '</div>' +
      '<div class="cert-verify-result" aria-live="polite"></div>' +
      '</form>' +
      '<div class="cert-map" hidden></div>' +
      '<div class="cert-filters" hidden></div>' +
      '<div class="cert-list"><p class="cert-loading">불러오는 중…</p></div>' +
      '</section>';

    var form = container.querySelector('.cert-verify');
    var input = container.querySelector('#cert-verify-input');
    var result = container.querySelector('.cert-verify-result');
    var listEl = container.querySelector('.cert-list');
    var filtersEl = container.querySelector('.cert-filters');
    var mapEl = container.querySelector('.cert-map');
    var map = null, mapItems = [];

    function drawMap(shown) {
      var pts = shown.filter(function (s) { return typeof s.lat === 'number' && typeof s.lng === 'number'; });
      if (!pts.length) { mapEl.hidden = true; return; }
      loadKakao().then(function (kakao) {
        if (!mapEl.isConnected) return;
        mapEl.hidden = false;
        if (!map) {
          map = new kakao.maps.Map(mapEl, { center: new kakao.maps.LatLng(36.3, 127.8), level: 13 });
          map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
        } else {
          map.relayout();
        }
        mapItems.forEach(function (it) { it.setMap(null); });
        mapItems = [];
        var bounds = new kakao.maps.LatLngBounds();
        pts.forEach(function (s) {
          var pos = new kakao.maps.LatLng(s.lat, s.lng);
          bounds.extend(pos);
          var marker = new kakao.maps.Marker({ position: pos, title: fullName(s) });
          marker.setMap(map);
          var label = document.createElement('button');
          label.type = 'button';
          label.className = 'cert-map-label';
          label.textContent = s.branch + ' ' + s.shop_name;
          label.addEventListener('click', function () { focusCard(s.cert_no); });
          kakao.maps.event.addListener(marker, 'click', function () { focusCard(s.cert_no); });
          var ov = new kakao.maps.CustomOverlay({ position: pos, content: label, yAnchor: 2.6, clickable: true });
          ov.setMap(map);
          mapItems.push(marker, ov);
        });
        if (pts.length === 1) { map.setCenter(bounds.getSouthWest()); map.setLevel(5); }
        else map.setBounds(bounds, 60, 40, 40, 40);
      }, function () { mapEl.hidden = true; });
    }

    function focusCard(certNo) {
      var card = listEl.querySelector('[data-cert="' + certNo + '"]');
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.remove('is-focus');
      void card.offsetWidth;
      card.classList.add('is-focus');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (v.replace(/[^A-Za-z0-9]/g, '').length < 6) {
        result.innerHTML = '<p class="cert-result cert-result--warn">인증번호를 정확히 적어 주세요</p>';
        return;
      }
      result.innerHTML = '<p class="cert-result">확인 중…</p>';
      client.rpc('verify_certificate', { p_cert_no: v }).then(function (r) {
        if (!form.isConnected) return;
        var row = r.data && r.data[0];
        if (r.error) {
          result.innerHTML = '<p class="cert-result cert-result--warn">지금은 조회할 수 없습니다. 잠시 후 다시 시도해 주세요</p>';
        } else if (!row) {
          result.innerHTML = '<p class="cert-result cert-result--bad">등록되지 않은 인증번호입니다. 번호를 다시 확인해 주세요</p>';
        } else if (row.status !== 'active') {
          result.innerHTML = '<div class="cert-result cert-result--bad"><b>현재 유효하지 않은 인증입니다</b>' +
            '<span>' + esc(row.cert_no) + ' · ' + esc(STATUS_LABEL[row.status] || row.status) + '</span></div>';
        } else {
          result.innerHTML = '<div class="cert-result cert-result--ok"><b>공식 인증이 확인되었습니다</b>' +
            '<span class="cert-result-name">' + esc(fullName(row)) + '</span>' +
            '<span>730 이어리더 ' + esc(row.reader_name) + ' · 인증번호 ' + esc(row.cert_no) + ' · 인증일 ' + esc(fmtDate(row.certified_at)) + '</span></div>';
        }
      });
    });

    function draw() {
      var regions = [];
      shops.forEach(function (s) { if (regions.indexOf(s.region) === -1) regions.push(s.region); });
      if (regions.length > 1) {
        filtersEl.hidden = false;
        filtersEl.innerHTML = ['all'].concat(regions).map(function (k) {
          return '<button type="button" class="cert-chip' + (region === k ? ' is-active' : '') + '" data-region="' + esc(k) + '">' +
            (k === 'all' ? '전체' : esc(k)) + '</button>';
        }).join('');
      } else {
        filtersEl.hidden = true;
      }
      var shown = shops.filter(function (s) { return region === 'all' || s.region === region; });
      drawMap(shown);
      if (!shown.length) {
        listEl.innerHTML = '<div class="cert-empty"><p>공식 인증점이 곧 공개됩니다</p>' +
          '<p class="cert-empty-sub">730스킨이어테라피 팀 1기가 교육을 마치면 이곳에 소개됩니다</p></div>';
        return;
      }
      listEl.innerHTML = '<ul class="cert-grid">' + shown.map(function (s) {
        var map = safeUrl(s.map_url);
        return '<li class="cert-card" data-cert="' + esc(s.cert_no) + '">' +
          '<p class="cert-card-badge">공식 인증점</p>' +
          '<p class="cert-card-brand">' + BRAND + ' ' + esc(s.branch) + '</p>' +
          '<h3 class="cert-card-name">' + esc(s.shop_name) + '</h3>' +
          (s.address ? '<p class="cert-card-addr">' + esc(s.address) + '</p>' : '') +
          '<div class="cert-card-links">' +
          (map ? '<a class="cert-link" href="' + esc(map) + '" target="_blank" rel="noopener noreferrer">지도·연락처 보기</a>' : '') +
          (s.instagram ? '<a class="cert-link cert-link--insta" href="https://www.instagram.com/' + encodeURIComponent(s.instagram) + '/" target="_blank" rel="noopener noreferrer">@' + esc(s.instagram) + '</a>' : '') +
          '</div>' +
          '<p class="cert-card-since">인증일 ' + esc(fmtDate(s.certified_at)) + '</p>' +
          '</li>';
      }).join('') + '</ul>';
    }

    filtersEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-region]');
      if (!b) return;
      region = b.getAttribute('data-region');
      draw();
    });

    if (!client) { listEl.innerHTML = '<p class="cert-loading">지금은 불러올 수 없습니다</p>'; return; }
    client.rpc('list_certified_shops').then(function (r) {
      if (!listEl.isConnected) return;
      if (r.error) { listEl.innerHTML = '<p class="cert-loading">지금은 불러올 수 없습니다. 잠시 후 다시 시도해 주세요</p>'; return; }
      shops = r.data || [];
      draw();
    });
  }

  // ===================== 관리자 페이지 =====================
  function renderAdmin(container) {
    var client = window.supabaseClient;
    var list = [], editing = null;
    container.innerHTML =
      '<section class="page-section admin-page">' +
      '<div class="section-title"><h2>인증점 관리</h2></div>' +
      '<div class="admin-card"><p class="admin-loading">불러오는 중…</p></div>' +
      '</section>';
    var card = container.querySelector('.admin-card');

    function field(name, label, value, opts) {
      opts = opts || {};
      return '<label class="cert-form-field' + (opts.wide ? ' cert-form-field--wide' : '') + '"><span>' + label + (opts.req ? ' <em>*</em>' : '') + '</span>' +
        '<input name="' + name + '" type="' + (opts.type || 'text') + '" value="' + esc(value == null ? '' : value) + '"' +
        (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : '') + '></label>';
    }

    function formHtml(s) {
      s = s || {};
      var isNew = !s.id;
      return '<form class="cert-form" novalidate>' +
        '<h3>' + (isNew ? '새 인증점 추가' : '인증점 수정') + '</h3>' +
        '<div class="cert-form-grid">' +
        field('branch', '지점명', s.branch, { req: true, ph: '예: 김포점' }) +
        field('shop_name', '샵 이름', s.shop_name, { req: true, ph: '예: ○○샵' }) +
        field('reader_name', '이어리더 이름', s.reader_name, { req: true, ph: '인증받은 분 이름' }) +
        field('region', '지역 묶음', s.region, { req: true, ph: '예: 경기 (목록 필터에 쓰임)' }) +
        field('address', '주소', s.address, { wide: true, ph: '예: 경기 김포시 ○○로 00' }) +
        field('map_url', '네이버 지도 링크', s.map_url, { wide: true, ph: 'https://naver.me/… (지도 앱 공유 버튼으로 복사)' }) +
        field('instagram', '인스타그램', s.instagram, { ph: '계정 이름 또는 링크' }) +
        field('certified_at', '인증일', s.certified_at || todayLocal(), { type: 'date' }) +
        field('cert_no', '인증번호', s.cert_no, { ph: isNew ? '비워 두면 자동으로 매김' : '' }) +
        field('sort_order', '보여주는 순서', s.sort_order || 0, { type: 'number', ph: '작을수록 앞' }) +
        '<label class="cert-form-field"><span>상태</span><select name="status">' + Object.keys(STATUS_LABEL).map(function (k) {
          return '<option value="' + k + '"' + ((s.status || 'active') === k ? ' selected' : '') + '>' + STATUS_LABEL[k] + '</option>';
        }).join('') + '</select></label>' +
        '<label class="cert-form-check"><input name="is_public" type="checkbox"' + (s.is_public === false ? '' : ' checked') + '> 공식 인증점 화면에 공개</label>' +
        field('admin_memo', '메모 (나만 보임)', s.admin_memo, { wide: true }) +
        '</div>' +
        '<p class="cert-form-msg" aria-live="polite"></p>' +
        '<div class="cert-form-actions">' +
        '<button type="submit" class="admin-btn admin-btn--approve">' + (isNew ? '추가' : '저장') + '</button>' +
        (isNew ? '' : '<button type="button" class="admin-btn cert-form-cancel">취소</button>') +
        '</div></form>';
    }

    function draw() {
      var link = window.location.origin + window.location.pathname + '#/certified';
      var html = '<div class="apply-admin-link"><span>공식 인증점 화면</span><code>' + esc(link) + '</code>' +
        '<a class="admin-btn" href="#/certified">보기</a></div>';
      html += formHtml(editing);
      if (lastNote) html += '<p class="cert-form-msg cert-admin-note">' + esc(lastNote) + '</p>';
      if (!list.length) {
        html += '<p class="admin-empty">아직 등록한 인증점이 없어요. 위에서 추가해 주세요.</p>';
      } else {
        html += '<ul class="admin-list">' + list.map(function (s) {
          var badge = s.status === 'active' ? (s.is_public ? 'approved' : 'pending') : 'suspended';
          var badgeText = s.status === 'active' ? (s.is_public ? '공개 중' : '비공개') : STATUS_LABEL[s.status];
          return '<li class="cert-admin-item">' +
            '<div class="admin-order-head"><b>' + esc(fullName(s)) + '</b> <span class="admin-status admin-status--' + badge + '">' + badgeText + '</span></div>' +
            '<p class="admin-order-who">' + esc(s.cert_no) + ' · 이어리더 ' + esc(s.reader_name) + ' · ' + esc(s.region) + ' · 인증일 ' + esc(fmtDate(s.certified_at)) + '</p>' +
            (s.address ? '<p class="apply-admin-meta">' + esc(s.address) + ' · 지도 위치 ' + (s.lat != null ? '있음' : '<b>없음</b>') + '</p>' : '<p class="apply-admin-meta">주소가 없어 지도에 표시되지 않아요</p>') +
            (s.admin_memo ? '<p class="apply-admin-meta">메모: ' + esc(s.admin_memo) + '</p>' : '') +
            '<div class="admin-order-edit"><button type="button" class="admin-btn" data-edit="' + s.id + '">수정</button>' +
            '<button type="button" class="admin-btn" data-copy="' + esc(s.cert_no) + '">인증번호 복사</button>' +
            (s.address ? '<button type="button" class="admin-btn" data-locate="' + esc(s.cert_no) + '">지도 위치 다시 찾기</button>' : '') +
            '</div>' +
            '</li>';
        }).join('') + '</ul>';
      }
      card.innerHTML = html;
    }

    var lastNote = '';
    function locate(certNo, addr) {
      return geocode(addr).then(function (pos) {
        if (!pos) return false;
        return client.rpc('admin_set_certified_shop_location', { p_cert_no: certNo, p_lat: pos.lat, p_lng: pos.lng })
          .then(function (r) { return !r.error; });
      });
    }

    function load() {
      client.rpc('admin_list_certified_shops').then(function (r) {
        if (!card.isConnected) return;
        if (r.error) { card.innerHTML = '<p class="admin-empty">불러오지 못했어요: ' + esc(r.error.message) + '</p>'; return; }
        list = r.data || [];
        draw();
      });
    }

    card.addEventListener('click', function (e) {
      var ed = e.target.closest('[data-edit]');
      if (ed) {
        editing = list.filter(function (s) { return s.id === ed.getAttribute('data-edit'); })[0] || null;
        draw();
        card.querySelector('.cert-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (e.target.closest('.cert-form-cancel')) { editing = null; draw(); return; }
      var lc = e.target.closest('[data-locate]');
      if (lc) {
        var row = list.filter(function (s) { return s.cert_no === lc.getAttribute('data-locate'); })[0];
        if (!row) return;
        lc.disabled = true; lc.textContent = '찾는 중…';
        locate(row.cert_no, row.address).then(function (ok) {
          lastNote = ok ? '' : '주소로 지도 위치를 찾지 못했어요: ' + row.address + (window.KAKAO_MAP_JS_KEY ? '' : ' (카카오맵 키가 아직 없어요)');
          load();
        });
        return;
      }
      var cp = e.target.closest('[data-copy]');
      if (cp && navigator.clipboard) {
        navigator.clipboard.writeText(cp.getAttribute('data-copy')).then(function () {
          cp.textContent = '복사됨';
          setTimeout(function () { cp.textContent = '인증번호 복사'; }, 1500);
        });
      }
    });

    card.addEventListener('submit', function (e) {
      if (!e.target.classList.contains('cert-form')) return;
      e.preventDefault();
      var f = e.target, msg = f.querySelector('.cert-form-msg');
      function v(n) { return f.elements[n].value.trim(); }
      if (!v('branch') || !v('shop_name') || !v('reader_name') || !v('region')) {
        msg.textContent = '지점명, 샵 이름, 이어리더 이름, 지역 묶음은 꼭 적어 주세요';
        return;
      }
      var btn = f.querySelector('button[type="submit"]');
      btn.disabled = true;
      msg.textContent = '저장 중…';
      client.rpc('admin_save_certified_shop', {
        p_id: editing ? editing.id : null,
        p_cert_no: v('cert_no'),
        p_branch: v('branch'),
        p_shop_name: v('shop_name'),
        p_reader_name: v('reader_name'),
        p_region: v('region'),
        p_address: v('address'),
        p_map_url: v('map_url'),
        p_instagram: v('instagram'),
        p_certified_at: v('certified_at') || null,
        p_status: f.elements.status.value,
        p_is_public: f.elements.is_public.checked,
        p_sort_order: parseInt(v('sort_order'), 10) || 0,
        p_admin_memo: v('admin_memo')
      }).then(function (r) {
        btn.disabled = false;
        if (r.error) { msg.textContent = r.error.message; return; }
        var certNo = r.data, addr = v('address');
        editing = null;
        if (!addr) {
          client.rpc('admin_set_certified_shop_location', { p_cert_no: certNo, p_lat: null, p_lng: null }).then(function () { load(); });
          return;
        }
        msg.textContent = '저장했어요. 지도 위치 찾는 중…';
        locate(certNo, addr).then(function (ok) {
          lastNote = ok ? '' : '저장했지만 주소로 지도 위치를 찾지 못했어요. 주소를 도로명 주소로 고쳐 다시 저장해 주세요' + (window.KAKAO_MAP_JS_KEY ? '' : ' (카카오맵 키가 아직 없어요)');
          load();
        });
      });
    });

    load();
  }

  return { renderPublic: renderPublic, renderAdmin: renderAdmin };
})();
