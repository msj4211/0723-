(function () {
  var client = window.supabaseClient;

  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  var PHONE_REGEX = /^\d{2,3}-\d{3,4}-\d{4}$/;
  var PENDING_PROFILE_KEY = 'pendingSignupProfile';

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
  var submitBtn = document.getElementById('auth-submit-btn');
  var switchTextEl = document.getElementById('auth-switch-text');
  var switchLinkEl = document.getElementById('auth-switch-link');

  var mode = 'login';
  var submitting = false;

  var COPY = {
    login: {
      desc: '이어포인트를 저장하고<br>세미나를 더욱 편리하게 이용하세요.',
      submit: '로그인',
      submitting: '로그인하는 중...',
      switchText: '아직 회원이 아니신가요?',
      switchLink: '회원가입 →'
    },
    signup: {
      desc: '이메일로 간편하게 시작해보세요.',
      submit: '회원가입',
      submitting: '가입하는 중...',
      switchText: '이미 계정이 있으신가요?',
      switchLink: '로그인 →'
    }
  };

  function showError(message) {
    noticeEl.hidden = true;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.hidden = true;
  }

  function showNotice() {
    errorEl.hidden = true;
    noticeEl.hidden = false;
  }

  function clearNotice() {
    noticeEl.hidden = true;
  }

  // Supabase가 돌려주는 영문 에러 메시지를 상황에 맞는 한국어 안내로 바꾼다.
  function signupErrorMessage(error) {
    var message = (error && error.message) || '';
    var lower = message.toLowerCase();

    if (lower.indexOf('already registered') !== -1 || lower.indexOf('already exists') !== -1) {
      return '이미 가입된 이메일입니다.';
    }
    if (lower.indexOf('rate limit') !== -1) {
      return '요청이 많아 잠시 제한되었습니다. 잠시 후 다시 시도해 주세요.';
    }
    if (lower.indexOf('invalid') !== -1 && lower.indexOf('email') !== -1) {
      return '올바른 이메일 주소를 입력해 주세요.';
    }
    if (lower.indexOf('password') !== -1) {
      return '비밀번호 조건을 다시 확인해 주세요.';
    }
    return '회원가입에 실패했습니다. 입력값을 확인해 주세요.';
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
    var copy = COPY[mode];
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
    togglePasswordBtn.setAttribute('aria-label', '비밀번호 표시');
    passwordConfirmError.hidden = true;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    emailInput.focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
  }

  function renderAuthState(user) {
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
    togglePasswordBtn.setAttribute('aria-label', isHidden ? '비밀번호 숨기기' : '비밀번호 표시');
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
    clearError();
    clearNotice();

    var name = nameInput.value.trim();
    var email = emailInput.value.trim();
    var phone = phoneInput.value.trim();
    var password = passwordInput.value;

    if (!email || !password) {
      showError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    if (mode === 'signup') {
      if (!name) {
        showError('이름을 입력해 주세요.');
        return;
      }
      if (!EMAIL_REGEX.test(email)) {
        showError('올바른 이메일 형식을 입력해 주세요.');
        return;
      }
      if (!PHONE_REGEX.test(phone)) {
        showError('휴대폰 번호를 정확히 입력해 주세요.');
        return;
      }
      if (!PASSWORD_REGEX.test(password)) {
        showError('비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다.');
        return;
      }
      if (!passwordsMatch()) {
        showError('비밀번호가 일치하지 않습니다.');
        return;
      }
      if (!privacyCheckbox.checked) {
        showError('개인정보 처리방침에 동의해 주세요.');
        return;
      }
    }

    var copy = COPY[mode];
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
        showError(mode === 'login' ? '이메일 또는 비밀번호가 올바르지 않습니다.' : signupErrorMessage(res.error));
        return;
      }

      if (mode === 'login') {
        closeModal();
        return;
      }

      var profileData = { name: name, phone: phone, marketing_agreed: marketingCheckbox.checked };

      if (res.data.session) {
        saveProfileNow(res.data.session.user.id, profileData);
        closeModal();
      } else {
        stashPendingProfile(profileData);
        showNotice();
      }
    });
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
      profileSubmitBtn.textContent = '저장하는 중...';

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
        profileSubmitBtn.textContent = '저장';

        if (res2.error) {
          showProfileError('저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
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
    renderAuthState(session ? session.user : null);
    if (event === 'SIGNED_IN' && session) {
      flushPendingProfile(session.user);
    }
  });

  client.auth.getSession().then(function (res) {
    renderAuthState(res.data.session ? res.data.session.user : null);
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
})();
