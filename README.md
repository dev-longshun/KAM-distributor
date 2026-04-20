# Kiro Account Manager

<p align="center">
  <img src="Kiro-account-manager/resources/icon.png" width="128" height="128" alt="Kiro Logo">
</p>

<p align="center">
  <strong>A powerful multi-account management tool for Kiro IDE</strong>
</p>

<p align="center">
  Quick account switching, auto token refresh, group/tag management, machine ID management and more
</p>

<p align="center">
  <strong>English</strong> | <a href="README_CN.md">简体中文</a>
</p>

---

## Features

- **Multi-Account Management** — Add, edit, delete and quickly switch between multiple Kiro accounts. Supports Builder ID, IAM Identity Center (SSO) and Social (Google/GitHub) login methods. Batch import/export account data.
- **In-App Login** — All login flows open inside the app with isolated browser sessions, no external browser needed. Each login uses a clean cookie environment to prevent account cache conflicts.
- **Auto Token Refresh** — Tokens are refreshed before expiration. Account usage and subscription info are updated automatically after refresh.
- **Groups & Tags** — Organize accounts with groups and tags. Batch operations supported. One account per group, multiple tags allowed.
- **Machine ID Management** — Modify device identifier to prevent account association bans. Auto switch machine ID when switching accounts. Backup and restore supported.
- **Auto Account Switch** — Automatically switch to an available account when balance is low. Configurable threshold and check interval.
- **API Proxy Service** — OpenAI and Claude compatible API endpoints with multi-account rotation, auto token refresh, request retry and more.
- **Kiro IDE Settings Sync** — Sync Kiro IDE settings, edit MCP servers, manage user rules (Steering).
- **Personalization** — 21 theme colors, dark/light mode, privacy mode.
- **Proxy Support** — HTTP/HTTPS/SOCKS5 proxy for all network requests.

---

## Screenshots

### Home
![Home](Kiro-account-manager/resources/主页.png)

### Account Management
![Account Management](Kiro-account-manager/resources/账户管理.png)

### Machine ID Management
![Machine ID Management](Kiro-account-manager/resources/机器码管理.png)

### Settings
![Settings](Kiro-account-manager/resources/设置.png)

### API Proxy Service
![API Proxy Service](Kiro-account-manager/resources/API%20反代服务.png)

### Kiro IDE Settings
![Kiro Settings](Kiro-account-manager/resources/Kiro%20设置.png)

---

## Installation

### Windows
Run the `.exe` installer.

### macOS
The app is not Apple code-signed. On first launch macOS may show "damaged and can't be opened":

```bash
xattr -cr /Applications/Kiro\ Account\ Manager.app
```

Or right-click the app → Open → Open.

### Linux
- **AppImage**: `chmod +x kiro-account-manager-*.AppImage && ./kiro-account-manager-*.AppImage`
- **deb**: `dpkg -i kiro-account-manager-*.deb`
- **snap**: `snap install kiro-account-manager-*.snap`

---

## Tech Stack

- **Framework**: Electron + React + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite (electron-vite)
- **Icons**: Lucide React

---

## Development

### Requirements

- Node.js >= 18
- npm >= 9

### Quick Start

```bash
cd Kiro-account-manager
npm install
npm run dev
```

### Build

```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

### Multi-Architecture Build

```bash
npx electron-builder --win --x64      # Windows 64-bit
npx electron-builder --win --arm64    # Windows ARM64
npx electron-builder --mac --x64      # macOS Intel
npx electron-builder --mac --arm64    # macOS Apple Silicon
npx electron-builder --linux --x64    # Linux 64-bit
npx electron-builder --linux --arm64  # Linux ARM64
```

---

## License

[AGPL-3.0](LICENSE)
