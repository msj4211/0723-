var SUPABASE_URL = 'https://sqsnhoflrrcqgehwjqzr.supabase.co';
var SUPABASE_KEY = 'sb_publishable_pLOmXkpE_gkagdMMtRsktw_o2_qfOB2';

// 비밀번호 찾기 메일의 링크로 들어온 경우(주소 끝에 type=recovery)를 미리 기억해 둔다.
// supabase가 주소를 읽고 지우기 전에 확인해야 한다.
window.__authRecovery = /type=recovery/.test(window.location.hash || '') || /type=recovery/.test(window.location.search || '');

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
