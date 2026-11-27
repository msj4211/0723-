/* 사이트 전체 자동 영어 번역층
 *
 * translations.js의 키(data-i18n)로 번역되지 않고 화면에 직접 쓰여 있는
 * 한국어 문구(파트너 전용몰, 상품 상세, 관리자 화면, 안내창, 버튼 상태 문구 등)를
 * 영어 모드일 때 아래 사전으로 바꿔 보여준다. 한국어로 돌아가면 원래 글자로 되돌린다.
 *
 * - 정확히 같은 문장 → DICT
 * - 숫자·이름이 섞인 문장 → PATTERNS
 * - 그 밖의 문장은 아는 낱말(FRAGMENTS)로 바꿔 봐서 한국어가 하나도 안 남을 때만 바꾼다.
 *   (상품 이름·회원 이름·이어포인트 내용처럼 사전에 없는 글은 그대로 둔다)
 * - 새로 추가하는 화면 문구는 이 파일 DICT에 '한국어': 'English' 한 줄만 더하면 된다.
 */
(function () {
  'use strict';

  var DICT = {
    // ===== 공통 =====
    '불러오는 중…': 'Loading…',
    '저장': 'Save',
    '저장 중…': 'Saving…',
    '저장됨': 'Saved',
    // ===== 교육 영상 =====
    '교육 영상': 'Training Videos',
    '교육 영상 관리': 'Training Videos (Admin)',
    '온라인 교육 녹화 영상입니다. 영상은 이 화면에서만 볼 수 있고, 내려받거나 다른 분께 공유할 수 없습니다': 'Recordings of our online training. Videos can only be watched on this page and cannot be downloaded or shared',
    '아직 볼 수 있는 교육 영상이 없어요': 'There are no training videos for you yet',
    '교육에 참여하신 영상은 원장님이 열어 드리면 여기에 나타납니다': 'Videos from sessions you joined appear here once the director opens them for you',
    '▶ 영상 보기': '▶ Watch',
    // ===== 공식 인증점 =====
    '공식 인증점': 'Certified Shops',
    '730스킨이어테라피 팀으로 합류해 교육을 마치고': 'These shops joined the 730 Skin Ear Therapy team, completed training',
    '인증을 받은 샵입니다. 같은 제품, 같은 프로토콜로 관리합니다.': 'and were certified. They use the same products and the same protocol.',
    '인증번호 조회': 'Verify a certificate',
    '인증 현판이나 디플로마에 적힌 번호를 넣으면 공식 인증인지 바로 확인할 수 있습니다': 'Enter the number on the certification plaque or diploma to check that it is official',
    '조회': 'Check',
    '확인 중…': 'Checking…',
    '인증번호를 정확히 적어 주세요': 'Please enter the certificate number exactly',
    '등록되지 않은 인증번호입니다. 번호를 다시 확인해 주세요': 'This certificate number is not registered. Please check the number',
    '현재 유효하지 않은 인증입니다': 'This certificate is not currently valid',
    '공식 인증이 확인되었습니다': 'Official certification confirmed',
    '지도·연락처 보기': 'Map & contact',
    '공식 인증점이 곧 공개됩니다': 'Certified shops will be listed soon',
    '730스킨이어테라피 팀 1기가 교육을 마치면 이곳에 소개됩니다': 'They will appear here once the first 730 Skin Ear Therapy team completes training',
    '취소': 'Cancel',
    '수정': 'Edit',
    '삭제': 'Delete',
    '닫기': 'Close',
    '다시 시도': 'Try again',
    '다시 시도해 주세요': 'please try again',
    '처리 중…': 'Processing…',
    '전체': 'All',
    '무료': 'Free',
    '아직 없어요.': 'None yet.',
    '마이페이지': 'My Page',
    '언어 선택': 'Language',
    '주요 메뉴': 'Main menu',
    '비밀번호 표시': 'Show password',
    '메뉴 닫기': 'Close menu',
    '메뉴 열기': 'Open menu',
    '빼기': 'Decrease',
    '더하기': 'Increase',
    '관리자': 'Admin',

    // ===== 홈 =====
    '오늘의 컨디션을 확인해 보세요': 'Check how you feel today',
    '증상에 맞는 귀 혈자리를 찾아보세요': 'Find ear points for your symptoms',
    '귀로 시작하는 가벼운 셀프케어': 'Easy self-care that starts with your ears',
    '나에게 필요한 이어테라피를 만나보세요': 'Discover the ear therapy you need',
    '꽃과 함께 연출된 귀 이미지': 'An ear styled with a flower',
    '자가 컨디션 체크 결과지': 'Self condition check results',
    '730 PMS 다이어리': '730 PMS Diary',
    '730 트러블 다이어리': '730 Trouble Diary',
    '730 이어 리딩 가이드': '730 Ear Reading Guide',

    // ===== 랜딩 =====
    '당신의 몸은': 'Your body is',
    '작은 신호를 보내고 있습니다.': 'sending you small signals.',
    '피곤함, 스트레스, 수면 부족,': 'Fatigue, stress, lack of sleep —',
    '몸은 늘 작은 신호를 보내지만': 'your body always sends small signals,',
    '우리는 쉽게 지나치곤 합니다.': 'but we often overlook them.',
    '이어테라피는 귀를 통해': 'Ear therapy uses the ear',
    '몸의 균형을 이해하고': 'to understand the body’s balance',
    '건강한 일상을 위한 셀프케어를 제안합니다.': 'and suggests self-care for a healthy daily life.',
    '이어테라피를 위한 제품': 'Products for ear therapy',
    '셀프케어와 전문 관리를 위한': 'Explore ear therapy products',
    '이어테라피 제품을 확인해보세요': 'for self-care and professional care',
    '상품 보러가기': 'View products',
    '이어테라피를 더 깊이 배우고 싶다면': 'Want to learn ear therapy in depth?',
    '현재 진행 중인 세미나와': 'See our current seminars',
    '교육 일정을 확인해보세요': 'and training schedule',
    '세미나 일정 보기': 'View seminar schedule',

    // ===== 수면 이어포인트 상세 =====
    '이전 페이지로 이동': 'Go back',
    '신문 교감 내분비 뇌간 위치가 표시된 귀 혈자리 이미지': 'Ear map marking Shenmen, Sympathetic, Endocrine and Brainstem',
    '이미지 파일명을': 'Name the image file',
    '로 맞추면 자동으로 표시돼요': 'and it will appear automatically',
    '귀 혈자리 이미지를 넣어 주세요': 'Please add the ear point image',

    // ===== 검색 =====
    '최근 검색어': 'Recent searches',
    '전체 삭제': 'Clear all',
    '추천 검색어': 'Suggested searches',
    '수면': 'Sleep',
    '스트레스': 'Stress',
    '두통': 'Headache',
    '소화': 'Digestion',
    '면역': 'Immunity',
    '무릎': 'Knee',
    '세미나': 'Seminar',

    // ===== 한 기기 로그인 안내 =====
    '다른 기기에서 로그인되었습니다': 'You were signed in on another device',
    '한 계정은 한 기기에서만 사용할 수 있어': 'Each account can be used on one device at a time,',
    '이 기기에서는 로그아웃되었습니다.': 'so you have been logged out on this device.',
    '이 기기에서 다시 로그인': 'Log in again on this device',

    // ===== 상품 · 상품 상세 =====
    '자세히 보기': 'View details',
    '상품을 찾을 수 없어요.': 'Product not found.',
    '← 상품 목록': '← Products',
    '상품 목록': 'Products',
    '파트너 전용가': 'Partner price',
    '전용몰에서 주문하기': 'Order in Partner Mall',
    '스마트스토어에서 구매하기': 'Buy on Smart Store',
    '승인된 파트너 회원은 파트너 전용몰에서 더 저렴하게 구매할 수 있어요.': 'Approved partner members can buy for less in the Partner Mall.',
    '상품 설명': 'Product details',
    '사진 없음': 'No photo',

    // ===== 파트너 전용몰 =====
    '파트너 전용몰': 'Partner Mall',
    '← 파트너 전용몰': '← Partner Mall',
    '입금 대기': 'Awaiting payment',
    '입금 확인': 'Payment confirmed',
    '발송 완료': 'Shipped',
    '입금 계좌를 준비 중이에요. 730스킨으로 문의해 주세요.': 'Bank details are being prepared. Please contact 730 Skin.',
    '내 주문 내역': 'My orders',
    '주문 취소': 'Cancel order',
    '지금 준비된 상품이 없어요. 곧 채워질 예정이에요.': 'No products yet. They will be added soon.',
    '주문서': 'Order form',
    '위에서 수량을 골라 주세요.': 'Choose quantities above.',
    '배송비': 'Shipping',
    '입금하실 금액': 'Amount to transfer',
    '받는 분': 'Recipient',
    '연락처': 'Phone',
    '주소': 'Address',
    '우편번호, 주소, 상세주소': 'Postal code, address, details',
    '입금자명': 'Depositor name',
    '요청사항 (선택)': 'Requests (optional)',
    '계좌이체로 주문하기': 'Order by bank transfer',
    '주문이 접수됐어요': 'Your order has been received',
    '주문번호': 'Order no.',
    '주문 내역 보기': 'View my orders',
    '이 주문을 취소할까요?': 'Cancel this order?',
    '받는 분, 연락처, 주소, 입금자명을 모두 적어 주세요.': 'Please fill in recipient, phone, address and depositor name.',
    '주문 넣는 중…': 'Placing order…',
    '상품을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.': 'Could not load products. Please try again shortly.',

    // ===== 관리자: 전용몰 =====
    '파트너 전용몰 관리': 'Partner Mall admin',
    '파트너 전용몰 주문 관리': 'Partner Mall orders',
    '주문': 'Orders',
    '상품·가격': 'Products & prices',
    '입금 계좌·배송비': 'Bank & shipping',
    '회원 승인 관리 →': 'Member approval →',
    '해당하는 주문이 없어요.': 'No matching orders.',
    '이름 미입력': 'No name',
    '송장번호': 'Tracking no.',
    '메모 (나만 보임)': 'Memo (only you)',
    '새 상품 추가': 'Add product',
    '+ 새 상품 추가': '+ Add product',
    '상품 수정': 'Edit product',
    '사진 고르기': 'Choose photo',
    '스마트스토어 상품 사진을 저장해서 올리면 돼요.': 'Save the Smart Store product photo and upload it.',
    '상품 이름': 'Product name',
    '예: 한방허브볼 [페이스&바디]': 'e.g. Herbal ball [Face & Body]',
    '한 줄 설명 (선택)': 'One-line summary (optional)',
    '일반 가격 (스마트스토어 판매가, 원)': 'Regular price (Smart Store, KRW)',
    '파트너 전용몰 가격 (원, 비우면 전용몰에 안 나옴)': 'Partner Mall price (KRW, leave empty to hide)',
    '스마트스토어 상품 링크 (선택)': 'Smart Store link (optional)',
    '상세 설명 (선택 · 빈 줄로 문단을 나눠요)': 'Description (optional · blank line = new paragraph)',
    '상세 사진 (선택 · 상세페이지 아래에 순서대로 보여요)': 'Detail photos (optional · shown in order on the page)',
    '상세 사진 추가': 'Add detail photos',
    '보이는 순서 (작을수록 앞)': 'Display order (smaller first)',
    '사이트에 공개': 'Show on site',
    '전용몰 가격을 넣은 상품만 파트너 전용몰에 보여요. 일반 가격과 스마트스토어 링크는 비회원이 보는 상품 페이지에 쓰여요.': 'Only products with a Partner Mall price appear in the Partner Mall. Regular price and Smart Store link are used on the public product page.',
    '등록된 상품이 없어요.': 'No products yet.',
    '(비공개)': '(hidden)',
    '미판매': 'Not sold',
    '전용몰 가격': 'Partner price',
    '가격 저장': 'Save price',
    '사진 올리는 중…': 'Uploading photo…',
    '올렸어요. 저장을 눌러야 반영돼요.': 'Uploaded. Press Save to apply.',
    '사진을 올렸어요. 저장을 눌러야 상품에 반영돼요.': 'Photo uploaded. Press Save to apply it to the product.',
    '은행': 'Bank',
    '예: 국민은행': 'e.g. KB Kookmin Bank',
    '계좌번호': 'Account number',
    '예금주': 'Account holder',
    '배송비 (원)': 'Shipping fee (KRW)',
    '0이면 무료': '0 = free',
    '이 금액 이상이면 배송비 무료 (원, 선택)': 'Free shipping over (KRW, optional)',
    '입금 기한 (일)': 'Payment deadline (days)',
    '주문서 안내 문구 (선택)': 'Order form notice (optional)',
    '예: 평일 오후 2시 전 입금 확인 시 당일 발송': 'e.g. Same-day shipping if paid before 2 pm on weekdays',
    '주문 알림 주소 (구글 Apps Script 웹앱 URL, 선택)': 'Order alert URL (Google Apps Script web app, optional)',
    '불러오지 못했어요. 관리자 계정으로 로그인했는지, 전용몰 SQL을 실행했는지 확인해 주세요.': 'Could not load. Check that you are logged in as admin and the mall database is set up.',
    '상품 이름을 적어 주세요.': 'Please enter a product name.',
    '설정 필요': 'Setup needed',
    '새 주문 없음': 'No new orders',

    // ===== 관리자: 회원 승인 =====
    '회원 승인 관리': 'Member approval',
    '승인 대기': 'Pending',
    '승인됨': 'Approved',
    '정지': 'Suspended',
    '승인': 'Approve',
    '대기로': 'Set pending',
    '승인을 기다리는 회원이 없어요.': 'No members are waiting for approval.',
    '해당하는 회원이 없어요.': 'No matching members.',
    '내 계정': 'My account',
    '이메일 인증 안 함': 'Email not verified',
    '로그인 기록 없음': 'Never logged in',
    '이름이 비어 있는 회원은 예전 방식으로 가입해 이름이 저장되지 않은 경우예요. 누구인지 모르면 승인하지 말고, 회원이 로그인해 내 프로필을 채우면 이름이 보여요.': 'Members without a name signed up the old way. If you don’t know who they are, don’t approve yet — the name appears once they fill in their profile.',
    '회원 목록을 불러오지 못했어요. 관리자 계정으로 로그인했는지 확인해 주세요.': 'Could not load members. Check that you are logged in as admin.',
    '대기 없음': 'None waiting'
  };

  // 숫자·이름이 섞인 문장. $1, $2 … 는 괄호로 잡은 부분.
  var PATTERNS = [
    [/^([\d,]+)원$/, '₩$1'],
    [/^([\d,]+)단계$/, 'Step $1'],
    [/^주문 후 (\d+)일 안에 입금해 주세요\. 입금이 확인되면 발송해 드려요\.$/, 'Please transfer within $1 days of ordering. We ship once payment is confirmed.'],
    [/^(\d+)일 안에 입금해 주세요\. 입금자명이 주문서와 같아야 빠르게 확인돼요\.$/, 'Please transfer within $1 days. Using the same depositor name as the order speeds up confirmation.'],
    [/^₩?([\d,]+)원? 이상 주문하면 배송비 무료$/, 'Free shipping on orders over ₩$1'],
    [/^입금 계좌 · (.*)$/, 'Bank account · $1'],
    [/^입금 계좌: (.*)$/, 'Bank account: $1'],
    [/^(.*) \(예금주 (.*)\)$/, '$1 (holder: $2)'],
    [/^주문을 넣지 못했어요: (.*)$/, 'Could not place the order: $1'],
    [/^저장하지 못했어요: (.*)$/, 'Could not save: $1'],
    [/^바꾸지 못했어요: (.*)$/, 'Could not change: $1'],
    [/^올리지 못했어요: (.*)$/, 'Upload failed: $1'],
    [/^사진을 올리지 못했어요: (.*)$/, 'Photo upload failed: $1'],
    [/^사진 (\d+)장 올리는 중…$/, 'Uploading $1 photos…'],
    [/^입금 대기 (\d+)건$/, 'Awaiting payment: $1'],
    [/^승인 대기 (\d+)명$/, 'Pending approval: $1'],
    [/^(.*) 회원을 정지할까요\? 정지하면 교육생 메뉴를 볼 수 없어요\.$/, 'Suspend $1? Suspended members cannot see member-only menus.'],
    [/^(.+)님$/, '$1']
  ];

  // 문장 안의 낱말 바꾸기 (결과에 한국어가 남지 않을 때만 적용). 긴 것부터.
  var FRAGMENTS = [
    ['이름 미입력', 'No name'], ['입금자명', 'Depositor'], ['배송비', 'Shipping'], ['상품', 'Items'], ['송장', 'Tracking'],
    ['요청:', 'Request:'], ['가입', 'Joined'], ['승인', 'Approved'], ['일반', 'Regular'],
    ['전용몰', 'Partner'], ['원', ''], ['건', ''], ['명', '']
  ].sort(function (a, b) { return b[0].length - a[0].length; });

  var HANGUL = /[ㄱ-ㆎ가-힣]/;
  var ORIG = new WeakMap();      // 텍스트 노드 → 원래 한국어
  var LAST = new WeakMap();      // 텍스트 노드 → 우리가 넣은 영어
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];

  function isEn() { return window.currentLanguage === 'en'; }

  function translateString(s) {
    if (!s || !HANGUL.test(s)) return null;
    var lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    var k = s.trim();
    var out = null;
    if (Object.prototype.hasOwnProperty.call(DICT, k)) out = DICT[k];
    if (out === null) {
      for (var i = 0; i < PATTERNS.length; i++) {
        var m = k.match(PATTERNS[i][0]);
        if (m) {
          out = k.replace(PATTERNS[i][0], PATTERNS[i][1]);
          // 남은 한국어가 있으면 한 번 더 바꿔 본다 (이름·은행명 같은 내용은 그대로 둔다)
          if (out !== k && HANGUL.test(out)) { var again = translateString(out); if (again !== null) out = again.trim(); }
          if (out === k) out = null;
          break;
        }
      }
    }
    if (out === null) {
      var t = k;
      FRAGMENTS.forEach(function (f) { t = t.split(f[0]).join(f[1]); });
      t = t.replace(/(\d)\s+(?=[^\d\s])/g, '$1 ');
      if (!HANGUL.test(t)) out = t;
    }
    return out === null ? null : lead + out + trail;
  }

  function skip(el) {
    return !el || el.closest('script,style,textarea,[contenteditable="true"],[data-no-auto-translate],iframe');
  }

  function doText(node) {
    var el = node.parentElement;
    if (skip(el)) return;
    var cur = node.nodeValue;
    if (isEn()) {
      if (LAST.get(node) === cur) return;               // 이미 우리가 바꾼 상태
      var tr = translateString(cur);
      if (tr === null) return;
      ORIG.set(node, cur);
      LAST.set(node, tr);
      node.nodeValue = tr;
    } else if (LAST.get(node) === cur && ORIG.has(node)) {
      node.nodeValue = ORIG.get(node);
      LAST.delete(node);
    }
  }

  function doAttrs(el) {
    if (skip(el)) return;
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var key = 'autoOrig' + a.replace(/-./g, function (x) { return x[1].toUpperCase(); }).replace(/^./, function (c) { return c.toUpperCase(); });
      var lastKey = key + 'Last';
      var cur = el.getAttribute(a);
      if (isEn()) {
        if (el.dataset[lastKey] === cur) return;
        var tr = translateString(cur);
        if (tr === null) return;
        el.dataset[key] = cur;
        el.dataset[lastKey] = tr;
        el.setAttribute(a, tr);
      } else if (el.dataset[lastKey] === cur && el.dataset[key] !== undefined) {
        el.setAttribute(a, el.dataset[key]);
        delete el.dataset[lastKey];
      }
    });
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) doAttrs(root);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    var n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) doText(n); else doAttrs(n);
    }
  }

  var scheduled = false, pending = [];
  function schedule(nodes) {
    pending.push.apply(pending, nodes);
    if (scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || setTimeout)(function () {
      scheduled = false;
      var list = pending; pending = [];
      list.forEach(function (n) { if (n.isConnected !== false) walk(n); });
    });
  }

  function start() {
    var mo = new MutationObserver(function (records) {
      if (!isEn()) return;
      var nodes = [];
      records.forEach(function (r) {
        if (r.type === 'childList') r.addedNodes.forEach(function (n) { nodes.push(n); });
        else if (r.type === 'characterData') nodes.push(r.target);
        else if (r.type === 'attributes') nodes.push(r.target);
      });
      if (nodes.length) schedule(nodes);
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    walk(document.body);
  }

  // 언어가 바뀌면 전체를 다시 훑는다 (영어로 바꾸기 / 한국어로 되돌리기)
  window.i18nOnLanguageChange = window.i18nOnLanguageChange || [];
  window.i18nOnLanguageChange.push(function () { setTimeout(function () { walk(document.body); }, 0); });

  // 알림창(alert/confirm)의 문구도 영어로
  var nativeAlert = window.alert, nativeConfirm = window.confirm;
  window.alert = function (msg) {
    var tr = isEn() ? translateString(String(msg)) : null;
    return nativeAlert.call(window, tr !== null ? tr : msg);
  };
  window.confirm = function (msg) {
    var tr = isEn() ? translateString(String(msg)) : null;
    return nativeConfirm.call(window, tr !== null ? tr : msg);
  };

  window.AutoTranslate = { translate: translateString, refresh: function () { walk(document.body); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
