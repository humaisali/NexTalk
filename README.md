# NexTalk — AI-Powered Real-Time Chat App

> Built by **Humais Ali** — SkyTech Developers | UET Mardan

A full-stack, production-ready chat application with 6 Gemini AI features built in 7 days.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 JWT Auth | Register, login, revocable sessions, secure logout |
| 💬 Real-Time Chat | Socket.io rooms, live messages, typing indicators |
| ✨ Tone Analyzer | Rates your message tone before sending |
| ⚡ Smart Replies | 3 AI-suggested quick reply chips |
| 📋 Catch Me Up | AI summary of missed messages |
| 💻 Code Sharing | Syntax highlighted code + AI auto-explanation |
| 🌐 Auto-Translate | Messages translate to your preferred language |
| 🔥 Mood Rooms | Live group sentiment tracking with history |

---

## 🚀 Local Setup

### 1. Clone & install

```bash
git clone https://github.com/humaisali/nextalk.git
cd nextalk

# Install root concurrently
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/nextalk
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
GEMINI_API_KEY=<from https://aistudio.google.com/app/apikey>
CLIENT_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=<required for production attachments>
CLOUDINARY_API_KEY=<required for production attachments>
CLOUDINARY_API_SECRET=<required for production attachments>
VAPID_PUBLIC_KEY=<persistent web-push public key>
VAPID_PRIVATE_KEY=<persistent web-push private key>
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run development servers

```bash
npm run dev        # Runs both client + server concurrently
```

- Frontend: http://localhost:5173  
- Backend:  http://localhost:5000

### Verification

```bash
npm run check      # Server security/state tests + production client build
```

---

## ☁️ Deployment

### Backend → Render

1. Push project to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Set **Root Directory** to `server`
5. Set **Build Command**: `npm install`
6. Set **Start Command**: `node index.js`
7. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB Atlas URI |
| `JWT_SECRET` | Long random string |
| `GEMINI_API_KEY` | Your Gemini API key |
| `CLIENT_ORIGIN` | Your Vercel URL (added after frontend deploy) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for durable attachments |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `VAPID_PUBLIC_KEY` | Persistent web-push public key |
| `VAPID_PRIVATE_KEY` | Persistent web-push private key |

8. Click **Deploy** — copy the Render URL (e.g. `https://nextalk-server.onrender.com`)

> **Free tier note:** Render spins down after 15min inactivity. First request may take ~30s.

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `client`
4. Set **Framework Preset** to `Vite`
5. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your Render backend URL |
| `VITE_SOCKET_URL` | Your Render backend URL |

6. Click **Deploy**
7. Copy your Vercel URL (e.g. `https://nextalk.vercel.app`)

8. **Go back to Render** → Update `CLIENT_ORIGIN` to your Vercel URL → Redeploy

---

### MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a **free M0 cluster**
3. Create a database user with read/write access
4. Add `0.0.0.0/0` to IP Allowlist (or Render's IPs)
5. Click **Connect** → **Drivers** → Copy the URI
6. Replace `<password>` in the URI with your DB user password

---

## 📁 Project Structure

```
nextalk/
├── client/                  # React + Vite + Tailwind
│   └── src/
│       ├── components/      # 12 UI components
│       ├── context/         # Auth, Socket, Toast providers
│       ├── hooks/           # useAI, useRooms, useTyping, useTranslation, useCodeShare, useToast
│       ├── pages/           # Login, Register, Chat
│       └── services/        # Axios API service
│
└── server/                  # Node.js + Express + Socket.io
    ├── middleware/           # auth.js, rateLimit.js
    ├── models/              # User, Room, Message
    ├── routes/              # auth, rooms, ai
    ├── services/            # geminiService.js
    └── socket/              # socketHandler.js
```

---

## 🗓️ Build Log

| Day | Feature |
|-----|---------|
| 1 | Setup + JWT Auth (register/login/me) |
| 2 | Socket.io real-time core (rooms, messages, presence) |
| 3 | Full React UI — all 10 components |
| 4 | AI: Tone Analyzer + Smart Replies |
| 5 | AI: Catch Me Up + Code Sharing + Auto-Explain |
| 6 | AI: Real-Time Translation + Mood Rooms |
| 7 | Polish, edge cases, deployment |

---

## 👤 Author

**Humais Ali**  
SkyTech Developers | UET Mardan  
GitHub: [github.com/humaisali](https://github.com/humaisali)  
Portfolio: [humaissoftneer.vercel.app](https://engineerhumais.vercel.app/)
