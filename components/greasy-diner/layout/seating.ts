import type { LayoutCollection } from "./types";

export const seatingCollections: LayoutCollection[] = [
	{
		key: "booths",
		label: "DINER BOOTHS",
		room: "main",
		position: { x: 0, y: 0, z: 0 },
		objects: [
			{
				key: "leftBooth",
				label: "LEFT BOOTH",
				position: { x: -11.415, y: 1.2, z: -3.28 },
				size: { x: 2.73, y: 2.4, z: 2.36 },
				collider: true,
			},
			{
				key: "rightBooth",
				label: "RIGHT BOOTH",
				position: { x: 11.415, y: 1.2, z: -3.28 },
				size: { x: 2.73, y: 2.4, z: 2.36 },
				collider: true,
			},
		],
	},
];
