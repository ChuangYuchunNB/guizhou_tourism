(function (global) {
  'use strict';

  const store = global.TravelStore;
  const ui = global.TravelUI;

  let currentBan = null; // { key, name }

  // 弹窗显隐必须同时操作 hidden 属性与 is-open 类：
  // CSS 中 .modal-overlay 默认 opacity:0，只有 .is-open 才 opacity:1，
  // 仅移除 hidden 会让弹窗“打开了但透明不可见”，且透明遮罩会拦截后续点击。
  function openModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(function () { modal.classList.add('is-open'); });
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    setTimeout(function () {
      modal.hidden = true;
      if (!document.querySelector('.modal-overlay:not([hidden])')) {
        document.body.classList.remove('modal-open');
      }
    }, 220);
  }

  function fmtDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const pad = (n) => String(n).padStart(2, '0');
    return (
      d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
    );
  }

  function roleBadge(role) {
    return role === 'ADMIN'
      ? '<span class="badge badge-admin">管理员</span>'
      : '<span class="badge badge-user">普通用户</span>';
  }

  function statusBadge(status) {
    return status === 'BANNED'
      ? '<span class="badge badge-banned">已封禁</span>'
      : '<span class="badge badge-active">正常</span>';
  }

  function setStat(name, value) {
    const el = document.querySelector('[data-stat="' + name + '"]');
    if (el) el.textContent = String(value);
  }

  function renderStats(users) {
    const total = users.length;
    const banned = users.filter((u) => u.status === 'BANNED').length;
    setStat('users', total);
    setStat('active', total - banned);
    setStat('banned', banned);
  }

  function emptyRow(cols, text) {
    return '<tr><td colspan="' + cols + '" class="empty-row">' + ui.escapeHtml(text) + '</td></tr>';
  }

  // ---------------- 用户管理 ----------------

  function renderUsers(users) {
    const wrap = document.getElementById('userTable');
    const me = store.currentUser();
    const myKey = me ? me.username.toLowerCase() : '';
    if (!users.length) {
      wrap.innerHTML = '<table class="data-table"><tbody>' + emptyRow(6, '暂无用户数据') + '</tbody></table>';
      return;
    }
    const head =
      '<thead><tr><th>用户名</th><th>角色</th><th>状态</th><th>注册时间</th><th>封禁信息</th><th class="col-action">操作</th></tr></thead>';
    const body = users
      .map(function (u) {
        const isSelf = (u.usernameKey && u.usernameKey.toLowerCase() === myKey) || u.username.toLowerCase() === myKey;
        const isAdminRow = u.role === 'ADMIN';
        let action;
        if (isAdminRow) {
          action = '<span class="muted">—</span>';
        } else if (isSelf) {
          action = '<span class="muted">当前账号</span>';
        } else if (u.status === 'BANNED') {
          action = '<button type="button" class="btn btn-quiet btn-sm" data-unban="' + ui.escapeHtml(u.usernameKey) + '">解封</button>';
        } else {
          action = '<button type="button" class="btn btn-danger btn-sm" data-ban="' + ui.escapeHtml(u.usernameKey) + '">封禁</button>';
        }
        const banInfo = u.status === 'BANNED'
          ? '<div class="ban-info"><div class="reason">' + ui.escapeHtml(u.banReason || '（未填写理由）') +
            '</div><div>执行人：' + ui.escapeHtml(u.bannedBy || '—') + ' · ' + fmtDate(u.bannedAt) + '</div></div>'
          : '<span class="muted">—</span>';
        return (
          '<tr>' +
          '<td><strong>' + ui.escapeHtml(u.username) + '</strong></td>' +
          '<td>' + roleBadge(u.role) + '</td>' +
          '<td>' + statusBadge(u.status) + '</td>' +
          '<td>' + fmtDate(u.createdAt) + '</td>' +
          '<td>' + banInfo + '</td>' +
          '<td class="col-action">' + action + '</td>' +
          '</tr>'
        );
      })
      .join('');
    wrap.innerHTML = '<table class="data-table">' + head + '<tbody>' + body + '</tbody></table>';
  }

  async function loadUsers() {
    const wrap = document.getElementById('userTable');
    wrap.innerHTML = '<table class="data-table"><tbody>' + emptyRow(6, '加载中…') + '</tbody></table>';
    try {
      const users = await store.adminListUsers();
      renderStats(users);
      renderUsers(users);
    } catch (error) {
      const msg = error.message || '加载失败';
      wrap.innerHTML = '<table class="data-table"><tbody>' + emptyRow(6, msg) + '</tbody></table>';
      ui.showToast(msg, 'error');
      if (msg.indexOf('权限') !== -1 || msg.indexOf('登录') !== -1) {
        setTimeout(function () {
          global.location.replace(store.currentUser() ? 'index.html' : 'login.html');
        }, 1200);
      }
    }
  }

  // ---------------- 景点管理 ----------------

  function renderSpots(spots) {
    const wrap = document.getElementById('spotTable');
    if (!spots.length) {
      wrap.innerHTML = '<table class="data-table"><tbody>' + emptyRow(6, '暂无景点') + '</tbody></table>';
      return;
    }
    const head = '<thead><tr><th>名称</th><th>等级</th><th>城市</th><th>评分</th><th>评分人数</th><th class="col-action">操作</th></tr></thead>';
    const body = spots
      .map(function (s) {
        return (
          '<tr>' +
          '<td><strong>' + ui.escapeHtml(s.name) + '</strong><div class="row-sub">' + ui.escapeHtml(s.id) + '</div></td>' +
          '<td><span class="badge badge-level">' + ui.escapeHtml(s.level) + '</span></td>' +
          '<td>' + ui.escapeHtml(s.city) + (s.area ? ' · ' + ui.escapeHtml(s.area) : '') + '</td>' +
          '<td>' + Number(s.rating).toFixed(1) + '</td>' +
          '<td>' + (s.ratingCount || 0) + '</td>' +
          '<td class="col-action"><button type="button" class="btn btn-danger btn-sm" data-del-spot="' + ui.escapeHtml(s.id) + '" data-name="' + ui.escapeHtml(s.name) + '">删除</button></td>' +
          '</tr>'
        );
      })
      .join('');
    wrap.innerHTML = '<table class="data-table">' + head + '<tbody>' + body + '</tbody></table>';
  }

  async function loadSpots() {
    const wrap = document.getElementById('spotTable');
    wrap.innerHTML = '<table class="data-table"><tbody>' + emptyRow(6, '加载中…') + '</tbody></table>';
    try {
      const spots = await store.adminListSpots();
      renderSpots(spots);
    } catch (error) {
      const msg = error.message || '加载失败';
      wrap.innerHTML = '<table class="data-table"><tbody>' + emptyRow(6, msg) + '</tbody></table>';
      ui.showToast(msg, 'error');
    }
  }

  function openSpotModal() {
    const form = document.getElementById('spotForm');
    form.reset();
    openModal(document.getElementById('spotModal'));
  }

  function closeSpotModal() {
    closeModal(document.getElementById('spotModal'));
  }

  function splitList(value) {
    return String(value || '')
      .split(/[,，]/)
      .map(function (t) { return t.trim(); })
      .filter(Boolean);
  }

  function collectSpotForm() {
    const form = document.getElementById('spotForm');
    const val = function (name) {
      const el = form.querySelector('[name="' + name + '"]');
      return el ? el.value : '';
    };
    return {
      id: val('id'),
      name: val('name'),
      level: val('level'),
      city: val('city'),
      area: val('area'),
      address: val('address'),
      rating: val('rating') === '' ? 0 : Number(val('rating')),
      ratingCount: val('ratingCount') === '' ? 0 : Number(val('ratingCount')),
      summary: val('summary'),
      intro: val('intro'),
      tags: splitList(val('tags')),
      highlights: splitList(val('highlights')),
      bestSeason: val('bestSeason'),
      duration: val('duration'),
      ticket: val('ticket'),
      emoji: val('emoji'),
      heroImage: val('heroImage'),
      colors: [val('color1') || '#0d5c4d', val('color2') || '#4ade80']
    };
  }

  async function syncGlobalSpots() {
    try {
      const list = await store.adminListSpots();
      global.GZ_SPOTS = list;
      global.dispatchEvent(new CustomEvent('qz:spotsloaded', { detail: { count: list.length } }));
    } catch (error) { /* 忽略，不阻塞后台操作 */ }
  }

  async function submitSpot(event) {
    event.preventDefault();
    const payload = collectSpotForm();
    if (!payload.id || !payload.name || !payload.city) {
      ui.showToast('请填写景区标识、名称与所在城市', 'error');
      return;
    }
    try {
      await store.adminCreateSpot(payload);
      ui.showToast('已新增景点「' + payload.name + '」', 'success');
      closeSpotModal();
      await loadSpots();
      await syncGlobalSpots();
    } catch (error) {
      ui.showToast(error.message || '新增失败', 'error');
    }
  }

  async function deleteSpot(id, name) {
    if (!global.confirm('确认删除景点「' + name + '」？该景点下的所有评价也会被一并删除，且不可恢复。')) return;
    try {
      await store.adminDeleteSpot(id);
      ui.showToast('已删除景点「' + name + '」', 'success');
      await loadSpots();
      await syncGlobalSpots();
    } catch (error) {
      ui.showToast(error.message || '删除失败', 'error');
    }
  }

  // ---------------- 评论管理 ----------------

  function renderReviews(reviews) {
    const wrap = document.getElementById('reviewTable');
    const countEl = document.getElementById('reviewCount');
    if (countEl) countEl.textContent = String(reviews.length);
    if (!reviews.length) {
      wrap.innerHTML = '<table class="data-table"><tbody>' + emptyRow(5, '暂无用户评价') + '</tbody></table>';
      return;
    }
    const head = '<thead><tr><th>景区</th><th>用户</th><th>评分</th><th>内容</th><th>时间</th><th class="col-action">操作</th></tr></thead>';
    const body = reviews
      .map(function (r) {
        const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        return (
          '<tr>' +
          '<td>' + ui.escapeHtml(r.spotName || r.spotId) + '</td>' +
          '<td><strong>' + ui.escapeHtml(r.username) + '</strong></td>' +
          '<td class="col-rating">' + stars + ' <span class="muted">' + r.rating + '.0</span></td>' +
          '<td class="col-content">' + ui.escapeHtml(r.content || '（未填写文字）') + '</td>' +
          '<td>' + fmtDate(r.createdAt) + '</td>' +
          '<td class="col-action"><button type="button" class="btn btn-danger btn-sm" data-del-review="' + r.id + '">删除</button></td>' +
          '</tr>'
        );
      })
      .join('');
    wrap.innerHTML = '<table class="data-table">' + head + '<tbody>' + body + '</tbody></table>';
  }

  async function loadReviews() {
    const wrap = document.getElementById('reviewTable');
    wrap.innerHTML = '<table class="data-table"><tbody>' + emptyRow(5, '加载中…') + '</tbody></table>';
    try {
      const reviews = await store.adminListReviews();
      renderReviews(reviews);
    } catch (error) {
      const msg = error.message || '加载失败';
      wrap.innerHTML = '<table class="data-table"><tbody>' + emptyRow(5, msg) + '</tbody></table>';
      ui.showToast(msg, 'error');
    }
  }

  async function deleteReview(id) {
    if (!global.confirm('确认删除这条评价？删除后所有用户都将看不到，且不可恢复。')) return;
    try {
      await store.adminDeleteReview(id);
      ui.showToast('已删除该评价', 'success');
      await loadReviews();
      // 同步：若当前打开了该评价所属景区详情，刷新其评价区块
      global.dispatchEvent(new CustomEvent('qz:reviewchange', { detail: { spotId: '' } }));
    } catch (error) {
      ui.showToast(error.message || '删除失败', 'error');
    }
  }

  // ---------------- 封禁弹窗 ----------------

  function openBanModal(key, name) {
    currentBan = { key: key, name: name };
    document.getElementById('banTarget').textContent = name;
    const reason = document.getElementById('banReason');
    reason.value = '';
    document.getElementById('banReasonCount').textContent = '0';
    openModal(document.getElementById('banModal'));
    setTimeout(function () { reason.focus(); }, 50);
  }

  function closeBanModal() {
    currentBan = null;
    closeModal(document.getElementById('banModal'));
  }

  async function confirmBan() {
    if (!currentBan) return;
    const reason = document.getElementById('banReason').value.trim();
    if (!reason) {
      ui.showToast('请填写封禁理由', 'error');
      return;
    }
    try {
      await store.adminBanUser(currentBan.key, reason);
      ui.showToast('已封禁「' + currentBan.name + '」', 'success');
      closeBanModal();
      loadUsers();
    } catch (error) {
      ui.showToast(error.message || '操作失败', 'error');
    }
  }

  async function confirmUnban(key, name) {
    if (!global.confirm('确认解封用户「' + name + '」？解封后该用户可恢复正常登录。')) return;
    try {
      await store.adminUnbanUser(key);
      ui.showToast('已解封「' + name + '」', 'success');
      loadUsers();
    } catch (error) {
      ui.showToast(error.message || '操作失败', 'error');
    }
  }

  // ---------------- 标签页 ----------------

  function switchTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(function (btn) {
      const active = btn.getAttribute('data-tab') === tab;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.admin-panel').forEach(function (panel) {
      const show = panel.id === 'panel-' + tab;
      panel.classList.toggle('is-active', show);
      panel.hidden = !show;
    });
  }

  // ---------------- 事件绑定 ----------------

  function bindEvents() {
    // 标签页
    document.querySelectorAll('.admin-tab').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.getAttribute('data-tab')); });
    });

    // 用户表：封禁 / 解封
    document.getElementById('userTable').addEventListener('click', function (event) {
      const banBtn = event.target.closest('[data-ban]');
      const unbanBtn = event.target.closest('[data-unban]');
      if (banBtn) {
        const key = banBtn.getAttribute('data-ban');
        const name = banBtn.closest('tr').querySelector('strong').textContent;
        openBanModal(key, name);
      } else if (unbanBtn) {
        const key = unbanBtn.getAttribute('data-unban');
        const name = unbanBtn.closest('tr').querySelector('strong').textContent;
        confirmUnban(key, name);
      }
    });

    // 景点表：删除
    document.getElementById('spotTable').addEventListener('click', function (event) {
      const btn = event.target.closest('[data-del-spot]');
      if (btn) deleteSpot(btn.getAttribute('data-del-spot'), btn.getAttribute('data-name') || '该景点');
    });

    // 评价表：删除
    document.getElementById('reviewTable').addEventListener('click', function (event) {
      const btn = event.target.closest('[data-del-review]');
      if (btn) deleteReview(btn.getAttribute('data-del-review'));
    });

    // 新增景点
    document.getElementById('addSpotBtn').addEventListener('click', openSpotModal);
    document.getElementById('spotForm').addEventListener('submit', submitSpot);

    // 封禁弹窗
    document.getElementById('confirmBanBtn').addEventListener('click', confirmBan);
    document.getElementById('banReason').addEventListener('input', function (event) {
      document.getElementById('banReasonCount').textContent = String(event.target.value.length);
    });

    // 通用：点击遮罩或关闭按钮关闭弹窗；Esc 关闭
    document.querySelectorAll('[data-close-modal]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeSpotModal();
        closeBanModal();
      });
    });
    document.addEventListener('click', function (event) {
      if (event.target.classList && event.target.classList.contains('modal-overlay')) {
        closeSpotModal();
        closeBanModal();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeSpotModal();
        closeBanModal();
      }
    });
  }

  async function init() {
    ui.initShell();
    await store.verifySession();
    const me = store.currentUser();
    if (!me) {
      global.location.replace('login.html');
      return;
    }
    if (me.role !== 'ADMIN') {
      ui.showToast('无管理员权限', 'error');
      setTimeout(function () { global.location.replace('index.html'); }, 1000);
      return;
    }
    bindEvents();
    loadUsers();
    loadSpots();
    loadReviews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
