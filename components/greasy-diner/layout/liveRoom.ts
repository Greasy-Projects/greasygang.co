import type { LayoutCollection } from "./types";

export const liveRoomCollections: LayoutCollection[] = [
	{
		key: "liveRoomStudio",
		label: "LIVE ROOM STUDIO",
		room: "live",
		position: { x: 21.8, y: 0, z: -5.4 },
		objects: [
			{
				key: "liveDesk",
				label: "LIVE ROOM DESK",
				position: { x: 0.825, y: 0.55, z: 0 },
				size: { x: 3.5, y: 1.1, z: 0.96 },
				collider: true,
			},
		],
	},
];
