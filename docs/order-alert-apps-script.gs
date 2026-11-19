/**
 * 730스킨 파트너 전용몰 주문 알림 (구글 Apps Script)
 *
 * 쓰는 법
 * 1) 구글 시트를 새로 만든다 (예: "파트너 전용몰 주문").
 * 2) 메뉴 확장 프로그램 > Apps Script 를 열고, 이 내용을 전부 붙여넣는다.
 * 3) 아래 ALERT_EMAIL 을 알림 받을 메일 주소로 바꾼다.
 * 4) 오른쪽 위 배포 > 새 배포 > 유형: 웹 앱
 *    - 실행 사용자: 나
 *    - 액세스 권한: 모든 사용자
 *    배포를 누르고 권한 허용 → 나오는 "웹 앱 URL"을 복사한다.
 * 5) 사이트 > 마이페이지 > 파트너 전용몰 주문 관리 > 입금 계좌·배송비 탭의
 *    "주문 알림 주소" 칸에 그 URL을 붙여넣고 저장한다.
 * 코드를 고친 뒤에는 배포 > 배포 관리 > 수정(연필) > 버전: 새 버전 으로 다시 배포해야 반영된다.
 */
var ALERT_EMAIL = 'msj7794@gmail.com';

function doPost(e) {
  var data = {};
  try { data = JSON.parse(e.postData.contents || '{}'); } catch (err) {}
  if (data.type !== 'order') return ContentService.createTextOutput('ignored');

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['주문시각', '주문번호', '금액', '상품', '회원 이메일', '받는 분', '연락처', '주소', '입금자명', '요청사항']);
  }
  sheet.appendRow([new Date(), data.order_no, data.total, data.items, data.member_email,
                   data.recipient, data.phone, data.address, data.depositor, data.memo || '']);

  var won = Number(data.total || 0).toLocaleString('ko-KR') + '원';
  MailApp.sendEmail({
    to: ALERT_EMAIL,
    subject: '[파트너 전용몰] 새 주문 ' + data.order_no + ' · ' + won,
    body: '새 주문이 들어왔어요.\n\n' +
          '주문번호: ' + data.order_no + '\n' +
          '입금하실 금액: ' + won + '\n' +
          '입금자명: ' + data.depositor + '\n' +
          '상품: ' + data.items + '\n\n' +
          '받는 분: ' + data.recipient + ' / ' + data.phone + '\n' +
          '주소: ' + data.address + '\n' +
          '요청사항: ' + (data.memo || '-') + '\n' +
          '회원: ' + data.member_email + '\n\n' +
          '입금 확인 후 사이트 마이페이지 > 파트너 전용몰 주문 관리에서 상태를 바꿔 주세요.'
  });
  return ContentService.createTextOutput('ok');
}
