# Lotería Multiplayer Game — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect a React + Vite + TypeScript frontend to an existing Express + Socket.IO Lotería API, with multi-pattern win condition support.

**Architecture:** The API (port 3000) holds all game state via REST + Socket.IO. The frontend (port 5173) uses Zustand for client state, React Router for navigation, and Vite's dev server proxy for all API/socket traffic. Player identity is persisted in sessionStorage to survive page refreshes.

**Tech Stack:** React 18, Vite, TypeScript, React Router v6, Zustand, socket.io-client (frontend) · Express 5, Socket.IO, TypeScript (API — existing)

---

## File Map

### API (`~/repos/loteria-api`)

| Action | File | Change |
|--------|------|--------|
| Modify | `src/data/cards.ts` | `.png` → `.jpg` in all imageUrl fields |
| Modify | `src/models/game.ts` | Add `WinPattern`, `WinResult` types |
| Modify | `src/models/socketEvents.ts` | Add `pattern: WinPattern` to `game:winner` |
| Modify | `src/services/gameService.ts` | Replace `checkWinner` with multi-pattern version |
| Modify | `src/sockets/gameSocket.ts` | Emit `pattern` in `game:winner` |

### Frontend (`~/Documentos/Projects/loteria`)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `package.json` | Dependencies |
| Create | `vite.config.ts` | Dev server + proxy to API |
| Create | `tsconfig.json` | TypeScript config |
| Create | `tsconfig.app.json` | App TypeScript config |
| Create | `index.html` | HTML entry point |
| Create | `src/main.tsx` | React entry |
| Create | `src/App.tsx` | Router setup |
| Create | `src/types/game.ts` | Mirrors API types + WinPattern |
| Create | `src/api/rooms.ts` | createRoom(), joinRoom() REST helpers |
| Create | `src/utils/winDetection.ts` | detectWin() — client-side pattern check |
| Create | `src/store/gameStore.ts` | Zustand store: identity, room, board, socket |
| Create | `src/pages/Home.tsx` | Create or join a room |
| Create | `src/pages/Lobby.tsx` | Waiting room; host starts game |
| Create | `src/pages/Game.tsx` | Main game: board, current card, controls |
| Create | `src/components/CardTile.tsx` | Single card (image + mark state) |
| Create | `src/components/PlayerBoard.tsx` | 4×4 grid of CardTile |
| Create | `src/components/CurrentCard.tsx` | Large display of the drawn card |
| Create | `src/components/DrawnCards.tsx` | Scrollable history of drawn cards |
| Create | `src/components/WinnerOverlay.tsx` | Win announcement modal |
| Create | `public/cards/01.jpg–54.jpg` | Normalized card images |

---

## Task 1: API — Update card image extension

**Files:**
- Modify: `~/repos/loteria-api/src/data/cards.ts`

- [ ] **Step 1: Replace .png with .jpg in all imageUrl fields**

Open `src/data/cards.ts`. The file has 54 entries like `imageUrl: "/cards/01.png"`. Replace `.png` with `.jpg` across all entries. The sed one-liner does it safely:

```bash
cd ~/repos/loteria-api
sed -i 's|/cards/\([0-9]*\)\.png|/cards/\1.jpg|g' src/data/cards.ts
```

Verify it looks right:
```bash
grep imageUrl src/data/cards.ts | head -5
```

Expected output contains `/cards/01.jpg`, `/cards/02.jpg`, etc.

- [ ] **Step 2: Commit**

```bash
cd ~/repos/loteria-api
git add src/data/cards.ts
git commit -m "fix: update card image extension from .png to .jpg"
```

---

## Task 2: API — Add WinPattern and WinResult types

**Files:**
- Modify: `~/repos/loteria-api/src/models/game.ts`

- [ ] **Step 1: Append types to game.ts**

Add at the bottom of `src/models/game.ts`:

```typescript
export type WinPattern =
  | "row"
  | "column"
  | "diagonal"
  | "square"
  | "corners"
  | "full_board"

export interface WinResult {
  hasWon: boolean
  pattern: WinPattern | null
}
```

- [ ] **Step 2: Update socketEvents.ts to include pattern in game:winner**

In `src/models/socketEvents.ts`, add the import and update the event:

```typescript
import { GameRoom, LoteriaCard, Player, PlayerBoard, WinPattern } from "./game"
```

Change the `game:winner` event signature from:
```typescript
"game:winner": (data: {
  playerId: string
  playerName: string
  room: GameRoom
}) => void
```

To:
```typescript
"game:winner": (data: {
  playerId: string
  playerName: string
  pattern: WinPattern
  room: GameRoom
}) => void
```

- [ ] **Step 3: Commit**

```bash
cd ~/repos/loteria-api
git add src/models/game.ts src/models/socketEvents.ts
git commit -m "feat: add WinPattern type and update game:winner event signature"
```

