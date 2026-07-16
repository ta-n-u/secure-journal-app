# Secure Journal — Encrypted Diary & Habit Tracker

A full-stack MERN application combining a **zero-knowledge encrypted diary** with a **habit tracker** featuring streaks and a GitHub-style consistency heatmap.

## Live Demo
[Add your deployed link here once live]

## Why this project

Most portfolio CRUD apps look the same. This one is built around a genuine security challenge: **the server never sees your diary entries in plaintext — not even the database admin can read them.** All encryption and decryption happens in the browser using the Web Crypto API.

## Architecture

### Zero-knowledge encryption design
- On signup, each user gets a random `encryptionSalt` (not secret, just unique per user)
- On login, the browser derives an AES-256 key from the user's password + their salt using **PBKDF2** (100,000 iterations, SHA-256)
- Diary entries are encrypted client-side with **AES-GCM** before being sent to the server
- The server only ever stores `ciphertext` + `iv` — it has no way to decrypt entries, even with full database access
- The password itself is separately hashed with bcrypt for authentication — this hash is *not* the encryption key and can't be used to decrypt anything

**Tradeoff, stated honestly:** the derived key is cached in `sessionStorage` (not `localStorage`) so a page refresh doesn't force re-login. This means the key briefly exists in browser storage rather than purely in memory — a deliberate usability-vs-purity tradeoff. The session ends when the browser tab is closed or the user logs out manually.

### Habit tracking
- Users define habits and check in daily
- Current/longest streaks are computed on read by walking sorted check-in dates and measuring consecutive-day gaps — no separate counter to keep in sync
- A calendar heatmap (GitHub contribution graph style) visualizes consistency over the past year

## Tech stack
- **Frontend:** React (Vite), React Router, Web Crypto API, react-calendar-heatmap, Axios
- **Backend:** Node.js, Express, MongoDB (Atlas), Mongoose
- **Auth:** JWT, bcrypt

## Project structure
secure-journal-app/
├── backend/
│   ├── config/       # MongoDB connection
│   ├── models/       # User, DiaryEntry, Habit, HabitLog
│   ├── controllers/  # Route logic
│   ├── routes/       # Express routers
│   └── middleware/   # JWT auth guard
└── frontend/
└── src/
├── utils/crypto.js       # PBKDF2 + AES-GCM encryption
├── context/AuthContext.jsx
├── pages/                # Login, Signup, Diary, Habits
└── api/axios.js

## API endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Log in |
| GET/POST | `/api/diary` | List / create encrypted entries |
| DELETE | `/api/diary/:id` | Delete an entry |
| GET/POST | `/api/habits` | List / create habits |
| POST | `/api/habits/:id/checkin` | Toggle today's check-in |
| GET | `/api/habits/:id/streak` | Current & longest streak |
| GET | `/api/habits/:id/logs` | Check-in history (for heatmap) |

## License
MIT