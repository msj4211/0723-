// 교육생 전용 이어포인트 콘텐츠(이름/설명/이미지)를 Supabase에서 불러온다.
// 이 파일 자체는 public JS 번들이지만, 실제 텍스트는 여기 들어있지 않고
// 요청 시점에 Supabase에서 가져온다 — RLS가 승인된 교육생이 아니면
// public.ear_points 조회 자체를 막기 때문에, 승인되지 않은 사용자는
// 이 파일을 열어봐도 콘텐츠를 얻을 수 없다.
//
// 실제 ear_points 테이블에는 id/name/description/image_url/created_at만
// 있다(영문 이름·정렬순서·검색 키워드 컬럼 없음) — 이 파일도 그 4개
// 필드만 다룬다. 새 컬럼이나 데이터를 추가하지 않는다.
window.EarPointsRepo = (function () {
  var loadPromise = null;

  function client() {
    return window.supabaseClient;
  }

  function toItem(row) {
    return {
      id: row.id,
      name: row.name,
      desc: row.description,
      imageUrl: row.image_url || null
    };
  }

  function populateLegacyGlobal(items) {
    // js/search-engine.js는 그대로 두고 이 전역 변수만 채워서, 검색
    // 색인이 자연스럽게 승인된 사용자에게만 이어포인트 결과를 보여주게
    // 한다(미승인 사용자는 아래 load()가 빈 배열을 돌려주므로 색인도 비어있다).
    window.EarPointsData = items;
  }

  // 승인된 교육생 세션 동안 한 번만 불러와 캐시한다. 로그아웃하거나 승인
  // 상태가 바뀌면 js/access-control.js가 clearCache()를 호출해서, 다음
  // 승인 세션에서 다시 받아오게 한다.
  function load() {
    if (loadPromise) return loadPromise;

    if (!client()) {
      populateLegacyGlobal([]);
      return Promise.resolve([]);
    }

    loadPromise = client().from('ear_points').select('id, name, description, image_url').then(function (res) {
      if (res.error || !res.data) {
        if (res.error) console.error('[EarPointsRepo] ear_points 조회 실패:', res.error);
        populateLegacyGlobal([]);
        return [];
      }
      var items = res.data.map(toItem);
      populateLegacyGlobal(items);
      return items;
    }).catch(function (err) {
      console.error('[EarPointsRepo] ear_points 조회 중 예외:', err);
      populateLegacyGlobal([]);
      return [];
    });

    return loadPromise;
  }

  function clearCache() {
    loadPromise = null;
    window.EarPointsData = [];
  }

  return {
    load: load,
    clearCache: clearCache
  };
})();
