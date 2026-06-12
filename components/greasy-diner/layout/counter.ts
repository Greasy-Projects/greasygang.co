import type { LayoutCollection } from "./types";

export const counterCollections: LayoutCollection[] = [
	{
		key: "counterArea",
		label: "COUNTER AND MAC AREA",
		room: "main",
		position: { x: 0, y: 0, z: 0 },
		objects: [
			{
				key: "counter",
				label: "FRONT COUNTER",
				position: { x: 0, y: 0.56, z: -8.8 },
				size: { x: 10.5, y: 1.12, z: 1.69 },
				collider: true,
			},
			{
				key: "mac",
				label: "MAC BEHIND COUNTER",
				position: { x: 0, y: 0, z: 0 },
				zone: {
					position: { x: 0, z: -9.6 },
					radius: 2.7,
					label: "TALK TO MAC",
					emoji: "🍴",
				},
			},
		],
	},
];
