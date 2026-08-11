# Lotería API

Backend for the Lotería Mexicana web game — reconstructed from the frontend's
API/socket contract. Express + Socket.IO + TypeScript, with player profiles and
custom boards persisted in Supabase Postgres. Rooms and live game state are held
in memory (ephemeral, per the original design).

## Setup

1. **Supabase**: create a project, then run [`db/schema.sql`](db/schema.sql) in
   the SQL editor (creates the `profiles` and `custom_boards` tables + RLS).
2. **Env**: `cp .env.example .env` and fill in:
   - `SUPABASE_URL` — Project Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — API → `service_role` secret (server-only)
   - `SUPABASE_JWT_SECRET` — optional/unused (see JWT note below); leave blank
3. **Run**:
   ```bash
   npm install
   npm run dev      # tsx watch on http://localhost:3000
   ```

The frontend (Vite, port 5173) proxies `/api` and `/socket.io` to port 3000, so
no CORS config is needed for local dev.

> **JWT note:** access tokens are verified against the Supabase Auth server via
> `supabase.auth.getUser()` in `src/utils/jwt.ts`. This works for both legacy
> HS256 and the newer asymmetric (ES256) signing keys, so no JWT secret needs to
> be configured. (Trade-off: one lightweight Auth call per verification.)

## REST API

All routes require `Authorization: Bearer <supabase-access-token>`.
Errors return `{ error: string }`.

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/profile` | — | `{ displayName, balance }` |
| POST | `/api/profile` | `{ displayName }` | `{ displayName, balance }` (201) |
| PATCH | `/api/profile` | `{ displayName }` | `{ displayName, balance }` |
| POST | `/api/rooms` | `{ nickname?, maxPlayers? }` | `{ roomId, hostId, room }` (201) |
| GET | `/api/rooms/:roomId` | — | `{ room }` |
| POST | `/api/rooms/:roomId/join` | `{ nickname? }` | `{ room, player }` |
| GET | `/api/boards` | — | `{ boards: CustomBoard[] }` |
| POST | `/api/boards` | `{ name, cardIds }` | `{ board }` (201) |
| DELETE | `/api/boards/:boardId` | — | `{ ok: true }` |

## Socket.IO events

Authenticated at connect time via `auth: { token }` (same Supabase token).

**Client → Server**

| Event | Payload |
|-------|---------|
| `room:join` | `{ roomId }` |
| `room:configure` | `{ roomId, entryFee }` (host) |
| `board:select` | `{ roomId, boardId, isCustom }` (toggle) |
| `game:start` | `{ roomId }` (host) |
| `game:draw` | `{ roomId }` (host) |
| `game:mark` | `{ roomId, cardId, boardIndex }` |
| `game:loteria` | `{ roomId, slot }` |
| `game:restart` | `{ roomId }` (host) |
| `chat:message` | `{ roomId, message }` |

**Server → Client**

| Event | Payload |
|-------|---------|
| `room:joined` | `{ room, player }` (to the joiner) |
| `room:player_joined` | `{ player }` |
| `room:updated` | `{ room }` |
| `board:locked` | `{ boardId, playerId, isCustom }` |
| `board:unlocked` | `{ boardId, playerId }` |
| `game:started` | `{ room }` |
| `game:card_drawn` | `{ card }` |
| `game:card_marked` | `{ playerId, board }` (to the owner) |
| `game:prize_claimed` | `{ slot, room }` |
| `game:ended` | `{ room, reason }` — `all_prizes_claimed` \| `deck_exhausted` |
| `game:restarted` | `{ room }` |
| `chat:message` | `{ playerId, playerName, message, timestamp }` (system = empty `playerId`) |
| `error` | `{ message }` |

## Game rules encoded here

- **Boards** are 4×4 (16 cards). Each player picks up to 2 in the lobby; shared
  boards lock to one player, custom boards come from `custom_boards`.
- **Economy**: on start, each player pays `entryFee × boards` into the pot;
  every custom board grants a `+10` coin bonus. New profiles start at 1000.
- **Prizes** pay a percentage of the pot: `full_board` 40%, `corners` 30%,
  `line` (row/column/diagonal) 20%, `square` (2×2) 10%. Each slot is claimed
  once; the game ends when all four are claimed or the 54-card deck is exhausted
  (remaining pot split evenly among players).

## Layout

```
src/
  config.ts              env loading
  index.ts               http + socket.io bootstrap
  app.ts                 express app, routes, error handler
  lib/supabase.ts        service-role admin client
  utils/jwt.ts           Supabase JWT verification
  data/cards.ts          the 54 Lotería cards
  models/game.ts         shared domain types (mirror the frontend)
  game/
    deck.ts              shuffling, board generation
    winPatterns.ts       win detection + prize math
  services/
    profileService.ts    balances + display names (Supabase)
    boardService.ts      custom boards (Supabase)
    gameService.ts       in-memory rooms + all game logic
  middleware/auth.ts     REST JWT guard
  controllers/           profile / room / board HTTP handlers
  routes.ts              /api router
  sockets/gameSocket.ts  realtime handlers
```
