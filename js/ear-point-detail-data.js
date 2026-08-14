// 이어포인트 상세페이지 전용 데이터 접근 모듈.
// public.ear_point_details / public.ear_point_related_points / public.user_ear_point_notes
// 를 다룬다 — 기존 public.ear_points(js/ear-points-data.js)는 건드리지 않는다.
// 세 테이블 모두 RLS로 승인된 교육생만 조회 가능하므로, 승인되지 않은
// 사용자는 이 모듈을 호출해도 빈 결과만 받는다. 실제 화면 전환(로그인
// 필요/승인 대기 등)은 js/access-control.js의 checkEducationAccess()가
// 이 모듈을 호출하기 전에 이미 끝낸다.
window.EarPointDetailRepo = (function () {
  function client() {
    return window.supabaseClient;
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  // ── 상세 콘텐츠(위치/이유/순서/관리/주의/영상) ──
  function loadDetail(pointId) {
    if (!client()) return Promise.resolve({ data: null, error: null });

    return client()
      .from('ear_point_details')
      .select('selection_reason, location_guide, combo_points, usage_steps, management_tips, avoid_when, video_title, video_url, video_description')
      .eq('ear_point_id', pointId)
      .maybeSingle()
      .then(function (res) {
        if (res.error || !res.data) {
          return { data: null, error: res.error || null };
        }
        var row = res.data;
        return {
          data: {
            selectionReason: row.selection_reason || '',
            locationGuide: row.location_guide || '',
            comboPoints: toArray(row.combo_points).filter(function (item) {
              return item && typeof item === 'object' && item.name;
            }),
            usageSteps: toArray(row.usage_steps).filter(Boolean),
            managementTips: toArray(row.management_tips).filter(Boolean),
            avoidWhen: toArray(row.avoid_when).filter(Boolean),
            videoTitle: row.video_title || '',
            videoUrl: row.video_url || '',
            videoDescription: row.video_description || ''
          },
          error: null
        };
      })
      .catch(function (err) {
        console.error('[EarPointDetailRepo] 상세 정보 조회 중 예외:', err);
        return { data: null, error: err };
      });
  }

  // ── 함께 활용하는 혈자리(최대 3개, sort_order 순) ──
  function loadRelated(pointId, limit) {
    if (!client()) return Promise.resolve({ data: [], error: null });

    return client()
      .from('ear_point_related_points')
      .select('related_ear_point_id, reason, sort_order')
      .eq('ear_point_id', pointId)
      .order('sort_order', { ascending: true })
      .limit(limit || 3)
      .then(function (res) {
        if (res.error || !res.data) {
          return { data: [], error: res.error || null };
        }
        return {
          data: res.data.map(function (row) {
            return { id: row.related_ear_point_id, reason: row.reason || '' };
          }),
          error: null
        };
      })
      .catch(function (err) {
        console.error('[EarPointDetailRepo] 관련 혈자리 조회 중 예외:', err);
        return { data: [], error: err };
      });
  }

  // ── 내 메모(본인 것만 RLS로 보장) ──
  function loadNote(userId, pointId) {
    if (!client()) return Promise.resolve({ data: null, error: null });

    return client()
      .from('user_ear_point_notes')
      .select('note, updated_at')
      .eq('user_id', userId)
      .eq('ear_point_id', pointId)
      .maybeSingle()
      .then(function (res) {
        if (res.error || !res.data) {
          return { data: null, error: res.error || null };
        }
        return { data: { note: res.data.note, updatedAt: res.data.updated_at }, error: null };
      })
      .catch(function (err) {
        console.error('[EarPointDetailRepo] 메모 조회 중 예외:', err);
        return { data: null, error: err };
      });
  }

  function saveNote(userId, pointId, noteText) {
    if (!client()) return Promise.resolve({ error: new Error('Supabase client not ready') });

    return client()
      .from('user_ear_point_notes')
      .upsert({
        user_id: userId,
        ear_point_id: pointId,
        note: noteText,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,ear_point_id' })
      .then(function (res) {
        return { error: res.error || null };
      })
      .catch(function (err) {
        return { error: err };
      });
  }

  function deleteNote(userId, pointId) {
    if (!client()) return Promise.resolve({ error: new Error('Supabase client not ready') });

    return client()
      .from('user_ear_point_notes')
      .delete()
      .eq('user_id', userId)
      .eq('ear_point_id', pointId)
      .then(function (res) {
        return { error: res.error || null };
      })
      .catch(function (err) {
        return { error: err };
      });
  }

  return {
    loadDetail: loadDetail,
    loadRelated: loadRelated,
    loadNote: loadNote,
    saveNote: saveNote,
    deleteNote: deleteNote
  };
})();
