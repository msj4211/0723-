// 730스킨이어테라피 교육 영상 (2026-11-27)
// - #/videos : 원장님이 골라 둔 승인 회원만 보는 교육 영상
// - #/admin-videos : 관리자 전용 영상 올리기 · 볼 사람 고르기 (마이페이지 관리자 메뉴)
// 영상 파일은 Supabase 비공개 저장소(edu-videos)에 있고, 볼 수 있는 사람만
// 2시간 동안 쓰는 주소(서명 주소)를 받아 재생한다.
window.EduVideos = (function () {
  var BUCKET = 'edu-videos';
  var SIGNED_SECONDS = 2 * 60 * 60;
  var TUS_SRC = 'https://cdn.jsdelivr.net/npm/tus-js-client@4/dist/tus.min.js';

  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtDate(v) {
    if (!v) return '';
    var d = new Date(v);
    if (isNaN(d)) return '';
    return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
  }
  function fmtSize(n) {
    if (!n) return '';
    if (n >= 1024 * 1024 * 1024) return (n / 1024 / 1024 / 1024).toFixed(2) + 'GB';
    return Math.round(n / 1024 / 1024) + 'MB';
  }
  function viewerName(profile, session) {
    var p = profile || {};
    var meta = (session && session.user && session.user.user_metadata) || {};
    return (p.name && String(p.name).trim()) || meta.name || (p.nickname && String(p.nickname).trim()) ||
      ((session && session.user && session.user.email) || '').split('@')[0] || '730';
  }

  // ===================== 재생기 (이름 워터마크) =====================
  function mountPlayer(box, url, name) {
    box.innerHTML =
      '<div class="vid-stage">' +
      '<video class="vid-video" controls playsinline preload="metadata" controlsList="nodownload" disablePictureInPicture></video>' +
      '<span class="vid-wm" aria-hidden="true"></span>' +
      '<button type="button" class="vid-full" aria-label="전체 화면">⛶</button>' +
      '</div>';
    var stage = box.querySelector('.vid-stage');
    var video = box.querySelector('.vid-video');
    var wm = box.querySelector('.vid-wm');
    var now = new Date();
    wm.textContent = name + ' · 730스킨이어테라피 · ' + fmtDate(now);
    video.src = url;
    video.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // 워터마크가 한 자리에 머물지 않도록 가끔 옮긴다 (화면 녹화로 돌려 보기 어렵게)
    var spots = [[8, 8], [55, 12], [12, 70], [50, 78], [30, 42]];
    var i = 0;
    function move() {
      if (!stage.isConnected) { clearInterval(timer); return; }
      var s = spots[i++ % spots.length];
      wm.style.left = s[0] + '%';
      wm.style.top = s[1] + '%';
    }
    move();
    var timer = setInterval(move, 20000);

    // 전체 화면은 영상만이 아니라 워터마크까지 같이 키운다
    function goFull() {
      var fn = stage.requestFullscreen || stage.webkitRequestFullscreen;
      if (fn) fn.call(stage); else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    }
    box.querySelector('.vid-full').addEventListener('click', function () {
      var fe = document.fullscreenElement || document.webkitFullscreenElement;
      if (fe) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else goFull();
    });
    function onFs() {
      var fe = document.fullscreenElement || document.webkitFullscreenElement;
      if (fe === video) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        setTimeout(goFull, 150);
      }
    }
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    return video;
  }

  // ===================== 회원 페이지 =====================
  function renderMember(container, session, profile) {
    var client = window.supabaseClient;
    var name = viewerName(profile, session);
    container.innerHTML =
      '<div class="section-title"><h2>교육 영상</h2></div>' +
      '<p class="vid-lead">온라인 교육 녹화 영상입니다. 영상은 이 화면에서만 볼 수 있고, 내려받거나 다른 분께 공유할 수 없습니다</p>' +
      '<div class="vid-list"><p class="admin-loading">불러오는 중…</p></div>';
    var listEl = container.querySelector('.vid-list');

    client.rpc('list_my_videos').then(function (r) {
      if (!listEl.isConnected) return;
      if (r.error) { listEl.innerHTML = '<p class="admin-empty">영상을 불러오지 못했어요. 잠시 뒤 다시 들어와 주세요</p>'; return; }
      var list = r.data || [];
      if (!list.length) {
        listEl.innerHTML = '<div class="vid-empty"><p>아직 볼 수 있는 교육 영상이 없어요</p><p class="vid-empty-sub">교육에 참여하신 영상은 원장님이 열어 드리면 여기에 나타납니다</p></div>';
        return;
      }
      var groups = [], byCat = {};
      list.forEach(function (v) {
        var c = v.category || '기타 교육';
        if (!byCat[c]) { byCat[c] = []; groups.push(c); }
        byCat[c].push(v);
      });
      function cardHtml(v) {
        return '<article class="vid-card" data-id="' + esc(v.id) + '">' +
          (v.month_label ? '<p class="vid-month">' + esc(v.month_label) + '</p>' : '') +
          '<h3 class="vid-title">' + esc(v.title) + '</h3>' +
          (v.description ? '<p class="vid-desc">' + esc(v.description).replace(/\n/g, '<br>') + '</p>' : '') +
          '<div class="vid-player"><button type="button" class="vid-play-btn" data-play="' + esc(v.id) + '">▶ 영상 보기</button></div>' +
          '</article>';
      }
      listEl.innerHTML = groups.map(function (c) {
        return '<section class="vid-group">' + (groups.length > 1 || byCat[c][0].category ? '<h3 class="vid-group-title">' + esc(c) + '</h3>' : '') +
          byCat[c].map(cardHtml).join('') + '</section>';
      }).join('');

      listEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-play]');
        if (!btn) return;
        var v = list.filter(function (x) { return x.id === btn.getAttribute('data-play'); })[0];
        if (!v) return;
        // 다른 영상은 멈춘다
        listEl.querySelectorAll('video').forEach(function (el) { el.pause(); });
        btn.disabled = true;
        btn.textContent = '불러오는 중…';
        client.storage.from(BUCKET).createSignedUrl(v.storage_path, SIGNED_SECONDS).then(function (s) {
          if (s.error || !s.data) {
            btn.disabled = false;
            btn.textContent = '▶ 영상 보기';
            btn.insertAdjacentHTML('afterend', '<p class="admin-empty">영상을 열지 못했어요. 볼 수 있는 기간이 끝났거나 권한이 바뀌었을 수 있어요</p>');
            return;
          }
          var video = mountPlayer(btn.parentNode, s.data.signedUrl, name);
          video.play().catch(function () {});
        });
      });
    });
  }

  // ===================== 관리자 페이지 =====================
  var tusPromise = null;
  function loadTus() {
    if (window.tus) return Promise.resolve(window.tus);
    if (tusPromise) return tusPromise;
    tusPromise = new Promise(function (resolve, reject) {
      var sc = document.createElement('script');
      sc.src = TUS_SRC;
      sc.onload = function () { window.tus ? resolve(window.tus) : reject(new Error('tus')); };
      sc.onerror = function () { reject(new Error('tus')); };
      document.head.appendChild(sc);
    });
    tusPromise.catch(function () { tusPromise = null; });
    return tusPromise;
  }

  // 큰 파일을 6MB씩 나눠 보내고, 인터넷이 잠깐 끊기면 그 자리부터 다시 보낸다 (TUS)
  function uploadFile(file, objectName, onProgress) {
    var client = window.supabaseClient;
    return loadTus().then(function (tus) {
      return client.auth.getSession().then(function (sres) {
        var session = sres.data && sres.data.session;
        if (!session) throw new Error('다시 로그인해 주세요');
        return new Promise(function (resolve, reject) {
          var up = new tus.Upload(file, {
            endpoint: window.SUPABASE_URL + '/storage/v1/upload/resumable',
            retryDelays: [0, 3000, 5000, 10000, 20000, 30000, 60000],
            headers: { authorization: 'Bearer ' + session.access_token, apikey: window.SUPABASE_KEY, 'x-upsert': 'true' },
            uploadDataDuringCreation: true,
            storeFingerprintForResuming: false,
            metadata: { bucketName: BUCKET, objectName: objectName, contentType: file.type || 'video/mp4', cacheControl: '3600' },
            chunkSize: 6 * 1024 * 1024,
            // 1시간 넘게 걸려도 로그인 표가 바뀐 것을 따라가도록 매번 새로 넣는다
            onBeforeRequest: function (req) {
              return client.auth.getSession().then(function (s) {
                var t = s.data && s.data.session && s.data.session.access_token;
                if (t) req.setHeader('authorization', 'Bearer ' + t);
              });
            },
            onError: function (err) { reject(err); },
            onProgress: function (sent, total) { onProgress(total ? sent / total : 0); },
            onSuccess: function () { resolve(); }
          });
          up.start();
        });
      });
    });
  }

  function uploadErrorText(err) {
    var m = String((err && err.message) || err || '');
    if (/413|Payload too large|maximum allowed size|exceeded/i.test(m)) {
      return '파일이 저장소 한도보다 커요. Supabase 저장소 설정에서 파일 크기 한도를 올려 주세요';
    }
    if (/mime|content type|invalid_mime/i.test(m)) return 'mp4·mov·webm 영상만 올릴 수 있어요';
    return '올리지 못했어요: ' + m.slice(0, 160);
  }

  function renderAdmin(container) {
    var client = window.supabaseClient;
    var videos = [], members = [], picking = null, editing = null, busy = false;
    container.innerHTML =
      '<div class="section-title"><h2>교육 영상 관리</h2></div>' +
      '<div class="admin-card"><p class="admin-loading">불러오는 중…</p></div>';
    var card = container.querySelector('.admin-card');

    function memberLabel(m) {
      return (m.name || m.nickname || '(이름 없음)') + (m.nickname && m.name && m.nickname !== m.name ? ' (' + m.nickname + ')' : '');
    }
    function approved() {
      return members.filter(function (m) { return (m.education_status || 'pending') === 'approved'; });
    }

    function categoryField(value) {
      var seen = {}, opts = [];
      ['팀 교육', '피부관리 교육'].concat(videos.map(function (v) { return v.category; })).forEach(function (c) {
        if (c && !seen[c]) { seen[c] = true; opts.push(c); }
      });
      return '<label class="cert-form-field"><span>교육 종류</span><input name="category" list="vid-cat-list" value="' + esc(value || '') + '" placeholder="예: 피부관리 교육">' +
        '<datalist id="vid-cat-list">' + opts.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist></label>';
    }

    function uploadFormHtml() {
      return '<form class="cert-form vid-upload" novalidate>' +
        '<h3>새 영상 올리기</h3>' +
        '<div class="cert-form-grid">' +
        '<label class="cert-form-field"><span>제목 <em>*</em></span><input name="title" placeholder="예: 1기 1회차 · 이혈의 기초"></label>' +
        '<label class="cert-form-field"><span>교육 달 · 회차</span><input name="month_label" placeholder="예: 2026년 12월"></label>' +
        categoryField('') +
        '<label class="cert-form-field cert-form-field--wide"><span>설명</span><textarea name="description" rows="2" placeholder="영상에서 다루는 내용 (선택)"></textarea></label>' +
        '<label class="cert-form-field cert-form-field--wide"><span>영상 파일 <em>*</em></span><input name="file" type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm"></label>' +
        '</div>' +
        '<div class="vid-progress" hidden><div class="vid-progress-bar"></div><span class="vid-progress-text"></span></div>' +
        '<p class="cert-form-msg" aria-live="polite"></p>' +
        '<p class="vid-hint">올리는 동안 이 화면을 닫지 마세요. 1시간 영상은 720p로 줄이면 훨씬 빨리 올라가요. 올린 뒤 아래에서 볼 사람을 고르고 공개하면 됩니다</p>' +
        '<div class="cert-form-actions"><button type="submit" class="admin-btn admin-btn--approve">올리기</button></div>' +
        '</form>';
    }

    function editHtml(v) {
      return '<form class="cert-form vid-edit" data-edit-form="' + esc(v.id) + '" novalidate>' +
        '<div class="cert-form-grid">' +
        '<label class="cert-form-field"><span>제목 <em>*</em></span><input name="title" value="' + esc(v.title) + '"></label>' +
        '<label class="cert-form-field"><span>교육 달 · 회차</span><input name="month_label" value="' + esc(v.month_label || '') + '"></label>' +
        categoryField(v.category) +
        '<label class="cert-form-field cert-form-field--wide"><span>설명</span><textarea name="description" rows="2">' + esc(v.description || '') + '</textarea></label>' +
        '<label class="cert-form-field"><span>보여주는 순서</span><input name="sort_order" type="number" value="' + (v.sort_order || 0) + '" placeholder="작을수록 앞"></label>' +
        '</div>' +
        '<p class="cert-form-msg" aria-live="polite"></p>' +
        '<div class="cert-form-actions"><button type="submit" class="admin-btn admin-btn--approve">저장</button>' +
        '<button type="button" class="admin-btn" data-cancel-edit>취소</button></div>' +
        '</form>';
    }

    function pickerHtml(v) {
      var chosen = {};
      (v.viewer_ids || []).forEach(function (id) { chosen[id] = true; });
      var list = approved();
      if (!list.length) return '<div class="vid-picker"><p class="admin-empty">승인된 회원이 아직 없어요</p></div>';
      return '<div class="vid-picker" data-picker="' + esc(v.id) + '">' +
        '<div class="vid-picker-tools">' +
        '<input type="search" class="vid-picker-search" placeholder="이름·별명·이메일로 찾기">' +
        '<button type="button" class="admin-btn" data-pick-all>모두 선택</button>' +
        '<button type="button" class="admin-btn" data-pick-none>모두 해제</button>' +
        '</div>' +
        '<ul class="vid-picker-list">' + list.map(function (m) {
          var hay = [m.name, m.nickname, m.email].join(' ').toLowerCase();
          return '<li data-hay="' + esc(hay) + '"><label><input type="checkbox" value="' + esc(m.id) + '"' + (chosen[m.id] ? ' checked' : '') + '> ' +
            '<b>' + esc(memberLabel(m)) + '</b> <small>' + esc(m.email || '') + '</small></label></li>';
        }).join('') + '</ul>' +
        '<p class="cert-form-msg" aria-live="polite"></p>' +
        '<div class="cert-form-actions"><button type="button" class="admin-btn admin-btn--approve" data-pick-save>볼 사람 저장</button>' +
        '<button type="button" class="admin-btn" data-pick-close>닫기</button></div>' +
        '</div>';
    }

    function draw() {
      var html = uploadFormHtml();
      if (!videos.length) {
        html += '<p class="admin-empty">아직 올린 영상이 없어요</p>';
      } else {
        var nameOf = {};
        members.forEach(function (m) { nameOf[m.id] = memberLabel(m); });
        html += '<ul class="admin-list">' + videos.map(function (v) {
          var hasFile = !!v.storage_path;
          var badge = !hasFile ? 'suspended' : (v.is_active ? 'approved' : 'pending');
          var badgeText = !hasFile ? '파일 없음' : (v.is_active ? '공개 중' : '숨김');
          var names = (v.viewer_ids || []).map(function (id) { return nameOf[id] || '알 수 없는 회원'; });
          return '<li class="cert-admin-item vid-admin-item">' +
            '<div class="admin-order-head"><b>' + esc(v.title) + '</b> <span class="admin-status admin-status--' + badge + '">' + badgeText + '</span></div>' +
            '<p class="admin-order-who">' + [v.category, v.month_label, '올린 날 ' + fmtDate(v.created_at), fmtSize(v.file_size)].filter(Boolean).map(esc).join(' · ') + '</p>' +
            '<p class="apply-admin-meta">볼 수 있는 사람 ' + names.length + '명' + (names.length ? ': ' + esc(names.slice(0, 8).join(', ')) + (names.length > 8 ? ' 외 ' + (names.length - 8) + '명' : '') : '') + '</p>' +
            '<div class="admin-order-edit">' +
            '<button type="button" class="admin-btn" data-pick="' + esc(v.id) + '">볼 사람 고르기</button>' +
            (hasFile ? '<button type="button" class="admin-btn' + (v.is_active ? '' : ' admin-btn--approve') + '" data-toggle="' + esc(v.id) + '">' + (v.is_active ? '숨기기' : '공개하기') + '</button>' : '') +
            (hasFile ? '<button type="button" class="admin-btn" data-preview="' + esc(v.id) + '">미리 보기</button>' : '') +
            '<button type="button" class="admin-btn" data-edit="' + esc(v.id) + '">수정</button>' +
            '<button type="button" class="admin-btn admin-btn--reject" data-delete="' + esc(v.id) + '">삭제</button>' +
            '</div>' +
            (editing === v.id ? editHtml(v) : '') +
            (picking === v.id ? pickerHtml(v) : '') +
            '<div class="vid-player vid-admin-preview"></div>' +
            '</li>';
        }).join('') + '</ul>';
      }
      card.innerHTML = html;
    }

    function load() {
      return Promise.all([client.rpc('admin_list_videos'), client.rpc('admin_list_members')]).then(function (rs) {
        if (!card.isConnected) return;
        if (rs[0].error) { card.innerHTML = '<p class="admin-empty">불러오지 못했어요: ' + esc(rs[0].error.message) + '</p>'; return; }
        videos = rs[0].data || [];
        members = (rs[1] && rs[1].data) || [];
        if (!busy) draw();
      });
    }
    function find(id) { return videos.filter(function (v) { return v.id === id; })[0]; }
    function save(v, patch) {
      var x = Object.assign({}, v, patch || {});
      return client.rpc('admin_save_video', {
        p_id: x.id, p_title: x.title, p_description: x.description || '', p_month_label: x.month_label || '',
        p_storage_path: patch && patch.storage_path ? patch.storage_path : null,
        p_file_size: patch && patch.file_size ? patch.file_size : null,
        p_is_active: !!x.is_active, p_sort_order: x.sort_order || 0, p_category: x.category || ''
      });
    }

    card.addEventListener('submit', function (e) {
      var f = e.target;
      if (f.classList.contains('vid-upload')) {
        e.preventDefault();
        var msg = f.querySelector('.cert-form-msg');
        var title = f.elements.title.value.trim();
        var file = f.elements.file.files[0];
        if (!title || !file) { msg.textContent = '제목과 영상 파일을 넣어 주세요'; return; }
        if (!/^video\//.test(file.type || '') && !/\.(mp4|mov|m4v|webm)$/i.test(file.name)) { msg.textContent = 'mp4·mov·webm 영상만 올릴 수 있어요'; return; }
        var btn = f.querySelector('button[type="submit"]');
        var bar = f.querySelector('.vid-progress'), fill = f.querySelector('.vid-progress-bar'), txt = f.querySelector('.vid-progress-text');
        btn.disabled = true; busy = true;
        msg.textContent = '';
        var ext = ((file.name.match(/\.([A-Za-z0-9]+)$/) || [])[1] || 'mp4').toLowerCase();
        var newId = null;
        client.rpc('admin_save_video', {
          p_id: null, p_title: title, p_description: f.elements.description.value.trim(),
          p_month_label: f.elements.month_label.value.trim(), p_storage_path: null, p_file_size: null,
          p_is_active: false, p_sort_order: 0, p_category: f.elements.category.value.trim()
        }).then(function (r) {
          if (r.error) throw new Error(r.error.message);
          newId = r.data;
          bar.hidden = false;
          var objectName = newId + '/' + Date.now() + '.' + ext;
          window.addEventListener('beforeunload', warn);
          return uploadFile(file, objectName, function (p) {
            fill.style.width = (p * 100).toFixed(1) + '%';
            txt.textContent = '올리는 중 ' + Math.floor(p * 100) + '% (' + fmtSize(file.size) + ')';
          }).then(function () {
            return client.rpc('admin_save_video', {
              p_id: newId, p_title: title, p_description: f.elements.description.value.trim(),
              p_month_label: f.elements.month_label.value.trim(), p_storage_path: objectName,
              p_file_size: file.size, p_is_active: false, p_sort_order: 0,
              p_category: f.elements.category.value.trim()
            });
          });
        }).then(function (r2) {
          window.removeEventListener('beforeunload', warn);
          if (r2 && r2.error) throw new Error(r2.error.message);
          busy = false;
          picking = newId;
          return load().then(function () {
            var pk = card.querySelector('[data-picker]');
            var note = card.querySelector('[data-picker] .cert-form-msg');
            if (note) note.textContent = '다 올라갔어요. 볼 사람을 고르고 저장한 뒤 공개하기를 눌러 주세요';
            if (pk) pk.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
        }).catch(function (err) {
          window.removeEventListener('beforeunload', warn);
          busy = false;
          btn.disabled = false;
          bar.hidden = true;
          msg.textContent = uploadErrorText(err);
          // 파일 없이 남은 기록은 지운다
          if (newId) client.rpc('admin_delete_video', { p_id: newId });
        });
        return;
      }
      if (f.hasAttribute('data-edit-form')) {
        e.preventDefault();
        var v = find(f.getAttribute('data-edit-form'));
        var m2 = f.querySelector('.cert-form-msg');
        if (!f.elements.title.value.trim()) { m2.textContent = '제목을 적어 주세요'; return; }
        save(v, {
          title: f.elements.title.value.trim(), month_label: f.elements.month_label.value.trim(),
          description: f.elements.description.value.trim(), sort_order: parseInt(f.elements.sort_order.value, 10) || 0,
          category: f.elements.category.value.trim()
        }).then(function (r) {
          if (r.error) { m2.textContent = r.error.message; return; }
          editing = null; load();
        });
      }
    });
    function warn(e) { e.preventDefault(); e.returnValue = ''; }

    card.addEventListener('input', function (e) {
      if (!e.target.classList.contains('vid-picker-search')) return;
      var q = e.target.value.trim().toLowerCase();
      e.target.closest('.vid-picker').querySelectorAll('li[data-hay]').forEach(function (li) {
        li.hidden = q && li.getAttribute('data-hay').indexOf(q) < 0;
      });
    });

    card.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-pick]'))) {
        picking = picking === t.getAttribute('data-pick') ? null : t.getAttribute('data-pick');
        editing = null; draw(); return;
      }
      if (e.target.closest('[data-pick-close]')) { picking = null; draw(); return; }
      if ((t = e.target.closest('[data-pick-all]')) || e.target.closest('[data-pick-none]')) {
        var on = !!t;
        e.target.closest('.vid-picker').querySelectorAll('li[data-hay]').forEach(function (li) {
          if (!li.hidden) li.querySelector('input').checked = on;
        });
        return;
      }
      if ((t = e.target.closest('[data-pick-save]'))) {
        var pk = t.closest('.vid-picker'), note = pk.querySelector('.cert-form-msg');
        var ids = Array.prototype.map.call(pk.querySelectorAll('input[type="checkbox"]:checked'), function (c) { return c.value; });
        t.disabled = true; note.textContent = '저장 중…';
        client.rpc('admin_set_video_viewers', { p_video_id: pk.getAttribute('data-picker'), p_user_ids: ids }).then(function (r) {
          t.disabled = false;
          if (r.error) { note.textContent = r.error.message; return; }
          picking = null; load();
        });
        return;
      }
      if ((t = e.target.closest('[data-toggle]'))) {
        var v = find(t.getAttribute('data-toggle'));
        if (!v.is_active && !(v.viewer_ids || []).length && !window.confirm('아직 고른 사람이 없어요. 그래도 공개할까요? (관리자만 볼 수 있어요)')) return;
        t.disabled = true;
        save(v, { is_active: !v.is_active }).then(function () { load(); });
        return;
      }
      if ((t = e.target.closest('[data-edit]'))) {
        editing = editing === t.getAttribute('data-edit') ? null : t.getAttribute('data-edit');
        picking = null; draw(); return;
      }
      if (e.target.closest('[data-cancel-edit]')) { editing = null; draw(); return; }
      if ((t = e.target.closest('[data-preview]'))) {
        var pv = find(t.getAttribute('data-preview'));
        var box = t.closest('li').querySelector('.vid-admin-preview');
        client.storage.from(BUCKET).createSignedUrl(pv.storage_path, SIGNED_SECONDS).then(function (s) {
          if (s.error) { box.innerHTML = '<p class="admin-empty">열지 못했어요: ' + esc(s.error.message) + '</p>'; return; }
          mountPlayer(box, s.data.signedUrl, '관리자 미리 보기');
        });
        return;
      }
      if ((t = e.target.closest('[data-delete]'))) {
        var dv = find(t.getAttribute('data-delete'));
        if (!window.confirm('"' + dv.title + '" 영상을 지울까요? 파일도 함께 지워지고 되돌릴 수 없어요')) return;
        t.disabled = true;
        var rm = dv.storage_path ? client.storage.from(BUCKET).remove([dv.storage_path]) : Promise.resolve({});
        rm.then(function (r) {
          if (r && r.error) throw new Error(r.error.message);
          return client.rpc('admin_delete_video', { p_id: dv.id });
        }).then(function (r) {
          if (r && r.error) throw new Error(r.error.message);
          load();
        }).catch(function (err) { t.disabled = false; window.alert('지우지 못했어요: ' + err.message); });
      }
    });

    load();
  }

  return { renderMember: renderMember, renderAdmin: renderAdmin };
})();
