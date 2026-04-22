# NexTalk — AI-Powered Real-Time Chat App

> Built by **Humais Ali** — SkyTech Developers | UET Mardan

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
# Root
npm install

# Client
cd client && npm install && cd ..

# Server
cd server && npm install && cd ..
```

### 2. Configure environment

Copy `.env.example` to `.env` inside `/server` and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nextalk
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=your_google_gemini_api_key
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Run in development

```bash
# From project root — runs both client + server
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:5000

---

## 📁 Project Structure

```
NexTalk/
├── client/          # React + Vite + Tailwind
└── server/          # Node.js + Express + Socket.io + MongoDB
```

---

## 🗓️ Build Progress

| Day | Status | Feature |
|-----|--------|---------|
| Day 1 | ✅ Done | Setup + JWT Auth |
| Day 2 | ⏳ Next | Socket.io Real-Time Core |
| Day 3 | ⏳ | Full React UI |
| Day 4 | ⏳ | AI — Tone Analyzer + Smart Replies |
| Day 5 | ⏳ | AI — Summarizer + Code Mode |
| Day 6 | ⏳ | AI — Translation + Mood Rooms |
| Day 7 | ⏳ | Polish + Deploy |

---

## 🔗 Links

- GitHub: [github.com/humaisali](https://github.com/humaisali)
- Portfolio: [humaissoftneer.vercel.app](https://humaissoftneer.vercel.app)
