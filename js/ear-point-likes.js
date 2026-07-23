window.EarPointLikes = (function () {
  var LIKED_KEY = 'likedEarPoints';
  var activeUnsubscribers = [];

  function getLikedIds() {
    try {
      return JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function setLikedIds(ids) {
    localStorage.setItem(LIKED_KEY, JSON.stringify(ids));
  }

  function isLiked(id) {
    return getLikedIds().indexOf(id) !== -1;
  }

  function addLiked(id) {
    var ids = getLikedIds();
    if (ids.indexOf(id) === -1) {
      ids.push(id);
      setLikedIds(ids);
    }
  }

  function removeLiked(id) {
    setLikedIds(getLikedIds().filter(function (existingId) {
      return existingId !== id;
    }));
  }

  // 라우트를 옮겼다 이어포인트로 돌아올 때마다 카드가 새로 그려지므로,
  // 이전 렌더링에서 붙여둔 실시간 리스너를 먼저 정리해 계속 쌓이지 않게 한다.
  function cleanup() {
    activeUnsubscribers.forEach(function (unsubscribe) { unsubscribe(); });
    activeUnsubscribers = [];
  }

  function initCard(db, card) {
    var id = card.dataset.pointId;
    var heartBtn = card.querySelector('.like-btn');
    var countEl = card.querySelector('.like-count');
    var docRef = db.collection('earPoints').doc(id);
    var busy = false;

    function renderPressed(pressed) {
      heartBtn.textContent = pressed ? '♥' : '♡';
      heartBtn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    }

    function renderCount(count) {
      countEl.textContent = count > 0
        ? '♥ ' + count + '명이 관심 있어요'
        : '♡ 아직 관심 표시가 없어요';
    }

    renderPressed(isLiked(id));

    // onSnapshot은 최초 값 로딩뿐 아니라, 다른 방문자가 좋아요를 누른 결과도
    // 실시간으로 반영해준다. 또한 우리가 update()를 호출하면 서버 응답 전에도
    // 로컬 캐시 기준으로 즉시 한 번 더 불려서, 별도 낙관적 업데이트 코드 없이도
    // "클릭 직후 즉시 반영"이 자연스럽게 이뤄진다.
    var unsubscribe = docRef.onSnapshot(function (doc) {
      renderCount(doc.exists ? (doc.data().likeCount || 0) : 0);
    }, function (err) {
      console.error('[EarPointLikes] "' + id + '" 좋아요 수를 불러오지 못했습니다:', err);
      renderCount(0);
    });
    activeUnsubscribers.push(unsubscribe);

    heartBtn.addEventListener('click', function () {
      if (busy) return;
      busy = true;

      var wasLiked = isLiked(id);
      var nowLiked = !wasLiked;
      var delta = nowLiked ? 1 : -1;

      renderPressed(nowLiked);
      if (nowLiked) addLiked(id); else removeLiked(id);

      heartBtn.classList.remove('is-animating');
      void heartBtn.offsetWidth;
      heartBtn.classList.add('is-animating');

      docRef.update({
        likeCount: firebase.firestore.FieldValue.increment(delta)
      }).then(function () {
        busy = false;
      }).catch(function (err) {
        console.error('[EarPointLikes] "' + id + '" 좋아요 반영에 실패했습니다:', err);
        // 서버 요청 실패: 개인 상태(로컬 스토리지)와 하트 표시만 되돌린다.
        // 공개 좋아요 숫자 자체는 onSnapshot이 서버의 실제 값으로 다시 맞춰준다.
        renderPressed(wasLiked);
        if (wasLiked) addLiked(id); else removeLiked(id);
        busy = false;
      });
    });
  }

  function init(container) {
    cleanup();

    var db = window.earPointsDb;
    if (!db) return;

    container.querySelectorAll('.point-card').forEach(function (card) {
      initCard(db, card);
    });
  }

  return { init: init };
})();
