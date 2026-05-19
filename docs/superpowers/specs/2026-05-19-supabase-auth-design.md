# Supabase Auth Integration Design

## Goal

Add email + password authentication using Supabase so that player identities and coin balances persist across browser sessions and devices.

## Architecture

The Supabase user `id` (UUID) replaces the server-generated `playerId` throughout the entire system. The frontend uses `@supabase/supabase-js` for auth; the backend verifies Supabase JWTs locally using the project's JWT secret (no network call per request). Rooms remain fully in-memory (ephemeral). Only the player balance moves to the database.

```
Frontend                         Backend (Express + Socket.IO)    Supabase
────────────────────             ────────────────────────────     ──────────────────
src/lib/supabase.ts  ──token──►  middleware/auth.ts               auth.users
src/pages/Auth.tsx               (JWT verified via secret)         profiles table
src/App.tsx (guard)              socket io.use() middleware          (id, display_name,
src/pages/Home.tsx               gameService.ts (async balance)       balance)
src/store/gameStore.ts           profileService.ts → Supabase DB
```

## Database Schema

One table in Supabase Postgres:

```sql
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  balance      integer not null default 1000,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);
```

The backend uses the service-role key and bypasses RLS for all writes. The profile row is created explicitly by the frontend calling `POST /api/profile` immediately after Supabase signup — not via a DB trigger.

## Auth Flow (Frontend)

### Registration
1. User fills email, password, display name on `/auth`
2. `supabase.auth.signUp({ email, password })` → Supabase creates `auth.users` record
3. Frontend calls `POST /api/profile` with `{ displayName }` and the new JWT in the `Authorization` header
4. Backend inserts `profiles` row via service-role client
5. Navigate to `/`

### Login
1. User fills email + password on `/auth`
2. `supabase.auth.signInWithPassword({ email, password })` → returns session with JWT
3. Navigate to `/`

### Route guard
`App.tsx` checks for an active Supabase session on every render. If none, it redirects to `/auth`. Guard applies to `/`, `/lobby/:roomId`, and `/game/:roomId`.

### Home page
- Name input removed; display name and balance fetched from `GET /api/profile` on mount
- Create/join room flows unchanged except `playerId` and `playerName` come from the session

### Socket token
`io({ auth: { token: session.access_token } })` — token passed at connect time. Supabase auto-refreshes the token in the background; since games typically last under an hour, mid-game token refresh on the socket is out of scope.

### Sign out
Button on Home (and optionally the game header). Calls `supabase.auth.signOut()`, resets game store, redirects to `/auth`.

## Backend Auth Middleware

### REST — `src/middleware/auth.ts`
Reads `Authorization: Bearer <token>` header, verifies the JWT using `SUPABASE_JWT_SECRET` (local, no network call), and sets `req.userId` on the request. Returns `401` if missing or invalid. Applied to all `/api/*` routes.

### Socket — `io.use()` in `gameSocket.ts`
Reads `socket.handshake.auth.token`, verifies the same way, sets `socket.data.userId`. Calls `next(new Error('Unauthorized'))` if invalid — Socket.IO rejects the connection.

## Balance Changes (Backend)

The in-memory `playerBalances: Map<string, number>` in `gameService.ts` is removed. A new `src/services/profileService.ts` handles all balance I/O:

```typescript
getBalance(userId: string): Promise<number>
deductCoins(userId: string, amount: number): Promise<number>  // throws if insufficient
addCoins(userId: string, amount: number): Promise<number>
```

All three call the Supabase admin client (`@supabase/supabase-js` with service role key). Because they are async, the socket handlers that touch balance (`game:start`, `game:loteria`, `game:draw`, `game:restart`) become `async`.

## Files Changed

### Frontend (`/home/daryl/Documentos/Projects/loteria`)

| File | Change |
|---|---|
| `src/lib/supabase.ts` | New — Supabase client (`createClient` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`) |
| `src/pages/Auth.tsx` | New — login/register form with tab toggle |
| `src/App.tsx` | Add `/auth` route; add session guard redirecting unauthenticated users |
| `src/pages/Home.tsx` | Remove name input; read `displayName` from session; fetch balance from `/api/profile` on mount |
| `src/store/gameStore.ts` | Remove `playerId`/`playerName` from persisted state; `initSocket()` reads token from Supabase session |
| `src/api/rooms.ts` | Add `Authorization: Bearer <token>` header to all fetch calls |
| `.env` | Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

### Backend (`/home/daryl/repos/loteria-api`)

| File | Change |
|---|---|
| `src/lib/supabase.ts` | New — admin client with service role key |
| `src/middleware/auth.ts` | New — JWT verification, sets `req.userId` |
| `src/services/profileService.ts` | New — `getBalance`, `deductCoins`, `addCoins` via Supabase Postgres |
| `src/routes/gameRoutes.ts` | Add auth middleware to all routes; add `POST /api/profile` and `GET /api/profile` |
| `src/controllers/gameController.ts` | Read `req.userId` instead of body `playerId`; look up `displayName` from profile |
| `src/services/gameService.ts` | Remove `playerBalances` Map; await `profileService` calls; all balance-touching functions become async |
| `src/sockets/gameSocket.ts` | Add `io.use()` JWT middleware; replace body `playerId` with `socket.data.userId` throughout |
| `src/app.ts` | Apply auth middleware to `/api` routes |
| `.env` | Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` |

## Supabase Setup (Manual, Before Coding)

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the `profiles` table migration in the Supabase SQL editor
3. Copy the following from Project Settings → API into `.env` files:
   - Project URL → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon` public key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`
   - JWT Secret → `SUPABASE_JWT_SECRET`

## Out of Scope

- Social login (Google, GitHub) — email + password only for now
- Mid-game socket token refresh — tokens last 1 hour by default, sufficient for a game session
- Leaderboards or game history persistence — rooms remain ephemeral
- Email confirmation — disabled in Supabase project settings for development simplicity