---

## Task 3: API — Implement multi-pattern win checking

**Files:**
- Modify: `~/repos/loteria-api/src/services/gameService.ts`

Win patterns on a 4×4 board (positions 0–15, row-major):
```
 0  1  2  3
 4  5  6  7
 8  9 10 11
12 13 14 15
```

- [ ] **Step 1: Add imports and WIN_PATTERNS constant**

At the top of `src/services/gameService.ts`, update the import:

```typescript
import { GameRoom, Player, PlayerBoard, LoteriaCard, WinPattern, WinResult } from "../models/game"
```

Add the constant after imports, before any functions:

```typescript
const WIN_PATTERNS: Array<{ pattern: WinPattern; positions: number[] }> = [
  { pattern: "corners",    positions: [0, 3, 12, 15] },
  { pattern: "row",        positions: [0, 1, 2, 3] },
  { pattern: "row",        positions: [4, 5, 6, 7] },
  { pattern: "row",        positions: [8, 9, 10, 11] },
  { pattern: "row",        positions: [12, 13, 14, 15] },
  { pattern: "column",     positions: [0, 4, 8, 12] },
  { pattern: "column",     positions: [1, 5, 9, 13] },
  { pattern: "column",     positions: [2, 6, 10, 14] },
  { pattern: "column",     positions: [3, 7, 11, 15] },
  { pattern: "diagonal",   positions: [0, 5, 10, 15] },
  { pattern: "diagonal",   positions: [3, 6, 9, 12] },
  { pattern: "square",     positions: [0, 1, 4, 5] },
  { pattern: "square",     positions: [1, 2, 5, 6] },
  { pattern: "square",     positions: [2, 3, 6, 7] },
  { pattern: "square",     positions: [4, 5, 8, 9] },
  { pattern: "square",     positions: [5, 6, 9, 10] },
  { pattern: "square",     positions: [6, 7, 10, 11] },
  { pattern: "square",     positions: [8, 9, 12, 13] },
  { pattern: "square",     positions: [9, 10, 13, 14] },
  { pattern: "square",     positions: [10, 11, 14, 15] },
  { pattern: "full_board", positions: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
]
```

- [ ] **Step 2: Add checkWinPatterns helper function**

Add this private function after `WIN_PATTERNS` (before the exported functions):

```typescript
function checkWinPatterns(board: PlayerBoard): WinResult {
  const marked = new Set(board.markedCards)
  for (const { pattern, positions } of WIN_PATTERNS) {
    const allMarked = positions.every(
      pos => board.cards[pos] !== undefined && marked.has(board.cards[pos].id)
    )
    if (allMarked) return { hasWon: true, pattern }
  }
  return { hasWon: false, pattern: null }
}
```

- [ ] **Step 3: Replace the existing checkWinner export**

Find and replace the existing `checkWinner` function (currently returns `boolean`) with this version (returns `WinResult`):

```typescript
export function checkWinner(roomId: string, playerId: string): WinResult {
  const room = rooms.get(roomId)
  if (!room) throw new Error("Room not found")

  const player = room.players.find(p => p.id === playerId)
  if (!player) throw new Error("Player not found")

  const result = checkWinPatterns(player.board)

  if (result.hasWon) {
    player.status = "won"
    room.status = "finished"
    rooms.set(roomId, room)
  }

  return result
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd ~/repos/loteria-api
npx tsc --noEmit
```

Expected: no errors. Fix any type errors before continuing.

- [ ] **Step 5: Commit**

```bash
git add src/services/gameService.ts
git commit -m "feat: replace checkWinner with multi-pattern win detection (row/col/diagonal/square/corners/full)"
```

---

## Task 4: API — Update socket handler to emit pattern

**Files:**
- Modify: `~/repos/loteria-api/src/sockets/gameSocket.ts`

- [ ] **Step 1: Update the game:loteria handler**

Find the `socket.on("game:loteria", ...)` block and replace it entirely:

```typescript
socket.on("game:loteria", ({ roomId, playerId }) => {
  try {
    const result = gameService.checkWinner(roomId, playerId)

    if (result.hasWon) {
      const room = gameService.getRoom(roomId)
      const winner = room.players.find(p => p.id === playerId)!

      io.to(roomId).emit("game:winner", {
        playerId,
        playerName: winner.name,
        pattern: result.pattern!,
        room
      })

      console.log(`🏆 ${winner.name} won in room ${roomId} with ${result.pattern}!`)
    } else {
      socket.emit("error", { message: "Not a valid Lotería — keep playing!" })
    }
  } catch (error: any) {
    socket.emit("error", { message: error.message })
  }
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ~/repos/loteria-api
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start API and smoke test it compiles and runs**

```bash
npm run dev
```

Expected: `🎴 Lotería server running on http://localhost:3000`

Stop the server (Ctrl+C) when confirmed.

