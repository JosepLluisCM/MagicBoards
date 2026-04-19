# MagicBoards

An infinite-canvas mood-board and reference-board app. Users sign in with Google, create named canvases, and arrange images and text freely using drag, resize, rotate, pan and zoom.

## Stack

| Layer | Technology |
|---|---|
| Client | React 19, TypeScript, Vite, Konva/react-konva, Tailwind CSS 4, Radix UI |
| Server | ASP.NET Core 8, C#, Serilog |
| Auth | Firebase Authentication (Google OAuth + session cookies) |
| Database | Google Firestore |
| File storage | Cloudflare R2 (S3-compatible) |
| Infrastructure | Docker Compose, Cloudflare |

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- Or: Node 20+ and .NET 8 SDK for running client/server separately

## Quick start (Docker)

```bash
# Start everything
docker-compose up --build -d

# Client:  http://localhost:5173
# Server:  http://localhost:5000  /  https://localhost:5001

# Tear down (removes volumes)
docker-compose down --remove-orphans -v; docker image prune -f
```

## Local development (without Docker)

**Client:**
```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

**Server:**
```bash
cd server
dotnet run         # http://localhost:5000
```

## Environment variables

Copy the examples and fill in your credentials before running:

```bash
cp server/.env.example server/.env
```

Required variables are documented in [`CLAUDE.md`](CLAUDE.md) under *Environment config*.  
Credential JSON files go in `secrets/` (not tracked by git).

## Client scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (write) |
| `npm run format:check` | Prettier (check only, used in CI) |
| `npm test` | Vitest (single run) |
| `npm run test:watch` | Vitest (watch mode) |

## Architecture

For a detailed architecture overview, decision rationale, and known issues see [`CLAUDE.md`](CLAUDE.md).
