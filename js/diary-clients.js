/* 730 다이어리 고객 관리 — PMS 다이어리 / 트러블 다이어리 공용
 * 원장님이 로그인한 상태면 다이어리 위에 '고객 고르기' 칸이 생긴다.
 * - '내 기록 (이 기기)': 예전처럼 이 기기 브라우저에만 저장
 * - 고객을 고르면: 그 고객 기록을 원장님 계정(Supabase)에 저장 → 어느 기기에서나 보인다
 */
(function () {
  "use strict";

  var EN = {
    "기록 대상": "Recording for",
    "내 기록 (이 기기)": "My record (this device)",
    "+ 새 고객 추가": "+ Add client",
    "고객 정보": "Client info",
    "새 고객": "New client",
    "이름 (또는 별칭)": "Name (or nickname)",
    "메모 (구분용, 선택)": "Memo (optional)",
    "예: 010-****-1234 / 화요일 관리": "e.g. phone last 4 digits / Tuesday care",
    "저장": "Save",
    "취소": "Cancel",
    "고객 삭제": "Delete client",
    "이름을 적어 주세요": "Please enter a name",
    "불러오는 중…": "Loading…",
    "저장 중…": "Saving…",
    "계정에 저장됨": "Saved to account",
    "저장 실패 · 다시 시도": "Save failed · Retry",
    "불러오지 못했어요": "Couldn't load",
    "고객 기록은 원장님 계정에만 저장되고, 원장님만 볼 수 있어요.": "Client records are saved only to your account and only you can see them.",
    "이 고객과 다이어리 기록을 모두 지울까요? 되돌릴 수 없어요.": "Delete this client and all diary records? This can't be undone.",
    "고객을 추가했어요": "Client added",
    "고객 정보를 저장했어요": "Client info saved",
    "고객을 지웠어요": "Client deleted"
  };
  function isEn() {
    try { if (typeof LANG !== "undefined") return LANG === "en"; } catch (e) {}
    return false;
  }
  function t(s) { return isEn() && Object.prototype.hasOwnProperty.call(EN, s) ? EN[s] : s; }

  function client() {
    try { if (window.parent && window.parent !== window && window.parent.supabaseClient) return window.parent.supabaseClient; } catch (e) {}
    return window.supabaseClient || null;
  }

  var opts = null;
  var clients = [];
  var activeId = "";      // "" = 내 기록 (이 기기)
  var userId = null;
  var saveTimer = null, pending = null, saving = false;
  var els = {};

  function lastKey() { return "730-diary-client-" + opts.kind + (userId ? "-" + userId : ""); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function injectStyle() {
    if (document.getElementById("dc-style")) return;
    var st = document.createElement("style");
    st.id = "dc-style";
    st.textContent =
      ".dc-bar{display:flex;align-items:center;gap:8px;margin:-4px 0 14px;flex-wrap:wrap}" +
      ".dc-bar label{font-size:13px;color:var(--sub,#8A8378);white-space:nowrap}" +
      ".dc-bar select{flex:1;min-width:150px;border:1px solid var(--line,#DDD6C8);border-radius:12px;padding:9px 10px;font:inherit;background:#fff;color:var(--ink,#2E2A26)}" +
      ".dc-edit{border:1px solid var(--line,#DDD6C8);background:#fff;border-radius:999px;padding:8px 12px;font:inherit;font-size:13px;cursor:pointer;color:var(--ink,#2E2A26)}" +
      ".dc-status{width:100%;font-size:12px;color:var(--sub,#8A8378);min-height:16px}" +
      ".dc-status.err{color:#B5503F;cursor:pointer;text-decoration:underline}" +
      ".dc-memo{width:100%;font-size:12px;color:var(--brown,#7A5C3E);margin-top:-4px}" +
      ".dc-modal{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:flex-end;justify-content:center;z-index:9999}" +
      ".dc-modal[hidden]{display:none}" +
      ".dc-box{background:#fff;width:100%;max-width:520px;border-radius:20px 20px 0 0;padding:18px 16px 22px}" +
      ".dc-box h3{margin:0 0 6px;font-size:16px}" +
      ".dc-box .dc-note{font-size:12px;color:var(--sub,#8A8378);margin:0 0 6px}" +
      ".dc-box label{display:block;font-size:13px;color:var(--sub,#8A8378);margin:10px 0 4px}" +
      ".dc-box input{width:100%;box-sizing:border-box;border:1px solid var(--line,#DDD6C8);border-radius:12px;padding:10px;font:inherit}" +
      ".dc-row{display:flex;gap:8px;margin-top:14px}" +
      ".dc-row button{flex:1;border:0;border-radius:999px;padding:12px;font:inherit;font-weight:700;cursor:pointer}" +
      ".dc-save{background:var(--brand,#FFCC00);color:#000}" +
      ".dc-cancel{background:#fff;border:1px solid var(--line,#DDD6C8)!important}" +
      ".dc-del{display:block;margin:12px auto 0;background:none;border:0;color:#B5503F;font:inherit;font-size:13px;cursor:pointer}";
    document.head.appendChild(st);
  }

  function buildUi() {
    injectStyle();
    var bar = document.createElement("div");
    bar.className = "dc-bar";
    bar.innerHTML =
      '<label for="dc-select"></label>' +
      '<select id="dc-select"></select>' +
      '<button type="button" class="dc-edit" id="dc-edit"></button>' +
      '<div class="dc-memo" id="dc-memo"></div>' +
      '<div class="dc-status" id="dc-status"></div>';
    var header = document.querySelector(".wrap > header") || document.querySelector("header");
    if (header && header.parentNode) header.parentNode.insertBefore(bar, header.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);

    var modal = document.createElement("div");
    modal.className = "dc-modal";
    modal.hidden = true;
    modal.innerHTML =
      '<div class="dc-box" role="dialog" aria-modal="true">' +
      '<h3 id="dc-title"></h3>' +
      '<p class="dc-note" id="dc-note"></p>' +
      '<label for="dc-name" id="dc-name-l"></label><input id="dc-name" maxlength="40" autocomplete="off">' +
      '<label for="dc-memo-in" id="dc-memo-l"></label><input id="dc-memo-in" maxlength="200" autocomplete="off">' +
      '<div class="dc-row"><button type="button" class="dc-cancel" id="dc-cancel"></button><button type="button" class="dc-save" id="dc-save"></button></div>' +
      '<button type="button" class="dc-del" id="dc-del"></button>' +
      '</div>';
    document.body.appendChild(modal);

    els = {
      bar: bar, select: bar.querySelector("#dc-select"), edit: bar.querySelector("#dc-edit"),
      memo: bar.querySelector("#dc-memo"), status: bar.querySelector("#dc-status"), label: bar.querySelector("label"),
      modal: modal, title: modal.querySelector("#dc-title"), note: modal.querySelector("#dc-note"),
      name: modal.querySelector("#dc-name"), memoIn: modal.querySelector("#dc-memo-in"),
      nameL: modal.querySelector("#dc-name-l"), memoL: modal.querySelector("#dc-memo-l"),
      save: modal.querySelector("#dc-save"), cancel: modal.querySelector("#dc-cancel"), del: modal.querySelector("#dc-del")
    };
    els.select.onchange = onSelect;
    els.edit.onclick = function () { openModal(activeId ? findClient(activeId) : null); };
    els.cancel.onclick = closeModal;
    modal.onclick = function (e) { if (e.target === modal) closeModal(); };
    els.save.onclick = submitModal;
    els.del.onclick = deleteClient;
    els.status.onclick = function () { if (els.status.classList.contains("err") && pending) flush(); };
    applyText();
  }

  function applyText() {
    if (!els.bar) return;
    els.label.textContent = t("기록 대상");
    els.edit.textContent = activeId ? t("고객 정보") : t("+ 새 고객 추가");
    els.nameL.textContent = t("이름 (또는 별칭)");
    els.memoL.textContent = t("메모 (구분용, 선택)");
    els.memoIn.placeholder = t("예: 010-****-1234 / 화요일 관리");
    els.save.textContent = t("저장");
    els.cancel.textContent = t("취소");
    els.del.textContent = t("고객 삭제");
    els.note.textContent = t("고객 기록은 원장님 계정에만 저장되고, 원장님만 볼 수 있어요.");
    renderSelect();
  }

  function findClient(id) { for (var i = 0; i < clients.length; i++) if (clients[i].id === id) return clients[i]; return null; }

  function renderSelect() {
    var html = '<option value="">' + esc(t("내 기록 (이 기기)")) + "</option>";
    clients.forEach(function (c) { html += '<option value="' + esc(c.id) + '">' + esc(c.name) + "</option>"; });
    html += '<option value="__new">' + esc(t("+ 새 고객 추가")) + "</option>";
    els.select.innerHTML = html;
    els.select.value = activeId;
    var c = activeId ? findClient(activeId) : null;
    els.memo.textContent = c && c.memo ? c.memo : "";
    els.memo.style.display = c && c.memo ? "" : "none";
    els.edit.textContent = activeId ? t("고객 정보") : t("+ 새 고객 추가");
  }

  function setStatus(msg, err) {
    if (!els.status) return;
    els.status.textContent = msg || "";
    els.status.classList.toggle("err", !!err);
  }

  function toast(msg) { try { if (typeof window.toast === "function") window.toast(msg); } catch (e) {} }

  async function loadClients() {
    var res = await client().from("diary_clients").select("id,name,memo").eq("kind", opts.kind).order("created_at", { ascending: true });
    if (res.error) throw res.error;
    clients = res.data || [];
  }

  async function switchTo(id) {
    await flush();
    if (!id) {
      activeId = "";
      try { localStorage.setItem(lastKey(), ""); } catch (e) {}
      renderSelect(); setStatus("");
      opts.onSwitch(null);
      return;
    }
    setStatus(t("불러오는 중…"));
    var res = await client().from("diary_records").select("data").eq("client_id", id).eq("kind", opts.kind).maybeSingle();
    if (res.error) { setStatus(t("불러오지 못했어요"), true); renderSelect(); return; }
    activeId = id;
    try { localStorage.setItem(lastKey(), id); } catch (e) {}
    renderSelect();
    setStatus(res.data ? t("계정에 저장됨") : "");
    opts.onSwitch(res.data && res.data.data ? res.data.data : opts.defaults());
  }

  function onSelect() {
    var v = els.select.value;
    if (v === "__new") { els.select.value = activeId; openModal(null); return; }
    switchTo(v);
  }

  var editing = null;
  function openModal(c) {
    editing = c;
    els.title.textContent = c ? t("고객 정보") : t("새 고객");
    els.name.value = c ? c.name : "";
    els.memoIn.value = c ? (c.memo || "") : "";
    els.del.style.display = c ? "" : "none";
    els.modal.hidden = false;
    setTimeout(function () { try { els.name.focus(); } catch (e) {} }, 30);
  }
  function closeModal() { els.modal.hidden = true; editing = null; }

  async function submitModal() {
    var name = els.name.value.trim(), memo = els.memoIn.value.trim();
    if (!name) { els.name.focus(); toast(t("이름을 적어 주세요")); return; }
    els.save.disabled = true;
    try {
      if (editing) {
        var r = await client().from("diary_clients").update({ name: name, memo: memo }).eq("id", editing.id);
        if (r.error) throw r.error;
        editing.name = name; editing.memo = memo;
        closeModal(); renderSelect(); toast(t("고객 정보를 저장했어요"));
      } else {
        var ins = await client().from("diary_clients").insert({ name: name, memo: memo, kind: opts.kind }).select("id,name,memo").single();
        if (ins.error) throw ins.error;
        clients.push(ins.data);
        closeModal(); toast(t("고객을 추가했어요"));
        await switchTo(ins.data.id);
      }
    } catch (e) {
      console.warn("[diary-clients]", e);
      toast(t("저장 실패 · 다시 시도"));
    } finally { els.save.disabled = false; }
  }

  async function deleteClient() {
    if (!editing) return;
    var ok = true;
    try { ok = window.confirm(t("이 고객과 다이어리 기록을 모두 지울까요? 되돌릴 수 없어요.")); } catch (e) {}
    if (!ok) return;
    var id = editing.id;
    var r = await client().from("diary_clients").delete().eq("id", id);
    if (r.error) { toast(t("저장 실패 · 다시 시도")); return; }
    clients = clients.filter(function (c) { return c.id !== id; });
    if (activeId === id) pending = null;
    closeModal(); toast(t("고객을 지웠어요"));
    await switchTo(activeId === id ? "" : activeId);
  }

  async function flush() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (!pending || saving) return;
    var job = pending; pending = null; saving = true;
    setStatus(t("저장 중…"));
    try {
      var r = await client().from("diary_records").upsert({ client_id: job.id, kind: opts.kind, data: job.data }, { onConflict: "client_id,kind" });
      if (r.error) throw r.error;
      if (job.id === activeId && !pending) setStatus(t("계정에 저장됨"));
    } catch (e) {
      console.warn("[diary-clients] save", e);
      if (!pending) pending = job;
      if (job.id === activeId) setStatus(t("저장 실패 · 다시 시도"), true);
    } finally {
      saving = false;
      if (pending) saveTimer = setTimeout(flush, 800);
    }
  }

  window.DiaryClients = {
    /* 고객이 선택돼 있으면 true — 이때 다이어리는 localStorage 대신 queueSave()로 저장한다 */
    active: function () { return !!activeId; },
    queueSave: function (data) {
      if (!activeId) return;
      pending = { id: activeId, data: JSON.parse(JSON.stringify(data)) };
      setStatus(t("저장 중…"));
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(flush, 600);
    },
    refreshLanguage: applyText,
    init: async function (o) {
      opts = o;
      var sb = client();
      if (!sb || !sb.auth) return;
      try {
        var s = await sb.auth.getSession();
        var user = s && s.data && s.data.session && s.data.session.user;
        if (!user) return;
        userId = user.id;
        await loadClients();
      } catch (e) {
        console.warn("[diary-clients] 고객 기능을 켜지 못했어요 (DB 설정 전일 수 있음)", e);
        return;
      }
      buildUi();
      var last = "";
      try { last = localStorage.getItem(lastKey()) || ""; } catch (e) {}
      if (last && findClient(last)) await switchTo(last);
      window.addEventListener("pagehide", function () { if (pending) flush(); });
      document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden" && pending) flush(); });
    }
  };
})();
