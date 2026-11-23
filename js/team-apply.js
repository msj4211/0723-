// 730스킨이어테라피 팀(가맹) 신청서 (2026-11-20)
// - #/apply : 로그인 없이 누구나 신청 (메뉴에는 없고, 링크로만 안내)
// - #/admin-apply : 관리자 전용 신청 목록 (마이페이지 관리자 메뉴)
// 신청 저장·조회는 Supabase 함수(submit_team_application, admin_list_team_applications,
// admin_update_team_application)로만 한다. 금액은 공개 페이지에 쓰지 않는다(개별 안내).
window.TeamApply = (function () {
  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var ROLE_LABEL = { owner: '원장', therapist: '관리사', beginner: '입문(처음 시작)' };
  var EXP_LABEL = { seminar: '730 세미나 참석', advanced: '730 심화 교육 이수', reflexer: '이어리플렉서 보유' };
  var STATUS_LABEL = { new: '새 신청', contacted: '연락함', accepted: '합류', declined: '보류' };

  // 기기마다 무작위 번호를 하나 만들어 두고, 신청서를 열 때 방문 기록을 남긴다.
  // (이름·연락처는 남기지 않음. 같은 기기 30분 안 재방문·관리자 방문은 서버에서 안 셈)
  function visitorId() {
    var key = '730-visitor-id', id = null;
    try { id = localStorage.getItem(key); } catch (e) {}
    if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
      try { localStorage.setItem(key, id); } catch (e) {}
    }
    return id;
  }
  function logView(page) {
    var client = window.supabaseClient;
    if (!client) return;
    try {
      client.rpc('log_page_view', { p_page: page, p_visitor: visitorId() }).then(function () {}, function () {});
    } catch (e) {}
  }

  // ===================== 신청 페이지 =====================
  function renderApply(container) {
    logView('apply');
    container.innerHTML =
      '<section class="page-section apply-page">' +
      '<div class="apply-hero">' +
      '<p class="apply-kicker">730 SKIN EAR THERAPY TEAM</p>' +
      '<h2 class="apply-title">730스킨이어테라피 팀<br>신청서</h2>' +
      '<p class="apply-lead">아래 안내를 먼저 읽어 보시고<br>마음이 맞으면 신청해 주세요</p>' +
      '</div>' +

      // ----- 팀 안내 (A4 요약본 금액 공개판과 같은 내용, 2026-11-21) -----
      '<div class="apply-card apply-guide">' +
      '<p class="apply-guide-kicker">730스킨이어테라피 팀 · 1기 모집</p>' +
      '<h3 class="apply-guide-title">귀를 읽고, 마음을 듣는 사람들</h3>' +
      '<p class="apply-guide-lead">같은 제품, 같은 프로토콜, 같은 리딩, 같은 말과 태도로 함께 키워갈 분을 모십니다</p>' +

      '<div class="apply-guide-two">' +
      '<div class="apply-box">' +
      '<h4>이런 분과 함께합니다</h4>' +
      '<ul class="apply-dots">' +
      '<li>원장님, 관리사, 이어테라피가 처음인 분 모두</li>' +
      '<li>“돈이 되나?”보다 몸과 마음이 편안해지는 변화를 믿는 분</li>' +
      '<li>아직 생소한 관리라 소신 있게 기다려줄 수 있는 분</li>' +
      '</ul>' +
      '<p class="apply-box-strong">실력은 가르치면 됩니다<br>태도가 먼저입니다</p>' +
      '</div>' +
      '<div class="apply-box apply-box--dark">' +
      '<h4>730의 약속</h4>' +
      '<ul class="apply-dots">' +
      '<li>진단하지 않습니다: 본 것을 말하고 질문합니다</li>' +
      '<li>확신하지 않습니다: “낫는다”고 말하지 않습니다</li>' +
      '<li>과장하지 않습니다: 불안으로 권하지 않습니다</li>' +
      '</ul>' +
      '<p class="apply-box-strong">몸도 마음도 편안해지는, 마음을 읽는 관리실</p>' +
      '</div>' +
      '</div>' +

      '<h4 class="apply-guide-h">교육: 더 많은 이론이 아니라, 더 많은 실제 귀</h4>' +
      '<div class="apply-guide-three">' +
      '<div class="apply-mini"><p class="apply-mini-tag">월 1회</p><p class="apply-mini-name">오프라인 실습 모임</p><p>2인 1조 실습, 문원장 조별 코칭</p></div>' +
      '<div class="apply-mini"><p class="apply-mini-tag">월 1회</p><p class="apply-mini-name">줌 교육</p><p>귀 사진 리딩·이론·상담 연습</p></div>' +
      '<div class="apply-mini"><p class="apply-mini-tag">상시</p><p class="apply-mini-name">단체방 피드백</p><p>귀 사진과 케이스 바로 질문</p></div>' +
      '</div>' +
      '<p class="apply-guide-sub"><b>1년 커리큘럼</b> 매달 생리학 테마 + 재밌는 혈자리 · 합류한 달의 테마부터 시작해 12개월이면 한 바퀴를 모두 배웁니다</p>' +
      '<ul class="apply-months"><li><b>1월</b> 내분비계</li><li><b>2월</b> 소화계</li><li><b>3월</b> 생식계</li><li><b>4월</b> 호흡계</li><li><b>5월</b> 감각계</li><li><b>6월</b> 근골격계</li><li><b>7월</b> 림프계</li><li><b>8월</b> 심혈관계</li><li><b>9월</b> 면역계</li><li><b>10월</b> 외피계</li><li><b>11월</b> 신경계</li><li><b>12월</b> 비뇨계</li></ul>' +

      '<h4 class="apply-guide-h">혜택</h4>' +
      '<dl class="apply-benefits">' +
      '<dt>교육</dt><dd>심화 교육, 월간 오프라인 실습, 월간 줌, 매달 생리학 교육자료, 복습 영상</dd>' +
      '<dt>도구</dt><dd>웹사이트 이용(40종 이혈도, 이어 리딩 가이드(전문가용), 자가 컨디션 체크, PMS·트러블 다이어리, 상담 차트, 동의서 등)</dd>' +
      '<dt>소속</dt><dd>730 이어리더 디플로마, 공식 인증점 현판·인증번호, 팀 단체방, 본사 SNS 소개</dd>' +
      '<dt>제품·홍보</dt><dd>초도 물품, 신제품 우선 제공, 매달 재밌는 혈자리 A6 카드, 홍보 이미지 2장</dd>' +
      '</dl>' +

      '<h4 class="apply-guide-h">비용</h4>' +
      '<div class="apply-guide-two">' +
      '<div class="apply-price"><p class="apply-mini-tag">패키지</p><p class="apply-price-num">180만 원</p><p class="apply-price-sub">1기 특가 · 2기부터 220만 원</p></div>' +
      '<div class="apply-price"><p class="apply-mini-tag">월 회비</p><p class="apply-price-num">무료</p><p class="apply-price-sub">교육과 팀 활동 포함 · 의무 발주 없음</p></div>' +
      '</div>' +
      '<p class="apply-guide-sub"><b>패키지 포함</b> 심화 교육(온라인 3시간) · 디플로마 · 인증 현판 · 웹사이트 이용 · 이어리플렉서 1대 · 테라피볼 10박스 · 허브볼 10개(바디 5개, 페이스 5개) · 730 괄사 · 소독 키트</p>' +
      '<div class="apply-deduct"><b>이미 함께한 분은 낸 만큼 빼드립니다</b><br>기존 심화 교육 50만 원 · 이어리플렉서 실제로 낸 기기값(정가 40만 원, 기기 재지급 없음)</div>' +

      '<div class="apply-steps"><p class="apply-mini-tag">1기 모집 · 10명 한정</p><p class="apply-steps-flow">신청서 → 결제 → 심화 교육 → 팀 합류</p><p class="apply-steps-note">모든 금액 VAT 별도 · 문의 인스타그램 @730_skin DM</p></div>' +
      '</div>' +

      '<form class="apply-card apply-form" novalidate>' +
      '<input type="text" name="website" class="apply-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +

      '<h3>기본 정보</h3>' +
      field('이름', true, '<input name="name" type="text" maxlength="30" autocomplete="name" required>') +
      field('연락처', true, '<input name="phone" type="tel" inputmode="numeric" maxlength="15" placeholder="010-0000-0000" autocomplete="tel" required>') +
      field('구분', true,
        '<div class="apply-choices">' +
        ['owner', 'therapist', 'beginner'].map(function (r) {
          return '<label class="apply-choice"><input type="radio" name="role" value="' + r + '"><span>' + ROLE_LABEL[r] + '</span></label>';
        }).join('') + '</div>') +
      field('샵 상호명', false, '<input name="shop_name" type="text" maxlength="60" placeholder="샵이 없으면 비워 두셔도 돼요">') +
      field('활동 지역', true, '<input name="region" type="text" maxlength="50" placeholder="예: 서울 강남구, 대구 수성구" required>') +
      field('인스타그램', false, '<input name="instagram" type="text" maxlength="60" placeholder="@아이디">') +

      '<h3>이어테라피 경험</h3>' +
      '<p class="apply-help">해당하는 것을 모두 골라 주세요 없으면 넘어가도 괜찮아요</p>' +
      '<div class="apply-choices apply-choices--col">' +
      ['seminar', 'advanced', 'reflexer'].map(function (k) {
        return '<label class="apply-choice"><input type="checkbox" name="experience" value="' + k + '"><span>' + EXP_LABEL[k] + '</span></label>';
      }).join('') + '</div>' +

      '<h3>이야기</h3>' +
      field('팀에 함께하고 싶은 이유', true, '<textarea name="motivation" rows="5" maxlength="2000" placeholder="이어테라피를 시작하게 된 계기, 요즘 고민 등 편하게 적어 주세요" required></textarea>') +
      field('팀에서 기대하는 것', false, '<textarea name="expectation" rows="3" maxlength="2000"></textarea>') +
      field('연락받기 편한 시간', false, '<input name="contact_time" type="text" maxlength="60" placeholder="예: 평일 오후 2~5시">') +

      '<h3>팀 약속</h3>' +
      '<div class="apply-promise">' +
      '<p><b>진단하지 않습니다</b> 우리는 의사·한의사가 아닌 에스테틱입니다</p>' +
      '<p><b>확신하지 않습니다</b> 과장하거나 단정하지 않습니다</p>' +
      '<p><b>마음을 읽는 공간이 됩니다</b> 증상만 보지 않고 원인과 마음까지 헤아려 다독입니다</p>' +
      '</div>' +
      '<label class="apply-agree"><input type="checkbox" name="agreed_cost"><span>위 비용(패키지 180만 원, 월 회비 무료, VAT 별도)을 확인했어요 (필수)</span></label>' +
      '<label class="apply-agree"><input type="checkbox" name="agreed_principles"><span>위 팀 약속을 읽었고, 지키겠습니다 (필수)</span></label>' +
      '<label class="apply-agree"><input type="checkbox" name="agreed_privacy"><span>개인정보 수집·이용에 동의합니다 (필수)</span></label>' +
      '<p class="apply-privacy">수집 항목: 이름, 연락처, 샵 상호명, 지역, 인스타그램, 작성 내용 · 이용 목적: 팀 신청 확인과 연락 · 보관 기간: 신청일로부터 1년 (요청하면 바로 삭제)</p>' +

      '<p class="apply-error" role="alert" hidden></p>' +
      '<button type="submit" class="apply-submit">신청하기</button>' +
      '</form>' +
      '</section>';

    function field(label, required, input) {
      return '<label class="apply-field"><span class="apply-label">' + label + (required ? ' <em>*</em>' : '') + '</span>' + input + '</label>';
    }

    var form = container.querySelector('.apply-form');
    var errEl = form.querySelector('.apply-error');
    var btn = form.querySelector('.apply-submit');

    function showError(msg) {
      errEl.textContent = msg;
      errEl.hidden = false;
      errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errEl.hidden = true;
      var f = form.elements;
      if (f.website.value) return; // 자동 입력 봇
      var role = (form.querySelector('input[name="role"]:checked') || {}).value;
      var phoneDigits = f.phone.value.replace(/[^0-9]/g, '');
      if (!f.name.value.trim()) return showError('이름을 적어 주세요');
      if (phoneDigits.length < 9 || phoneDigits.length > 12) return showError('연락처를 정확히 적어 주세요');
      if (!role) return showError('구분(원장/관리사/입문)을 골라 주세요');
      if (!f.region.value.trim()) return showError('활동 지역을 적어 주세요');
      if (!f.motivation.value.trim()) return showError('팀에 함께하고 싶은 이유를 적어 주세요');
      if (!f.agreed_cost.checked) return showError('위쪽 비용 안내를 확인하고 체크해 주세요');
      if (!f.agreed_principles.checked) return showError('팀 약속에 동의해 주세요');
      if (!f.agreed_privacy.checked) return showError('개인정보 수집·이용에 동의해 주세요');

      var client = window.supabaseClient;
      if (!client) return showError('잠시 후 다시 시도해 주세요');
      btn.disabled = true;
      btn.textContent = '보내는 중…';
      var exp = Array.prototype.map.call(form.querySelectorAll('input[name="experience"]:checked'), function (x) { return x.value; });
      client.rpc('submit_team_application', {
        p_name: f.name.value, p_phone: f.phone.value, p_shop_name: f.shop_name.value,
        p_region: f.region.value, p_role: role, p_instagram: f.instagram.value,
        p_experience: exp, p_motivation: f.motivation.value, p_expectation: f.expectation.value,
        p_contact_time: f.contact_time.value, p_agreed_principles: true, p_agreed_privacy: true
      }).then(function (res) {
        if (res.error) {
          btn.disabled = false;
          btn.textContent = '신청하기';
          var m = res.error.message || '';
          showError(/[가-힣]/.test(m) ? m : '신청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');
          return;
        }
        var name = esc(f.name.value.trim());
        container.querySelector('.apply-page').innerHTML =
          '<div class="apply-card apply-done">' +
          '<p class="apply-kicker">730 SKIN EAR THERAPY TEAM</p>' +
          '<h2>신청이 접수됐어요</h2>' +
          '<p>' + name + '님, 마음 내어 주셔서 고맙습니다<br>신청서를 꼼꼼히 읽고 남겨 주신 연락처로 연락드릴게요</p>' +
          '<a class="apply-submit apply-home" href="#/">홈으로</a>' +
          '</div>';
        window.scrollTo(0, 0);
      }, function () {
        btn.disabled = false;
        btn.textContent = '신청하기';
        showError('신청을 보내지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요');
      });
    });
  }

  // ===================== 관리자: 신청 목록 =====================
  function renderAdmin(container) {
    var client = window.supabaseClient;
    var filter = 'new', list = [];
    container.innerHTML =
      '<section class="page-section admin-page">' +
      '<div class="section-title"><h2>팀 신청 관리</h2></div>' +
      '<div class="admin-card"><p class="admin-loading">불러오는 중…</p></div>' +
      '</section>';
    var card = container.querySelector('.admin-card');

    function fmt(v) {
      var d = new Date(v);
      return isNaN(d) ? '' : (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    function phone(p) {
      return p.length === 11 ? p.slice(0, 3) + '-' + p.slice(3, 7) + '-' + p.slice(7) : p;
    }

    function draw() {
      var count = { all: list.length };
      Object.keys(STATUS_LABEL).forEach(function (k) { count[k] = list.filter(function (a) { return a.status === k; }).length; });
      var link = window.location.origin + window.location.pathname + '#/apply';
      var html = statsHtml() + '<div class="apply-admin-link"><span>신청서 링크</span><code>' + esc(link) + '</code>' +
        '<button type="button" class="admin-btn" data-copy="' + esc(link) + '">복사</button></div>';
      html += '<div class="admin-tabs">' + ['new', 'contacted', 'accepted', 'declined', 'all'].map(function (k) {
        return '<button type="button" class="admin-tab' + (filter === k ? ' is-active' : '') + '" data-filter="' + k + '">' +
          (k === 'all' ? '전체' : STATUS_LABEL[k]) + ' <span class="admin-count">' + count[k] + '</span></button>';
      }).join('') + '</div>';
      var shown = list.filter(function (a) { return filter === 'all' || a.status === filter; });
      if (!shown.length) {
        card.innerHTML = html + '<p class="admin-empty">해당하는 신청이 없어요.</p>';
        return;
      }
      html += '<ul class="admin-list">' + shown.map(function (a) {
        var exp = (a.experience || []).map(function (k) { return EXP_LABEL[k] || k; }).join(', ');
        return '<li class="apply-admin-item" data-id="' + a.id + '">' +
          '<div class="admin-order-head"><b>' + esc(a.name) + '</b> <span class="admin-status admin-status--' + (a.status === 'new' ? 'pending' : 'approved') + '">' + STATUS_LABEL[a.status] + '</span>' +
          '<span class="admin-order-date">' + fmt(a.created_at) + '</span></div>' +
          '<p class="admin-order-who"><a href="tel:' + esc(a.phone) + '">' + esc(phone(a.phone)) + '</a> · ' + esc(ROLE_LABEL[a.role] || a.role) + ' · ' + esc(a.region) +
          (a.shop_name ? ' · ' + esc(a.shop_name) : '') + (a.instagram ? ' · ' + esc(a.instagram) : '') + '</p>' +
          '<p class="apply-admin-meta">경험: ' + (exp ? esc(exp) : '없음') + (a.contact_time ? ' · 연락 편한 시간: ' + esc(a.contact_time) : '') + '</p>' +
          '<p class="apply-admin-text"><b>함께하고 싶은 이유</b><br>' + esc(a.motivation) + '</p>' +
          (a.expectation ? '<p class="apply-admin-text"><b>기대하는 것</b><br>' + esc(a.expectation) + '</p>' : '') +
          '<div class="admin-order-edit">' +
          '<select class="aa-status">' + Object.keys(STATUS_LABEL).map(function (k) {
            return '<option value="' + k + '"' + (a.status === k ? ' selected' : '') + '>' + STATUS_LABEL[k] + '</option>';
          }).join('') + '</select>' +
          '<input class="aa-memo" type="text" placeholder="메모 (나만 보임)" value="' + esc(a.admin_memo || '') + '">' +
          '<button type="button" class="admin-btn admin-btn--approve aa-save">저장</button>' +
          '</div></li>';
      }).join('') + '</ul>';
      card.innerHTML = html;
    }

    var stats = null;
    function statsHtml() {
      if (!stats) return '';
      function box(label, today, total, unit) {
        return '<div class="apply-stat"><p class="apply-stat-label">' + label + '</p>' +
          '<p class="apply-stat-num">' + total + '<small>' + unit + '</small></p>' +
          '<p class="apply-stat-today">오늘 ' + today + unit + '</p></div>';
      }
      var rate = stats.total_visitors > 0 ? Math.round(stats.total_applications / stats.total_visitors * 100) : 0;
      return '<div class="apply-stats">' +
        box('신청서를 열어 본 사람', stats.today_visitors, stats.total_visitors, '명') +
        box('실제 신청', stats.today_applications, stats.total_applications, '건') +
        '<div class="apply-stat"><p class="apply-stat-label">신청한 비율</p><p class="apply-stat-num">' + rate + '<small>%</small></p>' +
        '<p class="apply-stat-today">열어 본 횟수 ' + stats.total_views + '회</p></div>' +
        '</div>' +
        '<p class="admin-note apply-stat-note">같은 기기로 30분 안에 다시 열면 한 번으로 세고, 관리자가 연 것은 세지 않는다. 2026년 11월 20일 밤부터 센 숫자다.</p>';
    }

    function load() {
      client.rpc('admin_page_view_stats', { p_page: 'apply' }).then(function (r) {
        if (r.error || !r.data || !r.data[0] || !container.isConnected) return;
        stats = {};
        Object.keys(r.data[0]).forEach(function (k) { stats[k] = Number(r.data[0][k]) || 0; });
        if (list) draw();
      });
      return client.rpc('admin_list_team_applications').then(function (res) {
        if (!container.isConnected) return;
        if (res.error) {
          card.innerHTML = '<p class="admin-empty">신청 목록을 불러오지 못했어요. 관리자 계정으로 로그인했는지, 신청서 SQL을 실행했는지 확인해 주세요.</p>';
          return;
        }
        list = res.data || [];
        draw();
      });
    }

    card.addEventListener('click', function (e) {
      var tab = e.target.closest('.admin-tab');
      if (tab) { filter = tab.dataset.filter; draw(); return; }
      var copy = e.target.closest('[data-copy]');
      if (copy) {
        var text = copy.dataset.copy;
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
          copy.textContent = '복사됨';
        }, function () { window.prompt('아래 링크를 복사해 주세요', text); });
        return;
      }
      var save = e.target.closest('.aa-save');
      if (!save) return;
      var li = save.closest('[data-id]');
      save.disabled = true;
      save.textContent = '저장 중…';
      client.rpc('admin_update_team_application', {
        p_id: li.dataset.id,
        p_status: li.querySelector('.aa-status').value,
        p_admin_memo: li.querySelector('.aa-memo').value
      }).then(function (r) {
        if (r.error) {
          save.disabled = false;
          save.textContent = '다시 시도';
          window.alert('저장하지 못했어요: ' + r.error.message);
          return;
        }
        load();
      });
    });

    load();
  }

  return { renderApply: renderApply, renderAdmin: renderAdmin };
})();
