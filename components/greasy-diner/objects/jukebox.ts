import * as THREE from "three";
import type { DinerPalette } from "../sceneKit";

interface JukeboxContext {
	scene: THREE.Scene;
	C: DinerPalette;
	roundedBox: (
		w: number,
		h: number,
		d: number,
		color: number,
		radius?: number,
		rough?: number,
		metal?: number
	) => THREE.Mesh;
	canvasTexture: (source: HTMLCanvasElement) => THREE.CanvasTexture;
}

export function buildJukebox({
	scene,
	C,
	roundedBox,
	canvasTexture,
}: JukeboxContext) {
	const x = -11.5;
	const z = -9.8;
	const group = new THREE.Group();
	group.name = "jukebox";
	group.userData.label = "Jukebox";
	group.position.set(x, 0, z);

	const body = roundedBox(1.15, 1.9, 0.7, 0x7a0000, 0.11, 0.32, 0.18);
	body.name = "body";
	body.position.set(0, 0.95, 0);
	group.add(body);

	const base = roundedBox(1.28, 0.16, 0.82, 0x160705, 0.06, 0.42, 0.2);
	base.name = "base";
	base.position.set(0, 0.1, 0);
	group.add(base);

	const trim = roundedBox(1.24, 0.08, 0.78, C.mustard, 0.04, 0.22, 0.36);
	trim.name = "top-trim";
	trim.position.set(0, 1.78, 0);
	group.add(trim);

	const dome = new THREE.Mesh(
		new THREE.CylinderGeometry(0.58, 0.58, 0.56, 18, 1, false, 0, Math.PI),
		new THREE.MeshStandardMaterial({
			color: 0xaa2222,
			roughness: 0.28,
			metalness: 0.22,
		})
	);
	dome.name = "dome";
	dome.position.set(0, 1.9, 0);
	dome.rotation.z = Math.PI / 2;
	group.add(dome);

	const screenCanvas = document.createElement("canvas");
	screenCanvas.width = 256;
	screenCanvas.height = 256;
	const screenCtx = screenCanvas.getContext("2d")!;
	const gradient = screenCtx.createRadialGradient(128, 128, 8, 128, 128, 128);
	gradient.addColorStop(0, "#ffcc44");
	gradient.addColorStop(0.45, "#ff6600");
	gradient.addColorStop(1, "#330000");
	screenCtx.fillStyle = gradient;
	screenCtx.fillRect(0, 0, 256, 256);
	screenCtx.fillStyle = "rgba(255,220,100,0.9)";
	screenCtx.font = "bold 44px sans-serif";
	screenCtx.textAlign = "center";
	screenCtx.fillText("♫", 128, 80);
	screenCtx.font = "bold 28px Arial";
	screenCtx.fillText("JUKEBOX", 128, 138);
	screenCtx.fillText("LIVE", 128, 184);

	const screenTexture = canvasTexture(screenCanvas);
	const screen = new THREE.Mesh(
		new THREE.PlaneGeometry(0.72, 0.72),
		new THREE.MeshStandardMaterial({
			map: screenTexture,
			emissive: 0xff6600,
			emissiveMap: screenTexture,
			emissiveIntensity: 1.9,
			roughness: 1,
		})
	);
	screen.name = "screen";
	screen.position.set(0.62, 1.18, 0);
	screen.rotation.y = Math.PI / 2;
	group.add(screen);

	const glow = new THREE.PointLight(0xff6600, 1.4, 3.8, 2);
	glow.name = "glow";
	glow.position.set(0.9, 1.2, 0);
	group.add(glow);
	scene.add(group);

	return { glow, group };
}