- [ ] **Step 4: Commit**

```bash
git add src/sockets/gameSocket.ts
git commit -m "feat: emit win pattern in game:winner socket event"
```

---

## Task 5: Frontend — Scaffold Vite project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `index.html`

The project directory `~/Documentos/Projects/loteria` already has a `docs/` folder and is a git repo. Run the Vite scaffold from within it (answer **Yes** when it warns the directory is not empty).

- [ ] **Step 1: Run Vite scaffold**

```bash
cd ~/Documentos/Projects/loteria
npm create vite@latest . -- --template react-ts
```

When prompted `Current directory is not empty. Please choose how to proceed:` → select **Ignore files and continue**.

- [ ] **Step 2: Install base dependencies**

```bash
npm install
npm install react-router-dom zustand socket.io-client
npm install -D @types/node
```

- [ ] **Step 3: Replace vite.config.ts with proxy config**

The scaffold creates a basic vite.config.ts. Replace its contents entirely:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
```

With this proxy, the frontend calls `/api/rooms` and `io()` with no URL — Vite forwards everything to the API.

- [ ] **Step 4: Clear scaffold boilerplate**

Delete the scaffold's example files that will be replaced:

```bash
rm -f src/App.css src/assets/react.svg public/vite.svg
```

Replace `src/index.css` with an empty file (user owns styling):

```bash
> src/index.css
```

- [ ] **Step 5: Verify dev server starts**

Start both the API and the frontend:

```bash
# Terminal 1
cd ~/repos/loteria-api && npm run dev

# Terminal 2
cd ~/Documentos/Projects/loteria && npm run dev
```

Expected: Vite starts at `http://localhost:5173`. The page shows whatever the scaffold generated — that's fine.

- [ ] **Step 6: Commit**

```bash
cd ~/Documentos/Projects/loteria
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html src/
git commit -m "chore: scaffold Vite React TS project with API proxy"
```

---

## Task 6: Frontend — Copy and normalize card images

**Files:**
- Create: `public/cards/01.jpg` through `54.jpg`

The source images in `~/Descargas/Cartas/` are named inconsistently. Files 1–42 have numbers matching card IDs. Starting at 43, there's an extra "la campana" file that shifts everything by one — files 44–54 correspond to card IDs 43–53. Card 54 (El Catrin) reuses card 4's image.

- [ ] **Step 1: Create the copy script**

Create `scripts/copy-cards.sh`:

```bash
#!/usr/bin/env bash
set -e
SRC="$HOME/Descargas/Cartas"
DST="$(dirname "$0")/../public/cards"
mkdir -p "$DST"

copy_card() {
  local card_id=$1
  local file_prefix=$2
  local file
  file=$(find "$SRC" -maxdepth 1 \( -name "${file_prefix} *" -o -name "${file_prefix}-*" \) 2>/dev/null | head -1)
  if [ -n "$file" ]; then
    cp "$file" "$DST/$(printf '%02d' "$card_id").jpg"
    echo "  card $card_id ← $(basename "$file")"
  else
    echo "  WARNING: no file found for card $card_id (prefix $file_prefix)"
  fi
}

echo "Copying cards 1–42 (file number = card ID)..."
for id in $(seq 1 42); do
  copy_card "$id" "$id"
done

echo "Copying cards 43–53 (file number = card ID + 1, skipping campana at 43)..."
for id in $(seq 43 53); do
  copy_card "$id" $((id + 1))
done

echo "Card 54 (El Catrin): copying from card 4's image..."
cp "$DST/04.jpg" "$DST/54.jpg"

echo "Done. $(ls "$DST" | wc -l) files in $DST"
```

```bash
chmod +x scripts/copy-cards.sh
```

- [ ] **Step 2: Run the script**

```bash
cd ~/Documentos/Projects/loteria
bash scripts/copy-cards.sh
```

Expected: 54 files in `public/cards/`, no warnings.

- [ ] **Step 3: Verify a few images load in the browser**

With the dev server running, open `http://localhost:5173/cards/01.jpg` — should show El Gallo. Try `06.jpg` (La Sirena), `42.jpg` (La Calavera).

- [ ] **Step 4: Commit**

```bash
git add public/cards/ scripts/
git commit -m "chore: add normalized card images (01.jpg–54.jpg)"
```

---

## Task 7: Frontend — Shared types

**Files:**
- Create: `src/types/game.ts`

These mirror the API's models exactly, plus `WinPattern` which was added to the API in Task 2.

- [ ] **Step 1: Create src/types/game.ts**

