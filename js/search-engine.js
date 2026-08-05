// 사이트 통합 검색 엔진. 이어포인트(js/search-data.js)와 상품(Supabase)을
// 하나의 색인으로 모아 검색·자동완성·최근 검색어를 제공한다.
window.Search = (function () {
  var RECENT_KEY = 'siteRecentSearches';
  var RECENT_MAX = 5;
  var SUGGEST_MAX = 5;

  var productsCache = null;
  var productsFetchStarted = false;

  // 검색어를 입력하는 시점에는 이미 상품 목록이 준비돼 있도록, 페이지 로드
  // 직후 한 번 미리 불러와 캐시해둔다. 실패해도 이어포인트/세미나 검색은
  // 그대로 동작한다.
  function fetchProductsIndex() {
    if (productsFetchStarted) return;
    productsFetchStarted = true;

    var client = window.supabaseClient;
    if (!client) {
      productsCache = [];
      return;
    }

    client.from('products').select('*').eq('status', 'active').then(function (res) {
      productsCache = (!res.error && res.data) ? res.data : [];
    }).catch(function () {
      productsCache = [];
    });
  }
  fetchProductsIndex();

  function buildIndex() {
    var lang = window.currentLanguage;
    var earPointLabel = window.t ? window.t('searchTypeEarPoint') : '이어포인트';
    var seminarLabel = window.t ? window.t('searchTypeSeminar') : '세미나';
    var productLabel = window.t ? window.t('searchTypeProduct') : '상품';
    var items = [];

    (window.EarPointsData || []).forEach(function (p) {
      items.push({
        type: 'earPoint',
        typeLabel: earPointLabel,
        title: (lang === 'en' && p.name_en) ? p.name_en : p.name,
        desc: (lang === 'en' && p.desc_en) ? p.desc_en : p.desc,
        keywords: p.keywords || [],
        route: '#/ear-point?point=' + encodeURIComponent(p.id)
      });
    });

    (window.SleepPointsData || []).forEach(function (p) {
      items.push({
        type: 'earPoint',
        typeLabel: earPointLabel,
        title: (lang === 'en' && p.name_en) ? p.name_en : p.name,
        desc: (lang === 'en' && p.desc_en) ? p.desc_en : p.desc,
        keywords: p.keywords || [],
        route: '#/recommend/sleep?point=' + encodeURIComponent(p.id)
      });
    });

    (window.SeminarData || []).forEach(function (s) {
      items.push({
        type: 'seminar',
        typeLabel: seminarLabel,
        title: (lang === 'en' && s.name_en) ? s.name_en : s.name,
        desc: (lang === 'en' && s.desc_en) ? s.desc_en : s.desc,
        keywords: s.keywords || [],
        route: '#/seminar'
      });
    });

    (productsCache || []).forEach(function (p) {
      var name = (lang === 'en' && p.name_en) ? p.name_en : p.name;
      if (!name) return;
      var summary = (lang === 'en' && p.summary_en) ? p.summary_en : p.summary;
      items.push({
        type: 'product',
        typeLabel: productLabel,
        title: name,
        desc: summary || '',
        keywords: [],
        route: '#/products'
      });
    });

    return items;
  }

  // 검색어와 동의어 그룹을 비교해, 같은 그룹에 속한 모든 단어를 매칭
  // 대상으로 확장한다. 예: "불면" 입력 → ["불면", "수면", "잠", "숙면"].
  function expandTerms(rawQuery) {
    var q = rawQuery.trim().toLowerCase();
    var terms = [q];

    Object.keys(window.SearchSynonyms || {}).forEach(function (canonical) {
      var group = [canonical].concat(window.SearchSynonyms[canonical]).map(function (t) {
        return t.toLowerCase();
      });
      if (group.indexOf(q) !== -1) {
        group.forEach(function (t) {
          if (terms.indexOf(t) === -1) terms.push(t);
        });
      }
    });

    return terms;
  }

  function itemMatches(item, terms) {
    var haystack = [item.title, item.desc, item.typeLabel]
      .concat(item.keywords || [])
      .join(' ')
      .toLowerCase();
    return terms.some(function (term) {
      return term && haystack.indexOf(term) !== -1;
    });
  }

  function search(rawQuery) {
    var q = (rawQuery || '').trim();
    if (!q) return [];
    var terms = expandTerms(q);
    return buildIndex().filter(function (item) {
      return itemMatches(item, terms);
    });
  }

  function suggest(rawQuery, limit) {
    var q = (rawQuery || '').trim();
    if (q.length < 2) return [];
    return search(q).slice(0, limit || SUGGEST_MAX);
  }

  // ── 최근 검색어 (localStorage) ──
  function getRecent() {
    try {
      var raw = localStorage.getItem(RECENT_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveRecent(list) {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch (e) {
      // 저장 공간이 없거나 접근이 막힌 환경에서는 조용히 무시한다.
    }
  }

  function addRecent(term) {
    var q = (term || '').trim();
    if (!q) return;
    var list = getRecent().filter(function (t) {
      return t.toLowerCase() !== q.toLowerCase();
    });
    list.unshift(q);
    saveRecent(list.slice(0, RECENT_MAX));
  }

  function removeRecent(term) {
    saveRecent(getRecent().filter(function (t) { return t !== term; }));
  }

  function clearRecent() {
    saveRecent([]);
  }

  return {
    search: search,
    suggest: suggest,
    getRecent: getRecent,
    addRecent: addRecent,
    removeRecent: removeRecent,
    clearRecent: clearRecent
  };
})();
