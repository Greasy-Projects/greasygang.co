import * as THREE from "three";
import type { DinerPalette } from "../sceneKit";

interface SeatingContext {
	scene: THREE.Scene;
	C: DinerPalette;
	assets: {
		food: {
			bottle: string;
			cheeseburger: string;
			soda: string;
		};
	};
	box: (
		w: number,
		h: number,
		d: number,
		color: number,
		rough?: number,
		metal?: number
	) => THREE.Mesh;
	roundedBox: (
		w: number,
		h: number,
		d: number,
		color: number,
		radius?: number,
		rough?: number,
		metal?: number
	) => THREE.Mesh;
	makeGreaseSlick: (
		width?: number,
		height?: number,
		baseColor?: string,
		alpha?: number
	) => THREE.CanvasTexture;
	loadGlbProp: (options: {
		path: string;
		x: number;
		y: number;
		z: number;
		scale?: number;
		ry?: number;
		tint?: number;
	}) => THREE.Group;
}

const BOOTH_PLACEMENTS = [
	{ wallX: -12.55, z: -3.15, side: -1 },
	{ wallX: 12.55, z: -3.15, side: 1 },
] as const;

const fryGeometry = new THREE.CylinderGeometry(0.018, 0.02, 0.5, 6);
const fryMaterial = new THREE.MeshStandardMaterial({
	color: 0xf0be51,
	roughness: 0.68,
});
const plateGeometry = new THREE.CylinderGeometry(0.38, 0.42, 0.045, 32);
const plateMaterial = new THREE.MeshStandardMaterial({
	color: 0xfff2c8,
	roughness: 0.42,
	metalness: 0.03,
});