```typescript
export type WinPattern =
  | 'row'
  | 'column'
  | 'diagonal'
  | 'square'
  | 'corners'
  | 'full_board'

export interface LoteriaCard {
  id: number
  name: string
  imageUrl: string
  isDrawn: boolean
}

export interface PlayerBoard {
  playerId: string
  cards: LoteriaCard[]
  markedCards: number[]
}

export interface Player {
  id: string
  name: string
  board: PlayerBoard
  status: 'waiting' | 'playing' | 'won'
}

export interface GameRoom {
  roomId: string
  hostId: string
  players: Player[]
  deck: LoteriaCard[]
  drawnCards: LoteriaCard[]
  currentCard: LoteriaCard | null
  status: 'lobby' | 'playing' | 'finished'
  maxPlayers: number
}
```

- [ ] **Step 2: Create src/utils/winDetection.ts**

Same pattern logic as the API — used for optimistic "¡Lotería!" button state.

```typescript
import type { PlayerBoard, WinPattern } from '../types/game'

const WIN_PATTERNS: Array<{ pattern: WinPattern; positions: number[] }> = [
  { pattern: 'corners',    positions: [0, 3, 12, 15] },
  { pattern: 'row',        positions: [0, 1, 2, 3] },
  { pattern: 'row',        positions: [4, 5, 6, 7] },
  { pattern: 'row',        positions: [8, 9, 10, 11] },
  { pattern: 'row',        positions: [12, 13, 14, 15] },
  { pattern: 'column',     positions: [0, 4, 8, 12] },
  { pattern: 'column',     positions: [1, 5, 9, 13] },
  { pattern: 'column',     positions: [2, 6, 10, 14] },
  { pattern: 'column',     positions: [3, 7, 11, 15] },
  { pattern: 'diagonal',   positions: [0, 5, 10, 15] },
  { pattern: 'diagonal',   positions: [3, 6, 9, 12] },
  { pattern: 'square',     positions: [0, 1, 4, 5] },
  { pattern: 'square',     positions: [1, 2, 5, 6] },
  { pattern: 'square',     positions: [2, 3, 6, 7] },
  { pattern: 'square',     positions: [4, 5, 8, 9] },
  { pattern: 'square',     positions: [5, 6, 9, 10] },
  { pattern: 'square',     positions: [6, 7, 10, 11] },
  { pattern: 'square',     positions: [8, 9, 12, 13] },
  { pattern: 'square',     positions: [9, 10, 13, 14] },
  { pattern: 'square',     positions: [10, 11, 14, 15] },
  { pattern: 'full_board', positions: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
]

export function detectWin(board: PlayerBoard): WinPattern | null {
  const marked = new Set(board.markedCards)
  for (const { pattern, positions } of WIN_PATTERNS) {
    if (positions.every(pos => board.cards[pos] !== undefined && marked.has(board.cards[pos].id))) {
      return pattern
    }
  }
  return null
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd ~/Documentos/Projects/loteria
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/ src/utils/
git commit -m "feat: add shared types and client-side win detection utility"
```

---

## Task 8: Frontend — REST API helpers

**Files:**
- Create: `src/api/rooms.ts`

- [ ] **Step 1: Create src/api/rooms.ts**

```typescript
import type { GameRoom, Player } from '../types/game'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.message ?? 'Request failed')
  return body
}

export function createRoom(hostName: string): Promise<{ roomId: string; hostId: string; room: GameRoom }> {
  return request('/rooms', {
    method: 'POST',
    body: JSON.stringify({ hostName }),
  })
}

export function joinRoom(
  roomId: string,
  playerName: string,
): Promise<{ room: GameRoom; player: Player }> {
  return request(`/rooms/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({ playerName }),
  })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/api/
