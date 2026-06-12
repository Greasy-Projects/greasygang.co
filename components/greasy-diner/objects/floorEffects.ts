import * as THREE from "three";

interface FloorEffectContext {
	scene: THREE.Scene;
	canvasTexture: (source: HTMLCanvasElement) => THREE.CanvasTexture;
}

export function createZoneGlow(
	{ scene, canvasTexture }: FloorEffectContext,
	x: number,
	z: number,
	color: number
) {
	const glowCanvas = document.createElement("canvas");
	glowCanvas.width = 256;
	glowCanvas.height = 256;
	const ctx = glowCanvas.getContext("2d")!;
	const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
	const hex = "#" + color.toString(16).padStart(6, "0");
	gradient.addColorStop(0, hex + "55");
	gradient.addColorStop(0.5, hex + "22");
	gradient.addColorStop(1, "transparent");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 256, 256);

	const mesh = new THREE.Mesh(
		new THREE.PlaneGeometry(5, 5),
		new THREE.MeshStandardMaterial({
			map: canvasTexture(glowCanvas),
			transparent: true,
			roughness: 0.1,
			metalness: 0.2,
			depthWrite: false,
		})
	);
	mesh.rotation.x = -Math.PI / 2;
	mesh.position.set(x, 0.01, z);
	scene.add(mesh);
	return mesh;
}

export function createGreasePuddle(
	{ scene, canvasTexture }: FloorEffectContext,
	x: number,
	z: number
) {
	const puddleCanvas = document.createElement("canvas");
	puddleCanvas.width = 256;
	puddleCanvas.height = 128;
	const ctx = puddleCanvas.getContext("2d")!;
	const gradient = ctx.createRadialGradient(128, 64, 4, 128, 64, 92);
	gradient.addColorStop(0, "rgba(200,145,50,0.55)");
	gradient.addColorStop(0.5, "rgba(130,90,22,0.22)");
	gradient.addColorStop(1, "rgba(0,0,0,0)");
	ctx.fillStyle = gradient;
	ctx.ellipse(128, 64, 112, 56, 0.3, 0, Math.PI * 2);
	ctx.fill();

	const mesh = new THREE.Mesh(
		new THREE.PlaneGeometry(2.8, 1.4),
		new THREE.MeshStandardMaterial({
			map: canvasTexture(puddleCanvas),
			transparent: true,
			roughness: 0.08,
			metalness: 0.55,
			depthWrite: false,
		})
	);
	mesh.rotation.x = -Math.PI / 2;
	mesh.position.set(x, 0.005, z);
	scene.add(mesh);
	return mesh;
}
