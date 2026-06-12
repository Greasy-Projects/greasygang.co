import type { RoomBounds, RoomKey, RoomSpawn } from "../config";
import type { LayoutCollection } from "./types";

export const ROOM_SPAWNS: Record<RoomKey, RoomSpawn> = {
	main: { x: 0, z: 1.2, yaw: 0 },
	lore: { x: -21.8, z: 2.0, yaw: -Math.PI / 2 },
	fish: { x: 21.8, z: 6.65, yaw: Math.PI / 2 },
	live: { x: 21.8, z: -5.4, yaw: Math.PI / 2 },
	kitchen: { x: 0, z: -15.9, yaw: Math.PI },
};

export const ROOM_BOUNDS: Record<RoomKey, RoomBounds> = {
	main: { minX: -13.72, maxX: 13.72, minZ: -11.28, maxZ: 7.65 },
	lore: { minX: -26.98, maxX: -16.62, minZ: -2.76, maxZ: 6.76 },
	fish: { minX: 16.62, maxX: 26.98, minZ: 2.74, maxZ: 9.66 },
	live: { minX: 16.62, maxX: 26.98, minZ: -8.68, maxZ: -2.12 },
	kitchen: { minX: -5.98, maxX: 5.98, minZ: -22.72, maxZ: -14.88 },
};

export const roomCollections: LayoutCollection[] = [
	{
		key: "mainRoomWalls",
		label: "MAIN ROOM WALLS",
		room: "main",
		position: { x: 0, y: 0, z: 0 },
		objects: [
			{
				key: "mainBackWall",
				label: "MAIN BACK WALL",
				position: { x: 0, y: 2.4, z: -11.5 },
				size: { x: 27.4, y: 4.8, z: 0.36 },
			},
			{
				key: "mainLeftWall",
				label: "MAIN LEFT WALL",
				position: { x: -13.9, y: 2.4, z: -1 },
				size: { x: 0.36, y: 4.8, z: 19 },
			},
			{
				key: "mainRightWall",
				label: "MAIN RIGHT WALL",
				position: { x: 13.9, y: 2.4, z: -1 },
				size: { x: 0.36, y: 4.8, z: 19 },
			},
		],
	},
	{
		key: "loreRoomWalls",
		label: "LORE ROOM WALLS",
		room: "lore",
		position: { x: -21.8, y: 0, z: 2 },
		objects: [
			{
				key: "loreRoomBackWall",
				position: { x: 0, y: 2.4, z: 4.76 },
				size: { x: 10.36, y: 4.8, z: 0.36 },
			},
			{
				key: "loreRoomLeftWall",
				position: { x: -5.18, y: 2.4, z: 0 },
				size: { x: 0.36, y: 4.8, z: 9.52 },
			},
			{
				key: "loreRoomRightWall",
				position: { x: 5.18, y: 2.4, z: 0 },
				size: { x: 0.36, y: 4.8, z: 9.52 },
			},
		],
	},
	{
		key: "fishRoomWalls",
		label: "FISH FREEZER WALLS",
		room: "fish",
		position: { x: 21.8, y: 0, z: 6.65 },
		objects: [
			{
				key: "fishRoomBackWall",
				position: { x: 0, y: 2.4, z: 4.76 },
				size: { x: 10.36, y: 4.8, z: 0.36 },
			},
			{
				key: "fishRoomLeftWall",
				position: { x: -5.18, y: 2.4, z: 0 },
				size: { x: 0.36, y: 4.8, z: 9.52 },
			},
			{
				key: "fishRoomRightWall",
				position: { x: 5.18, y: 2.4, z: 0 },
				size: { x: 0.36, y: 4.8, z: 9.52 },
			},
		],
	},
	{
		key: "liveRoomWalls",
		label: "LIVE ROOM WALLS",
		room: "live",
		position: { x: 21.8, y: 0, z: -5.4 },
		objects: [
			{
				key: "liveRoomBackWall",
				position: { x: 5.36, y: 2.4, z: 0 },
				size: { x: 0.5, y: 4.8, z: 4.54 },
				collider: true,
			},
			{
				key: "liveRoomLeftWall",
				position: { x: 0, y: 2.4, z: -3.28 },
				size: { x: 10.36, y: 4.8, z: 0.36 },
			},
			{
				key: "liveRoomRightWall",
				position: { x: 0, y: 2.4, z: 3.28 },
				size: { x: 10.36, y: 4.8, z: 0.36 },
			},
		],
	},
	{
		key: "kitchenRoomWalls",
		label: "KITCHEN WALLS",
		room: "kitchen",
		position: { x: 0, y: 0, z: -18.8 },
		objects: [
			{
				key: "kitchenRoomBackWall",
				position: { x: 0, y: 2.4, z: -3.92 },
				size: { x: 11.96, y: 4.8, z: 0.36 },
			},
			{
				key: "kitchenRoomLeftWall",
				position: { x: -5.98, y: 2.4, z: 0 },
				size: { x: 0.36, y: 4.8, z: 7.84 },
			},
			{
				key: "kitchenRoomRightWall",
				position: { x: 5.98, y: 2.4, z: 0 },
				size: { x: 0.36, y: 4.8, z: 7.84 },
			},
		],
	},
];