git commit -m "feat: add REST API helpers for createRoom and joinRoom"
```

---

## Task 9: Frontend — Zustand store

**Files:**
- Create: `src/store/gameStore.ts`

The store holds all runtime game state. Identity fields (`playerId`, `playerName`, `isHost`, `roomId`) are persisted to `sessionStorage`. The `socket` instance is kept in the store but NOT persisted.

- [ ] **Step 1: Create src/store/gameStore.ts**

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { io, Socket } from 'socket.io-client'
import type { GameRoom, Player, PlayerBoard, LoteriaCard, WinPattern } from '../types/game'

interface Identity {
  playerId: string | null
  playerName: string | null
  isHost: boolean
  roomId: string | null
}

interface GameState extends Identity {
  room: GameRoom | null
  myBoard: PlayerBoard | null
  currentCard: LoteriaCard | null
  drawnCards: LoteriaCard[]
  winner: { playerId: string; playerName: string; pattern: WinPattern } | null
  error: string | null
  socket: Socket | null
  connected: boolean

  setIdentity: (identity: Identity) => void
  initSocket: () => Socket
  setRoom: (room: GameRoom) => void
  setMyBoard: (board: PlayerBoard) => void
  addPlayer: (player: Player) => void
  cardDrawn: (card: LoteriaCard) => void
  setWinner: (winner: { playerId: string; playerName: string; pattern: WinPattern }) => void
  setError: (error: string | null) => void
  resetGame: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerId: null,
      playerName: null,
      isHost: false,
      roomId: null,
      room: null,
      myBoard: null,
      currentCard: null,
      drawnCards: [],
      winner: null,
      error: null,
      socket: null,
      connected: false,

      setIdentity: (identity) => set(identity),

      initSocket: () => {
        const existing = get().socket
        if (existing?.connected) return existing

        const socket = io({ autoConnect: false })
        socket.on('connect', () => set({ connected: true }))
        socket.on('disconnect', () => set({ connected: false }))
        socket.connect()
        set({ socket })
        return socket
      },

      setRoom: (room) => set({ room }),

      setMyBoard: (myBoard) => set({ myBoard }),

      addPlayer: (player) =>
        set((s) => ({
          room: s.room
            ? { ...s.room, players: [...s.room.players, player] }
            : null,
        })),

      cardDrawn: (card) =>
        set((s) => ({
          currentCard: card,
          drawnCards: [...s.drawnCards, card],
        })),

      setWinner: (winner) => set({ winner }),

      setError: (error) => set({ error }),

      resetGame: () =>
        set({
          room: null,
          myBoard: null,
          currentCard: null,
          drawnCards: [],
          winner: null,
          error: null,
        }),
    }),
    {
      name: 'loteria-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        playerId: state.playerId,
        playerName: state.playerName,
        isHost: state.isHost,
        roomId: state.roomId,
      }),
    },
  ),
)
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/store/
git commit -m "feat: add Zustand store with sessionStorage identity persistence"
```

---

## Task 10: Frontend — App router and entry point

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Replace src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 2: Replace src/App.tsx**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Game from './pages/Game'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:roomId" element={<Lobby />} />
        <Route path="/game/:roomId" element={<Game />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

You'll get "Cannot find module './pages/Home'" errors — that's expected since the pages don't exist yet.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: configure React Router with Home, Lobby, and Game routes"
```

---

## Task 11: Frontend — Home page

**Files:**
- Create: `src/pages/Home.tsx`

The Home page has two modes: **create** (enter name → host a new room) and **join** (enter name + room code → join existing room).

- [ ] **Step 1: Create src/pages/Home.tsx**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { createRoom, joinRoom } from '../api/rooms'

type Mode = 'create' | 'join'

export default function Home() {
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode] = useState<Mode>('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const setIdentity = useGameStore((s) => s.setIdentity)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { roomId, hostId } = await createRoom(name.trim())
      setIdentity({ playerId: hostId, playerName: name.trim(), isHost: true, roomId })
      navigate(`/lobby/${roomId}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!name.trim() || !roomCode.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { player, room } = await joinRoom(roomCode.trim().toUpperCase(), name.trim())
      setIdentity({
        playerId: player.id,
        playerName: name.trim(),
        isHost: false,
        roomId: room.roomId,
      })
      navigate(`/lobby/${room.roomId}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = mode === 'create' ? handleCreate : handleJoin
  const submitLabel = loading ? 'Cargando...' : mode === 'create' ? 'Crear sala' : 'Unirse'
  const canSubmit = !loading && !!name.trim() && (mode === 'create' || !!roomCode.trim())

  return (
    <div>
      <h1>Lotería</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        maxLength={24}
      />

      <div>
        <button onClick={() => setMode('create')} disabled={mode === 'create'}>
          Crear sala
        </button>
        <button onClick={() => setMode('join')} disabled={mode === 'join'}>
          Unirse a sala
        </button>
      </div>

      {mode === 'join' && (
        <input
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Código de sala (ej. A3F9K2)"
          maxLength={6}
        />
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={handleSubmit} disabled={!canSubmit}>
        {submitLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify the page renders**

With `npm run dev` running and the API running, open `http://localhost:5173`. The Home page should render a name input, mode toggle, and button.

- [ ] **Step 3: Smoke test create room**

Enter a name, click "Crear sala". Verify in the browser's Network tab that `POST /api/rooms` returns 201 with `roomId` and `hostId`. The app should navigate to `/lobby/<roomId>` (it will 404 or render nothing since Lobby isn't built yet).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: add Home page with create/join room flow"
```

---

## Task 12: Frontend — Lobby page

**Files:**
- Create: `src/pages/Lobby.tsx`

The Lobby connects the socket, shows current players, and lets the host start the game. Players who refresh are handled: `room:joined` returns current room state, and if the room is already `playing`, they're redirected to Game.

- [ ] **Step 1: Create src/pages/Lobby.tsx**

```tsx
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export default function Lobby() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  const playerId = useGameStore((s) => s.playerId)
  const isHost = useGameStore((s) => s.isHost)
  const room = useGameStore((s) => s.room)
  const error = useGameStore((s) => s.error)

  const initSocket = useGameStore((s) => s.initSocket)
  const setRoom = useGameStore((s) => s.setRoom)
  const setMyBoard = useGameStore((s) => s.setMyBoard)
  const addPlayer = useGameStore((s) => s.addPlayer)
  const setError = useGameStore((s) => s.setError)

  useEffect(() => {
    if (!playerId || !roomId) return

    const socket = initSocket()

    socket.emit('room:join', { roomId, playerId })

    socket.on('room:joined', ({ room, player }) => {
      setRoom(room)
      setMyBoard(player.board)
      if (room.status === 'playing') navigate(`/game/${roomId}`)
    })

    socket.on('room:player_joined', ({ player }) => {
      addPlayer(player)
    })

    socket.on('game:started', ({ room }) => {
      const store = useGameStore.getState()
      setRoom(room)
      const me = room.players.find((p) => p.id === store.playerId)
      if (me) setMyBoard(me.board)
      navigate(`/game/${roomId}`)
    })

    socket.on('error', ({ message }) => setError(message))

    return () => {
      socket.off('room:joined')
      socket.off('room:player_joined')
      socket.off('game:started')
      socket.off('error')
    }
  }, [playerId, roomId])

  const handleStart = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId || !playerId) return
    socket.emit('game:start', { roomId, playerId })
  }

  return (
    <div>
      <h2>Sala: {roomId}</h2>
      <p>Comparte este código con tus amigos para que se unan.</p>

      <h3>Jugadores ({room?.players.length ?? 0} / {room?.maxPlayers ?? 6})</h3>
      <ul>
        {room?.players.map((p) => (
          <li key={p.id}>
            {p.name} {p.id === room.hostId ? '👑' : ''} {p.id === playerId ? '(tú)' : ''}
          </li>
        ))}
      </ul>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {isHost && (
        <button
          onClick={handleStart}
          disabled={!room || room.players.length < 2}
        >
          Iniciar juego
        </button>
      )}

      {!isHost && <p>Esperando que el anfitrión inicie el juego...</p>}
    </div>
  )
}
```

- [ ] **Step 2: Test the Lobby**

1. Open two browser tabs to `http://localhost:5173`
2. Tab 1: enter name → Create room → note the room code shown in the URL
3. Tab 2: enter a different name → Join room → enter the room code
4. Both tabs should show the Lobby with both players listed
5. Tab 1 (host) should show "Iniciar juego" button; Tab 2 should not

