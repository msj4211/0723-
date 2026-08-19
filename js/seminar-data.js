// 세미나 신청 페이지 전용 데이터 접근 모듈.
// public.seminars / public.seminar_applications 를 다룬다.
// seminars는 published=true인 행만 anon/authenticated에 SELECT가
// 허용되고(RLS), seminar_applications는 published=true 이면서
// status='open'인 세미나에만 INSERT가 허용된다(RLS의 EXISTS 서브쿼리).
// seminar_applications에는 SELECT 권한 자체가 없으므로, insert 뒤에
// .select()를 절대 붙이지 않는다 — 붙이면 반환 행을 요청하다가 실패한다.
window.SeminarRepo = (function () {
  function client() {
    return window.supabaseClient;
  }

  // ── 공개된 세미나 목록 ──
  function loadPublishedSeminars() {
    if (!client()) return Promise.resolve({ data: [], error: null });

    return client()
      .from('seminars')
      .select('id, title, title_en, description, description_en, location, location_en, notes, notes_en, starts_at, ends_at, price, capacity, status, kakao_url, sort_order')
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .order('starts_at', { ascending: true })
      .then(function (res) {
        if (res.error) {
          return { data: [], error: res.error };
        }
        return { data: res.data || [], error: null };
      })
      .catch(function (err) {
        console.error('[SeminarRepo] 세미나 목록 조회 중 예외:', err);
        return { data: [], error: err };
      });
  }

  // ── 신청서 저장 ──
  function submitApplication(payload) {
    if (!client()) return Promise.resolve({ error: new Error('Supabase client not ready') });

    return client()
      .from('seminar_applications')
      .insert({
        seminar_id: payload.seminar_id,
        name: payload.name,
        phone: payload.phone,
        applicant_type: payload.applicant_type,
        purposes: payload.purposes,
        privacy_agreed: payload.privacy_agreed,
        privacy_policy_version: payload.privacy_policy_version
      })
      .then(function (res) {
        return { error: res.error || null };
      })
      .catch(function (err) {
        return { error: err };
      });
  }

  return {
    loadPublishedSeminars: loadPublishedSeminars,
    submitApplication: submitApplication
  };
})();
