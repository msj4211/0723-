// Supabase(user_favorites 테이블) 기반 구현.
// 기존 Firestore 버전은 js/ear-point-likes.firestore-backup.js에 그대로 남겨뒀다.
window.EarPointLikes = (function () {
  var client = window.supabaseClient;
  var activeChannel = null;
  var currentContainer = null;

  // 라우트를 옮겼다 이어포인트로 돌아올 때마다 카드가 새로 그려지므로,
  // 이전 렌더링에서 붙여둔 realtime 구독을 먼저 정리해 계속 쌓이지 않게 한다.
  function cleanup() {
    if (activeChannel) {
      client.removeChannel(activeChannel);
      activeChannel = null;
    }
  }

  function renderPressed(heartBtn, pressed) {
    heartBtn.textContent = pressed ? '♥' : '♡';
    heartBtn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  }

  function renderCount(countEl, count) {
    countEl.textContent = count > 0
      ? '♥ ' + count + '명이 관심 있어요'
      : '♡ 아직 관심 표시가 없어요';
  }

  function getCards(container) {
    var cards = {};
    container.querySelectorAll('.point-card').forEach(function (card) {
      cards[card.dataset.pointId] = {
        el: card,
        heartBtn: card.querySelector('.like-btn'),
        countEl: card.querySelector('.like-count')
      };
    });
    return cards;
  }

  function renderAll(cards, favorites, myUserId) {
    var counts = {};
    var likedByMe = {};

    favorites.forEach(function (row) {
      counts[row.ear_point_id] = (counts[row.ear_point_id] || 0) + 1;
      if (myUserId && row.user_id === myUserId) {
        likedByMe[row.ear_point_id] = true;
      }
    });

    Object.keys(cards).forEach(function (id) {
      renderCount(cards[id].countEl, counts[id] || 0);
      renderPressed(cards[id].heartBtn, !!likedByMe[id]);
    });
  }

  function loadFavorites(ids, cards) {
    client.auth.getSession().then(function (sessionRes) {
      var myUserId = sessionRes.data.session ? sessionRes.data.session.user.id : null;

      client
        .from('user_favorites')
        .select('ear_point_id, user_id')
        .in('ear_point_id', ids)
        .then(function (res) {
          if (res.error) {
            console.error('[EarPointLikes] 좋아요 정보를 불러오지 못했습니다:', res.error);
            return;
          }
          renderAll(cards, res.data || [], myUserId);
        });
    });
  }

  function toggleLike(id, cards, user) {
    var card = cards[id];
    var heartBtn = card.heartBtn;
    if (heartBtn.dataset.busy === 'true') return;
    heartBtn.dataset.busy = 'true';

    var wasLiked = heartBtn.getAttribute('aria-pressed') === 'true';
    var nowLiked = !wasLiked;

    // 낙관적 업데이트: 서버 응답을 기다리지 않고 즉시 반영한 뒤,
    // 실패하면 원래 상태로 되돌린다.
    renderPressed(heartBtn, nowLiked);
    heartBtn.classList.remove('is-animating');
    void heartBtn.offsetWidth;
    heartBtn.classList.add('is-animating');

    var currentCount = parseInt((card.countEl.textContent.match(/\d+/) || ['0'])[0], 10) || 0;
    renderCount(card.countEl, currentCount + (nowLiked ? 1 : -1));

    var request = nowLiked
      ? client.from('user_favorites').insert({ user_id: user.id, ear_point_id: id })
      : client.from('user_favorites').delete().eq('user_id', user.id).eq('ear_point_id', id);

    request.then(function (res) {
      heartBtn.dataset.busy = 'false';
      if (res.error) {
        console.error('[EarPointLikes] "' + id + '" 좋아요 반영에 실패했습니다:', res.error);
        renderPressed(heartBtn, wasLiked);
        renderCount(card.countEl, currentCount);
      }
    });
  }

  function init(container) {
    cleanup();
    if (!client) return;

    currentContainer = container;
    var cards = getCards(container);
    var ids = Object.keys(cards);
    if (ids.length === 0) return;

    Object.keys(cards).forEach(function (id) {
      cards[id].heartBtn.addEventListener('click', function () {
        window.Auth.requireAuth(function (user) {
          toggleLike(id, cards, user);
        });
      });
    });

    loadFavorites(ids, cards);

    // 다른 방문자가 좋아요를 누르거나 취소하면 실시간으로 반영한다.
    activeChannel = client
      .channel('user-favorites-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_favorites' }, function () {
        if (currentContainer === container) loadFavorites(ids, cards);
      })
      .subscribe();
  }

  return { init: init };
})();
