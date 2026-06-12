import * as THREE from "three";
import type { DinerPalette } from "../sceneKit";
import { createKitchenMacCookRig } from "./kitchenMac";

type RoomDoorKey = "loreExit" | "fishExit" | "liveExit" | "kitchenExit";

interface RoomBuilderContext {
	scene: THREE.Scene;
	C: DinerPalette;
	assets: {
		decor: {
			wetFloor: string;
			window02: string;
		};
		food: {
			bottle: string;
		};
		furniture: {
			armChair: string;
		};
		characters: {
			kitchenMacBody: string;
			kitchenMacHead: string;
			kitchenMacArmSpatula: string;
			kitchenMacArmGesture: string;
			kitchenMacPreview: string;
			kitchenMacV2BodyFront: string;
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
		kitchen: {
			cuttingBoard: string;
		};
		lore: {
			micmac: string;
			whatsThisFish: string;
		};
	};
	roundedBox: (
		w: number,
		h: number,
		d: number,
		color: number,
		radius?: number,
		rough?: number,
		metal?: number
	) => THREE.Mesh;
	textureMaterial: (
		texture: THREE.Texture,
		options?: Partial<THREE.MeshStandardMaterialParameters>
	) => THREE.MeshStandardMaterial;
	loadAssetTexture: (path: string) => THREE.Texture;
	makeGreaseSlick: (
		width?: number,
		height?: number,
		baseColor?: string,
		alpha?: number
	) => THREE.CanvasTexture;
	makeRoomShell: (options: {
		cx: number;
		cz: number;
		w: number;
		d: number;
		accent: number;
		title: string;
		variant?: "diner" | "freezer";
	}) => void;
	makePlacedRoomDoor: (key: RoomDoorKey) => unknown;
	loadGlbProp: (options: {
		path: string;
		x: number;
		y: number;
		z: number;
		scale?: number;
		ry?: number;
		rx?: number;
		rz?: number;
		tint?: number;
	}) => THREE.Group;
	makeRoomSign: (
		text: string,
		accent: number,
		x: number,
		y: number,
		z: number,
		ry: number,
		w?: number,
		h?: number
	) => void;
	makeRoomScreen: (options: {
		title: string;
		lines: string[];
		x: number;
		y: number;
		z: number;
		ry: number;
		w: number;
		h: number;
		accent: number;
	}) => void;
	makeLayeredRelief: (options: {
		path: string;
		x: number;
		y: number;
		z: number;
		w: number;
		h: number;
		ry: number;
		accent: number;
		label: string;
		layers?: number;
	}) => unknown;
	makeClipping: (
		x: number,
		y: number,
		z: number,
		ry: number,
		headline: string,
		body: string[]
	) => void;
}

export function createSideRoomBuilders(ctx: RoomBuilderContext) {
	const {
		scene,
		C,
		assets,
		roundedBox,
		textureMaterial,
		loadAssetTexture,
		makeGreaseSlick,
		makeRoomShell,
		makePlacedRoomDoor,
		loadGlbProp,
		makeRoomSign,
		makeRoomScreen,
		makeLayeredRelief,
		makeClipping,
	} = ctx;

	const buildLoreRoom = () => {
		makeRoomShell({
			cx: -21.8,
			cz: 2.0,
			w: 10.4,
			d: 9.6,
			accent: C.red,
			title: "LORE HALL",
		});
		makePlacedRoomDoor("loreExit");
		makeRoomSign("EVENT ARCHIVE", C.red, -21.8, 3.15, 6.72, Math.PI, 3.2, 0.66);
		makeLayeredRelief({
			path: assets.lore.micmac,
			x: -26.62,
			y: 2.0,
			z: 2.0,
			w: 1.35,
			h: 3.0,
			ry: Math.PI / 2,
			accent: C.red,
			label: "MIC MAC",
			layers: 2,
		});
		makeClipping(-22.0, 2.7, 6.72, Math.PI, "GREASYSMP EVENT ARCHIVE", [
			"Server seasons, bad alliances,",
			"and chat archaeology catalogued",
			"behind the diner wall.",
		]);
		makeClipping(-19.8, 2.7, 6.72, Math.PI, "STREAMER CAMP INCIDENTS", [
			"Filed under outdoor chaos,",
			"unrecoverable clips, and",
			"things best left laminated.",
		]);
		makeClipping(-24.2, 2.7, 6.72, Math.PI, "SUBATHON RECORDS", [
			"Big Brother, TwitchPlays,",
			"24 hour sessions, and",
			"all remaining grease minutes.",
		]);
	};

	const buildFishRoom = () => {
		makeRoomShell({
			cx: 21.8,
			cz: 6.65,
			w: 10.4,
			d: 7.0,
			accent: C.teal,
			title: "FISH FREEZER",
			variant: "freezer",
		});
		makePlacedRoomDoor("fishExit");
		makeRoomSign(
			"THE FISH",
			C.teal,
			26.72,
			3.15,
			6.65,
			-Math.PI / 2,
			2.6,
			0.66
		);
		makeLayeredRelief({
			path: assets.lore.whatsThisFish,
			x: 26.62,
			y: 2.05,
			z: 6.65,
			w: 2.8,
			h: 1.75,
			ry: -Math.PI / 2,
			accent: C.teal,
			label: "WHAT'S THIS? FISH",
			layers: 2,
		});
		const fishPlinth = roundedBox(2.35, 0.85, 1.2, 0x07110f, 0.08, 0.42, 0.16);
		fishPlinth.position.set(25.25, 0.45, 6.65);
		scene.add(fishPlinth);
		const fishCase = new THREE.Mesh(
			new THREE.BoxGeometry(2.7, 1.15, 1.55),
			new THREE.MeshStandardMaterial({
				color: 0x89d8c8,
				transparent: true,
				opacity: 0.22,
				roughness: 0.18,
				metalness: 0.05,
			})
		);
		fishCase.position.set(25.25, 1.55, 6.65);
		scene.add(fishCase);
		const freezerLight = new THREE.PointLight(0x89d8c8, 1.2, 5, 1.8);
		freezerLight.position.set(24.4, 2.8, 6.65);
		scene.add(freezerLight);
		for (const shelfZ of [4.05, 8.35]) {
			const shelf = roundedBox(3.2, 0.16, 0.32, 0x1f3d35, 0.035, 0.36, 0.28);
			shelf.position.set(20.3, 1.55, shelfZ);
			scene.add(shelf);
			for (let i = 0; i < 4; i++) {
				const jar = new THREE.Mesh(
					new THREE.CylinderGeometry(0.12, 0.12, 0.48, 16),
					new THREE.MeshStandardMaterial({
						color: i % 2 ? 0xe8a946 : 0xfa4040,
						roughness: 0.34,
						metalness: 0.06,
					})
				);
				jar.position.set(19.25 + i * 0.42, 1.88, shelfZ);
				scene.add(jar);
			}
		}
		const coldSlick = new THREE.Mesh(
			new THREE.PlaneGeometry(4.4, 2.2),
			new THREE.MeshStandardMaterial({
				map: makeGreaseSlick(512, 192, "#0c6f6a", 0.28),
				transparent: true,
				roughness: 0.05,
				metalness: 0.42,
				depthWrite: false,
			})
		);
		coldSlick.rotation.x = -Math.PI / 2;
		coldSlick.position.set(23.6, 0.012, 6.65);
		scene.add(coldSlick);
	};

	const buildLiveRoom = () => {
		makeRoomShell({
			cx: 21.8,
			cz: -5.4,
			w: 10.4,
			d: 6.6,
			accent: C.neonBlue,
			title: "LIVE ROOM",
		});
		makePlacedRoomDoor("liveExit");
		makeRoomSign(
			"LIVE WALL",
			C.neonBlue,
			26.72,
			3.15,
			-5.4,
			-Math.PI / 2,
			2.8,
			0.66
		);
		makeRoomScreen({
			title: "TWITCH LIVE",
			lines: ["STATUS: STANDBY", "CHAT FEED: READY", "SIGNAL: GREASY"],
			x: 26.62,
			y: 2.55,
			z: -7.05,
			ry: -Math.PI / 2,
			w: 2.5,
			h: 1.45,
			accent: 0x7b3cff,
		});
		makeRoomScreen({
			title: "WATCHTIME",
			lines: ["TOP GREASE HOURS", "LEADERBOARD FEED", "SYNC IN PROGRESS"],
			x: 26.62,
			y: 2.55,
			z: -5.4,
			ry: -Math.PI / 2,
			w: 2.5,
			h: 1.45,
			accent: C.neonBlue,
		});
		makeRoomScreen({
			title: "ON AIR",
			lines: ["MAC CAM", "CLIPS", "LOUD BITS"],
			x: 26.62,
			y: 2.55,
			z: -3.75,
			ry: -Math.PI / 2,
			w: 2.5,
			h: 1.45,
			accent: C.red,
		});
		const liveDesk = roundedBox(3.8, 0.7, 1.4, 0x080403, 0.06, 0.48, 0.14);
		liveDesk.position.set(22.0, 0.55, -5.4);
		scene.add(liveDesk);
		const mixer = roundedBox(1.7, 0.16, 0.82, 0x10151b, 0.04, 0.36, 0.12);
		mixer.position.set(22.0, 1.02, -5.4);
		scene.add(mixer);
		for (let i = 0; i < 8; i++) {
			const knob = new THREE.Mesh(
				new THREE.CylinderGeometry(0.055, 0.055, 0.05, 14),
				new THREE.MeshStandardMaterial({
					color: i % 2 ? C.neonBlue : C.red,
					emissive: i % 2 ? C.neonBlue : C.red,
					emissiveIntensity: 0.7,
					roughness: 0.32,
				})
			);
			knob.position.set(
				21.35 + (i % 4) * 0.42,
				1.14,
				-5.62 + Math.floor(i / 4) * 0.36
			);
			scene.add(knob);
		}
		const onAirLight = new THREE.PointLight(C.red, 1.4, 5, 1.7);
		onAirLight.position.set(24.7, 2.5, -4.0);
		scene.add(onAirLight);
	};

	const buildKitchenRoom = () => {
		makeRoomShell({
			cx: 0,
			cz: -18.8,
			w: 12,
			d: 8,
			accent: C.mustard,
			title: "KITCHEN",
		});
		makePlacedRoomDoor("kitchenExit");
		makeRoomSign("PREP LINE", C.mustard, 0, 3.15, -22.72, 0, 2.8, 0.66);

		scene.add(createKitchenMacCookRig({ assets, loadAssetTexture }));

		const prepCounter = roundedBox(5.8, 0.82, 1.35, 0x120806, 0.06, 0.46, 0.12);
		prepCounter.name = "kitchen-prep-counter";
		prepCounter.position.set(-1.25, 0.52, -22.0);
		scene.add(prepCounter);

		const prepTop = roundedBox(5.95, 0.12, 1.48, 0x22262a, 0.05, 0.2, 0.55);
		prepTop.name = "kitchen-stainless-top";
		prepTop.position.set(-1.25, 0.98, -22.0);
		scene.add(prepTop);

		loadGlbProp({
			path: assets.kitchen.cuttingBoard,
			x: -2.6,
			y: 1.04,
			z: -21.95,
			scale: 0.55,
			ry: Math.PI * 0.08,
		}).name = "kitchen-cutting-board";

		const sink = roundedBox(1.12, 0.18, 0.72, 0x081012, 0.04, 0.14, 0.72);
		sink.name = "kitchen-sink";
		sink.position.set(0.25, 1.07, -22.0);
		scene.add(sink);

		const faucet = new THREE.Mesh(
			new THREE.TorusGeometry(0.18, 0.025, 10, 22, Math.PI),
			new THREE.MeshStandardMaterial({
				color: C.chrome,
				roughness: 0.12,
				metalness: 0.95,
			})
		);
		faucet.name = "kitchen-faucet";
		faucet.rotation.z = Math.PI / 2;
		faucet.position.set(0.35, 1.32, -22.05);
		scene.add(faucet);

		const stove = roundedBox(1.8, 0.62, 1.25, 0x090909, 0.05, 0.2, 0.62);
		stove.name = "kitchen-stove";
		stove.position.set(3.65, 0.44, -22.05);
		scene.add(stove);

		for (let i = 0; i < 4; i++) {
			const burner = new THREE.Mesh(
				new THREE.TorusGeometry(0.2, 0.018, 8, 22),
				new THREE.MeshStandardMaterial({
					color: 0x111111,
					emissive: i === 1 ? C.red : 0x000000,
					emissiveIntensity: i === 1 ? 0.75 : 0,
					roughness: 0.22,
					metalness: 0.4,
				})
			);
			burner.name = `kitchen-burner-${i + 1}`;
			burner.rotation.x = Math.PI / 2;
			burner.position.set(
				3.25 + (i % 2) * 0.78,
				0.78,
				-22.35 + Math.floor(i / 2) * 0.52
			);
			scene.add(burner);
		}

		for (const x of [-4.8, 4.8]) {
			const shelf = roundedBox(1.8, 0.12, 0.42, 0x2a160a, 0.035, 0.5, 0.08);
			shelf.name = `kitchen-wall-shelf-${x}`;
			shelf.position.set(x, 2.15, -22.58);
			scene.add(shelf);
			for (let i = 0; i < 3; i++) {
				loadGlbProp({
					path: assets.food.bottle,
					x: x - 0.45 + i * 0.45,
					y: 2.25,
					z: -22.58,
					scale: 0.18,
					ry: Math.PI,
					tint: i === 0 ? C.red : i === 1 ? C.mustard : C.pickle,
				}).name = `kitchen-shelf-bottle-${x}-${i}`;
			}
		}

		loadGlbProp({
			path: assets.decor.window02,
			x: 5.88,
			y: 2.35,
			z: -18.8,
			scale: 0.36,
			ry: -Math.PI / 2,
			tint: 0x88ddff,
		}).name = "kitchen-side-window";

		loadGlbProp({
			path: assets.decor.wetFloor,
			x: -4.65,
			y: 0.02,
			z: -16.55,
			scale: 0.65,
			ry: -Math.PI * 0.18,
		}).name = "kitchen-wet-floor-sign";

		loadGlbProp({
			path: assets.furniture.armChair,
			x: 4.65,
			y: 0,
			z: -16.4,
			scale: 1.05,
			ry: -Math.PI * 0.72,
		}).name = "kitchen-break-chair";

		const greaseTrail = new THREE.Mesh(
			new THREE.PlaneGeometry(4.8, 1.8),
			new THREE.MeshStandardMaterial({
				map: makeGreaseSlick(512, 192, "#7a2f05", 0.32),
				transparent: true,
				roughness: 0.05,
				metalness: 0.36,
				depthWrite: false,
			})
		);
		greaseTrail.name = "kitchen-grease-trail";
		greaseTrail.rotation.x = -Math.PI / 2;
		greaseTrail.position.set(-1.15, 0.014, -18.35);
		scene.add(greaseTrail);
	};

	return { buildLoreRoom, buildFishRoom, buildLiveRoom, buildKitchenRoom };
}
