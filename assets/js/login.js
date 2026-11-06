(function (global) {
  'use strict';

  const form = document.getElementById('authForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirmPassword');
  const confirmField = document.getElementById('confirmField');
  const submitButton = document.getElementById('authSubmit');
  const errorBox = document.getElementById('authError');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const switchBox = document.getElementById('authSwitch');
  const sessionNotice = document.getElementById('sessionNotice');
  const tabs = Array.from(document.querySelectorAll('[data-mode]'));

  const params = new URLSearchParams(global.location.search);
  const redirectParam = params.get('redirect') || '';
  const redirect = /^(index|favorites)\.html$/.test(redirectParam) ? redirectParam : 'index.html';

  let mode = params.get('tab') === 'register' ? 'register' : 'login';
  let submitting = false;

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  function hideError() {
    errorBox.hidden = true;
    errorBox.textContent = '';
  }

  function setLoading(loading) {
    submitting = loading;
    submitButton.disabled = loading;
    submitButton.classList.toggle('is-loading', loading);
    submitButton.textContent = loading ? '请稍候…' : mode === 'register' ? '注册并登录' : '登录';
    form.setAttribute('aria-busy', String(loading));
  }

  function setMode(nextMode) {
    mode = nextMode === 'register' ? 'register' : 'login';
    hideError();

    tabs.forEach(function (tab) {
      const active = tab.getAttribute('data-mode') === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    const isRegister = mode === 'register';
    title.textContent = isRegister ? '创建你的账号' : '欢迎回来';
    subtitle.textContent = isRegister
      ? '注册后即可收藏、评价景区，建立你的贵州心愿单'
      : '登录后即可收藏、评价喜欢的景区';
    confirmField.hidden = !isRegister;
    confirmInput.required = isRegister;
    passwordInput.autocomplete = isRegister ? 'new-password' : 'current-password';
    submitButton.textContent = isRegister ? '注册并登录' : '登录';
    submitButton.disabled = false;

    if (isRegister) {
      switchBox.innerHTML =
        '<span>已经有账号了？</span><button type="button" data-mode-switch="login">去登录</button>';
    } else {
      switchBox.innerHTML =
        '<span>还没有账号？</span><button type="button" data-mode-switch="register">立即注册</button>';
    }

    if (isRegister) {
      confirmInput.value = '';
    }
  }

  function renderSessionNotice() {
    const user = global.TravelStore.currentUser();
    if (!user) {
      sessionNotice.hidden = true;
      sessionNotice.innerHTML = '';
      return;
    }
    sessionNotice.hidden = false;
    sessionNotice.innerHTML =
      '<span>当前已登录 <strong>' +
      global.TravelUI.escapeHtml(user.username) +
      '</strong></span>' +
      '<span class="session-actions">' +
      '<a href="' +
      redirect +
      '">继续</a>' +
      '<button type="button" data-session-logout>退出</button>' +
      '</span>';
  }

  function togglePasswordVisibility(button) {
    const targetId = button.getAttribute('data-toggle-password');
    const input = document.getElementById(targetId);
    if (!input) return;
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    button.classList.toggle('is-visible', visible);
    button.setAttribute('aria-pressed', String(visible));
    button.setAttribute('aria-label', visible ? '隐藏密码' : '显示密码');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    hideError();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username) {
      showError('请输入用户名');
      usernameInput.focus();
      return;
    }
    if (mode === 'register' && !/^[\u4e00-\u9fa5A-Za-z0-9_]{2,20}$/.test(username)) {
      showError('用户名需为 2–20 位中文、字母、数字或下划线');
      usernameInput.focus();
      return;
    }
    if (!password) {
      showError('请输入密码');
      passwordInput.focus();
      return;
    }
    if (mode === 'register' && password.length < 6) {
      showError('密码至少需要 6 位');
      passwordInput.focus();
      return;
    }
    if (mode === 'register' && password !== confirmInput.value) {
      showError('两次输入的密码不一致');
      confirmInput.focus();
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await global.TravelStore.register(username, password);
      } else {
        await global.TravelStore.login(username, password);
      }
      renderSessionNotice();
      global.TravelUI.showToast(
        mode === 'register' ? '注册成功，正在进入…' : '登录成功，正在返回…',
        'success'
      );
      setTimeout(function () {
        global.location.href = redirect;
      }, 450);
    } catch (error) {
      showError(error.message || '操作失败，请稍后再试');
      setLoading(false);
      passwordInput.focus();
      passwordInput.select();
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      if (submitting) return;
      setMode(tab.getAttribute('data-mode'));
      usernameInput.focus();
    });
  });

  switchBox.addEventListener('click', function (event) {
    const button = event.target.closest('[data-mode-switch]');
    if (!button || submitting) return;
    setMode(button.getAttribute('data-mode-switch'));
  });

  document.querySelectorAll('[data-toggle-password]').forEach(function (button) {
    button.addEventListener('click', function () {
      togglePasswordVisibility(button);
    });
  });

  sessionNotice.addEventListener('click', function (event) {
    if (!event.target.closest('[data-session-logout]')) return;
    global.TravelStore.logout();
    renderSessionNotice();
    global.TravelUI.showToast('已退出登录', 'info');
  });

  form.addEventListener('submit', handleSubmit);

  [usernameInput, passwordInput, confirmInput].forEach(function (input) {
    input.addEventListener('input', hideError);
  });

  setMode(mode);
  renderSessionNotice();
  usernameInput.focus();
})(window);
