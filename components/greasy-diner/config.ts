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

export type RoomKey = "main" | "lore" | "fish" | "live";

export type ZoneKey =
	| Section
	| "loreRoom"
	| "fishRoom"
	| "liveRoom"
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

export const ROOM_SPAWNS: Record<RoomKey, RoomSpawn> = {
	main: { x: 0, z: 1.2, yaw: 0 },
	lore: { x: -21.8, z: 2.0, yaw: -Math.PI / 2 },
	fish: { x: 21.8, z: 6.2, yaw: Math.PI / 2 },
	live: { x: 21.8, z: -5.4, yaw: Math.PI / 2 },
};

export const ROOM_BOUNDS: Record<RoomKey, RoomBounds> = {
	main: { minX: -13.72, maxX: 13.72, minZ: -11.28, maxZ: 7.65 },
	lore: { minX: -26.98, maxX: -16.62, minZ: -2.76, maxZ: 6.76 },
	fish: { minX: 16.62, maxX: 26.98, minZ: 2.74, maxZ: 9.66 },
	live: { minX: 16.62, maxX: 26.98, minZ: -8.68, maxZ: -2.12 },
};

export const ROOM_COLLIDERS: Record<RoomKey, ColliderRect[]> = {
	main: [
		{ minX: -5.25, maxX: 5.25, minZ: -10.24, maxZ: -8.55 },
		{ minX: -12.78, maxX: -10.05, minZ: -4.46, maxZ: -2.1 },
		{ minX: 10.05, maxX: 12.78, minZ: -4.46, maxZ: -2.1 },
		{ minX: -12.35, maxX: -10.75, minZ: -10.25, maxZ: -8.95 },
	],
	lore: [
		{ minX: -26.84, maxX: -26.1, minZ: 0.32, maxZ: 3.68 },
		{ minX: -24.6, maxX: -19.1, minZ: 6.24, maxZ: 6.64 },
	],
	fish: [
		{ minX: 24.15, maxX: 26.48, minZ: 5.3, maxZ: 7.1 },
		{ minX: 19.05, maxX: 21.18, minZ: 3.84, maxZ: 4.34 },
		{ minX: 19.05, maxX: 21.18, minZ: 8.04, maxZ: 8.54 },
	],
	live: [
		{ minX: 26.05, maxX: 26.5, minZ: -7.72, maxZ: -3.18 },
		{ minX: 20.25, maxX: 23.75, minZ: -5.98, maxZ: -5.02 },
	],
};

export const ZONES: Zone[] = [
	{
		key: "menu",
		cx: 0,
		cz: -7.5,
		radius: 4.4,
		label: "VIEW MENU",
		emoji: "🍔",
	},
	{
		key: "about",
		cx: -12.2,
		cz: -2.0,
		radius: 1.8,
		label: "ABOUT GREASYMAC",
		emoji: "🎮",
	},
	{
		key: "leaderboard",
		cx: 10.4,
		cz: -5.6,
		radius: 3.7,
		label: "LEADERBOARD",
		emoji: "🏆",
	},
	{
		key: "mac",
		cx: 0,
		cz: -9.6,
		radius: 2.7,
		label: "TALK TO MAC",
		emoji: "🍴",
	},
	{
		key: "jukebox",
		cx: -11.5,
		cz: -9.7,
		radius: 1.9,
		label: "PLAY JUKEBOX",
		emoji: "♫",
	},
	{
		key: "loreRoom",
		cx: -12.8,
		cz: 2.0,
		radius: 2.2,
		label: "ENTER LORE HALL",
		emoji: "★",
		room: "main",
	},
	{
		key: "fishRoom",
		cx: 12.8,
		cz: 5.9,
		radius: 2.0,
		label: "ENTER FISH FREEZER",
		emoji: "◆",
		room: "main",
	},
	{
		key: "liveRoom",
		cx: 12.8,
		cz: 0.4,
		radius: 2.0,
		label: "ENTER LIVE ROOM",
		emoji: "●",
		room: "main",
	},
	{
		key: "exitMain",
		cx: -16.6,
		cz: 2.0,
		radius: 2.1,
		label: "BACK TO DINER",
		emoji: "↩",
		room: "lore",
	},
	{
		key: "exitMain",
		cx: 16.6,
		cz: 6.2,
		radius: 2.1,
		label: "BACK TO DINER",
		emoji: "↩",
		room: "fish",
	},
	{
		key: "exitMain",
		cx: 16.6,
		cz: -5.4,
		radius: 2.1,
		label: "BACK TO DINER",
		emoji: "↩",
		room: "live",
	},
];
