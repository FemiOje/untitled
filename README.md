# Hex'd

> A fully onchain asynchronous battle royale with fog of war, built with Cairo and Dojo

[![Cairo](https://img.shields.io/badge/Cairo-2.15.0-orange.svg)](https://www.cairo-lang.org/)
[![Dojo](https://img.shields.io/badge/Dojo-1.8.0-red.svg)](https://www.dojoengine.org/)
[![Starknet](https://img.shields.io/badge/Starknet-Sepolia-purple.svg)](https://www.starknet.io/)

## Overview

**Hex'd** is a multiplayer strategy game where players navigate a hexagonal grid shrouded in fog of war. Every step to an empty tile triggers a random encounter — a gift that strengthens you or a curse that may kill you. Walk into another player's tile and combat is resolved automatically based on XP. You can ambush offline players, and every decision is a gamble between exploration and survival.

All game logic, state, and randomness live fully onchain on Starknet via the Dojo game engine. The frontend is a fully playable 3D experience built with React and Three.js.

### What's Implemented

- **21x21 Hex Grid**: Axial coordinate system with bounds checking
- **3D Frontend**: Playable Three.js hex grid with camera controls, fog of war, and mobile support
- **Fog of War**: 6-bit neighbor bitmask reveals adjacent occupancy after each move
- **Asynchronous PvP Combat**: XP-based resolution, attack offline players
- **Gift/Curse Encounter System**: 6 distinct outcomes on every empty-tile move (50% gift, 50% curse)
- **Deterministic RNG**: Poseidon hash from game state, fully verifiable onchain
- **Leaderboard**: Highest score tracking with onchain registration
- **Game Counter**: Tracks active concurrent games (max 350)
- **Event-Driven Architecture**: 7 event types for frontend reactivity
- **Wallet Integration**: Cartridge Controller for seamless onchain interaction
- **Idle Attack Detection**: Polling detects combat while player is away

## Quick Start

### Prerequisites

- [Dojo](https://book.dojoengine.org/installation) 1.8.0+ (includes Scarb, Katana, Torii, Sozo)
- [Node.js](https://nodejs.org/) 18+ and pnpm (for frontend)

### Build & Test

```bash
cd contracts
sozo build       # Compile Cairo contracts
sozo test        # Run all 75 tests
```

### Run Locally

```bash
# Terminal 1: Local Starknet node
katana --disable-fee

# Terminal 2: Deploy contracts
cd contracts
sozo migrate

# Terminal 3: Start indexer
torii --world <WORLD_ADDRESS> --http.cors_origins "*"

# Terminal 4: Frontend
cd client
pnpm install
pnpm run dev
```

### Scarb Scripts

```bash
cd contracts
scarb run migrate-dev     # Full build + test + deploy (local)
scarb run migrate         # Full build + test + deploy (Sepolia)
scarb run spawn-dev       # Execute spawn on local
scarb run move-dev        # Execute move on local
```

## How to Play

### Getting Started

1. **Connect Wallet**: Open the game and connect your Starknet wallet via Cartridge Controller.
2. **Start Game**: Click "Start Game" to spawn on the hex grid. You get placed at a random position with 100 HP, 110 max HP, and 0 XP.
3. **Navigate**: Click an adjacent hex tile to select your direction, then click again to confirm. You can move in 6 directions: East, NorthEast, NorthWest, West, SouthWest, SouthEast.

### On Each Move

- **Empty tile**: You earn +10 XP for exploring, then an encounter triggers automatically. You receive a gift (50% chance) or curse (50% chance) that modifies your HP or XP.
- **Occupied tile**: Combat resolves automatically. The player with higher XP wins. Equal XP favors the attacker.

### Combat

| Outcome | Attacker | Defender |
|---------|----------|----------|
| **Attacker wins** | +30 XP, +10 HP, moves to defender's tile | -10 HP, pushed to attacker's old tile |
| **Defender wins** | -10 HP, stays put | -5 HP (retaliation), stays put |

If either player's HP reaches 0, they die. Their game session ends and their tile is cleared.

### Encounters

When you move to an empty tile, a deterministic encounter is rolled based on your position and the block timestamp.

| Type | Outcome | Effect | Chance |
|------|---------|--------|--------|
| Gift (50%) | **Heal** | +10 HP (capped at max) | 30% of gifts |
| | **Empower** | +20 XP | 45% of gifts |
| | **Blessing** | +5 HP, +10 XP | 25% of gifts |
| Curse (50%) | **Poison** | -15 HP (can kill) | 40% of curses |
| | **Drain** | -10 XP (floor: 0) | 25% of curses |
| | **Hex** | -10 HP, -10 XP (can kill) | 35% of curses |

Max HP is fixed at 110 and never changes. Exploration awards +10 XP per move regardless of the encounter outcome.

### Fog of War

After each move or spawn, you receive a bitmask showing which of your 6 neighboring tiles are occupied. Occupied neighbors appear red on the grid — plan your route accordingly.

### Death and Scoring

When your HP reaches 0 (from combat or a deadly encounter), your run ends. You can then:
- **Register your score** to the onchain leaderboard (records your final XP)
- **Return to the lobby** and start a new game

### Tips

- Red neighbors mean danger (or opportunity) — an occupied tile means combat.
- Exploring builds XP, which determines combat outcomes. Move often.
- Curses can kill you. If your HP is low, every move is a risk.
- You can attack offline players. They can attack you while you're away too — check the toast notifications for ambush alerts.

## Architecture

```
contracts/src/
  models.cairo                # Models + constants + enums
  lib.cairo                   # Module tree
  constants/constants.cairo   # Grid bounds, namespace
  systems/game/
    contracts.cairo           # IGameSystems (spawn, move, register_score, get_game_state, get_highest_score)
    tests.cairo               # 37 integration tests
  helpers/
    combat.cairo              # XP-based combat resolution + death handling
    encounter.cairo           # Gift/curse system (28 unit tests)
    movement.cairo            # Position + tile occupancy updates
    spawn.cairo               # Random spawn position
  utils/
    hex.cairo                 # Axial hex math (neighbors, bounds, occupancy) (7 unit tests)
    setup.cairo               # Test world deployment helper

client/                       # React + TypeScript + Three.js frontend
  src/
    components/               # HexGrid, Header, MyGames, DeathPage, HowToPlayModal, etc.
    contexts/                 # GameDirector, Sound, Controller
    dojo/                     # useGameActions, useSystemCalls, useEntitySync
    pages/                    # StartPage, GamePage
    stores/                   # Zustand game state + UI state
    three/                    # Three.js hex geometry, constants, coordinate utils
    types/                    # TypeScript game interfaces
    utils/                    # Event parsing, coordinate mapping, network config
```

### Models (Dojo ECS)

| Model | Key | Purpose |
|-------|-----|---------|
| `GameSession` | `game_id` | Maps game to player address, tracks active/inactive |
| `PlayerState` | `game_id` | Position (Vec2), last direction, movement flag |
| `PlayerStats` | `game_id` | HP, max HP, XP |
| `TileOccupant` | `(x, y)` | Which game_id occupies a tile (0 = empty) |
| `GameCounter` | singleton (0) | Tracks number of active concurrent games |
| `HighestScore` | singleton (0) | Leaderboard: player address, username, highest XP |

### System Functions

| Function | Description |
|----------|-------------|
| `spawn()` | Creates new game session, generates random position, initializes models, reveals neighbors |
| `move(game_id, direction)` | Validates ownership/bounds, resolves combat OR movement+encounter, emits events |
| `get_game_state(game_id)` | Read-only view returning full game state for a session |
| `register_score(player, username, xp)` | Updates highest score if new XP exceeds current record |
| `get_highest_score()` | Returns (player, username, xp) of the current leaderboard leader |

### Events

| Event | Emitted When |
|-------|-------------|
| `Spawned` | New game session created |
| `Moved` | Player moved to an empty tile |
| `CombatResult` | PvP combat resolved |
| `PlayerDied` | Player HP reached 0 (PvP or encounter) |
| `NeighborsRevealed` | Fog of war update after move/spawn |
| `EncounterOccurred` | Gift or curse applied after move |
| `HighestScoreUpdated` | New highest score registered |

### Key Design Decisions

**XP-based combat**: No stats to distribute. Your XP (earned from exploration and winning fights) determines combat outcomes. Higher XP wins; ties favor the attacker.

**Deterministic encounters**: Outcomes are derived from `poseidon_hash(game_id, x, y, block_timestamp)`. Same inputs always produce the same result, making the game fully verifiable.

**ECS separation**: Spatial state (`PlayerState`) and combat state (`PlayerStats`) are separate models, following Dojo ECS best practices. `TileOccupant` provides efficient reverse lookups for collision and combat detection.

**Game capacity**: `GameCounter` enforces a maximum of 350 concurrent games (~80% of the 441-tile grid), ensuring the grid never becomes fully saturated.

### Constants

```
STARTING_HP = 100, MAX_HP = 110 (fixed)
COMBAT_DAMAGE = 10, COMBAT_RETALIATION_DAMAGE = 5
COMBAT_XP_REWARD = 30, COMBAT_HP_REWARD = 10
EXPLORE_XP_REWARD = 10
GIFT_THRESHOLD = 50 (50% gift, 50% curse)
HEAL = +10 HP, EMPOWER = +20 XP, BLESSING = +5 HP / +10 XP
POISON = -15 HP, DRAIN = -10 XP, HEX = -10 HP / -10 XP
MIN_MAX_HP = 10, MAX_CONCURRENT_GAMES = 350
Grid: GRID_MIN = -10, GRID_MAX = 10 (21x21)
```

## Hex Grid

Uses **axial coordinates** `(q, r)` with pointy-top hexagons on a 21x21 grid (range [-10, 10]).

```
       (0,-1)  (1,-1)
         NW      NE
           \    /
            \  /
  (-1,0) W --(0,0)-- E (1,0)
            /  \
           /    \
         SW      SE
       (-1,1)  (0,1)
```

**Direction vectors**: E (+1,0), NE (+1,-1), NW (0,-1), W (-1,0), SW (-1,+1), SE (0,+1)

## Frontend

The client is a fully playable 3D game built with React, Three.js, and the Dojo SDK.

### Tech Stack

- **React 18** + TypeScript + Vite
- **Three.js** via @react-three/fiber for 3D hex grid rendering
- **Dojo SDK** + Starknet.js for contract interaction
- **Cartridge Controller** for wallet integration
- **Zustand** for client state management
- **Material UI** + Tailwind CSS for UI components

### Features

- **3D Hex Grid**: Instanced mesh rendering with procedural biome coloring and fog-of-war opacity
- **Camera Controls**: Orbit controls with smooth tracking to player position
- **Move Confirmation**: Click-to-select, click-again-to-confirm pattern prevents misclicks
- **Combat Indicators**: Occupied neighbor tiles shown in red
- **Toast Notifications**: Real-time feedback for moves, encounters, combat, and ambush alerts
- **Death Screen**: Game over page with final XP score and leaderboard registration
- **Game Persistence**: Active game saved to localStorage for resume across sessions
- **Idle Attack Detection**: Polling detects HP/position changes while player is away
- **Mobile Support**: Responsive camera and touch-friendly double-tap movement
- **Background Music**: Toggle-able ambient soundtrack

## Testing

75 tests total, all passing:

- **3 unit tests** in `models.cairo`: Vec2 equality, zero check, HP constant validation
- **7 unit tests** in `utils/hex.cairo`: All 6 movement directions + boundary validation
- **28 unit tests** in `helpers/encounter.cairo`: Outcome determination, encounter application for all 6 outcomes, boundary values, death conditions, stat invariants
- **37 integration tests** in `systems/game/tests.cairo`: Full world deployment tests covering spawn, movement, combat, encounter integration, player death, tile occupancy, neighbor revelation, game counter, and edge cases

```bash
cd contracts
sozo test    # Runs all 75 tests
```

## Roadmap

### Completed
- [x] Core models (GameSession, PlayerState, PlayerStats, TileOccupant, GameCounter, HighestScore)
- [x] Hex grid movement with bounds checking
- [x] XP-based asynchronous combat system
- [x] Gift/curse encounter system (6 outcomes)
- [x] Fog of war (neighbor occupancy bitmask)
- [x] Deterministic Poseidon-based RNG
- [x] Event-driven architecture (7 event types)
- [x] Comprehensive test suite (75 tests)
- [x] Highest score leaderboard
- [x] Game Design Document
- [x] 3D frontend with Three.js hex grid
- [x] Wallet integration (Cartridge Controller)
- [x] Sepolia testnet deployment
- [x] Idle attack detection and notifications
- [x] Mobile-responsive design

### Planned
- [ ] Full leaderboard with multiple entries and seasons
- [ ] Stat distribution (STR/DEX/VIT/LUK)
- [ ] Flee mechanic in combat
- [ ] Scoring system with multi-factor formula
- [ ] Balance tuning and gas optimization
- [ ] Mainnet deployment

## Documentation

- **[Game Design Document](GAME_DESIGN_DOCUMENT.md)**: Full aspirational design including planned features
- **[CLAUDE.md](CLAUDE.md)**: Technical reference for AI-assisted development
- **[Dojo Documentation](https://book.dojoengine.org/)**: Dojo engine reference
- **[Cairo Documentation](https://book.cairo-lang.org/)**: Cairo language reference

## Contributing

Feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **[Dojo Engine](https://www.dojoengine.org/)**: Provable game engine for onchain games
- **[Death Mountain](https://github.com/cartridge-gg/death-mountain)**: Inspiration for encounter system design
- **[Eternum](https://eternum.realms.world/)**: Inspiration for hex grid mechanics
- **[Red Blob Games](https://www.redblobgames.com/grids/hexagons/)**: Hex grid algorithms reference

## Contact

**Developer**: [Femi Oje]
**Twitter**: [@0xjinius](https://x.com/0xjinius)
**GitHub**: [@FemiOje](https://github.com/FemiOje)
**Email**: 0xjinius@gmail.com

**Project Link**: [https://github.com/FemiOje/hexed](https://github.com/FemiOje/hexed)

---

*Built on Starknet with Dojo*
