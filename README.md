# Skill Sync

Sync rules and skills files to multiple coding assistants via symlinks. Manage everything from one central directory — edit once, apply everywhere.

## The Problem

You use Claude Code, Cursor, Trae, and other AI coding assistants. Each has its own rules/skills directory. Keeping them in sync means copying files manually — change one, update them all. Skill Sync fixes this with symlinks.

## How It Works

```
central-repo/
├── rules/
│   ├── coding-style.md       ← edit here only
│   └── no-overengineering.md
└── skills/
    ├── code-review/
    │   └── SKILL.md
    └── testing/
        └── SKILL.md

~/.claude/rules/coding-style.md   → symlink → central-repo/rules/coding-style.md
~/.cursor/rules/coding-style.md   → symlink → central-repo/rules/coding-style.md
~/.trae/rules/coding-style.md     → symlink → central-repo/rules/coding-style.md
```

Changes in the central repo are immediately reflected in all linked editors.

## Quick Start

### 1. Install dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd client && npm install
```

Or from the root:

```bash
npm run postinstall
```

### 2. Configure

Copy the example config and set your central repo path:

```bash
cp config.example.json config.json
```

Edit `config.json` — set `centralRepo` to your central directory path.

### 3. Run

**Development** (both frontend and backend with auto browser open):

```bash
npm run dev
```

**Production** (build frontend, then serve everything from backend):

```bash
npm run build
npm start
```

Open http://localhost:3456

## Usage

### Step 1: Set Central Repo

Enter your central directory path at the top of the page, e.g. `D:/code/central-skills`.

Expected structure:

```
<central-repo>/
├── rules/          ← .md rule files
└── skills/         ← skill directories (each subdirectory is one skill)
```

### Step 2: Configure Editors

Switch to the **Editors** tab. Pre-configured editors with common paths:

| Editor | Rules Dir | Skills Dir |
|--------|-----------|------------|
| Claude Code | `~/.claude/rules` | `~/.claude/commands` |
| Cursor | `~/.cursor/rules` | — |
| Trae | `~/.trae/rules` | — |

- `~` expands to your home directory automatically
- Leave paths empty to skip them during sync
- Add custom editors, or disable/delete unused ones

### Step 3: Sync Rules / Skills

Switch to the **Rules** or **Skills** tab:

1. Select files/directories on the left
2. Select target editors on the right
3. Click **Sync Selected**

Symlinks are created in each editor's directory pointing back to the central repo.

### Step 4: Check Status

The **Status** tab shows a matrix view:

```
                Claude Code  Trae  Cursor  QClaw
coding-style.md     ✅        ✅     ⬜      ✅
no-overengineer.md  ✅        ⬜     ⬜      ⬜
code-review/        ✅        ✅     ⬜      ⬜
```

- ✅ Synced (symlink points correctly)
- ⬜ Not synced
- ⚠️ Conflict (non-symlink file exists, or symlink points elsewhere)

### Unsync

Select files and editors in the Rules/Skills tab, then click **Unsync** to remove the symlinks.

## API

Backend runs on `localhost:3456`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config` | Get config |
| PUT | `/api/config/repo` | Update central repo path |
| GET | `/api/editors` | List editors |
| POST | `/api/editors` | Add editor |
| PUT | `/api/editors/:id` | Update editor |
| DELETE | `/api/editors/:id` | Delete editor |
| GET | `/api/scan` | Scan central repo |
| GET | `/api/status` | Sync status for all editors |
| GET | `/api/status/:editorId` | Sync status for one editor |
| POST | `/api/sync` | Create symlinks |
| POST | `/api/unsync` | Remove symlinks |

## Project Structure

```
skill-sync/
├── server/                # Express backend
│   ├── index.js           # API routes + static serving
│   ├── lib/
│   │   ├── scanner.js     # Scan repo + check sync status
│   │   └── linker.js      # Symlink create/delete
│   └── package.json
├── client/                # React frontend
│   ├── src/
│   │   ├── api.ts         # API client
│   │   ├── types.ts       # TypeScript types
│   │   ├── App.tsx        # Main UI (tab switching)
│   │   └── components/
│   │       ├── RepoSetting.tsx
│   │       ├── SyncTab.tsx
│   │       ├── StatusTab.tsx
│   │       └── EditorsTab.tsx
│   └── vite.config.ts     # Proxy /api → localhost:3456
├── dev.js                 # Dev launcher (backend + frontend + browser)
├── config.example.json    # Example config
└── package.json           # Root scripts only
```

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + TypeScript + TailwindCSS v4 + Vite
- **Storage**: JSON config file

## Windows Notes

- Creating symlinks on Windows requires **admin privileges** or **Developer Mode**
- Enable Developer Mode: Settings → Update & Security → For developers → Developer Mode
- Directory symlinks use `junction` (no admin required)
- File symlinks use `file` (requires admin or Developer Mode)

## NPM Scripts

```bash
npm run dev       # Start both backend + frontend dev servers, open browser
npm start         # Production: serve from server/ on port 3456
npm run build     # Build frontend to public/
npm run postinstall  # Install all subdirectory dependencies
```

## License

MIT
