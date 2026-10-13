# 大手理论：AI 时代的移动办公手册

> 薄肌练身体，大水补日常，大手伸向远程资源。工作不再绑在一张桌子上。

这是一个关于「大手理论」的开放整理：把个人设备、远程主机、云端开发环境和 AI Agent 连接起来，让人能从不同地点继续工作，并把重复操作交给自动化。

## 大手理论

「大手理论」是本项目提出的工作方式主张，不是已有的学术理论：

1. **工作随人移动**：用轻便终端连接个人工作环境，减少对固定办公室和单一电脑的依赖。
2. **远程资源伸手可及**：通过安全网络访问家中电脑、Linux 服务器、云桌面、文件和开发环境。
3. **人管目标，Agent 管步骤**：把明确、可检查、可撤销的任务交给 AI Agent 执行，人负责判断、授权和验收。
4. **轻松来自系统，不来自加班**：同步、自动化、异步协作和清晰边界减少重复劳动；随时可连接不等于随时待命。
5. **安全是移动办公的地基**：优先使用身份验证、设备授权、最小权限和加密通道，不把远程桌面端口直接暴露到公网。

一句话：**人带着轻终端走，算力和工作环境留在合适的地方，需要时安全地伸手调用。**

## 网上流行的两个「理论」

- **薄肌理论**：近期中文社交媒体流行的健身表达，推崇可持续的力量训练和适度的肌肉线条，而非极端增肌。传播内容也混有审美、两性和个人成长话术，应把网络梗与健康建议分开看。
- **大水理论**：以大瓶饮用水替代奶茶、甜饮等“小甜水”的生活方式梗。喝水需求会受饮食、活动、气候和健康状况影响；不应把固定升数或短时间大量饮水当作人人适用的医学处方。

这些说法更像易传播的生活方式标签，并非经过验证的正式理论。项目背景和检索出处见[理论与来源](docs/theories-and-sources.md)。

## 远程资源地图

| 需要 | 可先看 | 适用场景 |
| --- | --- | --- |
| 私有设备互联 | [Tailscale](https://tailscale.com/)、[ZeroTier](https://www.zerotier.com/)、[NetBird](https://netbird.io/)、[WireGuard](https://www.wireguard.com/) | 让手机、笔记本、家中电脑和服务器加入私有网络 |
| Windows 远程桌面 | [Windows App / Remote Desktop](https://learn.microsoft.com/windows-server/remote/remote-desktop-services/)、[Chrome Remote Desktop](https://remotedesktop.google.com/)、[RustDesk](https://rustdesk.com/) | 需要完整图形桌面或远程协助 |
| Linux 图形桌面 | [RustDesk](https://rustdesk.com/)、[NoMachine](https://www.nomachine.com/)、[Remmina](https://remmina.org/)、[Apache Guacamole](https://guacamole.apache.org/) | Linux 桌面、跨平台客户端或浏览器访问网关 |
| 自托管设备管理 | [MeshCentral](https://meshcentral.com/)、[Apache Guacamole](https://guacamole.apache.org/)、[RustDesk Server](https://rustdesk.com/docs/en/self-host/) | 管理多台设备，或自行托管中继和访问入口 |
| 终端与服务器 | [OpenSSH](https://www.openssh.com/)、[Mosh](https://mosh.org/)、[tmux](https://github.com/tmux/tmux)、[Cockpit](https://cockpit-project.org/) | 低带宽命令行维护、持久会话、Linux 管理面板 |
| 云端开发工作区 | [GitHub Codespaces](https://github.com/features/codespaces)、[Coder](https://coder.com/)、[DevPod](https://devpod.sh/)、[OpenHands](https://github.com/OpenHands/OpenHands) | 从浏览器或轻终端进入预配置开发环境、运行 Agent |
| 浏览器自动化 / Agent | [Playwright](https://playwright.dev/)、[Browser Use](https://browser-use.com/)、[Stagehand](https://github.com/browserbase/stagehand)、[Skyvern](https://www.skyvern.com/) | 让脚本或 Agent 操作网页流程 |
| 桌面操作 Agent | [OpenAI computer use](https://platform.openai.com/docs/guides/tools-computer-use)、[Anthropic computer use](https://docs.anthropic.com/en/docs/agents-and-tools/computer-use)、[Microsoft Windows app automation](https://learn.microsoft.com/windows/) | 通过截图、鼠标和键盘控制桌面应用；需要强隔离和人工确认 |
| 手机 / 平板作为终端 | [Microsoft Remote Desktop 客户端](https://learn.microsoft.com/windows-server/remote/remote-desktop-services/)、[Chrome Remote Desktop](https://remotedesktop.google.com/)、[KDE Connect](https://kdeconnect.kde.org/)、[scrcpy](https://github.com/Genymobile/scrcpy) | 手机连接电脑、同步通知或控制 Android 设备 |

更完整的优缺点、平台覆盖和推荐组合见[远程控制资源目录](docs/remote-resources.md)。

## 快速选型

- **个人跨设备，想少折腾**：Tailscale + Windows RDP / Chrome Remote Desktop；Linux 服务器用 SSH。
- **偏好自托管**：WireGuard 或 NetBird + RustDesk；设备规模较大时看 MeshCentral 或 Guacamole。
- **主要写代码**：远程 SSH / Coder / Codespaces；让环境常驻服务器，笔记本只负责编辑和交互。
- **希望 Agent 帮忙操作**：优先用有明确任务范围的代码或浏览器 Agent；桌面级自动化放在隔离环境，关键步骤要求人工确认。
- **网络不稳定**：SSH 会话配合 tmux；图形桌面选择有中继或自托管中继的方案。

## 安全底线

1. 先建立私有网络或 VPN，再开放远程服务；避免把 RDP、VNC、SSH 管理端口无保护地暴露到公网。
2. 启用多因素认证、强密钥和设备授权；为远程账户使用最小权限。
3. Agent 使用单独账户和测试数据；限制文件、网络、剪贴板及凭据访问。
4. 对发送邮件、付款、删除数据、发布内容等外部操作保留人工确认。
5. 定期更新客户端、服务端和系统；检查会话记录与访问设备清单。

## 目录

- [远程控制资源目录](docs/remote-resources.md)
- [薄肌、大水与大手理论：背景和来源](docs/theories-and-sources.md)
- [安全与威胁模型](docs/security.md)

## 范围

远程访问产品、云服务和 Agent 工具持续变化。本目录是按用途整理的代表性工具地图，不声称穷尽所有商业产品；选型前请核对官方平台支持、价格、数据驻留和服务条款。最后整理：2026-10-13。

## 贡献

欢迎补充工具、纠正平台覆盖或提交新的官方文档来源。请尽可能提供官方链接、更新时间和适用场景，见[贡献指南](CONTRIBUTING.md)。

## License

本项目内容以 [CC BY 4.0](LICENSE) 发布。
