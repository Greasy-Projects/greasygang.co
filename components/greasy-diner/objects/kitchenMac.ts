import * as THREE from "three";
import { kitchenMacCollections } from "../layout/kitchenMac";
import type { LayoutObject } from "../layout/types";

interface KitchenMacAssets {
	characters: {
		kitchenMacV2BodyFrontHeadless: string;
		kitchenMacV2BodyFrontHeadlessNoArms: string;
		kitchenMacV2Faces: {
			neutralOpen: string;
			talkSmall: string;
			talkWide: string;
			shocked: string;
			suspicious: string;
			smug: string;
			laughing: string;
			clownReaction: string;
		};
		kitchenMacV2Limbs: {
			leftGestureOpen: string;
			rightSpatulaDown: string;
			rightSpatulaRaised: string;
		};
	};
}

interface KitchenMacRigContext {
	assets: KitchenMacAssets;
	loadAssetTexture: (path: string) => THREE.Texture;
}

type LayoutFallback = Required<Pick<LayoutObject, "position" | "size">>;

function makeBillboardMaterial(texture: THREE.Texture) {
	return new THREE.MeshBasicMaterial({
		map: texture,
		transparent: true,
		alphaTest: 0.08,
		depthWrite: false,
		side: THREE.DoubleSide,
		toneMapped: false,
	});
}

export function createKitchenMacCookRig({
	assets,
	loadAssetTexture,
}: KitchenMacRigContext) {
	const collection = kitchenMacCollections[0];
	const partsByKey = new Map(
		collection.objects.map(object => [object.key, object])
	);
	const rig = new THREE.Group();
	rig.name = "kitchen-mac-cook-rig";
	rig.userData.label = "Kitchen Mac Cook Rig";
	rig.userData.kitchenMacRig = true;
	rig.position.set(
		collection.position.x,
		collection.position.y,
		collection.position.z
	);

	const makePart = (
		key: string,
		path: string,
		fallback: LayoutFallback,
		renderOrder = 14
	) => {
		const layout = partsByKey.get(key);
		const position = layout?.position ?? fallback.position;
		const size = layout?.size ?? fallback.size;
		const texture = loadAssetTexture(path);
		const part = new THREE.Mesh(
			new THREE.PlaneGeometry(size.x, size.y),
			makeBillboardMaterial(texture)
		);
		part.name = key;
		part.userData.devLayoutTargetId = `${collection.key}:${key}:position`;
		part.position.set(position.x, position.y, position.z);
		part.renderOrder = renderOrder + Math.round(position.z * 100);
		rig.add(part);
		return part;
	};

	const makePivotedPart = (
		key: string,
		path: string,
		fallback: LayoutFallback,
		options: {
			pivotX: number;
			pivotY: number;
			meshOffsetX: number;
			meshOffsetY: number;
			initialRotation?: number;
			renderOrder?: number;
		}
	) => {
		const layout = partsByKey.get(key);
		const position = layout?.position ?? fallback.position;
		const size = layout?.size ?? fallback.size;
		const pivot = new THREE.Group();
		pivot.name = key;
		pivot.userData.devLayoutTargetId = `${collection.key}:${key}:position`;
		pivot.position.set(position.x, position.y, position.z);
		pivot.rotation.z = options.initialRotation ?? 0;
		pivot.renderOrder = options.renderOrder ?? 18;

		const texture = loadAssetTexture(path);
		const mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(size.x, size.y),
			makeBillboardMaterial(texture)
		);
		mesh.name = `${key}-sprite`;
		mesh.position.set(
			(0.5 - options.pivotX) * size.x + options.meshOffsetX,
			(0.5 - options.pivotY) * size.y + options.meshOffsetY,
			0
		);
		mesh.renderOrder = options.renderOrder ?? 18;
		pivot.add(mesh);
		rig.add(pivot);
		return pivot;
	};

	const body = makePart(
		"body",
		assets.characters.kitchenMacV2BodyFrontHeadlessNoArms,
		{
			position: { x: 0, y: 1.4, z: 0 },
			size: { x: 1.5, y: 2.84, z: 0.1 },
		},
		12
	);
	const head = makePart(
		"head",
		assets.characters.kitchenMacV2Faces.neutralOpen,
		{
			position: { x: -0.02, y: 2.52, z: 0.1 },
			size: { x: 0.64, y: 0.86, z: 0.1 },
		},
		20
	);

	const gestureArm = makePivotedPart(
		"gestureArm",
		assets.characters.kitchenMacV2Limbs.leftGestureOpen,
		{
			position: { x: -0.48, y: 2.05, z: 0.08 },
			size: { x: 1.04, y: 0.69, z: 0.1 },
		},
		{
			pivotX: 0.18,
			pivotY: 0.28,
			meshOffsetX: -0.12,
			meshOffsetY: -0.1,
			initialRotation: 0.22,
		}
	);
	const spatulaArm = makePivotedPart(
		"spatulaArm",
		assets.characters.kitchenMacV2Limbs.rightSpatulaDown,
		{
			position: { x: 0.48, y: 2.02, z: 0.09 },
			size: { x: 0.82, y: 1.02, z: 0.1 },
		},
		{
			pivotX: 0.62,
			pivotY: 0.14,
			meshOffsetX: 0.1,
			meshOffsetY: -0.18,
			initialRotation: -0.28,
			renderOrder: 19,
		}
	);

	const steam = new THREE.Group();
	steam.name = "kitchen-mac-steam-strokes";
	steam.position.set(0.88, 1.05, 0.1);
	for (let i = 0; i < 3; i++) {
		const line = new THREE.Mesh(
			new THREE.PlaneGeometry(0.04, 0.46),
			new THREE.MeshBasicMaterial({
				color: 0xfff0c8,
				transparent: true,
				opacity: 0.22,
				depthWrite: false,
			})
		);
		line.name = `steam-${i + 1}`;
		line.position.set(-0.12 + i * 0.12, i * 0.08, 0);
		line.rotation.z = (i - 1) * 0.18;
		line.renderOrder = 21;
		steam.add(line);
	}
	rig.add(steam);

	head.userData.expressionTextures = {
		neutralOpen: loadAssetTexture(
			assets.characters.kitchenMacV2Faces.neutralOpen
		),
		talkSmall: loadAssetTexture(assets.characters.kitchenMacV2Faces.talkSmall),
		talkWide: loadAssetTexture(assets.characters.kitchenMacV2Faces.talkWide),
		shocked: loadAssetTexture(assets.characters.kitchenMacV2Faces.shocked),
		suspicious: loadAssetTexture(
			assets.characters.kitchenMacV2Faces.suspicious
		),
		smug: loadAssetTexture(assets.characters.kitchenMacV2Faces.smug),
		laughing: loadAssetTexture(assets.characters.kitchenMacV2Faces.laughing),
		clownReaction: loadAssetTexture(
			assets.characters.kitchenMacV2Faces.clownReaction
		),
	};
	rig.userData.parts = { body, head, spatulaArm, gestureArm, steam };
	return rig;
}
