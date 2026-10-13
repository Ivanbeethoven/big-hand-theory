# 手机 SSH

这是仓库根目录 Node 服务提供的移动端 SSH 网页客户端。页面运行在服务端的 `/` 路径，SSH 凭据只在当前页面和 SSH 握手期间使用。

## 启动

需要 Node.js 20 或更高版本。

```sh
npm install
npm start
```

默认监听 `127.0.0.1:4173`。手机访问需要将服务绑定到局域网接口。在 PowerShell 中：

```powershell
$env:HOST="0.0.0.0"
$env:PORT="4173"
npm start
```

在 macOS / Linux shell 中：

```sh
HOST=0.0.0.0 PORT=4173 npm start
```

打开启动日志列出的手机可达地址，输入同一日志里的配对码，然后填写 SSH 主机、端口、用户名和认证方式。配对码每次服务重启都会改变。

## TLS

局域网 HTTP 连接会让同一网络上的观察者有机会读取配对码和 SSH 凭据。跨不可信网络使用时，应配置受手机信任的 TLS 证书，或放到 Tailscale Serve 等 HTTPS 私有访问入口之后。直接配置证书的示例：

```sh
TLS_CERT=/path/to/fullchain.pem TLS_KEY=/path/to/privkey.pem HOST=0.0.0.0 npm start
```

Windows PowerShell：

```powershell
$env:TLS_CERT="C:\certs\fullchain.pem"
$env:TLS_KEY="C:\certs\privkey.pem"
$env:HOST="0.0.0.0"
npm start
```

## 凭据和主机信任

- 配对票据 30 秒有效且只能使用一次；服务每次启动产生新的配对码。
- 密码、私钥和私钥口令不会保存到浏览器存储或服务端配置。
- 最近主机只保存主机名、端口、用户名和认证方式，不保存秘密。
- 首次连接会显示 SSH 主机公钥指纹。通过另一可信渠道核对后再确认。
- 已确认的主机指纹保存在服务端工作目录 `.data/known-hosts.json`。指纹变化会拒绝连接。
- `.data/` 和 `node_modules/` 已加入 Git 忽略列表。

## 终端

支持密码和 OpenSSH/PEM 私钥认证、交互式 shell、屏幕尺寸同步、Ctrl+C、Tab、Esc 和方向键。连接信息只保存在浏览器的最近主机列表中；终端命令历史由远端 SSH 主机负责。

这是个人自托管工具。请限制可访问服务的设备和网络，不要在公共 Wi-Fi 上以未加密 HTTP 使用。