- [ ] **Step 3: Commit**

```bash
git add src/pages/Lobby.tsx
git commit -m "feat: add Lobby page with socket connect, player list, and start game"
```

---

## Task 13: Frontend — CardTile component

**Files:**
- Create: `src/components/CardTile.tsx`

A single card on the player's board. Clickable only when drawn and not yet marked.

- [ ] **Step 1: Create src/components/CardTile.tsx**

```tsx
import type { LoteriaCard } from '../types/game'

interface CardTileProps {
  card: LoteriaCard
  isMarked: boolean
  isDrawn: boolean
  onClick: () => void
}

export default function CardTile({ card, isMarked, isDrawn, onClick }: CardTileProps) {
  const clickable = isDrawn && !isMarked

  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        cursor: clickable ? 'pointer' : 'default',
        opacity: isMarked ? 0.45 : 1,
        outline: isMarked ? '3px solid #22c55e' : '1px solid #d1d5db',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <img
        src={card.imageUrl}
        alt={card.name}
        style={{ width: '100%', display: 'block' }}
        draggable={false}
      />
      <div style={{ textAlign: 'center', fontSize: 11, padding: '2px 0' }}>{card.name}</div>
      {isMarked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 32 }}>⬤</span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CardTile.tsx
git commit -m "feat: add CardTile component"
```

---

## Task 14: Frontend — PlayerBoard component

**Files:**
- Create: `src/components/PlayerBoard.tsx`

Renders the player's 4×4 grid. Receives the set of drawn card IDs so it can enable/disable clicks.

- [ ] **Step 1: Create src/components/PlayerBoard.tsx**

```tsx
import CardTile from './CardTile'
import type { PlayerBoard as PlayerBoardType } from '../types/game'

interface PlayerBoardProps {
  board: PlayerBoardType
  drawnCardIds: Set<number>
  onMark: (cardId: number) => void
}

export default function PlayerBoard({ board, drawnCardIds, onMark }: PlayerBoardProps) {
  const marked = new Set(board.markedCards)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
        maxWidth: 480,
      }}
    >
      {board.cards.map((card) => (
        <CardTile
          key={card.id}
          card={card}
          isMarked={marked.has(card.id)}
          isDrawn={drawnCardIds.has(card.id)}
          onClick={() => onMark(card.id)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PlayerBoard.tsx
git commit -m "feat: add PlayerBoard component (4x4 grid)"
```

---

## Task 15: Frontend — CurrentCard and DrawnCards components

**Files:**
- Create: `src/components/CurrentCard.tsx`
- Create: `src/components/DrawnCards.tsx`

