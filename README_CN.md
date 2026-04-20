# Kiro 账户管理器

<p align="center">
  <img src="Kiro-account-manager/resources/icon.png" width="128" height="128" alt="Kiro Logo">
</p>

<p align="center">
  <strong>一个功能强大的 Kiro IDE 多账号管理工具</strong>
</p>

<p align="center">
  支持多账号快速切换、自动 Token 刷新、分组标签管理、机器码管理等功能
</p>

<p align="center">
  <a href="README.md">English</a> | <strong>简体中文</strong>
</p>

---

## 功能特性

- **多账号管理** — 支持添加、编辑、删除多个 Kiro 账号，一键快速切换。支持 Builder ID、IAM Identity Center (SSO) 和 Social（Google/GitHub）登录方式，批量导入导出账号数据。
- **程序内登录** — 所有登录流程在程序内嵌窗口中完成，无需跳转外部浏览器。每次登录使用独立的 cookie 环境，避免账号缓存冲突。
- **自动刷新** — Token 过期前自动刷新，刷新后自动更新账户用量、订阅等信息。
- **分组与标签** — 通过分组和标签灵活组织管理账号，支持批量操作。一个账户一个分组，可有多个标签。
- **机器码管理** — 修改设备标识符，防止账号关联封禁。切换账号时自动更换机器码，支持备份恢复。
- **自动换号** — 余额不足时自动切换到其他可用账号，可配置余额阈值和检查间隔。
- **API 反代服务** — 提供 OpenAI 和 Claude 兼容的 API 端点，支持多账号轮询、Token 自动刷新、请求重试等。
- **Kiro IDE 设置同步** — 同步 Kiro IDE 设置，编辑 MCP 服务器，管理用户规则（Steering）。
- **个性化** — 21 种主题颜色、深色/浅色模式、隐私模式。
- **代理支持** — 支持 HTTP/HTTPS/SOCKS5 代理。

---

## 界面预览

### 主页
![主页](Kiro-account-manager/resources/主页.png)

### 账户管理
![账户管理](Kiro-account-manager/resources/账户管理.png)

### 机器码管理
![机器码管理](Kiro-account-manager/resources/机器码管理.png)

### 设置
![设置](Kiro-account-manager/resources/设置.png)

### API 反代服务
![API 反代服务](Kiro-account-manager/resources/API%20反代服务.png)

### Kiro IDE 设置
![Kiro 设置](Kiro-account-manager/resources/Kiro%20设置.png)

---

## 安装说明

### Windows
直接运行 `.exe` 安装程序。

### macOS
应用未进行 Apple 代码签名，首次打开可能提示"已损坏，无法打开"：

```bash
xattr -cr /Applications/Kiro\ Account\ Manager.app
```

或右键点击应用 → 打开 → 打开。

### Linux
- **AppImage**: `chmod +x kiro-account-manager-*.AppImage && ./kiro-account-manager-*.AppImage`
- **deb**: `dpkg -i kiro-account-manager-*.deb`
- **snap**: `snap install kiro-account-manager-*.snap`

---

## 技术栈

- **框架**: Electron + React + TypeScript
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **构建工具**: Vite (electron-vite)
- **图标**: Lucide React

---

## 开发

### 环境要求

- Node.js >= 18
- npm >= 9

### 快速开始

```bash
cd Kiro-account-manager
npm install
npm run dev
```

### 构建

```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

---

## 许可证

[AGPL-3.0](LICENSE)
