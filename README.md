# 🎯 Lucky 2D/3D Betting Platform — Backend API

> **Standard Operating Procedure (SOP) — Backend Service**
> Prepared for: Project Manager
> Last Updated: April 2026

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [System Architecture](#-system-architecture)
4. [Project Structure](#-project-structure)
5. [Environment Setup](#-environment-setup)
6. [Running the Server](#-running-the-server)
7. [API Modules Overview](#-api-modules-overview)
8. [Authentication & Authorization](#-authentication--authorization)
9. [Automated Cron Jobs](#-automated-cron-jobs)
10. [Deployment](#-deployment)
11. [Key Business Logic](#-key-business-logic)
12. [Important Notes](#-important-notes)

---

## 📌 Project Overview

**Lucky 2D/3D** is a lottery betting platform backend API built with **Node.js + Express**. It handles:

- User registration, login, and wallet management
- 2D and 3D lottery bet placement and result processing
- Automatic payout calculation when results are announced
- Admin panel operations (user management, money transactions, result entry)
- Scheduled cron jobs for automated bet processing

**Live Production URLs (Frontend):**
| Environment | URL |
|---|---|
| Production | `https://zay2d3d.com` |
| Admin Panel | `https://admin.zay2d3d.com` |
| Staging | `https://2d.gttechsolutions.online` |

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js (ESM Modules) |
| Framework | Express.js v5 |
| Database | MySQL 2 |
| Authentication | JWT (JSON Web Tokens) + Cookie-based sessions |
| Password Hashing | bcrypt |
| Scheduler | node-cron |
| Date Handling | Day.js / Luxon |
| File Upload | Multer |
| Email | Nodemailer |
| HTTP Client | node-fetch |
| Dev Server | Nodemon |

---

## 🏗 System Architecture

```
Client (Web / Mobile App)
        │
        ▼
  Express.js API Server  (Port 3000)
        │
        ├── /api/v1/user          → User auth & profile
        ├── /api/v1/money         → User wallet transactions
        ├── /api/v1/twod          → 2D bet placement & listing
        ├── /api/v1/threed        → 3D bet placement & listing
        ├── /api/v1/two-d-result  → 2D result announcements
        ├── /api/v1/admin/*       → All admin operations
        │
        ▼
     MySQL Database
        │
        ├── users
        ├── bets (2D)
        ├── bets_3d
        ├── results
        ├── transactions
        └── ...
```

---

## 📁 Project Structure

```
lucky-2d-be/
├── src/
│   ├── index.js                    # 🚀 App entry point — starts Express server
│   ├── router.js                   # 🗺  Master router — mounts all route modules
│   │
│   ├── configs/
│   │   └── config.js               # ⚙️  Environment variables & DB config
│   │
│   ├── middlewear/
│   │   ├── authJwt.js              # 🔐 JWT verification middleware
│   │   └── admin_roles.js          # 👑 Admin role guard middleware
│   │
│   ├── helper/                     # 🧰 Utility/helper functions
│   │
│   └── features/
│       ├── users/                  # 👤 User registration & login
│       ├── money_transation/       # 💰 User deposit/withdraw requests
│       ├── 2d_bet/                 # 🎲 2D bet placement logic
│       │   ├── twod_list_route.js
│       │   ├── twod_list_controller.js
│       │   └── twod_list_service.js   ← Core betting logic lives here
│       ├── 2d_result/              # 📊 2D result + auto payout + cron jobs
│       ├── 3d-bet/                 # 🎰 3D bet placement logic
│       └── admin/
│           ├── auth/               # 🔑 Admin login
│           ├── users_managent/     # 👥 Admin: manage users
│           ├── money_transation/   # 💵 Admin: approve/reject transactions
│           ├── 2d/                 # 🎯 Admin: 2D number management
│           ├── 3d/                 # 🎯 Admin: 3D number management
│           ├── 3d_result/          # 📢 Admin: announce 3D results
│           ├── slide_images/       # 🖼  Admin: banner/slide management
│           ├── transcation_phone/  # 📱 Admin: payment phone numbers
│           ├── set_admin/          # ⚙️  Admin: role assignment
│           └── status_management/  # 🔛 Admin: open/close betting status
│
├── uploads/                        # 📂 Uploaded images (served as static)
├── .env                            # 🔒 Environment variables (NOT in git)
├── package.json
└── README.md
```

---

## ⚙️ Environment Setup

### 1. Prerequisites

| Requirement | Version |
|---|---|
| Node.js | v18+ |
| npm | v9+ |
| MySQL | v8+ |

### 2. Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd lucky-2d-be

# Install dependencies
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=lucky2d_db

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Admin
ADMIN_SECRET=your_admin_secret
```

> ⚠️ **Never commit `.env` to version control.** The `.gitignore` already excludes it.

---

## 🚀 Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start at: `http://localhost:3000`

### Check server is running

```bash
curl http://localhost:3000/
# Expected: "This is testing ci cd runing......OKOKOK....HYMA"
```

---

## 📡 API Modules Overview

### 👤 User Module — `/api/v1/user`
Handles user registration, login, profile, and password management.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/user/register` | Register a new user |
| POST | `/user/login` | Login and receive JWT |
| GET | `/user/profile` | Get current user profile |
| PUT | `/user/update` | Update user info |

---

### 💰 Money/Wallet Module — `/api/v1/money`
Handles user deposit and withdrawal requests.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/money/deposit` | Submit a deposit request |
| POST | `/money/withdraw` | Submit a withdrawal request |
| GET | `/money/history` | View transaction history |

---

### 🎲 2D Bet Module — `/api/v1/twod`
Core 2D lottery betting operations.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/twod/bet` | Place a 2D bet |
| GET | `/twod/list` | Get available 2D numbers |
| GET | `/twod/my-bets` | View user's bet history |
| GET | `/twod/open-time` | Get current betting session info |

---

### 🎰 3D Bet Module — `/api/v1/threed`
Core 3D lottery betting operations.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/threed/bet` | Place a 3D bet |
| GET | `/threed/list` | Get available 3D numbers |
| GET | `/threed/my-bets` | View user's 3D bet history |

---

### 📊 2D Result Module — `/api/v1/two-d-result`
Result lookup and history.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/two-d-result/latest` | Get the latest 2D result |
| GET | `/two-d-result/history` | Get result history |

---

### 👑 Admin Modules — `/api/v1/admin/*`

| Module | Base Path | Purpose |
|---|---|---|
| Auth | `/admin/auth` | Admin login/logout |
| Users | `/admin/users` | View & manage users |
| Money | `/admin/money` | Approve/reject transactions |
| 2D Numbers | `/admin/two-d` | Set 2D limits, hot numbers |
| 3D Numbers | `/admin/three-d` | Manage 3D number availability |
| 3D Result | `/admin/three-d-result` | Announce 3D results + payout |
| Slide Images | `/admin/image` | Upload/manage banner images |
| Phone Numbers | `/admin/phone` | Payment method phone numbers |
| Set Admin | `/set-admin` | Promote user to admin |
| Status | `/admin/status` | Open/close betting for a session |

---

## 🔐 Authentication & Authorization

The system uses **JWT-based authentication** with cookies.

### Flow:
1. User logs in → receives JWT token stored in an HTTP-only cookie
2. All protected routes pass through `authJwt.js` middleware
3. Admin routes additionally pass through `admin_roles.js` middleware

### Middleware Files:
| File | Purpose |
|---|---|
| `middlewear/authJwt.js` | Verifies JWT token from cookie/header |
| `middlewear/admin_roles.js` | Checks if authenticated user has admin role |

---

## ⏰ Automated Cron Jobs

The cron jobs run automatically when the server starts (imported in `index.js`).

**File:** `src/features/2d_result/cron_job.js`

| Job | Schedule | Description |
|---|---|---|
| Morning Session Close | 11:59 AM (Myanmar Time) | Closes 2D betting for the morning session |
| Evening Session Close | 3:59 PM (Myanmar Time) | Closes 2D betting for the evening session |
| Auto Payout | After result announcement | Automatically credits winners' wallets |

> ✅ These run in the background — **no manual action needed** once the server is running.

---

## 🌐 Deployment

### Current Production Setup

| Item | Detail |
|---|---|
| Server | VPS / Cloud server |
| Process Manager | (Recommend PM2 for production) |
| Frontend Host | Netlify / Custom domain |
| Backend Port | 3000 (proxied via Nginx) |

### Deploy Steps (Manual)

```bash
# 1. Pull latest code
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Restart the server
# If using PM2:
pm2 restart lucky-2d-be

# If using nodemon manually:
npm run dev
```

### Recommended: Run with PM2 (Production)

```bash
# Install PM2 globally (one-time)
npm install -g pm2

# Start the app
pm2 start src/index.js --name "lucky-2d-be" --interpreter node

# Auto-start on server reboot
pm2 startup
pm2 save
```

---

## 💡 Key Business Logic

### 2D Betting Rules
- Bets are accepted only during **open sessions** (AM & PM)
- Each number has a **maximum bet limit** configurable by admin
- Users cannot bet more than their available **wallet balance**
- All bets are recorded with timestamp and session info

### Auto Payout Process
1. Admin announces the winning 2D number
2. System queries all bets matching the winning number for that session
3. **Payout multiplier** is applied to each winning bet amount
4. Winners' wallets are automatically credited
5. Bet status is updated to `"paid"`

### 3D Lottery
- Results are announced **monthly**
- Admin manually enters the result via the admin panel
- Auto payout runs similarly to 2D upon result entry

---

## ⚠️ Important Notes

| # | Note |
|---|---|
| 1 | The `.env` file is **not included** in the repository — must be configured on each deployment environment |
| 2 | The `uploads/` folder stores images and is **served as static files** at `/uploads/*` |
| 3 | CORS is configured to only allow **specific frontend origins** — new domains must be added in `src/index.js` |
| 4 | All times are handled in **Myanmar Time (MMT, UTC+6:30)** using Luxon/Day.js |
| 5 | MySQL database schema/migrations are managed **separately** — contact developer for initial DB setup script |
| 6 | JWT tokens expire after **7 days** by default |

---

## 📞 Contact & Responsibility

| Role | Responsibility |
|---|---|
| Backend Developer | API development, bug fixes, cron job tuning |
| Admin | Result announcement, approving transactions, user management |
| DevOps / Manager | Server uptime, deployments, environment config |

---

> 📄 *This document serves as the Standard Operating Procedure (SOP) for the Lucky 2D/3D Backend API. Please keep this document updated whenever major changes are made to the system.*
