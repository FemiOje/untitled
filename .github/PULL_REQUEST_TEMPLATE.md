## Summary

Implements the core combat system for the onchain battle royale. When a player moves onto an occupied tile, combat is automatically resolved using pseudo-random outcomes. Losers take HP damage and may die, winners earn XP. The branch also adds player stats (HP/XP), tile occupancy tracking, a death screen with respawn flow, and exploration XP rewards.

### Key changes

**Contracts (Cairo/Dojo)**
- New models: `PlayerStats` (hp, max_hp, xp), `TileOccupant` (x, y -> game_id)
- New events: `CombatResult`, `PlayerDied`
- Combat constants: `STARTING_HP=10`, `MAX_HP=100`, `COMBAT_DAMAGE=10`, `COMBAT_XP_REWARD=30`, `EXPLORE_XP_REWARD=10`
- `spawn()` now initializes `PlayerStats` and writes `TileOccupant`
- `move()` checks destination tile for occupants, triggers combat if occupied:
  - Pseudo-random win/loss (tx hash + timestamp seed, 50/50)
  - Winner gets XP, loser takes damage
  - If loser dies: session deactivated, tile cleared, `PlayerDied` event emitted
  - If loser survives: positions swap (attacker claims tile, defender pushed back)
  - If no combat: grants `EXPLORE_XP_REWARD` on successful move
- `handle_player_death` internal function for cleanup
- ~670 lines of new contract tests covering tile occupancy, combat outcomes, death handling, XP rewards, and edge cases

**Client (React/TypeScript)**
- `DeathPage` component: game over screen showing final XP with "Play Again" / "Back to Lobby" options
- `gameStore`: added `isDead`, `deathXp`, `hp`, `maxHp`, `xp` state + selectors
- `events.ts`: parse `CombatResult` events from chain
- `GamePage`: integrates death state, redirects to `DeathPage` on player death
- `HexGrid`: updated to reflect combat/stat changes
- `useGameActions`: handles stat syncing and death detection
- Removed optimistic movement to avoid desyncs during combat
- Updated Sepolia manifest and bindings

## Test plan

- [ ] `sozo test` passes (all contract tests including new combat tests)
- [ ] Spawn two players, move one onto the other's tile -> combat resolves
- [ ] Winner receives 30 XP, loser loses 10 HP
- [ ] When HP reaches 0, player sees DeathPage with final XP
- [ ] "Play Again" on DeathPage respawns and navigates to game
- [ ] "Back to Lobby" resets state and returns to home
- [ ] Moving to an empty tile grants 10 XP (explore reward)
- [ ] Tile occupancy updates correctly after moves and deaths
- [ ] `npm run build` succeeds with no type errors
