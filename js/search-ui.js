(function () {
  var POPULAR_TERMS = ['수면', '스트레스', '두통', '소화', '면역', '무릎'];

  function navigateTo(hash) {
    window.location.hash = hash;
  }

  function submitSearch(rawQuery) {
    var q = (rawQuery || '').trim();
    if (!q) return;
    window.Search.addRecent(q);
    closeMobileSearchIfOpen();
    navigateTo('#/search?q=' + encodeURIComponent(q));
  }

  function selectResult(item, rawQuery) {
    var q = (rawQuery || '').trim();
    if (q) window.Search.addRecent(q);
    closeMobileSearchIfOpen();
    navigateTo(item.route);
  }

  // submitSearch/selectResult는 데스크톱 입력창과 모바일 전체화면 검색
  // 양쪽에서 공용으로 쓰인다. 모바일 검색이 열려 있는 상태에서 검색을
  // 실행하면, 이동 전에 오버레이부터 닫아야 다음 페이지에서 클릭이 막히지
  // 않는다(mobileOverlay/closeMobileSearch는 아래에서 선언되지만, 이 함수들은
  // 실제 클릭·제출 시점에만 호출되므로 그 무렵엔 이미 초기화가 끝나 있다).
  function closeMobileSearchIfOpen() {
    if (mobileOverlay && !mobileOverlay.hidden) closeMobileSearch();
  }

  // 검색 데이터는 우리가 관리하는 정적 데이터 + Supabase 상품이라 위험이
  // 낮지만, 사용자가 입력한 검색어를 그대로 화면에 반영하는 지점(자동완성
  // 목록, 최근 검색어)에서는 innerHTML 문자열 조합 대신 DOM API로 만들어
  // 항상 텍스트로만 삽입되게 한다.
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function buildSuggestionItem(item, index) {
    var row = el('div', 'search-suggestion-item');
    row.setAttribute('role', 'option');
    row.setAttribute('id', 'search-suggestion-' + index);
    row.dataset.index = String(index);

    var titleLine = el('p', 'search-suggestion-title');
    titleLine.appendChild(document.createTextNode(item.title));
    var typeSpan = el('span', 'search-suggestion-type', ' · ' + item.typeLabel);
    titleLine.appendChild(typeSpan);
    row.appendChild(titleLine);

    if (item.desc) {
      row.appendChild(el('p', 'search-suggestion-desc', item.desc));
    }

    return row;
  }

  // 데스크톱 헤더 입력창과 모바일 전체화면 입력창이 동일한 자동완성/키보드
  // 동작을 쓰도록 공통 로직을 하나로 묶는다.
  function createAutocomplete(inputEl, dropdownEl, options) {
    var items = [];
    var activeIndex = -1;
    var lastQuery = '';

    function close() {
      dropdownEl.hidden = true;
      dropdownEl.innerHTML = '';
      items = [];
      activeIndex = -1;
      inputEl.setAttribute('aria-expanded', 'false');
      inputEl.removeAttribute('aria-activedescendant');
    }

    function setActive(nextIndex) {
      var rows = dropdownEl.querySelectorAll('.search-suggestion-item');
      rows.forEach(function (row) { row.classList.remove('is-active'); row.setAttribute('aria-selected', 'false'); });

      activeIndex = nextIndex;
      if (activeIndex >= 0 && rows[activeIndex]) {
        rows[activeIndex].classList.add('is-active');
        rows[activeIndex].setAttribute('aria-selected', 'true');
        inputEl.setAttribute('aria-activedescendant', rows[activeIndex].id);
      } else {
        inputEl.removeAttribute('aria-activedescendant');
      }
    }

    function render() {
      dropdownEl.innerHTML = '';
      items.forEach(function (item, index) {
        var row = buildSuggestionItem(item, index);
        row.addEventListener('mousedown', function (e) {
          // input의 blur보다 먼저 처리되도록 mousedown에서 선택한다.
          e.preventDefault();
          selectResult(item, lastQuery);
          close();
        });
        dropdownEl.appendChild(row);
      });
      dropdownEl.hidden = items.length === 0;
      inputEl.setAttribute('aria-expanded', items.length > 0 ? 'true' : 'false');
      setActive(-1);
    }

    function update() {
      var q = inputEl.value;
      lastQuery = q;

      if (q.trim().length < 2) {
        close();
        if (options && options.onEmptyQuery) options.onEmptyQuery();
        return;
      }

      if (options && options.onQuery) options.onQuery();
      items = window.Search.suggest(q);
      render();
    }

    inputEl.addEventListener('input', update);

    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        if (items.length === 0) return;
        e.preventDefault();
        setActive(Math.min(activeIndex + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        if (items.length === 0) return;
        e.preventDefault();
        setActive(Math.max(activeIndex - 1, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && items[activeIndex]) {
          selectResult(items[activeIndex], lastQuery);
          close();
        } else {
          submitSearch(inputEl.value);
          close();
        }
      } else if (e.key === 'Escape') {
        if (!dropdownEl.hidden) {
          e.preventDefault();
          close();
        }
      }
    });

    inputEl.addEventListener('blur', function () {
      // 자동완성 항목 클릭은 mousedown에서 이미 처리했으므로, blur 시점에는
      // 그냥 닫기만 하면 된다.
      window.setTimeout(close, 0);
    });

    return { close: close };
  }

  // ===== 데스크톱 인라인 검색 =====
  var headerInput = document.getElementById('header-search-input');
  var headerDropdown = document.getElementById('header-search-suggestions');
  var headerBtn = document.getElementById('header-search-btn');
  var searchArea = document.querySelector('.search-area');

  var headerAutocomplete = null;
  if (headerInput && headerDropdown) {
    headerAutocomplete = createAutocomplete(headerInput, headerDropdown, {});
  }

  function isMobileHeaderLayout() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  if (headerBtn) {
    headerBtn.addEventListener('click', function () {
      if (isMobileHeaderLayout()) {
        openMobileSearch();
      } else {
        submitSearch(headerInput.value);
        if (headerAutocomplete) headerAutocomplete.close();
      }
    });
  }

  // 모바일에서는 입력창이 숨어 있으므로, 아이콘뿐 아니라 검색 영역 전체를
  // 눌러도 전체화면 검색이 열리게 한다. 데스크톱에서는 입력창 클릭이 곧
  // 포커스이므로 별도 처리가 필요 없다 — 버튼에만 제출 동작을 건다.
  if (searchArea) {
    searchArea.addEventListener('click', function (e) {
      if (!isMobileHeaderLayout()) return;
      if (e.target === headerInput) return;
      e.preventDefault();
      openMobileSearch();
    });
  }

  // ===== 모바일 전체화면 검색 =====
  var mobileOverlay = document.getElementById('mobile-search-overlay');
  var mobileInput = document.getElementById('mobile-search-input');
  var mobileDropdown = document.getElementById('mobile-search-suggestions');
  var mobileClose = document.getElementById('mobile-search-close');
  var mobilePanels = document.getElementById('mobile-search-panels');

  function renderChip(container, label, onClick, onRemove) {
    var chip = el('div', 'search-recent-chip');
    var btn = el('button', 'search-recent-chip-label', label);
    btn.type = 'button';
    btn.addEventListener('click', onClick);
    chip.appendChild(btn);

    if (onRemove) {
      var removeBtn = el('button', 'search-recent-chip-remove');
      removeBtn.type = 'button';
      removeBtn.setAttribute('aria-label', (window.t ? window.t('searchRecentRemove') : '삭제') + ': ' + label);
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        onRemove();
      });
      chip.appendChild(removeBtn);
    }

    container.appendChild(chip);
  }

  function renderMobilePanels() {
    if (!mobilePanels) return;
    mobilePanels.innerHTML = '';

    var recent = window.Search.getRecent();
    if (recent.length > 0) {
      var recentSection = el('div', 'search-panel-section');
      var recentHeading = el('div', 'search-panel-heading-row');
      recentHeading.appendChild(el('p', 'search-panel-heading', window.t ? window.t('searchRecentHeading') : '최근 검색어'));

      var clearBtn = el('button', 'search-panel-clear', window.t ? window.t('searchRecentClearAll') : '전체 삭제');
      clearBtn.type = 'button';
      clearBtn.addEventListener('click', function () {
        window.Search.clearRecent();
        renderMobilePanels();
      });
      recentHeading.appendChild(clearBtn);
      recentSection.appendChild(recentHeading);

      var recentList = el('div', 'search-recent-list');
      recent.forEach(function (term) {
        renderChip(recentList, term, function () {
          submitSearch(term);
        }, function () {
          window.Search.removeRecent(term);
          renderMobilePanels();
        });
      });
      recentSection.appendChild(recentList);
      mobilePanels.appendChild(recentSection);
    }

    var popularSection = el('div', 'search-panel-section');
    popularSection.appendChild(el('p', 'search-panel-heading', window.t ? window.t('searchPopularHeading') : '추천 검색어'));
    var popularList = el('div', 'search-recent-list');
    POPULAR_TERMS.forEach(function (term) {
      renderChip(popularList, term, function () {
        submitSearch(term);
      }, null);
    });
    popularSection.appendChild(popularList);
    mobilePanels.appendChild(popularSection);
  }

  var mobileAutocomplete = null;
  if (mobileInput && mobileDropdown) {
    mobileAutocomplete = createAutocomplete(mobileInput, mobileDropdown, {
      onEmptyQuery: function () {
        if (mobilePanels) mobilePanels.hidden = false;
        renderMobilePanels();
      },
      onQuery: function () {
        if (mobilePanels) mobilePanels.hidden = true;
      }
    });
  }

  function openMobileSearch() {
    if (!mobileOverlay) return;
    if (window.HeaderNav && window.HeaderNav.closeMenu) window.HeaderNav.closeMenu();
    mobileOverlay.hidden = false;
    document.body.classList.add('no-scroll');
    renderMobilePanels();
    window.requestAnimationFrame(function () {
      mobileInput.focus();
    });
  }

  function closeMobileSearch() {
    if (!mobileOverlay) return;
    mobileOverlay.hidden = true;
    document.body.classList.remove('no-scroll');
    if (mobileAutocomplete) mobileAutocomplete.close();
  }

  if (mobileClose) {
    mobileClose.addEventListener('click', closeMobileSearch);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileOverlay && !mobileOverlay.hidden) {
      // 자동완성이 열려 있으면 그것부터 닫고, 닫혀 있으면 검색 화면 자체를 닫는다.
      if (mobileDropdown && !mobileDropdown.hidden) return;
      closeMobileSearch();
    }
  });

  // 다른 모듈(header.js)이 모바일 검색을 열 수 있도록 공개 API로 노출한다.
  window.SearchUI = {
    openMobileSearch: openMobileSearch,
    closeMobileSearch: closeMobileSearch
  };
})();
