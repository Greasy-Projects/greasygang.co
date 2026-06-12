import * as THREE from "three";
import type { DinerPalette } from "../sceneKit";

interface CounterContext {
	C: DinerPalette;
	box: (
		w: number,
		h: number,
		d: number,
		color: number,
		rough?: number,
		metal?: number,
		ei?: number,
		ec?: number
	) => THREE.Mesh;
	canvasTexture: (source: HTMLCanvasElement) => THREE.CanvasTexture;
	makeGreaseSlick: (
		width?: number,
		height?: number,
		baseColor?: string,
		alpha?: number
	) => THREE.CanvasTexture;
}

export function createCounterArea({
	C,
	box,
	canvasTexture,
	makeGreaseSlick,
}: CounterContext) {
	const group = new THREE.Group();
	group.name = "counter-area";
	group.userData.label = "Counter Area";
	group.position.set(0, 0, -8.8);

	const counter = box(12, 1.12, 1.4, 0x150908, 0.65);
	counter.name = "counter-front";
	counter.position.set(0, 0.56, 0);
	group.add(counter);

	const marbC = document.createElement("canvas");
	marbC.width = 512;
	marbC.height = 128;
	const mc = marbC.getContext("2d")!;
	mc.fillStyle = "#0d0705";
	mc.fillRect(0, 0, 512, 128);
	mc.strokeStyle = "rgba(70,42,18,0.55)";
	mc.lineWidth = 1.5;
	for (let v = 0; v < 8; v++) {
		mc.beginPath();
		mc.moveTo(Math.random() * 512, 0);
		mc.bezierCurveTo(
			Math.random() * 512,
			40,
			Math.random() * 512,
			88,
			Math.random() * 512,
			128
		);
		mc.stroke();
	}

	const top = new THREE.Mesh(
		new THREE.BoxGeometry(12.18, 0.1, 1.52),
		new THREE.MeshStandardMaterial({
			map: canvasTexture(marbC),
			roughness: 0.07,
			metalness: 0.45,
		})
	);
	top.name = "countertop";
	top.position.set(0, 1.17, 0);
	top.castShadow = true;
	group.add(top);

	const nosing = box(12.16, 0.07, 0.05, C.mustard, 0.22, 0.45);
	nosing.name = "front-nosing";
	nosing.position.set(0, 1.12, 0.75);
	group.add(nosing);

	const griddle = box(4.25, 0.055, 0.95, 0x20120b, 0.18, 0.65, 0.05, 0xffaa44);
	griddle.name = "griddle";
	griddle.position.set(0.1, 1.24, 0.22);
	group.add(griddle);

	const griddleSlick = new THREE.Mesh(
		new THREE.PlaneGeometry(3.4, 0.74),
		new THREE.MeshStandardMaterial({
			map: makeGreaseSlick(512, 160, "#7a2f05", 0.7),
			transparent: true,
			roughness: 0.05,
			metalness: 0.35,
			depthWrite: false,
		})
	);
	griddleSlick.name = "griddle-grease-slick";
	griddleSlick.rotation.x = -Math.PI / 2;
	griddleSlick.position.set(0.25, 1.275, 0.28);
	group.add(griddleSlick);

	const heatLight = new THREE.PointLight(0xff6622, 0.65, 3.2, 2.2);
	heatLight.name = "griddle-heat-light";
	heatLight.position.set(0.1, 1.75, 0.3);
	group.add(heatLight);

	const register = box(0.6, 0.55, 0.4, 0x0a0705, 0.4, 0.3);
	register.name = "register";
	register.position.set(-4.5, 1.44, -0.05);
	group.add(register);

	const registerScreen = box(0.44, 0.3, 0.02, 0x001122, 0.2, 0.1, 1.5, 0x002244);
	registerScreen.name = "register-screen";
	registerScreen.position.set(-4.5, 1.6, 0.15);
	group.add(registerScreen);

	const registerGlow = new THREE.PointLight(0x0044aa, 0.3, 1.5, 2);
	registerGlow.name = "register-glow";
	registerGlow.position.set(-4.5, 1.65, 0.3);
	group.add(registerGlow);

	const napkin = box(0.08, 0.28, 0.22, C.chrome, 0.1, 0.9);
	napkin.name = "napkin-holder";
	napkin.position.set(2.5, 1.35, 0);
	group.add(napkin);

	[
		{ x: -2.25, color: C.red, name: "ketchup-bottle" },
		{ x: -1.95, color: C.mustard, name: "mustard-bottle" },
		{ x: 2.1, color: C.pickle, name: "pickle-bottle" },
		{ x: 2.35, color: C.cream, name: "cream-bottle" },
	].forEach(({ x, color, name }) => {
		const bottle = new THREE.Mesh(
			new THREE.CylinderGeometry(0.08, 0.1, 0.42, 12),
			new THREE.MeshStandardMaterial({
				color,
				roughness: 0.36,
				metalness: 0.04,
			})
		);
		bottle.name = name;
		bottle.position.set(x, 1.46, 0.42);
		bottle.castShadow = true;
		group.add(bottle);
	});

	return group;
}
