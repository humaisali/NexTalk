# NexTalk — Patch Notes

## 3 Fixes Applied

---

### Fix 1 — Translation Removed Completely

**What was removed:**
- `useTranslation.js` hook — no longer needed, delete it
- All `translateMessage`, `autoTranslate`, `batchTranslate`, `batchTranslateRoom` calls in `useAI.js`
- `LanguageSelector` component usage in `Sidebar.jsx` — removed entirely
- `translations`, `translationLoading`, `userLanguage` props from `ChatWindow.jsx` and `MessageBubble.jsx`
- Globe icon / Translate button from every message bubble
- `POST /api/ai/translate`, `POST /api/ai/translate-and-save`, `POST /api/ai/batch-translate` routes from `server/routes/ai.js`
- `translateMessage` function from `server/services/geminiService.js`
- `translateMsg`, `batchTranslate`, `updateLanguage` from `client/src/services/api.js`
- `language` field update logic (the `PUT /api/auth/language` route is left in place on the server but is no longer called from the frontend)

**Files changed:**
```
client/src/hooks/useAI.js              ← translation state + calls removed
client/src/services/api.js             ← translateMsg, batchTranslate removed
client/src/components/MessageBubble.jsx ← Globe button, translation bubble removed
client/src/components/ChatWindow.jsx    ← translation props removed
client/src/components/MessageInput.jsx  ← no language logic
client/src/components/Sidebar.jsx       ← LanguageSelector removed
client/src/pages/Chat.jsx              ← translation wiring removed
server/routes/ai.js                    ← 3 translation routes removed
server/services/geminiService.js       ← translateMessage removed
```

---

### Fix 2 — Rooms Renamed to Groups (WhatsApp Style)

Every user-facing "Room" / "Channel" label is now "Group". Backend models and API paths stay unchanged (`/api/rooms` still works) — only the UI vocabulary changes.

**What changed in the UI:**
- Sidebar tab: **Rooms → Groups**
- Sidebar header: **Channels → Groups**
- "Create Room" form → **"New Group"**  
- Toast messages: **"#roomname created!" → "Group created!"**
- Navbar subtitle: **"X online · Y members"** (no more hash icon)
- Group avatar: now shows **first letter of the group name** in a circle (like WhatsApp), not a `#` icon
- RoomInfoPanel header: **Information → Group Info**
- RoomInfoPanel "Room Mood" → **"Group Mood"**
- RoomInfoPanel "Room Details" → **"Group Details"**
- RoomSettings header: group name displayed with letter avatar
- RoomSettings Members tab: "Owner" badge kept, "Leave Room" → **"Leave Group"**
- RoomSettings Settings tab: "Room Name" → **"Group Name"**, "Room Settings" → **"Group Settings"**
- JoinRoom page: all "room" references → **"group"**
- Chat welcome screen: "Room" → **"Group"**
- Error messages: updated to say "group" throughout

**Files changed:**
```
client/src/components/Sidebar.jsx
client/src/components/Navbar.jsx
client/src/components/RoomInfoPanel.jsx
client/src/components/RoomSettings.jsx
client/src/pages/Chat.jsx
client/src/pages/JoinRoom.jsx
client/src/hooks/useRooms.js
```

---

### Fix 3 — Join Existing Group (New Feature)

Users can now join a group they are not a member of directly from the sidebar, without needing to navigate to a separate page.

**How it works:**
1. In the sidebar Groups tab, there is now a **teal `UserPlus` icon button** next to the `+` create button
2. Clicking it opens an inline form: **"Join a Group"**
3. The user pastes either:
   - A **full invite URL** (e.g. `https://nextalk.vercel.app/join/aB3xK9mN2p`)
   - Or just the **invite code** (e.g. `aB3xK9mN2p`)
4. The code is extracted automatically from the URL if pasted as a full link
5. On success: the group is added to the list and opened immediately
6. On failure: a clear inline error is shown ("Invalid code. Ask the group admin for a new link.")

**New function in `useRooms.js`:**
```js
handleJoinByCode(input)
// input = full URL or raw code string
// Extracts code, calls POST /api/rooms/join/:code
// Adds group to list, navigates into it
```

**Sidebar wiring:**
```jsx
// New prop passed from Chat.jsx → Sidebar.jsx
onJoinRoom={handleJoinGroup}

// Sidebar renders the inline join form when showJoin === true
```

**Files changed:**
```
client/src/hooks/useRooms.js           ← handleJoinByCode() added
client/src/components/Sidebar.jsx      ← join form UI + UserPlus button
client/src/pages/Chat.jsx              ← handleJoinGroup() + onJoinRoom prop
```

**No backend changes needed** — `POST /api/rooms/join/:inviteCode` already existed and works correctly.

---

## How to Apply

Copy the files from this patch into your project, replacing the originals:

```
client/src/hooks/useAI.js
client/src/hooks/useRooms.js
client/src/services/api.js
client/src/components/Sidebar.jsx
client/src/components/Navbar.jsx
client/src/components/ChatWindow.jsx
client/src/components/MessageBubble.jsx
client/src/components/MessageInput.jsx
client/src/components/RoomInfoPanel.jsx
client/src/components/RoomSettings.jsx
client/src/pages/Chat.jsx
client/src/pages/JoinRoom.jsx
server/routes/ai.js
server/services/geminiService.js
```

**Also delete these files** (no longer used):
```
client/src/hooks/useTranslation.js
client/src/components/LanguageSelector.jsx
```

No `package.json` changes. No new dependencies. No database migrations needed.
