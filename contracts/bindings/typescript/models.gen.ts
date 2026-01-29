import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, CairoOption, CairoOptionVariant, BigNumberish } from 'starknet';

// Type definition for `untitled::models::DirectionsAvailable` struct
export interface DirectionsAvailable {
	player: string;
	directions: Array<DirectionEnum>;
}

// Type definition for `untitled::models::Moves` struct
export interface Moves {
	player: string;
	last_direction: CairoOption<DirectionEnum>;
	can_move: boolean;
}

// Type definition for `untitled::models::Position` struct
export interface Position {
	player: string;
	vec: Vec2;
}

// Type definition for `untitled::models::PositionCount` struct
export interface PositionCount {
	identity: string;
	position: Array<[BigNumberish, BigNumberish]>;
}

// Type definition for `untitled::models::Vec2` struct
export interface Vec2 {
	x: BigNumberish;
	y: BigNumberish;
}

// Type definition for `untitled::systems::actions::actions::Moved` struct
export interface Moved {
	player: string;
	direction: DirectionEnum;
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
		DirectionsAvailable: DirectionsAvailable,
		Moves: Moves,
		Position: Position,
		PositionCount: PositionCount,
		Vec2: Vec2,
		Moved: Moved,
	},
}
export const schema: SchemaType = {
	untitled: {
		DirectionsAvailable: {
			player: "",
			directions: [new CairoCustomEnum({ 
					East: "",
				NorthEast: undefined,
				NorthWest: undefined,
				West: undefined,
				SouthWest: undefined,
				SouthEast: undefined, })],
		},
		Moves: {
			player: "",
			last_direction: new CairoOption(CairoOptionVariant.None),
			can_move: false,
		},
		Position: {
			player: "",
		vec: { x: 0, y: 0, },
		},
		PositionCount: {
			identity: "",
			position: [[0, 0]],
		},
		Vec2: {
			x: 0,
			y: 0,
		},
		Moved: {
			player: "",
		direction: new CairoCustomEnum({ 
					East: "",
				NorthEast: undefined,
				NorthWest: undefined,
				West: undefined,
				SouthWest: undefined,
				SouthEast: undefined, }),
		},
	},
};
export enum ModelsMapping {
	Direction = 'untitled-Direction',
	DirectionsAvailable = 'untitled-DirectionsAvailable',
	Moves = 'untitled-Moves',
	Position = 'untitled-Position',
	PositionCount = 'untitled-PositionCount',
	Vec2 = 'untitled-Vec2',
	Moved = 'untitled-Moved',
}