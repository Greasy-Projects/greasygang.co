import * as THREE from "three";
import type { DinerPalette } from "../sceneKit";

interface BarStoolOptions {
	C: DinerPalette;
	x: number;
	z: number;
	key?: string;
}

const seatGeometry = new THREE.CylinderGeometry(0.3, 0.28, 0.1, 16);
const stemGeometry = new THREE.CylinderGeometry(0.022, 0.022, 0.9, 8);
const baseGeometry = new THREE.CylinderGeometry(0.26, 0.3, 0.05, 16);
const footRestGeometry = new THREE.TorusGeometry(0.18, 0.017, 8, 20);
let cachedRed: THREE.MeshStandardMaterial | null = null;
let cachedChrome: THREE.MeshStandardMaterial | null = null;

export function createBarStool({ C, x, z, key }: BarStoolOptions) {
	const group = new THREE.Group();
	group.name = key ?? `bar-stool-${x.toFixed(1)}-${z.toFixed(1)}`;
	group.userData.label = "Bar Stool";
	group.position.set(x, 0, z);
	cachedRed ??= new THREE.MeshStandardMaterial({
		color: C.red,
		roughness: 0.45,
	});
	cachedChrome ??= new THREE.MeshStandardMaterial({
		color: C.chrome,
		roughness: 0.08,
		metalness: 0.96,
	});

	const seat = new THREE.Mesh(seatGeometry, cachedRed);
	seat.name = "seat";
	seat.position.y = 0.9;
	seat.castShadow = true;
	group.add(seat);

	const stem = new THREE.Mesh(stemGeometry, cachedChrome);
	stem.name = "stem";
	stem.position.y = 0.45;
	group.add(stem);

	const base = new THREE.Mesh(baseGeometry, cachedChrome);
	base.name = "base";
	base.position.y = 0.025;
	group.add(base);

	const footRest = new THREE.Mesh(footRestGeometry, cachedChrome);
	footRest.name = "foot-rest";
	footRest.rotation.x = Math.PI / 2;
	footRest.position.y = 0.3;
	group.add(footRest);

	return group;
}
