// 사이트 전체에서 쓰는 한국어/영어 문구 사전. 외부 번역 API 없이,
// 여기 등록된 고정 문구만 data-i18n 계열 속성을 통해 그대로 교체된다.
window.translations = {
  ko: {
    // 헤더
    brandAriaLabel: '730 스킨이어테라피 홈으로 이동',
    searchBtnAriaLabel: '이어밸런스체크 페이지로 이동',
    searchInputAriaLabel: '검색어 입력, Enter 키를 누르면 이어밸런스체크 페이지로 이동합니다',
    searchPlaceholder: '검색',
    navEarCheck: '이어밸런스체크',
    navEarPoints: '이어포인트',
    navProducts: '상품',
    navSeminar: '세미나신청',
    login: '로그인',
    logout: '로그아웃',
    profileBtn: '내 프로필',
    hamburgerOpen: '메뉴 열기',
    hamburgerClose: '메뉴 닫기',
    instagramAriaLabel: '730스킨 인스타그램 새 창에서 열기',
    scrollTopAriaLabel: '맨 위로 이동',
    close: '닫기',

    // 로그인/회원가입 모달
    authModalTitle: '730SKIN',
    authModalDescLogin: '이어포인트를 저장하고<br>세미나를 더욱 편리하게 이용하세요.',
    authModalDescSignup: '이메일로 간편하게 시작해보세요.',
    authNameLabel: '이름',
    authEmailLabel: '이메일',
    authPhoneLabel: '휴대폰 번호',
    authPasswordLabel: '비밀번호',
    authPasswordConfirmLabel: '비밀번호 확인',
    authPasswordHint: '영문과 숫자를 포함해 8자 이상 입력해주세요.',
    authPasswordShow: '비밀번호 표시',
    authPasswordHide: '비밀번호 숨기기',
    authPrivacyAgree: '개인정보 처리방침에 동의합니다.',
    authRequired: '(필수)',
    authOptional: '(선택)',
    authMarketingAgree: '이벤트 · 교육 · 신제품 안내 수신에 동의합니다.',
    authPasswordConfirmError: '비밀번호가 일치하지 않습니다.',
    authSwitchTextLogin: '아직 회원이 아니신가요?',
    authSwitchLinkLogin: '회원가입 →',
    authSwitchTextSignup: '이미 계정이 있으신가요?',
    authSwitchLinkSignup: '로그인 →',
    authResendLabel: '인증메일 다시 보내기',
    authResendCooldown: '60초 후 다시 요청할 수 있습니다',
    authGotoLogin: '로그인하기',
    authAwaitingConfirmation: '가입 확인 이메일을 보냈습니다<br>메일함과 스팸메일함을 확인해 주세요',
    authConfirmationComplete: '인증이 완료되었습니다',
    authSubmitLogin: '로그인',
    authSubmitSignup: '회원가입',
    authSubmittingLogin: '로그인하는 중...',
    authSubmittingSignup: '처리 중...',
    errRateLimit: '인증메일 요청이 너무 많습니다\n잠시 후 다시 시도해 주세요',
    errAlreadyRegistered: '이미 가입된 이메일입니다.',
    errInvalidEmail: '올바른 이메일 주소를 입력해 주세요.',
    errPasswordCondition: '비밀번호 조건을 다시 확인해 주세요.',
    errSendFail: '인증메일을 보내지 못했습니다\n잠시 후 다시 시도해 주세요',
    errSignupGeneric: '회원가입에 실패했습니다. 입력값을 확인해 주세요.',
    errEmailPasswordRequired: '이메일과 비밀번호를 입력해 주세요.',
    errNameRequired: '이름을 입력해 주세요.',
    errEmailFormat: '올바른 이메일 형식을 입력해 주세요.',
    errPhoneFormat: '휴대폰 번호를 정확히 입력해 주세요.',
    errPasswordFormat: '비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다.',
    errPasswordMismatch: '비밀번호가 일치하지 않습니다.',
    errPrivacyRequired: '개인정보 처리방침에 동의해 주세요.',
    errLoginWrong: '이메일 또는 비밀번호가 올바르지 않습니다.',
    errLoginFail: '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.',

    // 프로필 모달
    profileModalTitle: '내 프로필',
    profileModalDesc: '몇 가지 정보를 더 알려주시면<br>더 편리하게 이용하실 수 있어요.',
    profileNameLabel: '이름',
    profilePhoneLabel: '휴대폰 번호',
    profileGenderLabel: '성별',
    profileGenderNone: '선택 안 함',
    profileGenderFemale: '여성',
    profileGenderMale: '남성',
    profileAgeLabel: '나이',
    profileMarketingAgree: '이벤트 · 교육 · 신제품 안내 수신에 동의합니다.',
    profileSave: '저장',
    profileSaving: '저장하는 중...',
    profileSaveError: '저장에 실패했어요. 잠시 후 다시 시도해 주세요.',

    // 홈
    heroEyebrow: '730 SKIN EAR THERAPY',
    heroTitle: '귀에서 시작하는<br>가벼운 웰니스 루틴',
    heroDesc: '오늘의 몸 상태를 확인하고<br>나에게 필요한 귀 혈자리를 찾아보세요',
    heroBtnPrimary: '이어밸런스 시작하기',
    heroBtnSecondary: '이어포인트 둘러보기',
    heroVisualAlt: '꽃과 함께 연출된 귀 이미지',
    purposeHeading: '오늘 어떤 관리가 필요하신가요',
    purposeDesc: '지금 필요한 관리를 선택하면<br>관련 이어포인트를 쉽게 확인할 수 있어요',
    purposeSleep: '푹 자고 싶어요',
    purposeCalm: '마음이 편안해지고 싶어요',
    purposeDigest: '소화가 편했으면 좋겠어요',
    purposeFatigue: '피로를 덜고 싶어요',
    purposeShoulder: '목과 어깨를 관리하고 싶어요',
    purposeWomen: '여성 건강을 관리하고 싶어요',

    // 홈 푸터
    footerNavHeading: '메뉴 바로가기',
    footerNavEarCheck: '이어밸런스 체크',
    footerNavSeminar: '세미나 신청',
    footerSocialHeading: '외부 채널',
    instagram: 'Instagram',
    smartStore: 'Naver Smart Store',
    terms: '이용약관',
    privacy: '개인정보 처리방침',

    // Landing(제품/세미나 소개, 인트로)
    offerProductTitle: '이어테라피를 위한 제품',
    offerProductDesc: '셀프케어와 전문 관리를 위한<br>이어테라피 제품을 확인해보세요',
    offerProductBtn: '상품 보러가기',
    offerSeminarTitle: '이어테라피를 더 깊이 배우고 싶다면',
    offerSeminarDesc: '현재 진행 중인 세미나와<br>교육 일정을 확인해보세요',
    offerSeminarBtn: '세미나 일정 보기',
    landingAriaLabel: '730 스킨이어테라피 소개',
    landingIntroTitle: '당신의 몸은<br>작은 신호를 보내고 있습니다.',
    landingIntroBody:
      '피곤함, 스트레스, 수면 부족,<br>' +
      '몸은 늘 작은 신호를 보내지만<br>' +
      '우리는 쉽게 지나치곤 합니다.' +
      '<br><br>' +
      '이어테라피는 귀를 통해<br>' +
      '몸의 균형을 이해하고<br>' +
      '건강한 일상을 위한 셀프케어를 제안합니다.',

    // 이어포인트 목록
    likeCountLoading: '불러오는 중...',
    likeAriaLabelSuffix: ' 관심 표시',
    likeCountNone: '♡ 아직 관심 표시가 없어요',

    // 상품
    productsLoading: '상품을 불러오는 중...',
    productsEmpty: '상품을 준비 중이에요. 조금만 기다려 주세요.',
    productsFeaturedBadge: '추천',
    productsBuyBtn: '구매하기',

    // 수면 이어포인트 상세
    sdBackAriaLabel: '이전 페이지로 이동',
    sdHeroTitle: '편안한 수면을 위한<br>이어포인트',
    sdHeroDesc: '잠들기 어렵거나 자주 깨는 날 활용할 수 있는<br>셀프케어 정보를 확인해 보세요',
    sdSectionTitle: '추천 이어포인트',
    sdTabShenmen: '신문',
    sdTabSympathetic: '교감',
    sdTabEndocrine: '내분비',
    sdTabBrainstem: '뇌간',
    sdPointDescShenmen: '긴장된 상태를 편안하게 가라앉히고 휴식을 준비하는 데 참고할 수 있는 이어포인트예요',
    sdPointDescSympathetic: '몸이 예민하고 긴장된 날 편안한 이완을 돕는 셀프케어 포인트로 활용할 수 있어요',
    sdPointDescEndocrine: '일상적인 신체 리듬과 균형을 관리하는 셀프케어 과정에서 함께 살펴볼 수 있어요',
    sdPointDescBrainstem: '과도한 각성 상태를 낮추고 휴식 리듬을 준비하는 관리에 참고할 수 있는 포인트예요',
    sdMapAlt: '신문 교감 내분비 뇌간 위치가 표시된 귀 혈자리 이미지',
    sdMapPlaceholderStrong: '귀 혈자리 이미지를 넣어 주세요',
    sdMapPlaceholderBody: '이미지 파일명을<br>images/sleep-ear-map.png<br>로 맞추면 자동으로 표시돼요',
    sdReasonTitle: '왜 이 이어포인트를 추천하나요',
    sdReasonDesc: '신문, 교감, 내분비, 뇌간은 긴장과 각성 상태를 편안하게 조절하고 휴식을 준비하는 셀프케어 흐름으로 함께 구성하기 좋은 이어포인트예요',
    sdNotice: '본 정보는 일상적인 셀프케어를 위한 참고 자료이며 질환의 진단이나 치료를 대신하지 않습니다'
  },

  en: {
    // Header
    brandAriaLabel: 'Go to 730 Skin Ear Therapy home',
    searchBtnAriaLabel: 'Go to Ear Balance Check page',
    searchInputAriaLabel: 'Enter a search term — press Enter to go to the Ear Balance Check page',
    searchPlaceholder: 'Search',
    navEarCheck: 'Ear Balance Check',
    navEarPoints: 'Ear Points',
    navProducts: 'Products',
    navSeminar: 'Seminar Registration',
    login: 'Log in',
    logout: 'Log out',
    profileBtn: 'My Profile',
    hamburgerOpen: 'Open menu',
    hamburgerClose: 'Close menu',
    instagramAriaLabel: 'Open 730 Skin Instagram in a new tab',
    scrollTopAriaLabel: 'Scroll to top',
    close: 'Close',

    // Auth modal
    authModalTitle: '730SKIN',
    authModalDescLogin: 'Save your favorite ear points<br>and manage seminars more easily.',
    authModalDescSignup: 'Get started easily with your email.',
    authNameLabel: 'Name',
    authEmailLabel: 'Email',
    authPhoneLabel: 'Phone number',
    authPasswordLabel: 'Password',
    authPasswordConfirmLabel: 'Confirm password',
    authPasswordHint: 'Use at least 8 characters, including letters and numbers.',
    authPasswordShow: 'Show password',
    authPasswordHide: 'Hide password',
    authPrivacyAgree: 'I agree to the Privacy Policy.',
    authRequired: '(Required)',
    authOptional: '(Optional)',
    authMarketingAgree: 'I agree to receive updates on events, education, and new products.',
    authPasswordConfirmError: 'Passwords do not match.',
    authSwitchTextLogin: "Don't have an account yet?",
    authSwitchLinkLogin: 'Sign up →',
    authSwitchTextSignup: 'Already have an account?',
    authSwitchLinkSignup: 'Log in →',
    authResendLabel: 'Resend verification email',
    authResendCooldown: 'You can request again in 60 seconds',
    authGotoLogin: 'Go to log in',
    authAwaitingConfirmation: "We've sent a confirmation email<br>Please check your inbox and spam folder",
    authConfirmationComplete: 'Verification complete',
    authSubmitLogin: 'Log in',
    authSubmitSignup: 'Sign up',
    authSubmittingLogin: 'Logging in...',
    authSubmittingSignup: 'Processing...',
    errRateLimit: 'Too many verification email requests\nPlease try again later',
    errAlreadyRegistered: 'This email is already registered.',
    errInvalidEmail: 'Please enter a valid email address.',
    errPasswordCondition: 'Please check your password requirements again.',
    errSendFail: 'Could not send the verification email\nPlease try again later',
    errSignupGeneric: 'Sign up failed. Please check your entries.',
    errEmailPasswordRequired: 'Please enter your email and password.',
    errNameRequired: 'Please enter your name.',
    errEmailFormat: 'Please enter a valid email format.',
    errPhoneFormat: 'Please enter your phone number correctly.',
    errPasswordFormat: 'Password must be at least 8 characters and include letters and numbers.',
    errPasswordMismatch: 'Passwords do not match.',
    errPrivacyRequired: 'Please agree to the Privacy Policy.',
    errLoginWrong: 'Email or password is incorrect.',
    errLoginFail: 'Login failed. Please try again later.',

    // Profile modal
    profileModalTitle: 'My Profile',
    profileModalDesc: 'Adding a few more details<br>helps us serve you better.',
    profileNameLabel: 'Name',
    profilePhoneLabel: 'Phone number',
    profileGenderLabel: 'Gender',
    profileGenderNone: 'Prefer not to say',
    profileGenderFemale: 'Female',
    profileGenderMale: 'Male',
    profileAgeLabel: 'Age',
    profileMarketingAgree: 'I agree to receive updates on events, education, and new products.',
    profileSave: 'Save',
    profileSaving: 'Saving...',
    profileSaveError: 'Failed to save. Please try again later.',

    // Home
    heroEyebrow: '730 SKIN EAR THERAPY',
    heroTitle: 'A light wellness routine<br>that starts from the ear',
    heroDesc: "Check today's condition<br>and find the ear points you need",
    heroBtnPrimary: 'Start Ear Balance Check',
    heroBtnSecondary: 'Browse Ear Points',
    heroVisualAlt: 'An ear styled together with flowers',
    purposeHeading: 'What kind of care do you need today?',
    purposeDesc: 'Choose the care you need right now<br>to easily find related ear points',
    purposeSleep: "I want to sleep well",
    purposeCalm: 'I want to feel more at ease',
    purposeDigest: 'I want my digestion to feel better',
    purposeFatigue: 'I want to ease my fatigue',
    purposeShoulder: 'I want to care for my neck and shoulders',
    purposeWomen: "I want to manage women's health",

    // Home footer
    footerNavHeading: 'Quick Menu',
    footerNavEarCheck: 'Ear Balance Check',
    footerNavSeminar: 'Seminar Registration',
    footerSocialHeading: 'Channels',
    instagram: 'Instagram',
    smartStore: 'Naver Smart Store',
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',

    // Landing (offer/intro)
    offerProductTitle: 'Products for Ear Therapy',
    offerProductDesc: 'Check out ear therapy products<br>for self-care and expert care',
    offerProductBtn: 'Browse Products',
    offerSeminarTitle: 'Want to learn ear therapy in more depth?',
    offerSeminarDesc: 'Check out our current seminar<br>and education schedule',
    offerSeminarBtn: 'View Seminar Schedule',
    landingAriaLabel: 'About 730 Skin Ear Therapy',
    landingIntroTitle: 'Your body is sending<br>small signals.',
    landingIntroBody:
      'Fatigue, stress, lack of sleep —<br>' +
      'your body is always sending small signals,<br>' +
      'but they are easy to overlook.' +
      '<br><br>' +
      'Ear therapy helps you understand<br>' +
      "your body's balance through the ear<br>" +
      'and suggests self-care for a healthier daily life.',

    // Ear point list
    likeCountLoading: 'Loading...',
    likeAriaLabelSuffix: ' interest',
    likeCountNone: '♡ No interest yet',

    // Products
    productsLoading: 'Loading products...',
    productsEmpty: "Products are on the way. Please check back soon.",
    productsFeaturedBadge: 'Featured',
    productsBuyBtn: 'Buy Now',

    // Sleep ear point detail
    sdBackAriaLabel: 'Go back',
    sdHeroTitle: 'Ear Points<br>for Restful Sleep',
    sdHeroDesc: 'Self-care tips you can use<br>on nights when sleep feels difficult or restless',
    sdSectionTitle: 'Recommended Ear Points',
    sdTabShenmen: 'Shenmen',
    sdTabSympathetic: 'Sympathetic',
    sdTabEndocrine: 'Endocrine',
    sdTabBrainstem: 'Brainstem',
    sdPointDescShenmen: 'An ear point you can use as a reference to calm tension and help prepare for rest',
    sdPointDescSympathetic: 'A self-care point that may help you relax on days when your body feels sensitive and tense',
    sdPointDescEndocrine: "A point worth exploring as part of self-care for your body's everyday rhythm and balance",
    sdPointDescBrainstem: 'A reference point for care that helps ease overstimulation and prepare for restful rhythm',
    sdMapAlt: 'Ear point map showing the Shenmen, Sympathetic, Endocrine, and Brainstem locations',
    sdMapPlaceholderStrong: 'Please add the ear point image',
    sdMapPlaceholderBody: 'Name the image file<br>images/sleep-ear-map.png<br>and it will show automatically',
    sdReasonTitle: 'Why we recommend these ear points',
    sdReasonDesc: 'Shenmen, Sympathetic, Endocrine, and Brainstem work well together as a self-care routine that helps ease tension and overstimulation while preparing the body for rest',
    sdNotice: 'This information is provided for general self-care reference and is not a substitute for medical diagnosis or treatment'
  }
};

window.currentLanguage = 'ko';

window.t = function (key, language) {
  var lang = language || window.currentLanguage;
  var dict = window.translations[lang] || window.translations.ko;
  var koDict = window.translations.ko;
  if (dict && Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
  if (koDict && Object.prototype.hasOwnProperty.call(koDict, key)) return koDict[key];
  return '';
};
