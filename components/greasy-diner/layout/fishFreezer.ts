import type { LayoutCollection } from "./types";

export const fishFreezerCollections: LayoutCollection[] = [
	{
		key: "fishFreezerDisplays",
		label: "FISH FREEZER DISPLAYS",
		room: "fish",
		position: { x: 21.8, y: 0, z: 6.65 },
		objects: [
			{
				key: "fishCase",
				label: "FISH FREEZER CASE",
				position: { x: 3.25, y: 1.55, z: 0 },
				size: { x: 2.33, y: 2.1, z: 1.8 },
				collider: true,
			},
			{
				key: "fishShelfA",
				label: "FISH FREEZER SHELF A",
				position: { x: -1.725, y: 1.55, z: -2.35 },
				size: { x: 2.13, y: 1.6, z: 0.5 },
				collider: true,
			},
			{
				key: "fishShelfB",
				label: "FISH FREEZER SHELF B",
				position: { x: -1.725, y: 1.55, z: 2.35 },
				size: { x: 2.13, y: 1.6, z: 0.5 },
				collider: true,
			},
		],
	},
];
