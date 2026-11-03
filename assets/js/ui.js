(function (global) {
  'use strict';

  const ICONS = {
    heart:
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pin:
      '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    lock:
      '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><rect x="5" y="10" width="14" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    compass:
      '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m15.5 8.5-2.3 4.7-4.7 2.3 2.3-4.7 4.7-2.3Z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    star:
      '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false"><path d="m12 3 2.7 5.6 6.2.9-4.5 4.4 1.1 6.1-5.5-2.9-5.5 2.9 1.1-6.1-4.5-4.4 6.2-.9Z" fill="currentColor"/></svg>'
  };

  const ridges =
    '<svg class="card-ridges" viewBox="0 0 400 170" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 146 70 94 118 124 186 59 252 127 305 93 400 143V170H0Z"/><path d="M0 159 86 119 150 147 228 105 300 150 400 113V170H0Z"/></svg>';

  let toastTimer = null;
  let activeModal = null;
  let lastFocused = null;
  let shellReady = false;

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getSpot(id) {
    return (global.GZ_SPOTS || []).find(function (spot) {
      return spot.id === id;
    });
  }

  const RATING_WORDS = {
    1: '不太满意',
    2: '一般',
    3: '还不错',
    4: '很值得',
    5: '超赞'
  };

  function getRatingSummary(spot) {
    if (!spot) return { average: 0, count: 0, localCount: 0 };
    const localReviews = global.TravelStore.getReviews(spot.id);
    const baseRating = Number(spot.rating) || 0;
    const baseCount = Number(spot.ratingCount) || 0;
    const localCount = localReviews.length;
    const totalCount = baseCount + localCount;
    const localRatingSum = localReviews.reduce(function (sum, review) {
      return sum + (Number(review.rating) || 0);
    }, 0);
    const average = totalCount
      ? (baseRating * baseCount + localRatingSum) / totalCount
      : baseRating;
    return { average: average, count: totalCount, localCount: localCount };
  }

  function formatRatingCount(count) {
    const value = Number(count) || 0;
    if (value >= 10000) {
      return (value / 10000).toFixed(1).replace(/\.0$/, '') + '万';
    }
    return String(value);
  }

  function starGlyphs(rating, extraClass) {
    const rounded = Math.min(5, Math.max(0, Math.round(Number(rating) || 0)));
    const label = (Number(rating) || 0).toFixed(1);
    return (
      '<span class="' +
      (extraClass || 'rating-stars') +
      '" role="img" aria-label="评分 ' +
      label +
      ' 分">' +
      [1, 2, 3, 4, 5]
        .map(function (n) {
          return (
            '<span class="star-glyph' +
            (n <= rounded ? ' is-on' : '') +
            '" aria-hidden="true">★</span>'
          );
        })
        .join('') +
      '</span>'
    );
  }

  function cardRatingMarkup(spot) {
    const summary = getRatingSummary(spot);
    return (
      '<span class="card-rating" data-rating-for="' +
      escapeHtml(spot.id) +
      '" title="综合评分 ' +
      summary.average.toFixed(1) +
      ' 分">' +
      ICONS.star +
      '<strong class="rating-score">' +
      summary.average.toFixed(1) +
      '</strong>' +
      '<span class="rating-count">' +
      formatRatingCount(summary.count) +
      '</span></span>'
    );
  }

  function dialogRatingMarkup(spot) {
    const summary = getRatingSummary(spot);
    return (
      '<div class="dialog-rating" data-dialog-rating="' +
      escapeHtml(spot.id) +
      '">' +
      '<span class="rating-badge">' +
      ICONS.star +
      '<strong class="dialog-rating-score">' +
      summary.average.toFixed(1) +
      '</strong><span class="rating-max">/ 5</span></span>' +
      starGlyphs(summary.average, 'rating-stars') +
      '<span class="rating-count"><span class="dialog-rating-count">' +
      formatRatingCount(summary.count) +
      '</span> 人评分</span>' +
      '</div>'
    );
  }

  function formatReviewDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return (
      date.getFullYear() +
      '.' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '.' +
      String(date.getDate()).padStart(2, '0')
    );
  }

  function reviewItemMarkup(review, user) {
    const isSample = Boolean(review.sample);
    const mine =
      !isSample &&
      Boolean(user) &&
      String(review.username).toLowerCase() === String(user.username).toLowerCase();
    const initial = String(review.username || '?').slice(0, 1).toUpperCase();
    return (
      '<article class="review-item' +
      (mine ? ' is-mine' : '') +
      (isSample ? ' is-sample' : '') +
      '">' +
      '<span class="review-avatar" aria-hidden="true">' +
      escapeHtml(initial) +
      '</span>' +
      '<div class="review-main">' +
      '<div class="review-top"><strong>' +
      escapeHtml(review.username) +
      '</strong>' +
      (isSample ? '<span class="review-sample">示例</span>' : '') +
      (mine ? '<span class="review-mine">我的评价</span>' : '') +
      '<span class="review-date">' +
      escapeHtml(formatReviewDate(review.updatedAt)) +
      '</span></div>' +
      '<div class="review-rating-row">' +
      starGlyphs(review.rating, 'review-stars') +
      '<span class="review-score">' +
      Number(review.rating).toFixed(1) +
      '</span></div>' +
      (review.content
        ? '<p class="review-content">' + escapeHtml(review.content) + '</p>'
        : '<p class="review-content is-empty">只打了分，没有留下文字。</p>') +
      '</div></article>'
    );
  }

  function reviewFormMarkup(spot, myReview) {
    const user = global.TravelStore.currentUser();
    if (!user) {
      return (
        '<div class="review-login-hint">' +
        '<span class="review-login-icon" aria-hidden="true">' +
        ICONS.lock +
        '</span>' +
        '<div class="review-login-copy"><strong>登录后可以评价景区</strong>' +
        '<p>未登录时只能浏览评价。登录后可以打分并写下文字评价。</p></div>' +
        '<button type="button" class="btn btn-outline btn-sm" data-review-login>登录后评价</button>' +
        '</div>'
      );
    }

    const selected = myReview ? myReview.rating : 0;
    const content = myReview ? myReview.content : '';
    return (
      '<form class="review-form" data-review-form novalidate>' +
      '<div class="review-form-head"><div><h3>' +
      (myReview ? '更新你的评价' : '写下你的评价') +
      '</h3><p>评分必填，文字评价选填，最多 200 字。</p></div>' +
      '<span class="review-as">以 <strong>' +
      escapeHtml(user.username) +
      '</strong> 的身份评价</span></div>' +
      '<div class="review-stars-input" role="group" aria-label="选择评分">' +
      [1, 2, 3, 4, 5]
        .map(function (n) {
          return (
            '<button type="button" class="star-rating-btn' +
            (n <= selected ? ' is-active' : '') +
            '" data-rate="' +
            n +
            '" aria-label="' +
            n +
            ' 星" aria-pressed="' +
            String(n <= selected) +
            '">★</button>'
          );
        })
        .join('') +
      '<span class="rating-word" data-rating-word>' +
      (selected ? RATING_WORDS[selected] : '点击星星评分') +
      '</span></div>' +
      '<div class="review-input-wrap">' +
      '<textarea name="content" maxlength="200" placeholder="说说你的游玩体验，比如最佳拍照点、交通或避坑建议…" data-review-content>' +
      escapeHtml(content) +
      '</textarea>' +
      '<span class="review-counter" data-review-counter>' +
      content.length +
      '/200</span></div>' +
      '<div class="review-error" data-review-error hidden></div>' +
      '<div class="review-actions">' +
      '<button type="submit" class="btn btn-solid review-submit">' +
      (myReview ? '更新评价' : '发布评价') +
      '</button>' +
      (myReview
        ? '<button type="button" class="review-delete" data-review-delete>删除评价</button>'
        : '') +
      '</div>' +
      '</form>'
    );
  }

  function getSampleReviews(spotId) {
    const source = global.GZ_SAMPLE_REVIEWS;
    const list = source && source[spotId];
    if (!Array.isArray(list)) return [];
    return list.map(function (review) {
      return {
        username: review.username,
        rating: review.rating,
        content: review.content,
        updatedAt: review.updatedAt,
        sample: true
      };
    });
  }

  function reviewsBlockMarkup(spot) {
    const user = global.TravelStore.currentUser();
    const reviews = global.TravelStore.getReviews(spot.id);
    const samples = getSampleReviews(spot.id);
    const myReview = user ? global.TravelStore.getReview(spot.id) : null;
    const items = reviews
      .map(function (review) {
        return reviewItemMarkup(review, user);
      })
      .concat(
        samples.map(function (review) {
          return reviewItemMarkup(review, user);
        })
      )
      .join('');

    return (
      '<div class="reviews-head"><div><p class="reviews-eyebrow">TRAVELER REVIEWS</p>' +
      '<h3>用户评价</h3>' +
      '<p class="reviews-note">带「示例」标记的评价为项目内置示范文案，仅用于演示评价功能，不是高德地图等平台的真实用户评论，也不计入评分。</p>' +
      '</div><span class="reviews-local-count">' +
      (samples.length ? '示例 ' + samples.length + ' 条 · ' : '') +
      '本机 ' +
      reviews.length +
      ' 条</span></div>' +
      '<div class="reviews-list">' +
      (items ||
        '<div class="review-empty"><span aria-hidden="true">💬</span><p>还没有文字评价。' +
          (user ? '写下你的第一条评价吧。' : '登录后可以写下你的评价。') +
          '</p></div>') +
      '</div>' +
      reviewFormMarkup(spot, myReview)
    );
  }

  function updateStarButtons(overlay, value) {
    overlay.querySelectorAll('[data-rate]').forEach(function (button) {
      const rating = Number(button.getAttribute('data-rate'));
      button.classList.toggle('is-active', rating <= value);
      button.setAttribute('aria-pressed', String(rating <= value));
    });
    const word = overlay.querySelector('[data-rating-word]');
    if (word) word.textContent = value ? RATING_WORDS[value] : '点击星星评分';
  }

  function syncRatingDisplays(spot) {
    const id = spot.id;
    document.querySelectorAll('[data-rating-for="' + id + '"]').forEach(function (node) {
      node.outerHTML = cardRatingMarkup(spot);
    });
    document.querySelectorAll('[data-dialog-rating="' + id + '"]').forEach(function (node) {
      node.outerHTML = dialogRatingMarkup(spot);
    });
  }

  function refreshReviewBlock(spot, overlay) {
    if (!overlay) return;
    const block = overlay.querySelector('[data-reviews-for="' + spot.id + '"]');
    if (!block) return;
    block.innerHTML = reviewsBlockMarkup(spot);
    const user = global.TravelStore.currentUser();
    const myReview = user ? global.TravelStore.getReview(spot.id) : null;
    overlay.dataset.selectedRating = String(myReview ? myReview.rating : 0);
  }

  function showFormError(form, message) {
    const error = form.querySelector('[data-review-error]');
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
  }

  function handleReviewSubmit(form, overlay, spot) {
    const rating = Number(overlay.dataset.selectedRating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      showFormError(form, '请先点击星星选择 1–5 分');
      return;
    }
    const contentEl = form.querySelector('[data-review-content]');
    const content = contentEl ? contentEl.value : '';
    const alreadyReviewed = Boolean(global.TravelStore.getReview(spot.id));
    const result = global.TravelStore.saveReview(spot.id, rating, content);
    if (!result.ok) {
      if (result.reason === 'auth') {
        closePrompt();
        showAuthPrompt(spot.name, 'review');
        return;
      }
      showFormError(form, result.message || '评价保存失败，请稍后再试');
      return;
    }
    showToast(alreadyReviewed ? '评价已更新' : '评价已发布');
  }

  function handleReviewDelete(overlay, spot) {
    const result = global.TravelStore.deleteReview(spot.id);
    if (!result.ok) {
      showToast('没有找到可以删除的评价', 'info');
      return;
    }
    showToast('评价已删除', 'info');
  }

  function bindReviewEvents(overlay, spot) {
    overlay.addEventListener('click', function (event) {
      const star = event.target.closest('[data-rate]');
      if (star) {
        const value = Number(star.getAttribute('data-rate'));
        overlay.dataset.selectedRating = String(value);
        updateStarButtons(overlay, value);
        const form = overlay.querySelector('[data-review-form]');
        const error = form ? form.querySelector('[data-review-error]') : null;
        if (error) error.hidden = true;
        return;
      }

      if (event.target.closest('[data-review-delete]')) {
        handleReviewDelete(overlay, spot);
        return;
      }

      if (event.target.closest('[data-review-login]')) {
        showAuthPrompt(spot.name, 'review');
      }
    });

    overlay.addEventListener('input', function (event) {
      const textarea = event.target.closest('[data-review-content]');
      if (!textarea) return;
      const counter = overlay.querySelector('[data-review-counter]');
      if (counter) counter.textContent = textarea.value.length + '/200';
    });

    overlay.addEventListener('submit', function (event) {
      const form = event.target.closest('[data-review-form]');
      if (!form) return;
      event.preventDefault();
      handleReviewSubmit(form, overlay, spot);
    });
  }

  function spotCard(spot) {
    const favorited = global.TravelStore.isFavorite(spot.id);
    const tags = spot.tags
      .map(function (tag) {
        return '<span class="tag">' + escapeHtml(tag) + '</span>';
      })
      .join('');

    return (
      '<article class="spot-card" data-spot="' +
      escapeHtml(spot.id) +
      '" tabindex="0" aria-label="查看' +
      escapeHtml(spot.name) +
      '详情">' +
      '<div class="card-visual" style="--c1:' +
      escapeHtml(spot.colors[0]) +
      ';--c2:' +
      escapeHtml(spot.colors[1]) +
      '">' +
      ridges +
      '<img class="card-cover" loading="lazy" src="' +
      escapeHtml(spot.heroImage) +
      '" alt="' +
      escapeHtml(spot.name) +
      '封面">' +
      '<span class="level-pill" data-level="' +
      escapeHtml(spot.level) +
      '">' +
      escapeHtml(spot.level) +
      '</span>' +
      '<span class="visual-emoji" aria-hidden="true">' +
      spot.emoji +
      '</span>' +
      '<button type="button" class="fav-btn' +
      (favorited ? ' is-fav' : '') +
      '" data-fav="' +
      escapeHtml(spot.id) +
      '" aria-pressed="' +
      String(favorited) +
      '" aria-label="' +
      (favorited ? '取消收藏' : '收藏') +
      escapeHtml(spot.name) +
      '" title="' +
      (favorited ? '取消收藏' : '收藏') +
      '">' +
      ICONS.heart +
      '</button>' +
      '</div>' +
      '<div class="card-body">' +
      '<div class="card-meta">' +
      '<span class="card-location">' +
      ICONS.pin +
      '<span>' +
      escapeHtml(spot.city) +
      ' · ' +
      escapeHtml(spot.area) +
      '</span></span>' +
      cardRatingMarkup(spot) +
      '</div>' +
      '<h3 class="card-title">' +
      escapeHtml(spot.name) +
      '</h3>' +
      '<p class="card-summary">' +
      escapeHtml(spot.summary) +
      '</p>' +
      '<div class="tag-row">' +
      tags +
      '</div>' +
      '<div class="card-foot"><span>查看详情</span><span class="card-arrow" aria-hidden="true">→</span></div>' +
      '</div>' +
      '</article>'
    );
  }

  function syncFavoriteButtons(id, favorited) {
    const spot = getSpot(id);
    const buttons = document.querySelectorAll('[data-fav="' + id + '"]');
    buttons.forEach(function (button) {
      button.classList.toggle('is-fav', favorited);
      button.setAttribute('aria-pressed', String(favorited));
      button.setAttribute(
        'aria-label',
        (favorited ? '取消收藏' : '收藏') + (spot ? spot.name : '')
      );
      button.setAttribute('title', favorited ? '取消收藏' : '收藏');
      const label = button.querySelector('.fav-text');
      if (label) {
        label.textContent = favorited ? '已收藏' : '收藏景点';
      }
    });
  }

  function showToast(message, type) {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.className = 'toast is-visible toast-' + (type || 'success');
    toast.innerHTML =
      '<span class="toast-icon" aria-hidden="true">' +
      (type === 'info' ? 'i' : '✓') +
      '</span><span>' +
      escapeHtml(message) +
      '</span>';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2800);
  }

  function renderHeader() {
    const authArea = document.getElementById('headerAuth');
    const user = global.TravelStore.currentUser();

    if (authArea) {
      if (user) {
        const initial = user.username.slice(0, 1).toUpperCase();
        authArea.innerHTML =
          '<div class="user-chip" title="当前登录账号">' +
          '<span class="user-avatar">' +
          escapeHtml(initial) +
          '</span>' +
          '<span class="user-copy"><span>你好</span><strong>' +
          escapeHtml(user.username) +
          '</strong></span>' +
          '</div>' +
          '<button type="button" class="btn btn-quiet btn-sm" data-logout>退出</button>';
      } else {
        authArea.innerHTML =
          '<a class="btn btn-quiet btn-sm" href="login.html">登录</a>' +
          '<a class="btn btn-solid btn-sm" href="login.html?tab=register">注册</a>';
      }
    }

    const navCount = document.getElementById('favNavCount');
    if (navCount) {
      const count = global.TravelStore.favoriteCount();
      navCount.textContent = String(count);
      navCount.hidden = count === 0;
    }
  }

  function markActiveNav() {
    const page = document.body.getAttribute('data-page');
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      if (link.getAttribute('data-nav') === page) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function toggleFavoriteWithFeedback(id) {
    const spot = getSpot(id);
    const result = global.TravelStore.toggleFavorite(id);
    if (!result.ok && result.reason === 'auth') {
      showAuthPrompt(spot ? spot.name : '这个景区');
      return;
    }
    showToast(
      result.favorited
        ? '已收藏「' + (spot ? spot.name : '景区') + '」'
        : '已取消收藏',
      result.favorited ? 'success' : 'info'
    );
  }

  function currentPageFile() {
    const file = global.location.pathname.split('/').pop();
    return file && /\.html$/.test(file) ? file : 'index.html';
  }

  function authLink(tab) {
    const params = new URLSearchParams();
    if (tab === 'register') params.set('tab', 'register');
    params.set('redirect', currentPageFile());
    return 'login.html?' + params.toString();
  }

  function showAuthPrompt(spotName, actionType) {
    const isReview = actionType === 'review';
    closePrompt();
    const overlay = document.createElement('div');
    overlay.className = 'prompt-overlay';
    overlay.innerHTML =
      '<div class="prompt-card" role="dialog" aria-modal="true" aria-labelledby="authPromptTitle">' +
      '<button type="button" class="dialog-close on-light" data-close-prompt aria-label="关闭提示">' +
      ICONS.close +
      '</button>' +
      '<span class="prompt-icon" aria-hidden="true">' +
      ICONS.lock +
      '</span>' +
      '<h2 id="authPromptTitle">登录后' +
      (isReview ? '评价' : '收藏') +
      '「' +
      escapeHtml(spotName) +
      '」</h2>' +
      '<p>' +
      (isReview
        ? '登录或注册账号后，就能给这个景区打分、写下评价，也可以收藏它。评价会保存在当前浏览器中。'
        : '登录或注册账号后，就能把这个景区加入收藏。收藏记录会保存在当前浏览器中。') +
      '</p>' +
      '<div class="prompt-actions">' +
      '<a class="btn btn-solid" href="' +
      authLink('login') +
      '">去登录</a>' +
      '<a class="btn btn-outline" href="' +
      authLink('register') +
      '">注册新账号</a>' +
      '</div>' +
      '<button type="button" class="prompt-later" data-close-prompt>暂时不用，继续逛逛</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
    });
    const firstAction = overlay.querySelector('.btn');
    if (firstAction) firstAction.focus();
  }

  function closePrompt() {
    const overlay = document.querySelector('.prompt-overlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    setTimeout(function () {
      overlay.remove();
    }, 180);
    if (!document.querySelector('.modal-overlay')) {
      document.body.classList.remove('modal-open');
    }
  }

  function openSpotModal(spot) {
    closeModal(true);
    const favorited = global.TravelStore.isFavorite(spot.id);
    const user = global.TravelStore.currentUser();
    lastFocused = document.activeElement;

    const highlights = spot.highlights
      .map(function (item) {
        return '<span class="highlight-chip">' + escapeHtml(item) + '</span>';
      })
      .join('');
    const tags = spot.tags
      .map(function (tag) {
        return '<span class="tag">' + escapeHtml(tag) + '</span>';
      })
      .join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="spot-dialog" role="dialog" aria-modal="true" aria-labelledby="spotDialogTitle">' +
      '<div class="dialog-banner" style="--c1:' +
      escapeHtml(spot.colors[0]) +
      ';--c2:' +
      escapeHtml(spot.colors[1]) +
      '">' +
      ridges +
      '<span class="level-pill" data-level="' +
      escapeHtml(spot.level) +
      '">' +
      escapeHtml(spot.level) +
      '</span>' +
      '<span class="banner-emoji" aria-hidden="true">' +
      spot.emoji +
      '</span>' +
      '<button type="button" class="dialog-close" data-close-modal aria-label="关闭详情">' +
      ICONS.close +
      '</button>' +
      '</div>' +
      '<div class="dialog-body">' +
      '<div class="dialog-city">' +
      ICONS.pin +
      '<span>' +
      escapeHtml(spot.city) +
      ' · ' +
      escapeHtml(spot.area) +
      '</span></div>' +
      '<h2 class="dialog-title" id="spotDialogTitle">' +
      escapeHtml(spot.name) +
      '</h2>' +
      dialogRatingMarkup(spot) +
      '<p class="dialog-intro">' +
      escapeHtml(spot.intro) +
      '</p>' +
      '<div class="info-grid">' +
      '<div class="info-item"><span class="info-label">最佳季节</span><strong>' +
      escapeHtml(spot.bestSeason) +
      '</strong></div>' +
      '<div class="info-item"><span class="info-label">建议时长</span><strong>' +
      escapeHtml(spot.duration) +
      '</strong></div>' +
      '<div class="info-item"><span class="info-label">参考票价</span><strong>' +
      escapeHtml(spot.ticket) +
      '</strong></div>' +
      '<div class="info-item"><span class="info-label">地址</span><strong>' +
      escapeHtml(spot.address) +
      '</strong></div>' +
      '</div>' +
      '<div class="dialog-block"><h3>不可错过</h3><div class="highlight-list">' +
      highlights +
      '</div></div>' +
      '<div class="tag-row">' +
      tags +
      '</div>' +
      '<div class="reviews-block" data-reviews-for="' +
      escapeHtml(spot.id) +
      '">' +
      reviewsBlockMarkup(spot) +
      '</div>' +
      '</div>' +
      '<div class="dialog-foot">' +
      '<span class="foot-hint">' +
      (user ? '收藏与评价保存在当前浏览器' : '登录后即可收藏、评价这个景区') +
      '</span>' +
      '<button type="button" class="btn btn-solid dialog-fav' +
      (favorited ? ' is-fav' : '') +
      '" data-fav="' +
      escapeHtml(spot.id) +
      '" aria-pressed="' +
      String(favorited) +
      '">' +
      ICONS.heart +
      '<span class="fav-text">' +
      (favorited ? '已收藏' : '收藏景点') +
      '</span></button>' +
      '</div>' +
      '</div>';

    const myReview = user ? global.TravelStore.getReview(spot.id) : null;
    overlay.setAttribute('data-spot-id', spot.id);
    overlay.dataset.selectedRating = String(myReview ? myReview.rating : 0);
    bindReviewEvents(overlay, spot);

    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    activeModal = overlay;
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
    });
    const closeButton = overlay.querySelector('[data-close-modal]');
    if (closeButton) closeButton.focus();
  }

  function closeModal(immediate) {
    const overlay = activeModal;
    if (!overlay) return;
    activeModal = null;
    if (immediate) {
      overlay.remove();
    } else {
      overlay.classList.remove('is-open');
      setTimeout(function () {
        overlay.remove();
      }, 180);
    }
    if (!document.querySelector('.prompt-overlay')) {
      document.body.classList.remove('modal-open');
    }
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
      lastFocused = null;
    }
  }

  function closeAllOverlays() {
    closePrompt();
    closeModal();
  }

  function bindGlobalEvents() {
    document.addEventListener('click', function (event) {
      const favButton = event.target.closest('[data-fav]');
      if (favButton) {
        event.preventDefault();
        toggleFavoriteWithFeedback(favButton.getAttribute('data-fav'));
        return;
      }

      if (event.target.closest('[data-logout]')) {
        global.TravelStore.logout();
        showToast('已退出登录', 'info');
        return;
      }

      if (event.target.closest('[data-close-modal]') || event.target.classList.contains('modal-overlay')) {
        closeModal();
        return;
      }

      if (event.target.closest('[data-close-prompt]') || event.target.classList.contains('prompt-overlay')) {
        closePrompt();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (document.querySelector('.prompt-overlay')) {
        closePrompt();
      } else if (activeModal) {
        closeModal();
      }
    });

    global.addEventListener('qz:authchange', function () {
      renderHeader();
      if (activeModal) {
        const spot = getSpot(activeModal.getAttribute('data-spot-id'));
        if (spot) refreshReviewBlock(spot, activeModal);
      }
    });
    global.addEventListener('qz:favchange', function (event) {
      syncFavoriteButtons(event.detail.id, event.detail.favorited);
      renderHeader();
    });
    global.addEventListener('qz:reviewchange', function (event) {
      const spot = getSpot(event.detail.spotId);
      if (!spot) return;
      syncRatingDisplays(spot);
      if (activeModal && activeModal.getAttribute('data-spot-id') === spot.id) {
        refreshReviewBlock(spot, activeModal);
      }
    });
  }

  function initShell() {
    if (shellReady) return;
    shellReady = true;
    markActiveNav();
    renderHeader();
    bindGlobalEvents();
  }

  global.TravelUI = {
    initShell: initShell,
    spotCard: spotCard,
    getSpot: getSpot,
    getRatingSummary: getRatingSummary,
    dialogRatingMarkup: dialogRatingMarkup,
    reviewsBlockMarkup: reviewsBlockMarkup,
    bindReviewEvents: bindReviewEvents,
    refreshReviewBlock: refreshReviewBlock,
    openSpotModal: openSpotModal,
    showToast: showToast,
    showAuthPrompt: showAuthPrompt,
    escapeHtml: escapeHtml
  };
})(window);
