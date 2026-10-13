(() => {
  const $ = selector => document.querySelector(selector);
  const form = $('#connect-form');
  const panel = $('#connect-panel');
  const dialog = $('#host-dialog');
  const terminal = new Terminal({
    cursorBlink: true,
    convertEol: false,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: 13,
    theme: { background: '#0d1312', foreground: '#dce6e0', cursor: '#a6e3c5', selectionBackground: '#3d6252' },
    scrollback: 5000,
    allowProposedApi: false,
  });
  const fitAddon = new FitAddon.FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open($('#terminal'));

  let socket;
  let authMethod = 'password';
  let toastTimer;
  let resizeTimer;
  let currentHost = '';
  let dialogResolve;
  const recentKey = 'big-hand-ssh-recent';

  const setState = (label, connected = false) => {
    $('#connection-label').textContent = label;
    $('#state-dot').classList.toggle('connected', connected);
  };
  const showToast = message => {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  };
  const send = message => {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  };
  const encodeInput = value => {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  };
  const fit = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    try {
      fitAddon.fit();
      send({ type: 'resize', cols: terminal.cols, rows: terminal.rows });
    } catch { /* The terminal may be hidden while the connection panel is open. */ }
  };
  const setBusy = busy => {
    const button = $('#connect-button');
    button.disabled = busy;
    button.querySelector('span:first-child').textContent = busy ? '连接中…' : '连接';
  };

  const readRecents = () => {
    try { return JSON.parse(localStorage.getItem(recentKey) || '[]'); } catch { return []; }
  };
  const renderRecents = () => {
    const list = $('#recent-list');
    const items = readRecents();
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'recent-empty';
      empty.textContent = '连接成功的主机将显示在这里';
      list.append(empty);
      return;
    }
    items.forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'recent-item';
      const title = document.createElement('span');
      title.textContent = `${item.username}@${item.host}`;
      const detail = document.createElement('small');
      detail.textContent = `端口 ${item.port}`;
      button.append(title, detail);
      button.addEventListener('click', () => {
        $('#host').value = item.host;
        $('#port').value = item.port;
        $('#username').value = item.username;
        if (item.authMethod === 'key') selectAuth('key');
        else selectAuth('password');
        $('#password').focus();
      });
      list.append(button);
    });
  };
  const saveRecent = item => {
    const items = [item, ...readRecents().filter(entry => !(entry.host === item.host && entry.port === item.port && entry.username === item.username))].slice(0, 8);
    localStorage.setItem(recentKey, JSON.stringify(items));
    renderRecents();
  };
  const selectAuth = method => {
    authMethod = method;
    document.querySelectorAll('[data-auth]').forEach(button => button.classList.toggle('selected', button.dataset.auth === method));
    $('#password-field').classList.toggle('hidden', method !== 'password');
    $('#key-fields').classList.toggle('hidden', method !== 'key');
  };
  const openPanel = () => {
    panel.classList.remove('collapsed');
    setTimeout(fit, 220);
  };
  const closePanel = () => {
    panel.classList.add('collapsed');
    setTimeout(fit, 220);
  };

  const requestTicket = async token => {
    const response = await fetch('/api/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Access-Token': token }, body: '{}' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || '配对失败');
    return payload.ticket;
  };

  const confirmHost = (host, fingerprint) => new Promise(resolve => {
    dialogResolve = resolve;
    $('#dialog-host').textContent = host;
    $('#fingerprint').textContent = fingerprint;
    dialog.showModal();
  });
  dialog.addEventListener('close', () => {
    dialogResolve?.(dialog.returnValue === 'trust');
    dialogResolve = undefined;
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
    const token = $('#pairing-code').value.trim();
    const host = $('#host').value.trim();
    const port = Number($('#port').value || 22);
    const username = $('#username').value.trim();
    const auth = authMethod === 'password'
      ? { authMethod, password: $('#password').value }
      : { authMethod, privateKey: $('#private-key').value, passphrase: $('#passphrase').value };
    setBusy(true);
    setState('正在配对');
    $('#empty-state').classList.add('hidden');
    terminal.reset();

    try {
      const ticket = await requestTicket(token);
      const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${scheme}//${location.host}/ssh?ticket=${encodeURIComponent(ticket)}`);
      socket.addEventListener('open', () => {
        currentHost = `${username}@${host}:${port}`;
        setState('正在连接');
        socket.send(JSON.stringify({ type: 'connect', host, port, username, cols: terminal.cols, rows: terminal.rows, ...auth }));
        $('#password').value = '';
        $('#private-key').value = '';
        $('#passphrase').value = '';
      }, { once: true });
      socket.addEventListener('message', async event => {
        let message;
        try { message = JSON.parse(event.data); } catch { return; }
        if (message.type === 'host-key') {
          const approved = await confirmHost(message.host, message.fingerprint);
          send({ type: 'trust-host', approved });
        } else if (message.type === 'host-key-changed') {
          terminal.write('\r\n\x1b[31m主机指纹与已保存记录不符，连接已拒绝。请检查服务器身份。\x1b[0m\r\n');
          showToast('主机指纹变化，连接已拒绝');
        } else if (message.type === 'connected') {
          setState(currentHost, true);
          saveRecent({ host, port, username, authMethod });
          closePanel();
          setTimeout(() => { fit(); terminal.focus(); }, 240);
        } else if (message.type === 'data') {
          const binary = atob(message.data);
          const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
          terminal.write(bytes);
        } else if (message.type === 'error') {
          terminal.write(`\r\n\x1b[31m${message.message}\x1b[0m\r\n`);
          showToast(message.message);
          setState('连接失败');
        } else if (message.type === 'closed') {
          setState('连接已断开');
        }
      });
      socket.addEventListener('close', () => {
        setBusy(false);
        setState('未连接');
        if (terminal.buffer.active.baseY === 0 && terminal.buffer.active.cursorY === 0) $('#empty-state').classList.remove('hidden');
      });
      socket.addEventListener('error', () => {
        setBusy(false);
        showToast('连接服务失败，请确认服务仍在运行');
        setState('连接失败');
      });
    } catch (error) {
      setBusy(false);
      setState('未连接');
      showToast(error.message);
    }
  });

  terminal.onData(data => send({ type: 'input', data: encodeInput(data) }));
  document.querySelectorAll('[data-key]').forEach(button => button.addEventListener('click', () => {
    send({ type: 'input', data: encodeInput(button.dataset.key) });
    terminal.focus();
  }));
  $('#keyboard-button').addEventListener('click', () => {
    terminal.focus();
    const textarea = $('#terminal textarea');
    textarea?.focus();
    textarea?.click();
  });
  $('#show-connect').addEventListener('click', openPanel);
  $('#empty-connect').addEventListener('click', openPanel);
  $('#close-panel').addEventListener('click', closePanel);
  $('#disconnect-button').addEventListener('click', () => {
    send({ type: 'disconnect' });
    socket?.close();
    setState('未连接');
    openPanel();
  });
  $('#clear-recents').addEventListener('click', () => {
    localStorage.removeItem(recentKey);
    renderRecents();
  });
  document.querySelectorAll('[data-auth]').forEach(button => button.addEventListener('click', () => selectAuth(button.dataset.auth)));
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fit, 150);
  });
  window.visualViewport?.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fit, 150);
  });

  renderRecents();
  fitAddon.fit();
  if (matchMedia('(max-width: 760px)').matches) panel.classList.remove('collapsed');
})();
