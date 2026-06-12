import type { LayoutCollection } from "./types";

export const jukeboxCollections: LayoutCollection[] = [
	{
		key: "jukeboxCorner",
		label: "JUKEBOX CORNER",
		room: "main",
		position: { x: -11.5, y: 0, z: -9.8 },
		objects: [
			{
				key: "jukebox",
				label: "JUKEBOX",
				position: { x: 0, y: 0.95, z: 0 },
				size: { x: 1.6, y: 1.9, z: 1.3 },
				zone: {
					position: { x: 0, z: 0.1 },
					radius: 1.9,
					label: "PLAY JUKEBOX",
					emoji: "♫",
				},
				glow: { position: { x: 0, z: 0.1 }, color: 0xff6600 },
				collider: true,
			},
		],
	},
];
