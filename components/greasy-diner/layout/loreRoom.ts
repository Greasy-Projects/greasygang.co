import type { LayoutCollection } from "./types";

export const loreRoomCollections: LayoutCollection[] = [
	{
		key: "loreRoomDisplays",
		label: "LORE ROOM DISPLAYS",
		room: "lore",
		position: { x: -21.8, y: 0, z: 2 },
		objects: [
			{
				key: "loreArchiveWall",
				label: "LORE ARCHIVE WALL",
				position: { x: -4.47, y: 2.4, z: 1.84 },
				size: { x: 0.74, y: 4.8, z: 3.36 },
				collider: true,
			},
			{
				key: "loreDisplayWall",
				label: "LORE DISPLAY WALL",
				position: { x: -0.55, y: 2.4, z: 4.44 },
				size: { x: 5.5, y: 4.8, z: 0.4 },
				collider: true,
			},
		],
	},
];
