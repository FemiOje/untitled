import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, CairoOption, CairoOptionVariant, BigNumberish } from 'starknet';

// Type definition for `untitled::models::GameSession` struct
export interface GameSession {
	game_id: BigNumberish;
	player: string;
	is_active: boolean;
}

// Type definition for `untitled::models::PlayerState` struct
export interface PlayerState {
	game_id: BigNumberish;
	position: Vec2;
	last_direction: CairoOption<DirectionEnum>;
	can_move: boolean;
}

// Type definition for `untitled::models::Vec2` struct
export interface Vec2 {
	x: BigNumberish;
	y: BigNumberish;
}

// Type definition for `untitled::systems::actions::actions::Moved` struct
export interface Moved {
	game_id: BigNumberish;
	direction: DirectionEnum;
	position: Vec2;
}

// Type definition for `untitled::systems::actions::actions::Spawned` struct
export interface Spawned {
	game_id: BigNumberish;
	player: string;
	position: Vec2;
}

// Type definition for `untitled::models::GameState` struct
export interface GameState {
	game_id: BigNumberish;
	player: string;
	position: Vec2;
	last_direction: CairoOption<DirectionEnum>;
	can_move: boolean;
	is_active: boolean;
}

// Type definition for `untitled::models::Direction` enum
export const direction = [
	'East',
	'NorthEast',
	'NorthWest',
	'West',
	'SouthWest',
	'SouthEast',
] as const;
export type Direction = { [key in typeof direction[number]]: string };
export type DirectionEnum = CairoCustomEnum;

export interface SchemaType extends ISchemaType {
	untitled: {
		GameSession: GameSession,
		PlayerState: PlayerState,
		Vec2: Vec2,
		Moved: Moved,
		Spawned: Spawned,
		GameState: GameState,
	},
}
export const schema: SchemaType = {
	untitled: {
		GameSession: {
			game_id: 0,
			player: "",
			is_active: false,
		},
		PlayerState: {
			game_id: 0,
		position: { x: 0, y: 0, },
			last_direction: new CairoOption(CairoOptionVariant.None),
			can_move: false,
		},
		Vec2: {
			x: 0,
			y: 0,
		},
		Moved: {
			game_id: 0,
		direction: new CairoCustomEnum({ 
					East: "",
				NorthEast: undefined,
				NorthWest: undefined,
				West: undefined,
				SouthWest: undefined,
				SouthEast: undefined, }),
		position: { x: 0, y: 0, },
		},
		Spawned: {
			game_id: 0,
			player: "",
		position: { x: 0, y: 0, },
		},
		GameState: {
			game_id: 0,
			player: "",
		position: { x: 0, y: 0, },
			last_direction: new CairoOption(CairoOptionVariant.None),
			can_move: false,
			is_active: false,
		},
	},
};
export enum ModelsMapping {
	Direction = 'untitled-Direction',
	GameSession = 'untitled-GameSession',
	PlayerState = 'untitled-PlayerState',
	Vec2 = 'untitled-Vec2',
	Moved = 'untitled-Moved',
	Spawned = 'untitled-Spawned',
	GameState = 'untitled-GameState',
}