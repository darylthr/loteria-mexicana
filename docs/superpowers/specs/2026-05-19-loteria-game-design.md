# Lotería Mexicana — Multiplayer Web Game Design

**Date:** 2026-05-19  
**Status:** Approved

---

## Overview

A browser-based multiplayer Lotería Mexicana game with a React frontend connecting to an existing Express + Socket.IO API. The user owns UIUX; this spec covers functional architecture and integration only.

---

## Architecture

### Repos

| Repo | Path | Port |
|------|------|------|
| API (existing) | `~/repos/loteria-api/` | 3000 |
| Frontend (new) | `~/Documentos/Projects/loteria/` | 5173 (Vite dev) |

### Frontend Stack

- **Vite** + **React 18** + **TypeScript**
- **React Router v6** — route-based page navigation
- **Zustand** — global game state + socket lifecycle
- **socket.io-client** — real-time communication with the API

### CORS

The API already sets `CORS_ORIGIN=*` — no changes needed.

---

## API Changes

### 1. Card image extension

`src/data/cards.ts` — change all `imageUrl` values from `/cards/XX.png` to `/cards/XX.jpg`.

### 2. Win condition logic

`src/services/gameService.ts` — replace the `checkWinner` full-board-only check with a multi-pattern check.

**Win patterns (on a 4×4 = 16 card board, positions 0–15):**

| Condition | Description | Positions |
|-----------|-------------|-----------|
| Row | Any of 4 horizontal rows | [0-3], [4-7], [8-11], [12-15] |
| Column | Any of 4 vertical columns | [0,4,8,12], [1,5,9,13], [2,6,10,14], [3,7,11,15] |
| Diagonal | Either main diagonal | [0,5,10,15] or [3,6,9,12] |
| 2×2 Square | Any 2×2 adjacent block | 9 possible blocks |
| Corners | 4 corner cards | [0, 3, 12, 15] |
| Full board | All 16 cards marked | [0–15] |

The `checkWinner` function returns `{ hasWon: boolean, pattern: WinPattern | null }`. The `game:winner` socket event is updated to include the `pattern` field so the frontend can display which condition triggered the win.

### 3. New type in socketEvents.ts

```ts
export type WinPattern =
  | "row" | "column" | "diagonal" | "square" | "corners" | "full_board"
```

`game:winner` event gains a `pattern: WinPattern` field.

---

## Card Images

- Source: `~/Descargas/Cartas/` (54 `.jpg` files, inconsistently named)
- Destination: `public/cards/` in the frontend
- Naming: normalize to `01.jpg`, `02.jpg`, … `54.jpg` matching card IDs
- Note: files 43+ may have minor name-to-ID mismatches; visual verification recommended after first run

---

## Frontend Structure

```
src/
  types/
    game.ts           ← mirrors API types (GameRoom, Player, LoteriaCard, PlayerBoard, WinPattern)
  api/
    rooms.ts          ← createRoom(), joinRoom() REST helpers
  store/
    gameStore.ts      ← Zustand store
  pages/
    Home.tsx          ← create or join a room
    Lobby.tsx         ← waiting room, player list, host starts game
    Game.tsx          ← main game view
  components/
    PlayerBoard.tsx   ← 4×4 grid
    CardTile.tsx      ← single card (image + mark state)
    CurrentCard.tsx   ← currently drawn card (large display)
    DrawnCards.tsx    ← scrollable history of drawn cards
    WinnerOverlay.tsx ← winner announcement modal
  App.tsx             ← router
  main.tsx
public/
  cards/              ← 01.jpg–54.jpg
```

---

## Zustand Store Shape

```ts
interface GameState {
  // Identity
  playerId: string | null
  playerName: string | null
  isHost: boolean

  // Room & board
  room: GameRoom | null
  myBoard: PlayerBoard | null

  // Game progress
  currentCard: LoteriaCard | null
  drawnCards: LoteriaCard[]

  // Outcome
  winner: { playerId: string; playerName: string; pattern: WinPattern } | null
  error: string | null

  // Socket
  socket: Socket | null
  connected: boolean
}
```

Actions: `setIdentity`, `connectSocket`, `disconnectSocket`, `setRoom`, `updateBoard`, `cardDrawn`, `setWinner`, `setError`, `reset`.

---

## Game Flow

### 1. Home (`/`)

- User enters name
- **Create room**: `POST /api/rooms { hostName }` → receives `{ roomId, hostId, room }` → store identity → navigate to `/lobby/:roomId`
- **Join room**: user enters room code → `POST /api/rooms/:id/join { playerName }` → receives `{ room, player }` → store identity → navigate to `/lobby/:roomId`

### 2. Lobby (`/lobby/:roomId`)

- On mount: `socket.connect()` → emit `room:join { roomId, playerId }`
- Listen `room:joined` → store room state
- Listen `room:player_joined` → update player list
- Host only: "Start Game" button → emit `game:start { roomId, playerId }`
- Listen `game:started` → navigate to `/game/:roomId`

### 3. Game (`/game/:roomId`)

**Host view:**
- "Draw Card" button → emit `game:draw { roomId, playerId }`
- Button disabled when `drawnCards.length === 54` (deck exhausted)

**All players:**
- Listen `game:card_drawn` → update `currentCard` + `drawnCards`
- `PlayerBoard` shows 4×4 grid; clicking an unmarked card that appears in `drawnCards` → emit `game:mark { roomId, playerId, cardId }`
- Listen `game:card_marked` → update `myBoard`
- "¡Lotería!" button appears when any local win pattern is detected (optimistic) → emit `game:loteria { roomId, playerId }`
- Listen `game:winner` → set winner state → show `WinnerOverlay`
- Listen `error` → display error message

---

## Routing

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `Home` | Entry point |
| `/lobby/:roomId` | `Lobby` | Pre-game waiting room |
| `/game/:roomId` | `Game` | Active game |

Player identity (`playerId`, `playerName`, `isHost`, `roomId`) is stored in Zustand and persisted to `sessionStorage` to survive a page refresh.

---

## Error Handling

- Socket `error` events → displayed as a dismissible banner in the current view
- REST failures → caught and shown inline (e.g., "Room not found", "Room is full")
- No retry logic — user must take explicit action (re-enter, reload)

---

## Out of Scope

- Authentication / persistent accounts
- Chat
- Spectator mode
- Mobile-specific UIUX (user handles all styling)
- Automated card drawing (timer-based) — host manually draws each card
