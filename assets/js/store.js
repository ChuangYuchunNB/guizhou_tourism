(function (global) {
  'use strict';

  const KEYS = {
    users: 'qianxing_users_v1',
    session: 'qianxing_session_v1',
    favorites: 'qianxing_favorites_v1_',
    reviews: 'qianxing_reviews_v1'
  };

  const memory = new Map();

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

  function normalizeUsername(username) {
    return String(username || '').trim();
  }

  function usernameKey(username) {
    return normalizeUsername(username).toLowerCase();
  }

  function getUsers() {
    const users = readJSON(KEYS.users, []);
    return Array.isArray(users) ? users : [];
  }

  function saveUsers(users) {
    writeJSON(KEYS.users, users);
  }

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

  function currentAlgo() {
    return global.crypto && global.crypto.subtle && global.TextEncoder ? 'sha256' : 'fnv1a';
  }

  function fallbackHash(value) {
    let hash = 0x811c9dc5;
    const input = 'qianxing-v1:' + value;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    let second = 0x9e3779b9;
    for (let i = input.length - 1; i >= 0; i -= 1) {
      second ^= input.charCodeAt(i);
      second = Math.imul(second, 0x85ebca6b);
    }
    return 'fnv1a-' + (hash >>> 0).toString(16) + (second >>> 0).toString(16);
  }

  async function hashPassword(password, algo) {
    if (algo === 'sha256') {
      const bytes = new global.TextEncoder().encode('qianxing-v1:' + password);
      const digest = await global.crypto.subtle.digest('SHA-256', bytes);
      return (
        'sha256-' +
        Array.from(new Uint8Array(digest))
          .map(function (byte) {
            return byte.toString(16).padStart(2, '0');
          })
          .join('')
      );
    }
    return fallbackHash(password);
  }

  function publicUser(user) {
    return user
      ? {
          username: user.username,
          createdAt: user.createdAt
        }
      : null;
  }

  function currentUser() {
    const session = readJSON(KEYS.session, null);
    if (!session || !session.username) return null;
    const user = getUsers().find(function (item) {
      return item.usernameKey === usernameKey(session.username);
    });
    if (!user) {
      storageRemove(KEYS.session);
      return null;
    }
    return publicUser(user);
  }

  async function register(username, password) {
    const name = normalizeUsername(username);
    const nameError = validateUsername(name);
    if (nameError) throw new Error(nameError);
    const passwordError = validatePassword(password);
    if (passwordError) throw new Error(passwordError);

    const users = getUsers();
    if (
      users.some(function (item) {
        return item.usernameKey === usernameKey(name);
      })
    ) {
      throw new Error('这个用户名已经被注册了，换一个试试吧');
    }

    const algo = currentAlgo();
    const passwordHash = await hashPassword(String(password), algo);
    const user = {
      username: name,
      usernameKey: usernameKey(name),
      passwordHash: passwordHash,
      algo: algo,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    storageSet(KEYS.session, JSON.stringify({ username: user.username, at: Date.now() }));
    emit('qz:authchange', { user: publicUser(user), action: 'register' });
    return publicUser(user);
  }

  async function login(username, password) {
    const name = normalizeUsername(username);
    if (!name) throw new Error('请输入用户名');
    if (!password) throw new Error('请输入密码');

    const user = getUsers().find(function (item) {
      return item.usernameKey === usernameKey(name);
    });
    if (!user) throw new Error('用户名或密码不正确');

    const algo = user.algo || 'fnv1a';
    if (algo === 'sha256' && !(global.crypto && global.crypto.subtle && global.TextEncoder)) {
      throw new Error('当前环境无法安全校验密码，请通过本地服务器访问页面');
    }
    const passwordHash = await hashPassword(String(password), algo);
    if (passwordHash !== user.passwordHash) {
      throw new Error('用户名或密码不正确');
    }

    storageSet(KEYS.session, JSON.stringify({ username: user.username, at: Date.now() }));
    emit('qz:authchange', { user: publicUser(user), action: 'login' });
    return publicUser(user);
  }

  function logout() {
    storageRemove(KEYS.session);
    emit('qz:authchange', { user: null, action: 'logout' });
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

  function readReviews() {
    const reviews = readJSON(KEYS.reviews, []);
    return Array.isArray(reviews) ? reviews : [];
  }

  function writeReviews(reviews) {
    writeJSON(KEYS.reviews, reviews);
  }

  function normalizeRating(rating) {
    const value = Number(rating);
    if (!Number.isInteger(value) || value < 1 || value > 5) return 0;
    return value;
  }

  function getReviews(spotId) {
    const id = String(spotId);
    return readReviews()
      .filter(function (review) {
        return review && review.spotId === id && !Number.isNaN(Number(review.rating));
      })
      .sort(function (a, b) {
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      });
  }

  function getReview(spotId) {
    const user = currentUser();
    if (!user) return null;
    const key = usernameKey(user.username);
    return (
      getReviews(spotId).find(function (review) {
        return review.usernameKey === key;
      }) || null
    );
  }

  function saveReview(spotId, rating, content) {
    const user = currentUser();
    if (!user) return { ok: false, reason: 'auth', message: '登录后才能评价景区' };

    const id = String(spotId);
    const value = normalizeRating(rating);
    if (!value) {
      return { ok: false, reason: 'rating', message: '请选择 1–5 分的评分' };
    }
    const text = String(content === undefined || content === null ? '' : content).trim();
    if (text.length > 200) {
      return { ok: false, reason: 'content', message: '文字评价最多 200 字' };
    }

    const key = usernameKey(user.username);
    const reviews = readReviews();
    const now = new Date().toISOString();
    let review = reviews.find(function (item) {
      return item && item.spotId === id && item.usernameKey === key;
    });
    const isNew = !review;

    if (review) {
      review.username = user.username;
      review.rating = value;
      review.content = text;
      review.updatedAt = now;
    } else {
      review = {
        id: id + '__' + key,
        spotId: id,
        username: user.username,
        usernameKey: key,
        rating: value,
        content: text,
        createdAt: now,
        updatedAt: now
      };
      reviews.push(review);
    }

    writeReviews(reviews);
    const count = reviews.filter(function (item) {
      return item && item.spotId === id;
    }).length;
    emit('qz:reviewchange', { spotId: id, review: review, count: count });
    return { ok: true, review: review, created: isNew };
  }

  function deleteReview(spotId) {
    const user = currentUser();
    if (!user) return { ok: false, reason: 'auth' };

    const id = String(spotId);
    const key = usernameKey(user.username);
    const reviews = readReviews();
    const index = reviews.findIndex(function (item) {
      return item && item.spotId === id && item.usernameKey === key;
    });
    if (index === -1) return { ok: false, reason: 'missing' };

    reviews.splice(index, 1);
    writeReviews(reviews);
    const count = reviews.filter(function (item) {
      return item && item.spotId === id;
    }).length;
    emit('qz:reviewchange', { spotId: id, review: null, count: count });
    return { ok: true };
  }

  global.TravelStore = {
    register: register,
    login: login,
    logout: logout,
    currentUser: currentUser,
    getFavorites: getFavorites,
    favoriteCount: favoriteCount,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    getReviews: getReviews,
    getReview: getReview,
    saveReview: saveReview,
    deleteReview: deleteReview
  };
})(window);