- [ ] **Step 1: Create src/components/CurrentCard.tsx**

Displays the card most recently drawn by the host.

```tsx
import type { LoteriaCard } from '../types/game'

interface CurrentCardProps {
  card: LoteriaCard | null
}

export default function CurrentCard({ card }: CurrentCardProps) {
  if (!card) {
    return (
      <div style={{ width: 180, textAlign: 'center' }}>
        <p>Esperando la primera carta...</p>
      </div>
    )
  }

  return (
    <div style={{ width: 180, textAlign: 'center' }}>
      <img
        src={card.imageUrl}
        alt={card.name}
        style={{ width: '100%', borderRadius: 8 }}
      />
      <p style={{ margin: '6px 0 0', fontWeight: 600 }}>{card.name}</p>
    </div>
  )
}
```

- [ ] **Step 2: Create src/components/DrawnCards.tsx**

Shows a compact scrollable history of all cards drawn so far.

```tsx
import type { LoteriaCard } from '../types/game'

interface DrawnCardsProps {
  cards: LoteriaCard[]
}

export default function DrawnCards({ cards }: DrawnCardsProps) {
  return (
    <div>
      <p style={{ margin: '0 0 4px', fontSize: 13, opacity: 0.7 }}>
        Cartas llamadas: {cards.length}
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          maxHeight: 160,
          overflowY: 'auto',
        }}
      >
        {cards.map((card) => (
          <img
            key={card.id}
            src={card.imageUrl}
            alt={card.name}
            title={card.name}
            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CurrentCard.tsx src/components/DrawnCards.tsx
git commit -m "feat: add CurrentCard and DrawnCards display components"
```

---

## Task 16: Frontend — WinnerOverlay component

**Files:**
- Create: `src/components/WinnerOverlay.tsx`

Shown when `game:winner` fires. Covers the screen.

- [ ] **Step 1: Create src/components/WinnerOverlay.tsx**

```tsx
import type { WinPattern } from '../types/game'

const PATTERN_LABELS: Record<WinPattern, string> = {
  row: 'Línea',
  column: 'Columna',
  diagonal: 'Diagonal',
  square: 'Cuadro 2×2',
  corners: 'Esquinas',
  full_board: 'Tabla Completa',
}

interface WinnerOverlayProps {
  playerName: string
  pattern: WinPattern
  isMe: boolean
  onClose: () => void
}

export default function WinnerOverlay({ playerName, pattern, isMe, onClose }: WinnerOverlayProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div style={{ textAlign: 'center', padding: 32, borderRadius: 12, background: '#fff' }}>
        <h1 style={{ fontSize: 48, margin: '0 0 8px' }}>🎉 ¡Lotería!</h1>
        {isMe ? (
          <p style={{ fontSize: 24, fontWeight: 700 }}>¡Ganaste!</p>
        ) : (
          <p style={{ fontSize: 20 }}><strong>{playerName}</strong> ganó</p>
        )}
        <p style={{ fontSize: 16, opacity: 0.7 }}>Patrón: {PATTERN_LABELS[pattern]}</p>
        <button onClick={onClose} style={{ marginTop: 20, padding: '10px 24px' }}>
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/WinnerOverlay.tsx
git commit -m "feat: add WinnerOverlay component"
```

---

## Task 17: Frontend — Game page

**Files:**
- Create: `src/pages/Game.tsx`

The Game page assembles all components. It registers socket listeners on mount (using `useGameStore.getState()` inside callbacks to avoid stale closures) and tears them down on unmount.

- [ ] **Step 1: Create src/pages/Game.tsx**

