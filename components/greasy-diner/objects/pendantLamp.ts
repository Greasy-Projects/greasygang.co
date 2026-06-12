import * as THREE from "three";
import type { DinerPalette } from "../sceneKit";

interface PendantLampContext {
	C: DinerPalette;
	assets: {
		furniture: {
			lampWithShade: string;
		};
	};
	loadGlbProp: (options: {
		path: string;
		x: number;
		y: number;
		z: number;
		scale?: number;
		ry?: number;
		tint?: number;
	}) => THREE.Group;
	x: number;
	z: number;
	drop?: number;
	key?: string;
}

export function createPendantLamp({
	C,
	assets,
	loadGlbProp,
	x,
	z,
	drop = 2.55,
	key,
}: PendantLampContext) {
	const group = new THREE.Group();
	group.name = key ?? `pendant-lamp-${x.toFixed(1)}-${z.toFixed(1)}`;
	group.userData.label = "Pendant Lamp";
	group.position.set(x, 0, z);

	const cord = new THREE.Mesh(
		new THREE.CylinderGeometry(0.012, 0.012, drop, 8),
		new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
	);
	cord.name = "cord";
	cord.position.set(0, 8.2 - drop / 2, 0);
	group.add(cord);

	const glbShade = loadGlbProp({
		path: assets.furniture.lampWithShade,
		x: 0,
		y: 5.35,
		z: 0,
		scale: 0.34,
		ry: Math.PI,
		tint: 0x15100b,
	});
	glbShade.name = "glb-shade";
	group.add(glbShade);

	const shadeProfile = [
		new THREE.Vector2(0.18, -0.34),
		new THREE.Vector2(0.58, -0.18),
		new THREE.Vector2(0.72, 0.18),
		new THREE.Vector2(0.34, 0.38),
	];
	const shade = new THREE.Mesh(
		new THREE.LatheGeometry(shadeProfile, 32),
		new THREE.MeshStandardMaterial({
			color: 0x0d0d0d,
			side: THREE.DoubleSide,
			roughness: 0.24,
			metalness: 0.78,
		})
	);
	shade.name = "shade";
	shade.position.set(0, 5.65, 0);
	shade.castShadow = true;
	group.add(shade);

	const ring = new THREE.Mesh(
		new THREE.TorusGeometry(0.58, 0.018, 8, 36),
		new THREE.MeshStandardMaterial({
			color: C.mustard,
			roughness: 0.08,
			metalness: 0.82,
		})
	);
	ring.name = "ring";
	ring.rotation.x = Math.PI / 2;
	ring.position.set(0, 5.44, 0);
	group.add(ring);

	const disc = new THREE.Mesh(
		new THREE.CircleGeometry(0.36, 32),
		new THREE.MeshStandardMaterial({
			color: C.cream,
			emissive: C.butter,
			emissiveIntensity: 5.5,
			roughness: 1,
		})
	);
	disc.name = "light-disc";
	disc.rotation.x = Math.PI / 2;
	disc.position.set(0, 5.42, 0);
	group.add(disc);

	const light = new THREE.PointLight(0xffcc66, 2.8, 7.5, 1.6);
	light.name = "point-light";
	light.position.set(0, 5.25, 0);
	group.add(light);

	return { group, light };
}
