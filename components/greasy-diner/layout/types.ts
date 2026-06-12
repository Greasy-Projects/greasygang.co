import type { ColliderRect, RoomKey, Zone, ZoneKey } from "../config";

export interface Vec2 {
	x: number;
	z: number;
}

export interface Vec3 extends Vec2 {
	y: number;
}

export interface Size3 {
	x: number;
	y: number;
	z: number;
}

export interface LayoutZone {
	key?: ZoneKey;
	position: Vec2;
	radius: number;
	label: string;
	emoji: string;
	room?: RoomKey;
}

export interface LayoutGlow {
	position: Vec2;
	color: number;
}

export interface LayoutHangingSign {
	position: Vec2;
	ry: number;
	text: string;
	arrow: string;
	color: number;
}

export interface LayoutRightWallTV {
	z: number;
	accent: number;
}

export interface LayoutDoor {
	position: Vec3;
	ry: number;
	title: string;
	subtitle: string;
	accent: number;
}

export interface LayoutCollider {
	position?: Vec2;
	size?: Pick<Size3, "x" | "z">;
	rect?: ColliderRect;
}

export interface LayoutObject {
	key: string;
	label?: string;
	position?: Vec3;
	size?: Size3;
	zone?: LayoutZone;
	glow?: LayoutGlow;
	hangingSign?: LayoutHangingSign;
	rightWallTV?: LayoutRightWallTV;
	door?: LayoutDoor;
	collider?: boolean | LayoutCollider;
	colliders?: LayoutCollider[];
}

export interface LayoutCollection {
	key: string;
	label: string;
	room?: RoomKey;
	position: Vec3;
	objects: LayoutObject[];
}

export interface ResolvedLayoutObject extends LayoutObject {
	collectionKey: string;
	room?: RoomKey;
	worldPosition?: Vec3;
}

export interface ZoneGlowPlacement {
	key: string;
	x: number;
	z: number;
	color: number;
}

export interface HangingSignPlacement {
	key: string;
	x: number;
	z: number;
	ry: number;
	text: string;
	arrow: string;
	color: number;
}

export interface RightWallTVPlacement {
	key: "twitch" | "leaderboard";
	z: number;
	accent: number;
}

export interface RoomDoorPlacement extends LayoutDoor {
	key: string;
}

export function resolveObjects(
	collections: LayoutCollection[]
): ResolvedLayoutObject[] {
	return collections.flatMap(collection =>
		collection.objects.map(object => ({
			...object,
			collectionKey: collection.key,
			room: collection.room,
			worldPosition: object.position
				? {
						x: collection.position.x + object.position.x,
						y: collection.position.y + object.position.y,
						z: collection.position.z + object.position.z,
					}
				: undefined,
		}))
	);
}

export function toZone(object: ResolvedLayoutObject): Zone | null {
	if (!object.zone) return null;
	const key = object.zone.key ?? (object.key as ZoneKey);
	const base = object.worldPosition ?? { x: 0, y: 0, z: 0 };
	return {
		key,
		cx: base.x + object.zone.position.x,
		cz: base.z + object.zone.position.z,
		radius: object.zone.radius,
		label: object.zone.label,
		emoji: object.zone.emoji,
		room: object.zone.room ?? object.room,
	};
}

export function toGlow(object: ResolvedLayoutObject): ZoneGlowPlacement | null {
	if (!object.glow) return null;
	const base = object.worldPosition ?? { x: 0, y: 0, z: 0 };
	return {
		key: object.key,
		x: base.x + object.glow.position.x,
		z: base.z + object.glow.position.z,
		color: object.glow.color,
	};
}

export function toHangingSign(
	object: ResolvedLayoutObject
): HangingSignPlacement | null {
	if (!object.hangingSign) return null;
	const base = object.worldPosition ?? { x: 0, y: 0, z: 0 };
	return {
		key: object.key,
		x: base.x + object.hangingSign.position.x,
		z: base.z + object.hangingSign.position.z,
		ry: object.hangingSign.ry,
		text: object.hangingSign.text,
		arrow: object.hangingSign.arrow,
		color: object.hangingSign.color,
	};
}

export function toRightWallTV(
	object: ResolvedLayoutObject
): RightWallTVPlacement | null {
	if (!object.rightWallTV) return null;
	return {
		key: object.key as RightWallTVPlacement["key"],
		z: object.rightWallTV.z,
		accent: object.rightWallTV.accent,
	};
}

export function toDoor(object: ResolvedLayoutObject): RoomDoorPlacement | null {
	if (!object.door) return null;
	return {
		key: object.key,
		...object.door,
		position: {
			x: object.door.position.x,
			y: object.door.position.y,
			z: object.door.position.z,
		},
	};
}

export function toColliders(object: ResolvedLayoutObject): ColliderRect[] {
	const colliders =
		object.colliders ??
		(object.collider ? [object.collider === true ? {} : object.collider] : []);
	return colliders.map(collider => {
		if (collider.rect) return collider.rect;
		const base = object.worldPosition ?? { x: 0, y: 0, z: 0 };
		const position = collider.position ?? { x: 0, z: 0 };
		const size = collider.size ?? object.size;
		if (!size) {
			throw new Error(
				`Layout object "${object.key}" has a collider without size.`
			);
		}
		const cx = base.x + position.x;
		const cz = base.z + position.z;
		return {
			minX: cx - size.x / 2,
			maxX: cx + size.x / 2,
			minZ: cz - size.z / 2,
			maxZ: cz + size.z / 2,
		};
	});
}
