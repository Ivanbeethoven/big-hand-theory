# 远程控制与移动办公资源目录

更新日期：2026-10-13。这里的“远程控制”覆盖网络连通、图形桌面、终端、云工作区、移动设备和 AI Agent 操作。它们解决的问题不同，通常需要组合使用。产品覆盖范围和商业条款会变化，请点开官方资料复核。

## 1. 先分清四层

| 层 | 解决的问题 | 常见工具 |
| --- | --- | --- |
| 网络接入 | 两台设备如何安全互通 | Tailscale、WireGuard、ZeroTier、NetBird、Headscale、Twingate、Cloudflare Tunnel |
| 远程交互 | 如何看到桌面、敲命令、传文件 | RDP、VNC、RustDesk、AnyDesk、TeamViewer、SSH、Guacamole |
| 工作环境 | 代码和应用实际跑在哪里 | 自有 PC/服务器、Codespaces、Coder、DevPod、云主机 |
| 自动执行 | 哪些步骤由脚本或 Agent 代办 | Playwright、OpenHands、Browser Use、computer-use Agent |

优先确定信任边界和工作负载，再选软件。远程桌面和 VPN 不是同一类工具：前者传输交互画面，后者建立网络通道。

## 2. 网络与安全接入

| 工具 | 形态 | 适合 | 注意点 |
| --- | --- | --- | --- |
| [Tailscale](https://tailscale.com/) | WireGuard 基础上的托管组网服务 | 个人设备、团队私网、快速连接家中设备 | 控制面由服务商托管；核对套餐和身份提供商支持 |
| [WireGuard](https://www.wireguard.com/) | 开源 VPN 协议及实现 | 自己管理 VPN、轻量安全隧道 | 需要管理密钥、路由、端点和 NAT 穿透 |
| [NetBird](https://netbird.io/) | WireGuard 组网，提供托管和自托管选项 | 希望有策略管理面板的个人或团队 | 自托管增加升级、备份和可用性责任 |
| [ZeroTier](https://www.zerotier.com/) | 虚拟网络平台 | 多平台设备组网、跨网络访问 | 评估托管控制面的权限和费用 |
| [Headscale](https://github.com/juanfont/headscale) | Tailscale 控制服务器的开源实现 | 想自行托管兼容客户端控制面的用户 | 自己维护控制服务器；兼容性以项目文档为准 |
| [Twingate](https://www.twingate.com/) | 零信任远程访问服务 | 按用户和资源授权的团队访问 | 商业服务，需评估套餐、身份集成和日志保留 |
| [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) | 出站隧道与访问控制 | 发布受保护的内部 Web 应用 | 不是通用桌面协议；访问策略配置必须正确 |
| [OpenVPN](https://openvpn.net/) | VPN 协议及商业/开源实现 | 兼容既有 VPN 基础设施 | 配置和运维较 WireGuard 方案繁琐 |

## 3. Windows、Linux 与跨平台远程桌面

| 工具 | 平台 / 方式 | 适合 | 注意点 |
| --- | --- | --- | --- |
| [Windows Remote Desktop / RDP](https://learn.microsoft.com/windows-server/remote/remote-desktop-services/) | Windows 主机远程会话 | 访问 Windows 专业版/服务器桌面 | 主机版本、网络和授权有限制；不要将 RDP 直接暴露公网 |
| [Windows App](https://learn.microsoft.com/windows-app/) | 微软远程桌面客户端 | 从 Windows、macOS、iOS、Android 等连接远程 PC/云资源 | 客户端和目标服务能力依具体平台与版本而异 |
| [Quick Assist](https://support.microsoft.com/windows/use-quick-assist-to-help-users) | Windows 临时协助 | 需要对方确认的一次性帮助 | 适用于有人协助场景，不是长期无人值守访问 |
| [Chrome Remote Desktop](https://remotedesktop.google.com/) | 托管远程桌面 | 个人跨设备访问，安装配置较简单 | 依赖 Google 账号和服务可用性；高级管理较少 |
| [RustDesk](https://rustdesk.com/) | 开源客户端，支持自托管服务端 | 跨平台远控、希望自管中继 | 自托管需维护 hbbs/hbbr 等服务和访问策略 |
| [AnyDesk](https://anydesk.com/) | 商业远控 | 快速跨平台支持和无人值守访问 | 费用、商业使用规则和隐私条款需查官方页面 |
| [TeamViewer](https://www.teamviewer.com/) | 商业远控与支持 | IT 支持、设备管理、跨平台远控 | 商业许可和账号安全策略需要核对 |
| [Splashtop](https://www.splashtop.com/) | 商业远程桌面 | 远程办公、IT 支持和高性能桌面访问 | 不同产品面向不同场景，价格依计划变化 |
| [NoMachine](https://www.nomachine.com/) | 跨平台远程桌面 | Linux 图形桌面和高响应交互 | 评估其服务器/客户端网络配置和许可 |
| [Remmina](https://remmina.org/) | Linux 远程桌面客户端 | Linux 用户连接 RDP、VNC、SSH 等 | 它主要是客户端，不提供完整的托管网络 |
| [Apache Guacamole](https://guacamole.apache.org/) | 自托管浏览器网关，支持 RDP/VNC/SSH | 浏览器统一入口、团队访问门户 | 部署涉及反向代理、身份认证和网关加固 |
| [MeshCentral](https://meshcentral.com/) | 自托管 Web 设备管理与远控 | 管理多台 Windows/Linux 设备、远程终端和桌面 | 需要维护服务端、代理设备和访问权限 |
| [DWService](https://www.dwservice.net/) | 开源远控项目及托管服务 | 浏览器连接远端设备 | 使用托管服务前核对隐私、区域和服务条款 |
| [HopToDesk](https://www.hoptodesk.com/) | 跨平台远控 | RustDesk 类远控需求 | 核对项目维护情况、服务端选项和许可 |
| [VNC](https://www.realvnc.com/) | 远程 framebuffer 协议及多种实现 | 传统桌面共享、异构设备 | 具体实现安全性差异大；避免裸露公网 |
| [Parsec](https://parsec.app/) | 低延迟图形/串流远控 | 图形应用、协作和交互延迟敏感工作 | 平台能力、企业用途及许可按官方说明确认 |
| [Sunshine + Moonlight](https://github.com/LizardByte/Sunshine) | 自托管主机串流 + 多端客户端 | 家中高性能 PC 的低延迟串流 | 需处理网络、显卡编码和配对安全 |

## 4. Linux 终端、管理面板和持久会话

| 工具 | 适合 | 备注 |
| --- | --- | --- |
| [OpenSSH](https://www.openssh.com/) | Linux/Unix 服务器命令行管理，也可访问 Windows OpenSSH Server | 用密钥登录、限制账户权限；管理端口只经 VPN 或可信访问策略开放 |
| [Mosh](https://mosh.org/) | 网络切换频繁的交互式终端 | 通常与 SSH 配合；服务端需要 UDP 通信 |
| [tmux](https://github.com/tmux/tmux) | SSH 断线后保留终端工作会话 | 多窗口、重连；本身不负责网络安全 |
| [Cockpit](https://cockpit-project.org/) | 浏览器管理 Linux 服务器 | 管理服务状态、存储、网络和虚拟机；限制管理面板可达范围 |
| [VS Code Remote - SSH](https://code.visualstudio.com/docs/remote/ssh) | 在本地 VS Code 中开发远程 Linux 项目 | 代码和工具运行在远端主机；需稳定 SSH 连接 |
| [code-server](https://github.com/coder/code-server) | 浏览器访问远端 VS Code 环境 | 适合轻终端；应放在身份验证和 TLS 保护之后 |
| [Xpra](https://xpra.org/) | 远程运行并转发单个 GUI 应用或桌面 | 用于 Linux 图形应用；按官方安全指南部署 |

## 5. 云端开发工作区与远程机器

| 工具 | 形态 | 适合 |
| --- | --- | --- |
| [GitHub Codespaces](https://github.com/features/codespaces) | 托管容器化开发环境 | 仓库级环境配置、浏览器或 VS Code 开发 |
| [Coder](https://coder.com/) | 自托管/云端开发工作区平台 | 团队提供可复用的开发环境和权限控制 |
| [DevPod](https://devpod.sh/) | 开发容器客户端，可接不同基础设施 | 希望自己选择工作区运行位置的开发者 |
| [OpenHands](https://github.com/OpenHands/OpenHands) | AI 开发 Agent 平台，可在本机或云端运行 | 让 Agent 在隔离工作区处理代码任务 |
| [Gitpod / Ona](https://www.ona.com/) | 云端开发工作区及 Agent 工具 | 产品品牌和能力处于演进中，按官网当前资料评估 |
| 自建 Linux 主机 + SSH | 自己维护的工作站或云主机 | 需要长期运行服务、GPU 或自定义环境的个人/团队 |

云工作区便于在轻终端继续工作，但仍需要代码备份、持久化策略、费用上限和凭据隔离。

## 6. 浏览器自动化和 AI Agent

| 工具 / 方案 | 控制对象 | 适合 | 运行前要确认 |
| --- | --- | --- | --- |
| [Playwright](https://playwright.dev/) | 浏览器 DOM、页面和浏览器上下文 | 稳定的测试及确定性网页流程 | 浏览器登录态、下载目录、外部副作用 |
| [Browser Use](https://browser-use.com/) | 浏览器页面与交互 | 以自然语言驱动的浏览器 Agent | 账号权限、页面提示注入和人工审批点 |
| [Stagehand](https://github.com/browserbase/stagehand) | Playwright 上的 AI 浏览器操作 | DOM 自动化和 Agent 灵活操作组合 | 模型调用、页面数据外发和费用 |
| [Skyvern](https://www.skyvern.com/) | 浏览器工作流 | 跨网站重复流程自动化 | 执行账户权限、审计日志及异常处理 |
| [OpenAI computer use](https://platform.openai.com/docs/guides/tools-computer-use) | 截图、鼠标和键盘等桌面操作 | 需要操作没有 API 的 GUI 的任务 | 在隔离虚拟机运行；对敏感及不可逆操作保留人工确认 |
| [Anthropic computer use](https://docs.anthropic.com/en/docs/agents-and-tools/computer-use) | 截图、鼠标和键盘等桌面操作 | 构建视觉桌面 Agent | 使用容器/虚拟机；限制网络和敏感数据访问 |
| [OpenHands](https://docs.openhands.dev/) | 代码库、终端和开发工具 | 软件工程任务和代码 Agent | 给 Agent 单独工作区，检查 diff 后再合并 |
| [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp) | Playwright 浏览器会话，通过 MCP 提供给 Agent | 用标准化工具接口让 Agent 操作 Web | MCP 工具权限取决于宿主；不要把未审查服务接入敏感账户 |
| [BrowserGym / WorkArena](https://github.com/ServiceNow/BrowserGym) | 浏览器 Agent 基准环境 | 评估 Agent 网页操作能力 | 主要面向研究和评测，不是生产远控服务 |

桌面 Agent 通过屏幕操作，往往比 API 或 DOM 自动化更脆弱，也更容易误点。优先选官方 API 或受限浏览器上下文；只有必要时才开放完整桌面控制。

## 7. 手机、平板和物理设备

| 工具 | 用途 |
| --- | --- |
| [KDE Connect](https://kdeconnect.kde.org/) | 手机和桌面互通通知、剪贴板及远程输入等功能 |
| [scrcpy](https://github.com/Genymobile/scrcpy) | 从电脑显示和控制 Android 设备，USB 或 TCP/IP 连接 |
| [ADB](https://developer.android.com/tools/adb) | Android 开发和设备调试；只授权可信电脑 |
| [AirDroid](https://www.airdroid.com/) | 手机与电脑之间的设备管理和远程访问服务 |
| [Chrome Remote Desktop](https://remotedesktop.google.com/) / [Windows App](https://learn.microsoft.com/windows-app/) | 手机和平板作为连接远端桌面的客户端 |

## 8. 推荐组合

### 个人日常

Tailscale 连接个人设备；Windows 用 RDP 或 Chrome Remote Desktop；Linux 主机用 SSH + tmux；重要文件同步到有版本历史的存储。

### 自托管爱好者

NetBird 或 WireGuard 建私网；RustDesk 处理桌面；MeshCentral 管理多台设备；Guacamole 为可信用户提供浏览器网关。组件越多，补丁、备份和监控工作也越多。

### 移动开发者

代码在 Codespaces、Coder 或常开 Linux 主机；手机/平板只做检查和轻量改动，笔记本用 VS Code Remote SSH；任务交给 Agent 时，每项任务用独立分支或工作区。

### AI 自动化

有 API 就用 API；网页任务优先 Playwright；GUI 任务放到无敏感资料的独立虚拟机。发送、购买、删除、发布和权限变更前由人确认。

## 9. 选型检查表

- 需要控制的是桌面、终端、浏览器、文件还是整台设备？
- 主机操作系统、客户端设备和网络环境分别是什么？
- 能否接受厂商中继和托管控制面？需要自托管吗？谁负责更新和备份？
- 是否支持 MFA、设备撤销、最小权限、日志审计和会话超时？
- 是否需要剪贴板、文件传输、音视频、USB 或多显示器？
- Agent 能访问哪些密钥、文件、网络和账号？如何回滚或停止？
- 服务不可用时，能否在本机继续关键任务？

## 官方资料索引

工具名称链接到各项目/产品官网或官方文档；商业产品没有统一比较定价，因为套餐、地区和商业用途差异较大。使用前查看当前许可和平台支持。
