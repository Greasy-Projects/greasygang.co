import type { LayoutCollection } from "./types";

export const kitchenMacCollections: LayoutCollection[] = [
	{
		key: "kitchenMac",
		label: "KITCHEN MAC",
		room: "kitchen",
		position: { x: 2.95, y: 0.05, z: -21.08 },
		objects: [
			{
				key: "body",
				label: "KITCHEN MAC BODY",
				position: { x: 0, y: 1.4, z: 0 },
				size: { x: 1.5, y: 2.84, z: 0.1 },
			},
			{
				key: "head",
				label: "KITCHEN MAC HEAD",
				position: { x: -0.02, y: 2.52, z: 0.1 },
				size: { x: 0.64, y: 0.86, z: 0.1 },
			},
			{
				key: "spatulaArm",
				label: "KITCHEN MAC SPATULA ARM",
				position: { x: 0.48, y: 2.02, z: 0.09 },
				size: { x: 0.82, y: 1.02, z: 0.1 },
			},
			{
				key: "gestureArm",
				label: "KITCHEN MAC GESTURE ARM",
				position: { x: -0.48, y: 2.05, z: 0.08 },
				size: { x: 1.04, y: 0.69, z: 0.1 },
			},
		],
	},
];
