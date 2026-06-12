import type { LayoutCollection } from "./types";

export const rightWallCollections: LayoutCollection[] = [
	{
		key: "rightWallMedia",
		label: "RIGHT WALL MEDIA",
		room: "main",
		position: { x: 0, y: 0, z: 0 },
		objects: [
			{
				key: "leaderboard",
				label: "LEADERBOARD WALL TV",
				zone: {
					position: { x: 11.2, z: -2.15 },
					radius: 2.8,
					label: "LEADERBOARD",
					emoji: "🏆",
				},
				glow: { position: { x: 11.2, z: -2.15 }, color: 0x22aaff },
				hangingSign: {
					position: { x: 6.25, z: -1.65 },
					ry: -Math.PI * 0.1,
					text: "LEADERBOARD",
					arrow: "►",
					color: 0x2255cc,
				},
				rightWallTV: { z: -1.35, accent: 0x4488ff },
			},
			{
				key: "twitch",
				label: "TWITCH WALL TV",
				rightWallTV: { z: -5.2, accent: 0x6444ff },
			},
		],
	},
];
