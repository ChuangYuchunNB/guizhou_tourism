(function (global) {
  'use strict';

  // 登录注册后端地址（Spring Boot，端口 8081）。
  // 后端可达时走真实数据；不可达（未启动 / 双击 HTML 以 file:// 打开被 CORS 拦截）时
  // 自动降级为浏览器本地离线模式，保证无需启动服务也能完整浏览、登录、收藏、评价与后台管理。
  var API_BASE = 'http://127.0.0.1:8081';

  const KEYS = {
    session: 'qianxing_session_v1',
    favorites: 'qianxing_favorites_v1_',
    reviews: 'qianxing_reviews_v1',
    accounts: 'qianxing_accounts_v1',
    spots: 'qianxing_spots_v1'
  };

  const memory = new Map();

  // 离线模式开关：首次网络失败后置 true，当前页面会话内不再尝试联网（刷新后可恢复在线）。
  let offlineActive = false;
  function markOffline() { offlineActive = true; }

  // 景点：内置 GZ_SPOTS 作兜底，启动后异步拉取服务端数据替换（管理员增删后全站同步）。
  let spotsLoaded = false;
  // 评价：按 spotId 缓存服务端评价；getReviews 同步返回缓存，未命中时触发异步加载。
  const reviewsCache = new Map();
  const reviewsLoading = new Set();

  function storageGet(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (error) {
      return memory.has(key) ? memory.get(key) : null;
    }
  }

  function storageSet(key, value) {
    try {
      global.localStorage.setItem(key, value);
    } catch (error) {
      memory.set(key, value);
    }
  }

  function storageRemove(key) {
    try {
      global.localStorage.removeItem(key);
    } catch (error) {
      memory.delete(key);
    }
  }

  function readJSON(key, fallback) {
    const raw = storageGet(key);
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    storageSet(key, JSON.stringify(value));
  }

  function emit(name, detail) {
    global.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  // 把网络异常标记为 .network，便于调用方区分“后端不可达”与“业务校验失败”，
  // 只有前者才降级到离线模式，避免把真实的业务错误（如密码错误）误判为离线。
  function netError(message) {
    const err = new Error(message);
    err.network = true;
    return err;
  }

  function normalizeUsername(username) {
    return String(username || '').trim();
  }

  function usernameKey(username) {
    return normalizeUsername(username).toLowerCase();
  }

  // 客户端预校验（避免明显错误走一次网络往返），最终校验以后端为准。
  function validateUsername(username) {
    const value = normalizeUsername(username);
    if (!value) return '请输入用户名';
    if (!/^[\u4e00-\u9fa5A-Za-z0-9_]{2,20}$/.test(value)) {
      return '用户名需为 2–20 位中文、字母、数字或下划线';
    }
    return '';
  }

  function validatePassword(password) {
    const value = String(password || '');
    if (!value) return '请输入密码';
    if (value.length < 6 || value.length > 32) return '密码长度需为 6–32 位';
    return '';
  }

  // 会话：{ username, token, role, createdAt, at }。token 由后端签发并持久化。
  function saveSession(data) {
    storageSet(
      KEYS.session,
      JSON.stringify({
        username: data.username,
        token: data.token,
        role: data.role || 'USER',
        createdAt: data.createdAt || null,
        at: Date.now()
      })
    );
  }

  function readSession() {
    return readJSON(KEYS.session, null);
  }

  /** 同步返回当前登录用户（被收藏/评价/头部渲染广泛调用，必须保持同步）。 */
  function currentUser() {
    const session = readSession();
    if (!session || !session.username) return null;
    return {
      username: session.username,
      createdAt: session.createdAt || null,
      role: session.role || 'USER'
    };
  }

  /** 统一调用后端鉴权接口，失败时抛出携带中文提示的 Error。 */
  async function authRequest(path, payload) {
    let resp;
    try {
      resp = await global.fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      throw netError('无法连接登录服务，请确认后端已启动（端口 8081）');
    }
    if (!resp.ok) {
      throw new Error('服务器错误（' + resp.status + '），请稍后再试');
    }
    let result;
    try {
      result = await resp.json();
    } catch (error) {
      throw new Error('服务器响应格式异常，请稍后再试');
    }
    if (!result || !result.success) {
      throw new Error((result && result.message) || '操作失败，请稍后再试');
    }
    return result.data;
  }

  // ==================== 离线鉴权（localStorage 模拟后端账号表） ====================

  function getAccounts() {
    let accounts = readJSON(KEYS.accounts, null);
    if (!accounts) {
      // 首次运行播种默认管理员，与后端默认账号保持一致，方便演示后台。
      accounts = {};
      const now = new Date().toISOString();
      accounts['admin'] = {
        username: 'admin',
        usernameKey: 'admin',
        password: 'admin123',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: now,
        banReason: null,
        bannedAt: null,
        bannedBy: null
      };
      writeJSON(KEYS.accounts, accounts);
    }
    return accounts;
  }

  function writeAccounts(accounts) {
    writeJSON(KEYS.accounts, accounts);
  }

  function offlineLogin(name, password) {
    const accounts = getAccounts();
    const key = usernameKey(name);
    const acc = accounts[key];
    if (!acc) throw new Error('用户不存在，请先注册');
    if (acc.status === 'BANNED') {
      throw new Error('该账号已被封禁' + (acc.banReason ? '：' + acc.banReason : ''));
    }
    if (acc.password !== String(password)) throw new Error('用户名或密码错误');
    saveSession({
      username: acc.username,
      token: 'offline-' + key + '-' + Date.now(),
      role: acc.role,
      createdAt: acc.createdAt
    });
    const user = { username: acc.username, createdAt: acc.createdAt, role: acc.role };
    emit('qz:authchange', { user: user, action: 'login' });
    return user;
  }

  function offlineRegister(name, password) {
    const accounts = getAccounts();
    const key = usernameKey(name);
    if (accounts[key]) throw new Error('该用户名已被注册');
    const now = new Date().toISOString();
    accounts[key] = {
      username: name,
      usernameKey: key,
      password: String(password),
      role: 'USER',
      status: 'ACTIVE',
      createdAt: now,
      banReason: null,
      bannedAt: null,
      bannedBy: null
    };
    writeAccounts(accounts);
    saveSession({
      username: name,
      token: 'offline-' + key + '-' + Date.now(),
      role: 'USER',
      createdAt: now
    });
    const user = { username: name, createdAt: now, role: 'USER' };
    emit('qz:authchange', { user: user, action: 'register' });
    return user;
  }

  async function register(username, password) {
    const name = normalizeUsername(username);
    const nameError = validateUsername(name);
    if (nameError) throw new Error(nameError);
    const passwordError = validatePassword(password);
    if (passwordError) throw new Error(passwordError);

    if (offlineActive) return offlineRegister(name, password);
    let data;
    try {
      data = await authRequest('/api/auth/register', {
        username: name,
        password: String(password)
      });
    } catch (error) {
      if (error.network) {
        markOffline();
        return offlineRegister(name, password);
      }
      throw error;
    }
    saveSession({ username: data.username, token: data.token, role: data.role, createdAt: data.createdAt });
    const user = { username: data.username, createdAt: data.createdAt, role: data.role };
    emit('qz:authchange', { user: user, action: 'register' });
    return user;
  }

  async function login(username, password) {
    const name = normalizeUsername(username);
    if (!name) throw new Error('请输入用户名');
    if (!password) throw new Error('请输入密码');

    if (offlineActive) return offlineLogin(name, password);
    let data;
    try {
      data = await authRequest('/api/auth/login', {
        username: name,
        password: String(password)
      });
    } catch (error) {
      if (error.network) {
        markOffline();
        return offlineLogin(name, password);
      }
      throw error;
    }
    saveSession({ username: data.username, token: data.token, role: data.role, createdAt: data.createdAt });
    const user = { username: data.username, createdAt: data.createdAt, role: data.role };
    emit('qz:authchange', { user: user, action: 'login' });
    return user;
  }

  function logout() {
    storageRemove(KEYS.session);
    emit('qz:authchange', { user: null, action: 'logout' });
  }

  /**
   * 启动时校验本地 token 是否仍有效（调用 /me）。
   * - token 在后端有效 → 保持登录，刷新 createdAt。
   * - token 在后端无效 → 清除本地会话并广播登出。
   * - 网络异常（后端未启动 / file://）→ 进入离线模式，保留本地会话，保证收藏/评价离线可用。
   */
  async function verifySession() {
    const session = readSession();
    if (!session || !session.token) return;
    // 已是离线会话或离线模式：不联网校验，直接保留本地会话。
    if (offlineActive || String(session.token).indexOf('offline-') === 0) {
      markOffline();
      return;
    }
    let result;
    try {
      const resp = await global.fetch(
        API_BASE + '/api/auth/me?token=' + encodeURIComponent(session.token)
      );
      if (!resp.ok) return; // 服务端异常，保留本地会话
      result = await resp.json();
    } catch (error) {
      markOffline(); // 后端不可达 → 离线容忍
      return;
    }
    if (result && result.success && result.data) {
      let changed = false;
      if (result.data.createdAt && result.data.createdAt !== session.createdAt) {
        session.createdAt = result.data.createdAt;
        changed = true;
      }
      const newRole = result.data.role || 'USER';
      if (newRole !== (session.role || 'USER')) {
        session.role = newRole;
        changed = true;
      }
      if (changed) {
        storageSet(KEYS.session, JSON.stringify(session));
        emit('qz:authchange', { user: currentUser(), action: 'refresh' });
      }
      return;
    }
    // token 已被服务端判定无效（含被管理员封禁的情况）
    logout();
  }

  function favoriteKey() {
    const user = currentUser();
    return user ? KEYS.favorites + usernameKey(user.username) : '';
  }

  function getFavorites() {
    const key = favoriteKey();
    if (!key) return [];
    const favorites = readJSON(key, []);
    return Array.isArray(favorites) ? favorites.filter(function (id) { return typeof id === 'string'; }) : [];
  }

  function favoriteCount() {
    return getFavorites().length;
  }

  function isFavorite(spotId) {
    return getFavorites().indexOf(String(spotId)) !== -1;
  }

  function toggleFavorite(spotId) {
    const key = favoriteKey();
    if (!key) return { ok: false, reason: 'auth', favorited: false, count: 0 };

    const id = String(spotId);
    const favorites = getFavorites();
    const index = favorites.indexOf(id);
    let favorited;
    if (index === -1) {
      favorites.unshift(id);
      favorited = true;
    } else {
      favorites.splice(index, 1);
      favorited = false;
    }
    writeJSON(key, favorites);
    emit('qz:favchange', { id: id, favorited: favorited, count: favorites.length });
    return { ok: true, favorited: favorited, count: favorites.length };
  }

  // ==================== 评价 ====================

  function normalizeRating(rating) {
    const value = Number(rating);
    if (!Number.isInteger(value) || value < 1 || value > 5) return 0;
    return value;
  }

  function sortReviews(list) {
    return list.slice().sort(function (a, b) {
      return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
    });
  }

  function readReviewStore() {
    return readJSON(KEYS.reviews, {});
  }

  function writeReviewStore(data) {
    writeJSON(KEYS.reviews, data);
  }

  function loadReviewsOffline(id) {
    const store = readReviewStore();
    const list = Array.isArray(store[id]) ? store[id] : [];
    reviewsCache.set(id, sortReviews(list));
  }

  // 同步返回某景区的评价缓存；首次访问会触发异步拉取，完成后发 qz:reviewchange 重渲染。
  function getReviews(spotId) {
    const id = String(spotId);
    if (!reviewsCache.has(id)) {
      reviewsCache.set(id, []);
      loadReviews(id);
    }
    return reviewsCache.get(id);
  }

  function loadReviews(spotId) {
    const id = String(spotId);
    if (reviewsLoading.has(id)) return Promise.resolve();
    reviewsLoading.add(id);
    if (offlineActive) {
      loadReviewsOffline(id);
      reviewsLoading.delete(id);
      emit('qz:reviewchange', { spotId: id });
      return Promise.resolve();
    }
    return global.fetch(API_BASE + '/api/spots/' + encodeURIComponent(id) + '/reviews')
      .then(function (resp) { return resp.ok ? resp.json() : null; })
      .then(function (result) {
        if (result && result.success && Array.isArray(result.data)) {
          reviewsCache.set(id, sortReviews(result.data));
        }
      })
      .catch(function () {
        // 后端不可达 → 切离线，读取本地评价
        markOffline();
        loadReviewsOffline(id);
      })
      .finally(function () {
        reviewsLoading.delete(id);
        emit('qz:reviewchange', { spotId: id });
      });
  }

  function getReview(spotId) {
    const user = currentUser();
    if (!user) return null;
    const key = usernameKey(user.username);
    return (
      getReviews(spotId).find(function (review) {
        return review && String(review.username).toLowerCase() === key;
      }) || null
    );
  }

  function saveReviewOffline(id, value, text, user) {
    const store = readReviewStore();
    const list = Array.isArray(store[id]) ? store[id].slice() : [];
    const now = new Date().toISOString();
    const key = usernameKey(user.username);
    const idx = list.findIndex(function (r) {
      return r && String(r.username).toLowerCase() === key;
    });
    let review;
    if (idx >= 0) {
      review = Object.assign({}, list[idx], { rating: value, content: text, updatedAt: now });
      list[idx] = review;
    } else {
      review = {
        id: 'r' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        spotId: id,
        username: user.username,
        rating: value,
        content: text,
        createdAt: now,
        updatedAt: now
      };
      list.unshift(review);
    }
    store[id] = list;
    writeReviewStore(store);
    reviewsCache.set(id, sortReviews(list));
    emit('qz:reviewchange', { spotId: id });
    return { ok: true, review: review };
  }

  async function saveReview(spotId, rating, content) {
    const user = currentUser();
    if (!user) return { ok: false, reason: 'auth', message: '登录后才能评价景区' };
    const id = String(spotId);
    const value = normalizeRating(rating);
    if (!value) return { ok: false, reason: 'rating', message: '请选择 1–5 分的评分' };
    const text = String(content === undefined || content === null ? '' : content).trim();
    if (text.length > 200) return { ok: false, reason: 'content', message: '文字评价最多 200 字' };

    if (offlineActive) return saveReviewOffline(id, value, text, user);

    const token = currentToken();
    let resp, result;
    try {
      resp = await global.fetch(API_BASE + '/api/spots/' + encodeURIComponent(id) + '/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Token': token },
        body: JSON.stringify({ rating: value, content: text })
      });
    } catch (error) {
      markOffline();
      return saveReviewOffline(id, value, text, user);
    }
    try { result = await resp.json(); } catch (error) { result = null; }
    if (!resp.ok || !result || !result.success) {
      return { ok: false, reason: 'server', message: (result && result.message) || '评价保存失败，请稍后再试' };
    }
    const key = usernameKey(user.username);
    const list = (reviewsCache.get(id) || []).slice();
    const idx = list.findIndex(function (r) { return r && String(r.username).toLowerCase() === key; });
    if (idx >= 0) list[idx] = result.data; else list.unshift(result.data);
    reviewsCache.set(id, sortReviews(list));
    emit('qz:reviewchange', { spotId: id });
    return { ok: true, review: result.data };
  }

  function deleteReviewOffline(id, reviewId) {
    const store = readReviewStore();
    const list = Array.isArray(store[id]) ? store[id] : [];
    const next = list.filter(function (r) { return r && String(r.id) !== String(reviewId); });
    store[id] = next;
    writeReviewStore(store);
    reviewsCache.set(id, sortReviews(next));
    emit('qz:reviewchange', { spotId: id });
    return { ok: true };
  }

  async function deleteReview(spotId) {
    const user = currentUser();
    if (!user) return { ok: false, reason: 'auth' };
    const id = String(spotId);
    const mine = getReview(id);
    if (!mine || !mine.id) return { ok: false, reason: 'missing' };

    if (offlineActive) return deleteReviewOffline(id, mine.id);

    const token = currentToken();
    let resp, result;
    try {
      resp = await global.fetch(API_BASE + '/api/reviews/' + encodeURIComponent(mine.id), {
        method: 'DELETE',
        headers: { 'X-Token': token }
      });
    } catch (error) {
      markOffline();
      return deleteReviewOffline(id, mine.id);
    }
    try { result = await resp.json(); } catch (error) { result = null; }
    if (!resp.ok || !result || !result.success) {
      return { ok: false, reason: 'server', message: (result && result.message) || '删除失败，请稍后再试' };
    }
    reviewsCache.set(id, (reviewsCache.get(id) || []).filter(function (r) { return r && r.id !== mine.id; }));
    emit('qz:reviewchange', { spotId: id });
    return { ok: true };
  }

  function currentToken() {
    const session = readSession();
    return session && session.token ? session.token : '';
  }

  /** 后台管理接口统一调用：自动携带当前会话 token，失败抛中文 Error。method 可选（GET/POST/DELETE）。 */
  async function adminRequest(path, payload, method) {
    const token = currentToken();
    if (!token) throw new Error('请先登录');
    const m = method || (payload ? 'POST' : 'GET');
    let resp;
    try {
      resp = await global.fetch(API_BASE + path, {
        method: m,
        headers: { 'Content-Type': 'application/json', 'X-Token': token },
        body: m === 'GET' || m === 'DELETE' || payload == null ? undefined : JSON.stringify(payload)
      });
    } catch (error) {
      throw netError('无法连接后台服务，请确认后端已启动（端口 8081）');
    }
    if (!resp.ok) throw new Error('服务器错误（' + resp.status + '），请稍后再试');
    let result;
    try {
      result = await resp.json();
    } catch (error) {
      throw new Error('服务器响应格式异常，请稍后再试');
    }
    if (!result || !result.success) {
      throw new Error((result && result.message) || '操作失败，请稍后再试');
    }
    return result.data;
  }

  // ==================== 离线后台管理 ====================

  function requireOfflineAdmin() {
    const me = currentUser();
    if (!me) throw new Error('请先登录');
    if (me.role !== 'ADMIN') throw new Error('无管理员权限');
    return me;
  }

  function offlineAdminListUsers() {
    requireOfflineAdmin();
    const accounts = getAccounts();
    return Object.keys(accounts).map(function (k) {
      const a = accounts[k];
      return {
        id: null,
        username: a.username,
        usernameKey: a.usernameKey,
        role: a.role,
        status: a.status,
        banReason: a.banReason,
        bannedAt: a.bannedAt,
        bannedBy: a.bannedBy,
        createdAt: a.createdAt
      };
    });
  }

  function offlineAdminBanUser(targetKey, reason) {
    const admin = requireOfflineAdmin();
    const accounts = getAccounts();
    const key = usernameKey(targetKey);
    if (!key || !accounts[key]) throw new Error('目标用户不存在');
    if (key === usernameKey(admin.username)) throw new Error('不能封禁你自己');
    const target = accounts[key];
    if (target.role === 'ADMIN') throw new Error('不能封禁管理员账号');
    const note = String(reason == null ? '' : reason).trim();
    if (!note) throw new Error('请填写封禁理由，以便告知被封禁用户');
    if (note.length > 255) throw new Error('封禁理由最多 255 字');
    target.status = 'BANNED';
    target.banReason = note;
    target.bannedBy = admin.username;
    target.bannedAt = new Date().toISOString();
    writeAccounts(accounts);
    return {};
  }

  function offlineAdminUnbanUser(targetKey) {
    requireOfflineAdmin();
    const accounts = getAccounts();
    const key = usernameKey(targetKey);
    if (!key || !accounts[key]) throw new Error('目标用户不存在');
    const target = accounts[key];
    if (target.role === 'ADMIN') throw new Error('不能操作管理员账号');
    target.status = 'ACTIVE';
    target.banReason = null;
    target.bannedAt = null;
    target.bannedBy = null;
    writeAccounts(accounts);
    return {};
  }

  // ----- 离线景点（localStorage 持久化，从内置 GZ_SPOTS 播种） -----

  function cloneSpot(s) {
    return Object.assign({}, s, {
      tags: Array.isArray(s.tags) ? s.tags.slice() : [],
      highlights: Array.isArray(s.highlights) ? s.highlights.slice() : [],
      colors: Array.isArray(s.colors) ? s.colors.slice() : []
    });
  }

  function getOfflineSpots() {
    let spots = readJSON(KEYS.spots, null);
    if (!spots) {
      spots = (global.GZ_SPOTS || []).map(cloneSpot);
      writeJSON(KEYS.spots, spots);
    }
    return spots;
  }

  function saveOfflineSpots(spots) {
    writeJSON(KEYS.spots, spots);
    global.GZ_SPOTS = spots;
    emit('qz:spotsloaded', { count: spots.length });
  }

  function offlineAdminListSpots() {
    requireOfflineAdmin();
    return getOfflineSpots().slice();
  }

  const SPOT_ID_RE = /^[a-z0-9-]{2,64}$/;
  const ALLOWED_LEVELS = { '5A': true, '4A': true, '3A': true };

  function trimOrEmpty(value) {
    return value == null ? '' : String(value).trim();
  }
  function trimOrNull(value) {
    const t = trimOrEmpty(value);
    return t === '' ? null : t;
  }

  function offlineAdminCreateSpot(payload) {
    requireOfflineAdmin();
    if (!payload) throw new Error('请求参数为空');
    const id = trimOrEmpty(payload.id).toLowerCase();
    if (!SPOT_ID_RE.test(id)) throw new Error('景区标识需为 2–64 位小写字母、数字或连字符（如 xiaoqikong）');
    const spots = getOfflineSpots();
    if (spots.some(function (s) { return s.id === id; })) throw new Error('该景区标识已存在，请换一个');
    const name = trimOrEmpty(payload.name);
    if (!name || name.length > 100) throw new Error('请填写景区名称（不超过 100 字）');
    const level = trimOrEmpty(payload.level).toUpperCase();
    if (!ALLOWED_LEVELS[level]) throw new Error('景区等级需为 5A / 4A / 3A');
    const city = trimOrEmpty(payload.city);
    if (!city) throw new Error('请填写所在城市');

    const spot = {
      id: id,
      name: name,
      level: level,
      city: city,
      heroImage: trimOrNull(payload.heroImage),
      area: trimOrNull(payload.area),
      summary: trimOrNull(payload.summary),
      intro: payload.intro == null ? null : String(payload.intro),
      bestSeason: trimOrNull(payload.bestSeason),
      duration: trimOrNull(payload.duration),
      ticket: trimOrNull(payload.ticket),
      address: trimOrNull(payload.address),
      emoji: trimOrNull(payload.emoji),
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
      colors: Array.isArray(payload.colors) && payload.colors.length ? payload.colors : ['#0d5c4d', '#4ade80'],
      rating: payload.rating == null ? 0 : Number(payload.rating) || 0,
      ratingCount: payload.ratingCount == null ? 0 : Number(payload.ratingCount) || 0
    };
    saveOfflineSpots(spots.concat([spot]));
    return spot;
  }

  function offlineAdminDeleteSpot(id) {
    requireOfflineAdmin();
    const key = trimOrEmpty(id);
    const spots = getOfflineSpots();
    if (!key || !spots.some(function (s) { return s.id === key; })) throw new Error('景区不存在或已被删除');
    // 一并删除该景区下的评价
    const store = readReviewStore();
    if (store[key]) { delete store[key]; writeReviewStore(store); }
    saveOfflineSpots(spots.filter(function (s) { return s.id !== key; }));
    return {};
  }

  function offlineAdminListReviews() {
    requireOfflineAdmin();
    const store = readReviewStore();
    const spots = getOfflineSpots();
    const spotName = Object.create(null);
    spots.forEach(function (s) { spotName[s.id] = s.name; });
    const out = [];
    Object.keys(store).forEach(function (spotId) {
      const list = store[spotId];
      if (!Array.isArray(list)) return;
      list.forEach(function (r) {
        if (!r) return;
        out.push({
          id: r.id,
          spotId: r.spotId,
          spotName: spotName[r.spotId] || r.spotId,
          username: r.username,
          rating: r.rating,
          content: r.content,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        });
      });
    });
    out.sort(function (a, b) {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return out;
  }

  function offlineAdminDeleteReview(id) {
    requireOfflineAdmin();
    const rid = String(id);
    const store = readReviewStore();
    let changed = false;
    let spotId = '';
    Object.keys(store).forEach(function (sid) {
      const list = store[sid];
      if (!Array.isArray(list)) return;
      const next = list.filter(function (r) { return r && String(r.id) !== rid; });
      if (next.length !== list.length) {
        store[sid] = next;
        changed = true;
        spotId = sid;
      }
    });
    if (!changed) throw new Error('评价不存在或已被删除');
    writeReviewStore(store);
    if (spotId) {
      reviewsCache.set(spotId, sortReviews(store[spotId] || []));
      emit('qz:reviewchange', { spotId: spotId });
    }
    return {};
  }

  // ----- 后台管理公开方法：在线优先，网络失败自动降级离线 -----

  /** 拉取全部用户列表（仅管理员可用）。 */
  async function adminListUsers() {
    if (offlineActive) return offlineAdminListUsers();
    try {
      return await adminRequest('/api/admin/users');
    } catch (error) {
      if (error.network) { markOffline(); return offlineAdminListUsers(); }
      throw error;
    }
  }

  /** 封禁普通用户，必须提供封禁理由（会告知被封禁用户）。 */
  async function adminBanUser(targetKey, reason) {
    if (offlineActive) return offlineAdminBanUser(targetKey, reason);
    try {
      return await adminRequest(
        '/api/admin/users/' + encodeURIComponent(targetKey) + '/ban',
        { reason: reason }
      );
    } catch (error) {
      if (error.network) { markOffline(); return offlineAdminBanUser(targetKey, reason); }
      throw error;
    }
  }

  /** 解封普通用户。 */
  async function adminUnbanUser(targetKey) {
    if (offlineActive) return offlineAdminUnbanUser(targetKey);
    try {
      return await adminRequest(
        '/api/admin/users/' + encodeURIComponent(targetKey) + '/unban',
        {}
      );
    } catch (error) {
      if (error.network) { markOffline(); return offlineAdminUnbanUser(targetKey); }
      throw error;
    }
  }

  /** 启动时拉取服务端景区列表，替换内置兜底数据；失败则进入离线模式并使用本地数据。 */
  function loadSpots() {
    if (spotsLoaded) return Promise.resolve();
    spotsLoaded = true;
    if (offlineActive) {
      const spots = getOfflineSpots();
      global.GZ_SPOTS = spots;
      emit('qz:spotsloaded', { count: spots.length });
      return Promise.resolve();
    }
    return global.fetch(API_BASE + '/api/spots')
      .then(function (resp) { return resp.ok ? resp.json() : null; })
      .then(function (result) {
        if (result && result.success && Array.isArray(result.data)) {
          global.GZ_SPOTS = result.data;
          emit('qz:spotsloaded', { count: result.data.length });
        }
      })
      .catch(function () {
        // 后端不可达 → 切离线，使用内置兜底/本地持久化的景点数据
        markOffline();
        const spots = getOfflineSpots();
        global.GZ_SPOTS = spots;
        emit('qz:spotsloaded', { count: spots.length });
      });
  }

  async function adminListSpots() {
    if (offlineActive) return offlineAdminListSpots();
    try {
      return await adminRequest('/api/admin/spots');
    } catch (error) {
      if (error.network) { markOffline(); return offlineAdminListSpots(); }
      throw error;
    }
  }

  async function adminCreateSpot(payload) {
    if (offlineActive) return offlineAdminCreateSpot(payload);
    try {
      return await adminRequest('/api/admin/spots', payload);
    } catch (error) {
      if (error.network) { markOffline(); return offlineAdminCreateSpot(payload); }
      throw error;
    }
  }

  async function adminDeleteSpot(id) {
    if (offlineActive) return offlineAdminDeleteSpot(id);
    try {
      return await adminRequest('/api/admin/spots/' + encodeURIComponent(id), null, 'DELETE');
    } catch (error) {
      if (error.network) { markOffline(); return offlineAdminDeleteSpot(id); }
      throw error;
    }
  }

  async function adminListReviews() {
    if (offlineActive) return offlineAdminListReviews();
    try {
      return await adminRequest('/api/admin/reviews');
    } catch (error) {
      if (error.network) { markOffline(); return offlineAdminListReviews(); }
      throw error;
    }
  }

  async function adminDeleteReview(id) {
    if (offlineActive) return offlineAdminDeleteReview(id);
    try {
      return await adminRequest('/api/admin/reviews/' + encodeURIComponent(id), null, 'DELETE');
    } catch (error) {
      if (error.network) { markOffline(); return offlineAdminDeleteReview(id); }
      throw error;
    }
  }

  global.TravelStore = {
    register: register,
    login: login,
    logout: logout,
    currentUser: currentUser,
    verifySession: verifySession,
    getFavorites: getFavorites,
    favoriteCount: favoriteCount,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    getReviews: getReviews,
    getReview: getReview,
    saveReview: saveReview,
    deleteReview: deleteReview,
    adminListUsers: adminListUsers,
    adminBanUser: adminBanUser,
    adminUnbanUser: adminUnbanUser,
    loadSpots: loadSpots,
    adminListSpots: adminListSpots,
    adminCreateSpot: adminCreateSpot,
    adminDeleteSpot: adminDeleteSpot,
    adminListReviews: adminListReviews,
    adminDeleteReview: adminDeleteReview
  };

  // 模块加载即异步校验一次会话，并拉取服务端景区数据（均不阻塞页面渲染）。
  verifySession();
  loadSpots();
})(window);
