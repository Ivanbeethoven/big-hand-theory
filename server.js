const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const { Client } = require('ssh2');

const app = express();
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const tlsCert = process.env.TLS_CERT;
const tlsKey = process.env.TLS_KEY;
if (Boolean(tlsCert) !== Boolean(tlsKey)) throw new Error('Set both TLS_CERT and TLS_KEY, or neither.');
const accessToken = crypto.randomBytes(18).toString('base64url');
const tickets = new Map();
const dataDir = path.join(__dirname, '.data');
const pinsPath = path.join(dataDir, 'known-hosts.json');
let knownHosts = {};

try {
  knownHosts = JSON.parse(fs.readFileSync(pinsPath, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.json({ limit: '64kb' }));
app.use('/assets/xterm', express.static(path.join(__dirname, 'node_modules/@xterm/xterm/lib')));
app.use('/assets/xterm-fit', express.static(path.join(__dirname, 'node_modules/@xterm/addon-fit/lib')));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/ticket', (req, res) => {
  if (!safeEqual(req.get('x-access-token') || '', accessToken)) {
    return res.status(401).json({ error: '配对码不正确' });
  }
  const ticket = crypto.randomBytes(24).toString('base64url');
  tickets.set(ticket, Date.now() + 30_000);
  res.json({ ticket });
});

const server = tlsCert
  ? https.createServer({ cert: fs.readFileSync(tlsCert), key: fs.readFileSync(tlsKey) }, app)
  : http.createServer(app);
server.listen(port, host, () => {
  console.log(`Mobile SSH is ready:`);
  for (const url of getUrls(host, port, Boolean(tlsCert))) console.log(`  ${url}`);
  console.log(`Pairing code: ${accessToken}`);
  if (host !== '127.0.0.1' && host !== 'localhost') {
    console.log(tlsCert
      ? 'LAN mode is enabled. Keep access limited to trusted devices and networks.'
      : 'WARNING: LAN mode without TLS exposes pairing and SSH credentials to the local network. Use only on a trusted network or configure TLS.');
  }
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/ssh') return socket.destroy();
  const ticket = url.searchParams.get('ticket');
  const expiresAt = tickets.get(ticket);
  if (!ticket || !expiresAt || expiresAt < Date.now()) return socket.destroy();
  tickets.delete(ticket);
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
});

wss.on('connection', ws => {
  let ssh;
  let stream;
  let pendingHostApproval;

  const send = payload => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  };

  const fail = message => {
    send({ type: 'error', message });
    if (ws.readyState === WebSocket.OPEN) ws.close(1000);
  };

  ws.on('message', raw => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return fail('收到无法识别的请求');
    }

    if (message.type === 'trust-host') {
      if (!pendingHostApproval) return;
      const approve = pendingHostApproval;
      pendingHostApproval = null;
      approve(message.approved === true);
      return;
    }

    if (message.type === 'connect') {
      if (ssh) return fail('当前连接已建立');
      const config = validateConnection(message);
      if (config.error) return fail(config.error);

      ssh = new Client();
      const hostId = `${config.host}:${config.port}`;
      const hostVerifier = (key, callback) => {
        const fingerprint = `SHA256:${crypto.createHash('sha256').update(Buffer.from(key, 'hex')).digest('base64').replace(/=+$/, '')}`;
        const saved = knownHosts[hostId];
        if (saved) {
          const accepted = safeEqual(saved, fingerprint);
          if (!accepted) send({ type: 'host-key-changed', host: hostId, expected: saved, actual: fingerprint });
          callback(accepted);
          return;
        }

        send({ type: 'host-key', host: hostId, fingerprint });
        pendingHostApproval = approved => {
          if (approved) {
            knownHosts[hostId] = fingerprint;
            fs.mkdirSync(dataDir, { recursive: true });
            fs.writeFileSync(pinsPath, JSON.stringify(knownHosts, null, 2), { mode: 0o600 });
          }
          callback(approved);
        };
      };

      ssh.on('ready', () => {
        stream = ssh.shell({ term: 'xterm-256color', cols: clamp(message.cols, 40, 240, 80), rows: clamp(message.rows, 10, 100, 24) }, (error, shell) => {
          if (error) return fail(`无法打开终端：${error.message}`);
          stream = shell;
          send({ type: 'connected' });
          stream.on('data', data => send({ type: 'data', data: data.toString('base64') }));
          stream.stderr.on('data', data => send({ type: 'data', data: data.toString('base64') }));
          stream.on('close', () => {
            send({ type: 'closed' });
            ws.close(1000);
          });
        });
      });
      ssh.on('error', error => fail(`SSH 连接失败：${error.message}`));
      ssh.on('close', () => send({ type: 'closed' }));

      const sshConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: 15_000,
        hostVerifier,
      };
      if (config.authMethod === 'password') {
        sshConfig.password = message.password;
      } else {
        sshConfig.privateKey = message.privateKey;
        if (message.passphrase) sshConfig.passphrase = message.passphrase;
      }
      ssh.connect(sshConfig);
      return;
    }

    if (message.type === 'input' && stream) {
      stream.write(Buffer.from(message.data || '', 'base64'));
    } else if (message.type === 'resize' && stream) {
      const cols = clamp(message.cols, 40, 240, 80);
      const rows = clamp(message.rows, 10, 100, 24);
      stream.setWindow(rows, cols, 0, 0);
    } else if (message.type === 'disconnect') {
      ssh?.end();
      ws.close(1000);
    }
  });

  ws.on('close', () => {
    if (pendingHostApproval) pendingHostApproval(false);
    stream?.close();
    ssh?.end();
  });
});

function validateConnection(message) {
  const hostValue = String(message.host || '').trim();
  const username = String(message.username || '').trim();
  const portValue = Number(message.port || 22);
  if (!hostValue || /[\s/\\]/.test(hostValue)) return { error: '请输入有效的主机名或 IP 地址' };
  if (!username || username.length > 128) return { error: '请输入有效的用户名' };
  if (!Number.isInteger(portValue) || portValue < 1 || portValue > 65535) return { error: '端口必须是 1 到 65535 之间的整数' };
  if (message.authMethod === 'key') {
    if (typeof message.privateKey !== 'string' || !message.privateKey.includes('PRIVATE KEY')) return { error: '请粘贴有效的私钥内容' };
  } else if (typeof message.password !== 'string' || !message.password.length) {
    return { error: '请输入 SSH 密码' };
  }
  return { host: hostValue, username, port: portValue, authMethod: message.authMethod };
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.floor(number))) : fallback;
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function getUrls(bindHost, bindPort, tlsEnabled) {
  const scheme = tlsEnabled ? 'https' : 'http';
  if (bindHost === '127.0.0.1' || bindHost === 'localhost') return [`${scheme}://localhost:${bindPort}`];
  const addresses = Object.values(os.networkInterfaces()).flat().filter(item => item && item.family === 'IPv4' && !item.internal).map(item => `${scheme}://${item.address}:${bindPort}`);
  return addresses.length ? [...new Set(addresses)] : [`${scheme}://${bindHost}:${bindPort}`];
}