export function buildDinerSeating({
	scene,
	C,
	assets,
	box,
	roundedBox,
	makeGreaseSlick,
	loadGlbProp,
}: SeatingContext) {
	const makeFriesBasket = (
		parent: THREE.Group,
		x: number,
		y: number,
		z: number,
		rot = 0
	) => {
		const group = new THREE.Group();
		group.name = "fries-basket";
		const tray = roundedBox(0.5, 0.11, 0.34, 0xb21f1f, 0.04, 0.55);
		tray.name = "tray";
		tray.position.y = 0.02;
		group.add(tray);

		for (let i = 0; i < 13; i++) {
			const fry = new THREE.Mesh(fryGeometry, fryMaterial);
			fry.name = `fry-${i + 1}`;
			fry.scale.y = 0.84 + Math.random() * 0.32;
			fry.rotation.z = (Math.random() - 0.5) * 0.7;
			fry.rotation.x = (Math.random() - 0.5) * 0.35;
			fry.position.set(
				(Math.random() - 0.5) * 0.34,
				0.22,
				(Math.random() - 0.5) * 0.18
			);
			group.add(fry);
		}

		group.rotation.y = rot;
		group.position.set(x, y, z);
		parent.add(group);
		return group;
	};

	const makePlate = (parent: THREE.Group, x: number, y: number, z: number) => {
		const plate = new THREE.Mesh(plateGeometry, plateMaterial);
		plate.name = "plate";
		plate.position.set(x, y, z);
		parent.add(plate);
		return plate;
	};

	const makeDinerTable = (x: number, z: number, side: number) => {
		const group = new THREE.Group();
		group.name = `diner-table-${side < 0 ? "left" : "right"}`;
		group.userData.label = "Diner Table";
		group.position.set(x, 0, z);

		const tabletop = roundedBox(1.55, 0.13, 0.98, 0xede4c4, 0.09, 0.28, 0.04);
		tabletop.name = "tabletop";
		tabletop.position.set(0, 1.0, 0);
		group.add(tabletop);

		const rim = new THREE.Mesh(
			new THREE.TorusGeometry(0.66, 0.024, 8, 44),
			new THREE.MeshStandardMaterial({
				color: C.mustard,
				roughness: 0.18,
				metalness: 0.45,
			})
		);
		rim.name = "rim";
		rim.scale.z = 0.64;
		rim.rotation.x = Math.PI / 2;
		rim.position.set(0, 1.07, 0);
		group.add(rim);

		const stem = new THREE.Mesh(
			new THREE.LatheGeometry(
				[
					new THREE.Vector2(0.08, -0.48),
					new THREE.Vector2(0.05, -0.18),
					new THREE.Vector2(0.075, 0.22),
					new THREE.Vector2(0.05, 0.48),
				],
				24
			),
			new THREE.MeshStandardMaterial({
				color: C.chrome,
				roughness: 0.08,
				metalness: 0.94,
			})
		);
		stem.name = "stem";
		stem.position.set(0, 0.5, 0);
		group.add(stem);

		const foot = new THREE.Mesh(
			new THREE.CylinderGeometry(0.36, 0.5, 0.08, 32),
			new THREE.MeshStandardMaterial({
				color: C.chrome,
				roughness: 0.1,
				metalness: 0.9,
			})
		);
		foot.name = "foot";
		foot.position.set(0, 0.045, 0);
		group.add(foot);

		const tableSlick = new THREE.Mesh(
			new THREE.PlaneGeometry(0.72, 0.36),
			new THREE.MeshStandardMaterial({
				map: makeGreaseSlick(256, 128, "#7a2f05", 0.42),
				transparent: true,
				roughness: 0.05,
				depthWrite: false,
			})
		);
		tableSlick.name = "grease-slick";
		tableSlick.rotation.x = -Math.PI / 2;
		tableSlick.position.set(side * 0.08, 1.071, -0.08);
		group.add(tableSlick);

		makePlate(group, -side * 0.22, 1.115, 0.04);
		const burger = loadGlbProp({
			path: assets.food.cheeseburger,
			x: -side * 0.22,
			y: 1.15,
			z: 0.04,
			scale: 0.42,
			ry: side * 0.24,
		});
		burger.name = "burger";
		group.add(burger);
		makeFriesBasket(group, side * 0.18, 1.12, -0.08, side * 0.28);
		const soda = loadGlbProp({
			path: assets.food.soda,
			x: side * 0.08,
			y: 1.08,
			z: -0.28,
			scale: 0.24,
			ry: side * 0.1,
		});
		soda.name = "soda";
		group.add(soda);
		const bottleA = loadGlbProp({
			path: assets.food.bottle,
			x: side * 0.42,
			y: 1.08,
			z: 0.24,
			scale: 0.23,
			ry: side * -0.2,
		});
		bottleA.name = "sauce-bottle-a";
		group.add(bottleA);
		const bottleB = loadGlbProp({
			path: assets.food.bottle,
			x: side * 0.26,
			y: 1.08,
			z: 0.28,
			scale: 0.2,
			ry: side * 0.18,
		});
		bottleB.name = "sauce-bottle-b";
		group.add(bottleB);

		scene.add(group);
		return group;
	};

	const makeBooth = (wallX: number, z: number, side: number) => {
		const group = new THREE.Group();
		group.name = `diner-booth-${side < 0 ? "left" : "right"}`;
		group.userData.label = "Diner Booth";
		group.position.set(wallX, 0, z);

		const back = roundedBox(0.34, 1.72, 3.35, C.redDark, 0.13, 0.58);
		back.name = "back";
		back.position.set(0, 1.55, 0);
		group.add(back);

		const seat = roundedBox(1.22, 0.34, 3.18, C.red, 0.12, 0.54);
		seat.name = "seat";
		seat.position.set(-side * 0.48, 0.78, 0);
		group.add(seat);

		const toeKick = roundedBox(1.12, 0.22, 3.05, 0x130806, 0.06, 0.5, 0.1);
		toeKick.name = "toe-kick";
		toeKick.position.set(-side * 0.48, 0.33, 0);
		group.add(toeKick);

		for (let seam = -1.05; seam <= 1.05; seam += 0.7) {
			const groove = box(0.045, 1.46, 0.035, 0x5b0909, 0.72);
			groove.name = `back-groove-${seam.toFixed(2)}`;
			groove.position.set(-side * 0.18, 1.57, seam);
			group.add(groove);
			const seatSeam = box(0.92, 0.025, 0.035, 0x8c1818, 0.72);
			seatSeam.name = `seat-seam-${seam.toFixed(2)}`;
			seatSeam.position.set(-side * 0.48, 0.97, seam);
			group.add(seatSeam);
		}

		const topTrim = box(0.12, 0.09, 3.45, C.mustard, 0.18, 0.42);
		topTrim.name = "top-trim";
		topTrim.position.set(-side * 0.19, 2.44, 0);
		group.add(topTrim);

		const sideCapA = roundedBox(1.16, 1.34, 0.13, C.redDark, 0.09, 0.58);
		sideCapA.name = "side-cap-a";
		sideCapA.position.set(-side * 0.48, 1.22, -1.66);
		group.add(sideCapA);
		const sideCapB = roundedBox(1.16, 1.34, 0.13, C.redDark, 0.09, 0.58);
		sideCapB.name = "side-cap-b";
		sideCapB.position.set(-side * 0.48, 1.22, 1.66);
		group.add(sideCapB);

		scene.add(group);
		makeDinerTable(wallX - side * 1.72, z + 0.08, side);
		return group;
	};

	BOOTH_PLACEMENTS.forEach(({ wallX, z, side }) => makeBooth(wallX, z, side));
}