```tsx
import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { detectWin } from '../utils/winDetection'
import PlayerBoard from '../components/PlayerBoard'
import CurrentCard from '../components/CurrentCard'
import DrawnCards from '../components/DrawnCards'
import WinnerOverlay from '../components/WinnerOverlay'

export default function Game() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  const playerId = useGameStore((s) => s.playerId)
  const isHost = useGameStore((s) => s.isHost)
  const room = useGameStore((s) => s.room)
  const myBoard = useGameStore((s) => s.myBoard)
  const currentCard = useGameStore((s) => s.currentCard)
  const drawnCards = useGameStore((s) => s.drawnCards)
  const winner = useGameStore((s) => s.winner)
  const error = useGameStore((s) => s.error)

  const setRoom = useGameStore((s) => s.setRoom)
  const setMyBoard = useGameStore((s) => s.setMyBoard)
  const cardDrawn = useGameStore((s) => s.cardDrawn)
  const setWinner = useGameStore((s) => s.setWinner)
  const setError = useGameStore((s) => s.setError)
  const resetGame = useGameStore((s) => s.resetGame)

  // Register socket event listeners once on mount
  useEffect(() => {
    const socket = useGameStore.getState().socket
    if (!socket) return

    socket.on('game:card_drawn', ({ card }) => {
      useGameStore.getState().cardDrawn(card)
    })

    socket.on('game:card_marked', ({ playerId: markedBy, board }) => {
      if (markedBy === useGameStore.getState().playerId) {
        useGameStore.getState().setMyBoard(board)
      }
    })

    socket.on('game:winner', ({ playerId: winnerId, playerName, pattern, room }) => {
      useGameStore.getState().setWinner({ playerId: winnerId, playerName, pattern })
      useGameStore.getState().setRoom(room)
    })

    socket.on('error', ({ message }) => {
      useGameStore.getState().setError(message)
    })

    return () => {
      socket.off('game:card_drawn')
      socket.off('game:card_marked')
      socket.off('game:winner')
      socket.off('error')
    }
  }, [])

  const drawnCardIds = useMemo(
    () => new Set(drawnCards.map((c) => c.id)),
    [drawnCards],
  )

  const winPattern = myBoard ? detectWin(myBoard) : null
  const deckExhausted = drawnCards.length >= 54

  const handleDraw = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId || !playerId) return
    socket.emit('game:draw', { roomId, playerId })
  }

  const handleMark = (cardId: number) => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId || !playerId) return
    socket.emit('game:mark', { roomId, playerId, cardId })
  }

  const handleLoteria = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId || !playerId) return
    socket.emit('game:loteria', { roomId, playerId })
  }

  const handleCloseWinner = () => {
    resetGame()
    navigate('/')
  }

  return (
    <div>
      {winner && (
        <WinnerOverlay
          playerName={winner.playerName}
          pattern={winner.pattern}
          isMe={winner.playerId === playerId}
          onClose={handleCloseWinner}
        />
      )}

      <div>
        <h3>Sala {roomId}</h3>
        {room && (
          <span>Jugadores: {room.players.map((p) => p.name).join(', ')}</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {/* Left: current card + controls */}
        <div>
          <CurrentCard card={currentCard} />

          {isHost && (
            <button
              onClick={handleDraw}
              disabled={deckExhausted || room?.status !== 'playing'}
              style={{ marginTop: 12, display: 'block' }}
            >
              {deckExhausted ? 'Mazo agotado' : 'Siguiente carta'}
            </button>
          )}

          <button
            onClick={handleLoteria}
            disabled={!winPattern}
            style={{ marginTop: 8, display: 'block' }}
          >
            ¡Lotería!
          </button>

          {error && (
            <p style={{ color: 'red' }}>
              {error}{' '}
              <button onClick={() => setError(null)}>×</button>
            </p>
          )}
        </div>

        {/* Right: player board */}
        {myBoard && (
          <PlayerBoard
            board={myBoard}
            drawnCardIds={drawnCardIds}
            onMark={handleMark}
          />
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <DrawnCards cards={drawnCards} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
cd ~/Documentos/Projects/loteria
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Full end-to-end smoke test**

Start both servers:
```bash
# Terminal 1
cd ~/repos/loteria-api && npm run dev

# Terminal 2
cd ~/Documentos/Projects/loteria && npm run dev
```

Walk through the full game flow in two tabs:

1. Tab 1: Create room as "Ana" → note room code → land in Lobby
2. Tab 2: Join room as "Pedro" → enter room code → land in Lobby
3. Tab 1 (host): Click "Iniciar juego" → both tabs navigate to Game
4. Tab 1 (host): Click "Siguiente carta" repeatedly → both tabs see the card update
5. Tab 2 (Pedro): Click a card on the board that matches the drawn card → it marks
6. Keep drawing and marking until a win pattern is reached
7. Click "¡Lotería!" → WinnerOverlay appears in both tabs
8. Click "Volver al inicio" → returns to Home

- [ ] **Step 4: Commit**

```bash
git add src/pages/Game.tsx
git commit -m "feat: add Game page wiring all components and socket events"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|-----------------|------|
| REST: createRoom, joinRoom | Tasks 8, 11 |
| Socket: room:join, room:joined, room:player_joined | Task 12 |
| Socket: game:start, game:started | Task 12 |
| Socket: game:draw, game:card_drawn | Task 17 |
| Socket: game:mark, game:card_marked | Task 17 |
| Socket: game:loteria, game:winner | Tasks 4, 17 |
| Win patterns: row/col/diagonal/square/corners/full | Tasks 3, 7 |
| Card images copied and normalized | Task 6 |
| API imageUrl .png → .jpg | Task 1 |
| Zustand store with sessionStorage identity | Task 9 |
| React Router: Home/Lobby/Game routes | Task 10 |
| Home page create/join flow | Task 11 |
| Lobby page with player list | Task 12 |
| Game page with board, current card, history | Task 17 |
| WinnerOverlay with pattern name | Task 16 |
| Vite dev proxy to API | Task 5 |

All spec requirements covered. ✓
