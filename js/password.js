/* 비밀번호 찾기 · 변경
 * 1) 로그인 창의 '비밀번호를 잊으셨나요?' → 적어 둔 이메일로 재설정 메일 발송
 * 2) 메일 링크로 들어오면(PASSWORD_RECOVERY) '새 비밀번호 설정' 창을 띄운다
 * 3) 마이페이지 '비밀번호 변경' 버튼도 같은 창을 쓴다
 */
(function () {
  'use strict';
  var client = window.supabaseClient;
  if (!client) return;

  var PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  var T = function (k) { return window.t ? window.t(k) : k; };

  // ===== 1) 재설정 메일 보내기 =====
  var forgotBtn = document.getElementById('auth-forgot-link');
  var emailInput = document.getElementById('auth-email');
  var authError = document.getElementById('auth-error');
  var authNotice = document.getElementById('auth-notice');
  var cooldownUntil = 0;

  function showAuthMsg(el, other, msg) {
    if (other) other.hidden = true;
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }

  if (forgotBtn) {
    forgotBtn.addEventListener('click', function () {
      var email = emailInput ? emailInput.value.trim() : '';
      if (!email || email.indexOf('@') < 1) {
        showAuthMsg(authError, authNotice, T('errEmailFirst'));
        if (emailInput) emailInput.focus();
        return;
      }
      if (Date.now() < cooldownUntil) {
        showAuthMsg(authError, authNotice, T('errResetWait'));
        return;
      }
      cooldownUntil = Date.now() + 60000;
      forgotBtn.disabled = true;
      client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/'
      }).then(function (res) {
        forgotBtn.disabled = false;
        // 가입하지 않은 이메일이어도 같은 안내를 보여준다(가입 여부가 드러나지 않게).
        if (res && res.error && /rate|too many|seconds/i.test(res.error.message || '')) {
          showAuthMsg(authError, authNotice, T('errResetWait'));
          return;
        }
        showAuthMsg(authNotice, authError, T('authResetSent'));
      }).catch(function () {
        forgotBtn.disabled = false;
        cooldownUntil = 0;
        showAuthMsg(authError, authNotice, T('errResetWait'));
      });
    });
  }

  // ===== 2) 새 비밀번호 설정 창 =====
  var modal = document.getElementById('password-modal');
  if (!modal) return;
  var form = document.getElementById('password-form');
  var newInput = document.getElementById('pw-new');
  var confirmInput = document.getElementById('pw-confirm');
  var errEl = document.getElementById('pw-error');
  var noticeEl = document.getElementById('pw-notice');
  var submitBtn = document.getElementById('pw-submit');
  var saving = false;

  function open() {
    form.reset();
    errEl.hidden = true;
    noticeEl.hidden = true;
    submitBtn.disabled = false;
    submitBtn.hidden = false;
    submitBtn.textContent = T('pwSave');
    var loginModal = document.getElementById('auth-modal');
    if (loginModal) loginModal.hidden = true;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    setTimeout(function () { try { newInput.focus(); } catch (e) {} }, 30);
  }
  function close() {
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
  }
  document.getElementById('password-modal-close').addEventListener('click', close);
  document.getElementById('password-modal-backdrop').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (saving) return;
    errEl.hidden = true;
    var pw = newInput.value, pw2 = confirmInput.value;
    if (!PASSWORD_REGEX.test(pw)) { errEl.textContent = T('errPasswordFormat'); errEl.hidden = false; return; }
    if (pw !== pw2) { errEl.textContent = T('errPasswordMismatch'); errEl.hidden = false; return; }
    saving = true;
    submitBtn.disabled = true;
    submitBtn.textContent = T('pwSaving');
    client.auth.getSession().then(function (r) {
      if (!r || !r.data || !r.data.session) return { error: { message: 'Auth session missing' } };
      return client.auth.updateUser({ password: pw });
    }).then(function (res) {
      saving = false;
      submitBtn.disabled = false;
      submitBtn.textContent = T('pwSave');
      if (res.error) {
        var m = res.error.message || '';
        console.warn('[password] updateUser', res.error);
        if (/different|same/i.test(m)) errEl.textContent = T('pwSameError');
        else if (/weak|short|characters|pwned|leaked/i.test(m)) errEl.textContent = T('errPasswordFormat') + ' (' + m + ')';
        else errEl.textContent = T('pwSaveError') + (m ? ' (' + m + ')' : '');
        errEl.hidden = false;
        return;
      }
      form.reset();
      noticeEl.textContent = T('pwSaved');
      noticeEl.hidden = false;
      submitBtn.hidden = true;
      setTimeout(close, 2500);
    }).catch(function () {
      saving = false;
      submitBtn.disabled = false;
      submitBtn.textContent = T('pwSave');
      errEl.textContent = T('pwSaveError');
      errEl.hidden = false;
    });
  });

  // 메일 링크로 들어오면 supabase가 PASSWORD_RECOVERY를 알려준다.
  var recoveryShown = false;
  function onRecovery(session) {
    if (recoveryShown) return;
    recoveryShown = true;
    // 이 기기를 '지금 쓰는 기기'로 등록해 둬야 다른 화면에서 로그아웃되지 않는다.
    try { if (window.SingleSession && session) window.SingleSession.claim(session); } catch (e) {}
    open();
  }
  client.auth.onAuthStateChange(function (event, session) {
    if (event === 'PASSWORD_RECOVERY') onRecovery(session);
  });
  if (window.__authRecovery) {
    // 이벤트를 놓친 경우를 대비해, 세션이 잡히면 창을 띄운다.
    var tries = 0;
    (function waitSession() {
      client.auth.getSession().then(function (r) {
        var s = r && r.data && r.data.session;
        if (s) onRecovery(s);
        else if (++tries < 20) setTimeout(waitSession, 300);
      });
    })();
  }

  window.PasswordUI = { open: open };
})();
