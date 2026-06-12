import type { ColliderRect, RoomKey } from "./config";
import { counterCollections } from "./layout/counter";
import { fishFreezerCollections } from "./layout/fishFreezer";
import { jukeboxCollections } from "./layout/jukebox";
import { kitchenMacCollections } from "./layout/kitchenMac";
import { liveRoomCollections } from "./layout/liveRoom";
import { loreRoomCollections } from "./layout/loreRoom";
import { navigationCollections } from "./layout/navigation";
import { rightWallCollections } from "./layout/rightWall";
import { ROOM_BOUNDS, ROOM_SPAWNS, roomCollections } from "./layout/rooms";
import { seatingCollections } from "./layout/seating";
import {
	resolveObjects,
	toColliders,
	toDoor,
	toGlow,
	toHangingSign,
	toRightWallTV,
	toZone,
	type HangingSignPlacement,
	type LayoutCollection,
	type LayoutObject,
	type ResolvedLayoutObject,
	type RightWallTVPlacement,
	type RoomDoorPlacement,
	type ZoneGlowPlacement,
} from "./layout/types";

export {
	ROOM_BOUNDS,
	ROOM_SPAWNS,
	type HangingSignPlacement,
	type LayoutCollection,
	type LayoutObject,
	type ResolvedLayoutObject,
	type RightWallTVPlacement,
	type RoomDoorPlacement,
	type ZoneGlowPlacement,
};

export const LAYOUT_COLLECTIONS: LayoutCollection[] = [
	...roomCollections,
	...navigationCollections,
	...counterCollections,
	...seatingCollections,
	...jukeboxCollections,
	...rightWallCollections,
	...loreRoomCollections,
	...fishFreezerCollections,
	...liveRoomCollections,
	...kitchenMacCollections,
];

export const DINER_OBJECTS = resolveObjects(LAYOUT_COLLECTIONS);

export const ROOM_COLLIDERS: Record<RoomKey, ColliderRect[]> = {
	main: [],
	lore: [],
	fish: [],
	live: [],
	kitchen: [],
};

for (const object of DINER_OBJECTS) {
	const room = object.room;
	if (!room) continue;
	ROOM_COLLIDERS[room].push(...toColliders(object));
}

export const ZONES = DINER_OBJECTS.map(toZone).filter(zone => zone !== null);

export const ZONE_GLOWS = DINER_OBJECTS.map(toGlow).filter(
	glow => glow !== null
);

export const HANGING_SIGNS = DINER_OBJECTS.map(toHangingSign).filter(
	sign => sign !== null
);

export const RIGHT_WALL_TVS = DINER_OBJECTS.map(toRightWallTV).filter(
	tv => tv !== null
);

export const ROOM_DOORS = DINER_OBJECTS.map(toDoor).filter(
	door => door !== null
);
