import type { DinerPalette } from "./sceneKit";

export interface Button {
	icon: { name: string; type: string };
	text: string;
	href: string;
	tag: string;
	color: string;
}

export type Section =
	| "none"
	| "menu"
	| "about"
	| "leaderboard"
	| "mac"
	| "jukebox";

export type RoomKey = "main" | "lore" | "fish" | "live" | "kitchen";

export type ZoneKey =
	| Section
	| "loreRoom"
	| "fishRoom"
	| "liveRoom"
	| "kitchenRoom"
	| "exitMain";

export interface Zone {
	key: ZoneKey;
	cx: number;
	cz: number;
	radius: number;
	label: string;
	emoji: string;
	room?: RoomKey;
}

export interface RoomBounds {
	minX: number;
	maxX: number;
	minZ: number;
	maxZ: number;
}

export interface RoomSpawn {
	x: number;
	z: number;
	yaw: number;
}

export interface ColliderRect {
	minX: number;
	maxX: number;
	minZ: number;
	maxZ: number;
}

export const DINER_PALETTE: DinerPalette = {
	cream: 0xfff2c8,
	mustard: 0xe8a946,
	butter: 0xf6cf5d,
	red: 0xfa4040,
	redDark: 0xc92828,
	pickle: 0x2f7f67,
	ink: 0x25120e,
	chrome: 0xcccccc,
	neonPink: 0xff2255,
	neonBlue: 0x22aaff,
	sauce: 0x7a2f05,
	amber: 0xffaa44,
	teal: 0x89d8c8,
};

export {
	DINER_OBJECTS,
	HANGING_SIGNS,
	LAYOUT_COLLECTIONS,
	RIGHT_WALL_TVS,
	ROOM_BOUNDS,
	ROOM_COLLIDERS,
	ROOM_DOORS,
	ROOM_SPAWNS,
	ZONE_GLOWS,
	ZONES,
	type HangingSignPlacement,
	type LayoutCollection,
	type LayoutObject,
	type ResolvedLayoutObject,
	type RightWallTVPlacement,
	type RoomDoorPlacement,
	type ZoneGlowPlacement,
} from "./layout";
