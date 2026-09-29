# Split Expenses

A full-stack web application for splitting group expenses, featuring **real-time one-to-one chat** between users. Users are uniquely identified by their username.

This project is configured as an **npm workspaces monorepo** with a single centralized `node_modules`, `.env`, and `.gitignore` file at the root.

---

## 🗂️ Project Structure

```
Split expenses/
├── node_modules/       # Single shared node_modules for entire project
├── .env                # Single unified environment file
├── .env.example        # Example environment configuration
├── .gitignore          # Single unified gitignore
├── package.json        # Root workspace configuration & scripts
├── README.md
├── backend/            # Node.js + Express + MongoDB + Socket.IO
│   ├── server.js
│   ├── package.json
│   └── src/
│       ├── controllers/   # auth & message controllers
│       ├── models/        # User & Message models
│       ├── routes/        # auth & message routes
│       ├── middleware/    # auth middleware
│       ├── socket/        # Socket.IO setup & online users tracking
│       └── utils/         # db connection & token generator
└── frontend/           # React.js + Vite + Tailwind CSS v4
    ├── vite.config.js     # Configured with Tailwind v4 & proxy to backend
    ├── package.json
    ├── index.html
    └── src/
        ├── main.jsx       # App entry with Auth & Socket providers
        ├── App.jsx        # Protected routing setup
        ├── index.css      # Tailwind CSS v4 entry
        ├── context/       # AuthContext & SocketContext
        ├── pages/         # HomePage, LoginPage, SignupPage
        └── utils/         # Axios instance
```

---

## 🛠️ Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| **Frontend** | React.js, Vite, Tailwind CSS v4, React Router v7|
| **Backend**  | Node.js, Express.js                             |
| **Database** | MongoDB (via Mongoose)                          |
| **Real-time**| Socket.IO                                       |
| **Auth**     | JWT + bcryptjs (HttpOnly cookies)               |
| **Architecture** | npm Workspaces (Single root `node_modules`, `.env`, `.gitignore`) |

---

## 📦 Monorepo & Dependencies

All dependencies are installed in the single root `node_modules` directory using npm workspaces:

### Backend Dependencies
- `express` — Web application framework
- `mongoose` — MongoDB object modeling
- `socket.io` — Real-time bidirectional event engine
- `jsonwebtoken` — JWT token generation & verification
- `bcryptjs` — Password hashing
- `dotenv` — Environment variable loader
- `cors` — Cross-Origin Resource Sharing
- `cookie-parser` — Parse HttpOnly cookies
- `nodemon` (dev) — Auto-restart on code changes

### Frontend Dependencies
- `react`, `react-dom` — React 19 UI library
- `vite` — Next-gen frontend tooling
- `tailwindcss`, `@tailwindcss/vite` — Tailwind CSS v4 engine
- `react-router-dom` — Client-side routing
- `axios` — HTTP client
- `socket.io-client` — Socket.IO client library

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally or MongoDB Atlas URI

---

### 1. Install All Dependencies (Single Command)

From the project root directory:

```bash
npm install
```

> This automatically installs and links all dependencies for both `frontend` and `backend` into the single root `node_modules`.

---

### 2. Configure Environment Variables

There is **only one `.env` file** at the root of the project. Copy the template:

```bash
cp .env.example .env
```

Review or edit `.env` if needed:

```env
# ── Server ──────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Database ─────────────────────────────────────────────
MONGO_URI=mongodb://localhost:27017/split-expenses

# ── Auth ──────────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

# ── CORS ──────────────────────────────────────────────────
CLIENT_URL=http://localhost:5173

# ── Frontend (Vite exposes only VITE_ prefixed vars) ──────
VITE_API_URL=http://localhost:5000
```

- **Backend** loads this root `.env` via `path.resolve(__dirname, "../.env")`.
- **Frontend** reads this root `.env` via Vite's `envDir: "../"`.

---

### 3. Run Development Servers

You can run everything directly from the project root!

**Terminal 1 — Backend:**
```bash
npm run dev:backend
```
*Backend runs on `http://localhost:5000`*

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
```
*Frontend runs on `http://localhost:5173`*

---

## 📜 Root Scripts

| Command | Description |
|---|---|
| `npm run dev:backend` | Starts Express backend with nodemon |
| `npm run dev:frontend` | Starts Vite React frontend dev server |
| `npm run start:backend` | Starts backend in production mode |
| `npm run build:frontend` | Builds production bundle for frontend |

---

## 🔌 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/signup` | Public | Register with unique username |
| POST | `/login` | Public | Login with username and password |
| POST | `/logout` | Public | Clear JWT authentication cookie |
| GET | `/me` | Private | Get currently authenticated user |
| PUT | `/profile` | Private | Update username and/or profile picture |
| PUT | `/change-password` | Private | Update user password with verification |

### Friends & Discovery (`/api/friends`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/all?search=` | Private | Discover all registered users (search by username or User ID) |
| GET | `/list` | Private | Get confirmed friends list |
| GET | `/requests` | Private | Get pending incoming friend requests |
| POST | `/request/:targetUserId` | Private | Send a friend request to a user |
| POST | `/accept/:requestId` | Private | Accept an incoming friend request |
| POST | `/reject/:requestId` | Private | Reject or cancel a friend request |

### Messages (`/api/messages`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/users` | Private | Fetch other users for sidebar |
| GET | `/:username` | Private | Fetch chat history with specific user |
| POST | `/send/:username` | Private | Send a direct message to a user |

---

## ⚡ Socket.IO Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `getOnlineUsers` | Server → Client | `string[]` (userIds) | Real-time list of online users |
| `newMessage` | Server → Client | `Message` object | Real-time incoming message notification |
| `newFriendRequest` | Server → Client | Request object | Real-time incoming friend request notification |
| `friendRequestAccepted`| Server → Client | User object | Real-time notification when a sent request is accepted |

---

## 📄 License

MIT
