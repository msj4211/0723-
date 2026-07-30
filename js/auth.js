(function () {
  var client = window.supabaseClient;

  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  var PHONE_REGEX = /^\d{2,3}-\d{3,4}-\d{4}$/;
  var PENDING_PROFILE_KEY = 'pendingSignupProfile';
  var PENDING_SIGNUP_EMAIL_KEY = 'pendingSignupEmail';

  var loginBtn = document.getElementById('auth-login-btn');
  var userBox = document.getElementById('auth-user');
  var userEmailEl = document.getElementById('auth-user-email');
  var logoutBtn = document.getElementById('auth-logout-btn');
  var profileBtn = document.getElementById('auth-profile-btn');

  var modal = document.getElementById('auth-modal');
  var modalBackdrop = document.getElementById('auth-modal-backdrop');
  var modalClose = document.getElementById('auth-modal-close');
  var descEl = document.getElementById('auth-modal-desc');
  var form = document.getElementById('auth-form');
  var nameField = document.getElementById('auth-name-field');
  var nameInput = document.getElementById('auth-name');
  var emailInput = document.getElementById('auth-email');
  var phoneField = document.getElementById('auth-phone-field');
  var phoneInput = document.getElementById('auth-phone');
  var passwordInput = document.getElementById('auth-password');
  var passwordHint = document.getElementById('auth-password-hint');
  var togglePasswordBtn = document.getElementById('auth-toggle-password');
  var passwordConfirmField = document.getElementById('auth-password-confirm-field');
  var passwordConfirmInput = document.getElementById('auth-password-confirm');
  var passwordConfirmError = document.getElementById('auth-password-confirm-error');
  var privacyField = document.getElementById('auth-privacy-field');
  var privacyCheckbox = document.getElementById('auth-privacy-agree');
  var marketingField = document.getElementById('auth-marketing-field');
  var marketingCheckbox = document.getElementById('auth-marketing-agree');
  var errorEl = document.getElementById('auth-error');
  var noticeEl = document.getElementById('auth-notice');
  var resendBtn = document.getElementById('auth-resend-btn');
  var gotoLoginBtn = document.getElementById('auth-goto-login-btn');
  var submitBtn = document.getElementById('auth-submit-btn');
  var switchTextEl = document.getElementById('auth-switch-text');
  var switchLinkEl = document.getElementById('auth-switch-link');

  var mode = 'login';
  var submitting = false;
  var lastSignupEmail = '';
  var resendCooldownTimer = null;
  var RESEND_COOLDOWN_SECONDS = 60;

  function getCopy(currentMode) {
    return currentMode === 'signup'
      ? {
          desc: window.t('authModalDescSignup'),
          submit: window.t('authSubmitSignup'),
          submitting: window.t('authSubmittingSignup'),
          switchText: window.t('authSwitchTextSignup'),
          switchLink: window.t('authSwitchLinkSignup')
        }
      : {
          desc: window.t('authModalDescLogin'),
          submit: window.t('authSubmitLogin'),
          submitting: window.t('authSubmittingLogin'),
          switchText: window.t('authSwitchTextLogin'),
          switchLink: window.t('authSwitchLinkLogin')
        };
  }

  function clearResendCooldown() {
    if (resendCooldownTimer) {
      clearTimeout(resendCooldownTimer);
      resendCooldownTimer = null;
    }
  }

  // 재발송 버튼을 60초간 비활성화해 반복 요청(429 오류)을 막는다.
  function startResendCooldown() {
    clearResendCooldown();
    resendBtn.disabled = true;
    resendBtn.textContent = window.t('authResendCooldown');
    resendCooldownTimer = setTimeout(function () {
      resendCooldownTimer = null;
      resendBtn.disabled = false;
      resendBtn.textContent = window.t('authResendLabel');
    }, RESEND_COOLDOWN_SECONDS * 1000);
  }

  function hideResend() {
    clearResendCooldown();
    resendBtn.hidden = true;
    resendBtn.disabled = false;
    resendBtn.textContent = window.t('authResendLabel');
    gotoLoginBtn.hidden = true;
  }

  function showError(message) {
    noticeEl.hidden = true;
    errorEl.innerHTML = String(message).replace(/\n/g, '<br>');
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.hidden = true;
  }

  function clearNotice() {
    noticeEl.hidden = true;
    hideResend();
  }

  function stashPendingSignupEmail(email) {
    try { localStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, email); } catch (e) {}
  }

  function getPendingSignupEmail() {
    try { return localStorage.getItem(PENDING_SIGNUP_EMAIL_KEY); } catch (e) { return null; }
  }

  function clearPendingSignupEmail() {
    try { localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY); } catch (e) {}
  }

  // 이메일 인증 대기 중임을 안내하고, 재발송 버튼을 보여준다.
  function showAwaitingConfirmation() {
    errorEl.hidden = true;
    gotoLoginBtn.hidden = true;
    noticeEl.innerHTML = window.t('authAwaitingConfirmation');
    noticeEl.hidden = false;
    resendBtn.hidden = false;
  }

  // 이메일 인증이 완료된 상태를 안내하고, 로그인하기 버튼을 보여준다.
  function showConfirmationComplete() {
    errorEl.hidden = true;
    clearResendCooldown();
    resendBtn.hidden = true;
    noticeEl.innerHTML = window.t('authConfirmationComplete');
    noticeEl.hidden = false;
    gotoLoginBtn.hidden = false;
  }

  // 로컬에 저장된 가입 대기 이메일이 있으면, 현재 세션 기준으로 인증 완료
  // 여부를 다시 판단해 모달에 알맞은 안내를 보여준다. 새로고침이나 재방문
  // 후에도 이 함수가 다시 실행되어 화면이 최신 인증 상태로 갱신된다.
  function checkPendingConfirmation() {
    var pendingEmail = getPendingSignupEmail();
    if (!pendingEmail) return;

    lastSignupEmail = pendingEmail;

    client.auth.getSession().then(function (res) {
      var session = res.data.session;
      var user = session ? session.user : null;

      if (user && user.email === pendingEmail && isEmailConfirmed(user)) {
        showConfirmationComplete();
      } else {
        showAwaitingConfirmation();
      }
    });
  }

  // Supabase가 돌려주는 영문 에러 메시지를 상황에 맞는 한국어 안내로 바꾼다.
  function signupErrorMessage(error) {
    var message = (error && error.message) || '';
    var lower = message.toLowerCase();
    var status = error && error.status;

    if (status === 429 || lower.indexOf('rate limit') !== -1 || lower.indexOf('too many') !== -1) {
      return window.t('errRateLimit');
    }
    if (lower.indexOf('already registered') !== -1 || lower.indexOf('already exists') !== -1) {
      return window.t('errAlreadyRegistered');
    }
    if (lower.indexOf('invalid') !== -1 && lower.indexOf('email') !== -1) {
      return window.t('errInvalidEmail');
    }
    if (lower.indexOf('password') !== -1) {
      return window.t('errPasswordCondition');
    }
    if (
      lower.indexOf('sending') !== -1 ||
      lower.indexOf('smtp') !== -1 ||
      lower.indexOf('confirmation email') !== -1 ||
      (lower.indexOf('email') !== -1 && (lower.indexOf('fail') !== -1 || lower.indexOf('error') !== -1))
    ) {
      return window.t('errSendFail');
    }
    return window.t('errSignupGeneric');
  }

  function formatPhone(value) {
    var digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return digits.slice(0, 3) + '-' + digits.slice(3);
    return digits.slice(0, 3) + '-' + digits.slice(3, 7) + '-' + digits.slice(7);
  }

  function passwordsMatch() {
    return passwordInput.value.length > 0 && passwordInput.value === passwordConfirmInput.value;
  }

  function isSignupValid() {
    return (
      nameInput.value.trim().length > 0 &&
      EMAIL_REGEX.test(emailInput.value.trim()) &&
      PHONE_REGEX.test(phoneInput.value.trim()) &&
      PASSWORD_REGEX.test(passwordInput.value) &&
      passwordsMatch() &&
      privacyCheckbox.checked
    );
  }

  // 회원가입 모드에서는 모든 필수 항목이 유효할 때만 가입 버튼이 눌리도록 한다.
  // 로그인 모드에서는 이 검사를 적용하지 않는다.
  function refreshSubmitState() {
    if (submitting) {
      submitBtn.disabled = true;
      return;
    }

    if (mode !== 'signup') {
      submitBtn.disabled = false;
      return;
    }

    var confirmTouched = passwordConfirmInput.value.length > 0;
    passwordConfirmError.hidden = !confirmTouched || passwordsMatch();

    submitBtn.disabled = !isSignupValid();
  }

  function applyMode() {
    var copy = getCopy(mode);
    descEl.innerHTML = copy.desc;
    submitBtn.textContent = copy.submit;
    switchTextEl.textContent = copy.switchText;
    switchLinkEl.textContent = copy.switchLink;

    var isSignup = mode === 'signup';
    nameField.hidden = !isSignup;
    phoneField.hidden = !isSignup;
    passwordHint.hidden = !isSignup;
    passwordConfirmField.hidden = !isSignup;
    privacyField.hidden = !isSignup;
    marketingField.hidden = !isSignup;
    nameInput.required = isSignup;
    phoneInput.required = isSignup;

    refreshSubmitState();
  }

  function setMode(nextMode) {
    mode = nextMode;
    clearError();
    clearNotice();

    // 회원가입에서 로그인으로 돌아오면 동의 체크 상태를 초기화해서,
    // 이후 다시 회원가입으로 전환했을 때 이전 값이 남아있지 않게 한다.
    if (nextMode === 'login') {
      privacyCheckbox.checked = false;
      marketingCheckbox.checked = false;
    }

    applyMode();
  }

  function openModal() {
    setMode('login');
    form.reset();
    passwordInput.type = 'password';
    togglePasswordBtn.setAttribute('aria-pressed', 'false');
    togglePasswordBtn.setAttribute('aria-label', window.t('authPasswordShow'));
    passwordConfirmError.hidden = true;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    emailInput.focus();
    checkPendingConfirmation();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
  }

  function isEmailConfirmed(user) {
    return !!(user && user.email_confirmed_at);
  }

  // 세션은 있지만 이메일 인증이 끝나지 않은 사용자는 로그인 상태로 표시하지 않고,
  // 남아있는 세션을 즉시 정리해 로그인 버튼만 보이도록 한다.
  function renderAuthState(session) {
    var user = session ? session.user : null;

    if (user && !isEmailConfirmed(user)) {
      loginBtn.hidden = false;
      userBox.hidden = true;
      userEmailEl.textContent = '';
      client.auth.signOut();
      return;
    }

    if (user) {
      loginBtn.hidden = true;
      userBox.hidden = false;
      userEmailEl.textContent = user.email;
    } else {
      loginBtn.hidden = false;
      userBox.hidden = true;
      userEmailEl.textContent = '';
    }
  }

  loginBtn.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);

  switchLinkEl.addEventListener('click', function () {
    setMode(mode === 'login' ? 'signup' : 'login');
  });

  togglePasswordBtn.addEventListener('click', function () {
    var isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePasswordBtn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
    togglePasswordBtn.setAttribute('aria-label', isHidden ? window.t('authPasswordHide') : window.t('authPasswordShow'));
  });

  phoneInput.addEventListener('input', function () {
    phoneInput.value = formatPhone(phoneInput.value);
    refreshSubmitState();
  });

  [nameInput, emailInput, passwordInput, passwordConfirmInput].forEach(function (el) {
    el.addEventListener('input', refreshSubmitState);
  });
  privacyCheckbox.addEventListener('change', refreshSubmitState);

  logoutBtn.addEventListener('click', function () {
    client.auth.signOut();
  });

  // 회원가입과 동시에 입력받은 이름/휴대폰/마케팅 동의를 profiles 테이블에 저장한다.
  // 이메일 인증이 필요해 세션이 바로 생기지 않는 경우, 실제 로그인 시점까지
  // sessionStorage에 임시 보관했다가 그때 저장한다.
  function saveProfileNow(userId, profileData) {
    return client.from('profiles').insert({
      id: userId,
      name: profileData.name,
      phone: profileData.phone,
      marketing_agreed: profileData.marketing_agreed,
      updated_at: new Date().toISOString()
    });
  }

  function stashPendingProfile(profileData) {
    try {
      sessionStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(profileData));
    } catch (e) {}
  }

  function flushPendingProfile(user) {
    var raw;
    try {
      raw = sessionStorage.getItem(PENDING_PROFILE_KEY);
    } catch (e) {
      raw = null;
    }
    if (!raw) return;

    sessionStorage.removeItem(PENDING_PROFILE_KEY);
    var pending = JSON.parse(raw);
    client.from('profiles').select('id').eq('id', user.id).maybeSingle().then(function (res) {
      if (!res.error && !res.data) {
        saveProfileNow(user.id, pending);
      }
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitting) return;
    clearError();
    clearNotice();

    var name = nameInput.value.trim();
    var email = emailInput.value.trim();
    var phone = phoneInput.value.trim();
    var password = passwordInput.value;

    if (!email || !password) {
      showError(window.t('errEmailPasswordRequired'));
      return;
    }

    if (mode === 'signup') {
      if (!name) {
        showError(window.t('errNameRequired'));
        return;
      }
      if (!EMAIL_REGEX.test(email)) {
        showError(window.t('errEmailFormat'));
        return;
      }
      if (!PHONE_REGEX.test(phone)) {
        showError(window.t('errPhoneFormat'));
        return;
      }
      if (!PASSWORD_REGEX.test(password)) {
        showError(window.t('errPasswordFormat'));
        return;
      }
      if (!passwordsMatch()) {
        showError(window.t('errPasswordMismatch'));
        return;
      }
      if (!privacyCheckbox.checked) {
        showError(window.t('errPrivacyRequired'));
        return;
      }
    }

    var copy = getCopy(mode);
    submitting = true;
    refreshSubmitState();
    submitBtn.textContent = copy.submitting;

    var request = mode === 'login'
      ? client.auth.signInWithPassword({ email: email, password: password })
      : client.auth.signUp({ email: email, password: password });

    request.then(function (res) {
      submitting = false;
      submitBtn.textContent = copy.submit;
      refreshSubmitState();

      if (res.error) {
        showError(mode === 'login' ? window.t('errLoginWrong') : signupErrorMessage(res.error));
        return;
      }

      if (mode === 'login') {
        clearPendingSignupEmail();
        closeModal();
        return;
      }

      var profileData = { name: name, phone: phone, marketing_agreed: marketingCheckbox.checked };

      if (res.data.session) {
        saveProfileNow(res.data.session.user.id, profileData);
        clearPendingSignupEmail();
        closeModal();
      } else {
        stashPendingProfile(profileData);
        lastSignupEmail = email;
        stashPendingSignupEmail(email);
        showAwaitingConfirmation();
        startResendCooldown();
      }
    }).catch(function () {
      submitting = false;
      submitBtn.textContent = copy.submit;
      refreshSubmitState();
      showError(mode === 'login' ? window.t('errLoginFail') : window.t('errSendFail'));
    });
  });

  resendBtn.addEventListener('click', function () {
    if (resendBtn.disabled || !lastSignupEmail) return;
    clearError();
    startResendCooldown();
    client.auth.resend({ type: 'signup', email: lastSignupEmail }).then(function (res) {
      if (res.error) {
        showError(signupErrorMessage(res.error));
      }
    }).catch(function () {
      showError(window.t('errSendFail'));
    });
  });

  gotoLoginBtn.addEventListener('click', function () {
    clearPendingSignupEmail();
    setMode('login');
    emailInput.focus();
  });

  // ===== 프로필(이름/휴대폰/성별/나이) =====
  var profileModal = document.getElementById('profile-modal');
  var profileModalBackdrop = document.getElementById('profile-modal-backdrop');
  var profileModalClose = document.getElementById('profile-modal-close');
  var profileForm = document.getElementById('profile-form');
  var profileNameInput = document.getElementById('profile-name');
  var profilePhoneInput = document.getElementById('profile-phone');
  var profileGenderInput = document.getElementById('profile-gender');
  var profileAgeInput = document.getElementById('profile-age');
  var profileMarketingCheckbox = document.getElementById('profile-marketing-agree');
  var profileError = document.getElementById('profile-error');
  var profileSubmitBtn = document.getElementById('profile-submit-btn');

  function showProfileError(message) {
    profileError.textContent = message;
    profileError.hidden = false;
  }

  function clearProfileError() {
    profileError.hidden = true;
  }

  function openProfileModal(profileRow) {
    profileForm.reset();
    clearProfileError();
    profileSubmitBtn.disabled = false;
    profileSubmitBtn.textContent = window.t('profileSave');
    if (profileRow) {
      profileNameInput.value = profileRow.name || '';
      profilePhoneInput.value = profileRow.phone || '';
      profileGenderInput.value = profileRow.gender || '';
      profileAgeInput.value = profileRow.age || '';
      profileMarketingCheckbox.checked = !!profileRow.marketing_agreed;
    }
    profileModal.hidden = false;
    document.body.classList.add('no-scroll');
  }

  function closeProfileModal() {
    profileModal.hidden = true;
    document.body.classList.remove('no-scroll');
  }

  profileModalClose.addEventListener('click', closeProfileModal);
  profileModalBackdrop.addEventListener('click', closeProfileModal);

  profileBtn.addEventListener('click', function () {
    client.auth.getSession().then(function (res) {
      var session = res.data.session;
      if (!session) return;
      client.from('profiles').select('*').eq('id', session.user.id).maybeSingle().then(function (profRes) {
        openProfileModal(profRes.data);
      });
    });
  });

  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearProfileError();

    client.auth.getSession().then(function (res) {
      var session = res.data.session;
      if (!session) return;

      var name = profileNameInput.value.trim();
      var phone = profilePhoneInput.value.trim();
      var gender = profileGenderInput.value;
      var ageValue = profileAgeInput.value;
      var age = ageValue ? parseInt(ageValue, 10) : null;
      var marketingAgreed = profileMarketingCheckbox.checked;

      profileSubmitBtn.disabled = true;
      profileSubmitBtn.textContent = window.t('profileSaving');

      client.from('profiles').upsert({
        id: session.user.id,
        name: name || null,
        phone: phone || null,
        gender: gender || null,
        age: age,
        marketing_agreed: marketingAgreed,
        updated_at: new Date().toISOString()
      }).then(function (res2) {
        profileSubmitBtn.disabled = false;
        profileSubmitBtn.textContent = window.t('profileSave');

        if (res2.error) {
          showProfileError(window.t('profileSaveError'));
          return;
        }
        closeProfileModal();
      });
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!profileModal.hidden) closeProfileModal();
    else if (!modal.hidden) closeModal();
  });

  client.auth.onAuthStateChange(function (event, session) {
    renderAuthState(session);
    if (event === 'SIGNED_IN' && session && isEmailConfirmed(session.user)) {
      flushPendingProfile(session.user);
    }
    // 모달이 열려 있는 상태에서 다른 탭 등을 통해 인증이 완료되면
    // 안내 화면을 즉시 최신 상태로 갱신한다.
    if (!modal.hidden) {
      checkPendingConfirmation();
    }
  });

  client.auth.getSession().then(function (res) {
    renderAuthState(res.data.session);
  });

  // 다른 모듈(이어포인트 좋아요 등)이 로그인 여부를 확인하고,
  // 필요하면 모달을 띄울 수 있도록 공개 API로 노출한다.
  window.Auth = {
    requireAuth: function (onAuthenticated) {
      client.auth.getSession().then(function (res) {
        var session = res.data.session;
        if (session) {
          onAuthenticated(session.user);
        } else {
          openModal();
        }
      });
    },
    openModal: openModal
  };

  // 로그인/프로필 모달이 열려 있는 동안 언어를 바꾸면, 이 모듈이 직접
  // textContent로 채운 부분(설명 문구, 버튼, 안내 메시지 등)은 data-i18n으로
  // 잡히지 않으므로 여기서 다시 그려준다.
  if (window.i18nOnLanguageChange) {
    window.i18nOnLanguageChange.push(function () {
      if (!modal.hidden) {
        applyMode();
        var isHidden = passwordInput.type === 'password';
        togglePasswordBtn.setAttribute('aria-label', isHidden ? window.t('authPasswordShow') : window.t('authPasswordHide'));
        if (!resendBtn.hidden && resendBtn.disabled) {
          resendBtn.textContent = window.t('authResendCooldown');
        } else if (!resendBtn.hidden) {
          resendBtn.textContent = window.t('authResendLabel');
        }
      }
      if (!profileModal.hidden) {
        profileSubmitBtn.textContent = window.t('profileSave');
      }
    });
  }
})();
