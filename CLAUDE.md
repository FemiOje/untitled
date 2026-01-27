# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fully onchain asynchronous battle royale with fog of war, built with Cairo/Dojo (smart contracts) and React/Three.js (frontend). Players explore a hexagonal grid, encounter gifts/dangers, fight other players (even offline), and compete on a leaderboard.

## Build & Run Commands

### Smart Contracts (`contracts/`)
```bash
sozo build                # Build contracts
sozo test                 # Run tests
sozo migrate              # Deploy to local Katana node
```

### Local Starknet Node
```bash
katana --disable-fee      # Run local node (Terminal 1)
# Or use Docker:
docker compose up         # Runs katana + sozo migrate + torii together
```

### Torii Indexer
```bash
torii --world <WORLD_ADDRESS> --http.cors_origins "*"
```

### Frontend (`client/`)
```bash
npm install
npm run dev               # Vite dev server
npm run build             # Production build
npm run lint              # ESLint
npm run format            # Prettier
npm run test              # Vitest
```

## Architecture

```
contracts/                # Cairo smart contracts (Dojo framework)
  src/models.cairo        # Data models (Moves, Position, Direction, Vec2)
  src/systems/actions.cairo  # Game actions (spawn, move)
  src/tests/              # Contract tests
  Scarb.toml              # Cairo 2.13.1, Dojo 1.8.0

client/                   # React + TypeScript frontend
  src/App.tsx             # Main app, Dojo SDK setup
  src/components/HexGrid.tsx  # Three.js hexagonal grid (instanced mesh)
  src/three/              # Hex geometry, coordinate utils, constants
  src/typescript/         # Auto-generated types from contract manifest
  src/starknet-provider.tsx   # Wallet connector config
  dojoConfig.ts           # Dojo manifest config
```

### Data Flow
Frontend (React) → Dojo SDK → Starknet RPC (Katana/Sepolia) → Cairo Contracts → Torii Indexer → Dojo Store → Three.js Visualization

### Key Technologies
- **Cairo 2.13.1 + Dojo 1.8.5+**: Smart contracts and onchain game engine
- **Scarb**: Cairo package manager
- **Three.js**: 3D hex grid rendering with instanced meshes
- **@dojoengine/sdk + @starknet-react/core**: Contract interaction and wallet integration
- **Zustand**: Frontend state management

## Game Design Reference

`GAME_DESIGN_DOCUMENT.md` contains 1,300+ lines of detailed game mechanics including combat formulas, encounter system, scoring, and stat calculations. Consult it before implementing any game logic.

### Hex Grid
Uses axial coordinate system (q, r). The frontend renders a 10x10 hex grid with Three.js. Coordinate conversion utilities are in `client/src/three/utils.ts`.

## Development Config

- Local RPC: `http://localhost:5050/`
- World namespace: `dojo_starter`
- Dev config: `contracts/dojo_dev.toml`
- Docker setup: `contracts/compose.yaml`
