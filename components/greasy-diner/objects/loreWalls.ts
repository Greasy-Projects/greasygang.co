import * as THREE from "three";
import type { DinerPalette } from "../sceneKit";

type ClippingBuilder = (
	x: number,
	y: number,
	z: number,
	ry: number,
	headline: string,
	body: string[]
) => void;

interface ClippingContext {
	scene: THREE.Scene;
	box: (
		w: number,
		h: number,
		d: number,
		color: number,
		rough?: number,
		metal?: number
	) => THREE.Mesh;
	canvasTexture: (source: HTMLCanvasElement) => THREE.CanvasTexture;
	textureMaterial: (
		texture: THREE.Texture,
		options?: Partial<THREE.MeshStandardMaterialParameters>
	) => THREE.MeshStandardMaterial;
}

interface LoreWallContext extends ClippingContext {
	C: DinerPalette;
	assets: {
		lore: {
			ggFatArt: string;
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
	setCanvasNoise: (
		ctx: CanvasRenderingContext2D,
		width: number,
		height: number,
		alpha?: number
	) => void;
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
	}) => THREE.Object3D;
}

export function createClippingBuilder({
	scene,
	box,
	canvasTexture,
	textureMaterial,
}: ClippingContext): ClippingBuilder {
	return (x, y, z, ry, headline, body) => {
		const pC = document.createElement("canvas");
		pC.width = 480;
		pC.height = 560;
		const ctx = pC.getContext("2d")!;
		ctx.fillStyle = "#f5edcc";
		ctx.fillRect(0, 0, 480, 560);
		ctx.fillStyle = "rgba(180,140,60,0.12)";
		ctx.fillRect(0, 0, 480, 560);
		ctx.strokeStyle = "#1a0d06";
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(18, 18);
		ctx.lineTo(462, 18);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(18, 22);
		ctx.lineTo(462, 22);
		ctx.stroke();
		ctx.fillStyle = "#1a0d06";
		ctx.font = "bold 18px serif";
		ctx.textAlign = "center";
		ctx.fillText("THE GREASY GAZETTE  •  GREASYGANG EDITION", 240, 42);
		ctx.beginPath();
		ctx.moveTo(18, 50);
		ctx.lineTo(462, 50);
		ctx.stroke();
		ctx.font = "bold 38px serif";
		const words = headline.split(" ");
		let line = "";
		let lineY = 92;
		for (const word of words) {
			const test = line + word + " ";
			if (ctx.measureText(test).width > 420 && line) {
				ctx.fillText(line.trim(), 240, lineY);
				line = word + " ";
				lineY += 44;
			} else {
				line = test;
			}
		}
		ctx.fillText(line.trim(), 240, lineY);
		lineY += 16;
		ctx.beginPath();
		ctx.moveTo(18, lineY + 8);
		ctx.lineTo(462, lineY + 8);
		ctx.stroke();
		lineY += 24;
		ctx.font = "15px serif";
		ctx.textAlign = "left";
		body.forEach(bodyLine => {
			ctx.fillText(bodyLine, 22, lineY);
			lineY += 22;
		});
		ctx.strokeStyle = "rgba(100,70,20,0.18)";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(0, 280);
		ctx.lineTo(480, 280);
		ctx.stroke();

		const frame = box(1.6, 1.95, 0.04, 0x1a0d06, 0.8);
		frame.position.set(x, y, z);
		frame.rotation.y = ry;
		scene.add(frame);

		const paper = new THREE.Mesh(
			new THREE.PlaneGeometry(1.5, 1.85),
			textureMaterial(canvasTexture(pC), { roughness: 0.85 })
		);
		paper.position.set(x + Math.sin(ry) * 0.022, y, z + Math.cos(ry) * 0.022);
		paper.rotation.y = ry;
		scene.add(paper);
	};
}

export function buildMainLoreClippings(makeClipping: ClippingBuilder) {
	makeClipping(
		-13.82,
		3.5,
		-3.5,
		Math.PI / 2,
		"40 DAY STREAM STREAK SHOCKS VIEWERS",
		[
			"Mac goes live every single day for",
			"40 consecutive days, refusing to",
			"stop for anything. Chat descends",
			"into pure chaos by day 28.",
			'"I cannot be stopped," he whispered.',
			"Nobody believed him. He was right.",
		]
	);
	makeClipping(-13.82, 3.5, -6.5, Math.PI / 2, "GREASYSMP SEASON 4 CONCLUDES", [
		"After four legendary seasons of",
		"the GreasySMP, the server closes",
		"its doors. Drama, betrayal, and an",
		"astronomical amount of dirt blocks.",
		"GreasyCraft remains a cornerstone",
		"of the GreasyGang experience.",
	]);
	makeClipping(
		-13.82,
		3.5,
		-9.5,
		Math.PI / 2,
		"CLOWN WALKS: A CULTURAL RESET",
		[
			"Mac dons his clown suit and walks",
			"through public spaces as chat",
			"screams directions. Passersby",
			"confused. Chat never happier.",
			'"Wii in the Wild" spawns similarly.',
			"Los Angeles has not recovered.",
		]
	);
}

export function buildSideLoreWalls({
	scene,
	C,
	assets,
	box,
	roundedBox,
	canvasTexture,
	textureMaterial,
	setCanvasNoise,
	makeLayeredRelief,
}: LoreWallContext) {
	const makeLorePlaque = (
		x: number,
		y: number,
		z: number,
		ry: number,
		title: string,
		lines: string[],
		accent: string
	) => {
		const pC = document.createElement("canvas");
		pC.width = 720;
		pC.height = 420;
		const ctx = pC.getContext("2d")!;
		ctx.fillStyle = "#130806";
		ctx.fillRect(0, 0, 720, 420);
		setCanvasNoise(ctx, 720, 420, 0.14);
		ctx.fillStyle = accent;
		ctx.fillRect(0, 0, 720, 18);
		ctx.fillRect(0, 402, 720, 18);
		ctx.strokeStyle = "#e8a946";
		ctx.lineWidth = 7;
		ctx.strokeRect(16, 16, 688, 388);
		ctx.strokeStyle = "rgba(255,242,200,0.25)";
		ctx.lineWidth = 2;
		ctx.strokeRect(34, 34, 652, 352);
		ctx.fillStyle = accent;
		ctx.font = "bold 56px 'Arial Black', Impact, sans-serif";
		ctx.textAlign = "center";
		ctx.fillText(title, 360, 92);
		ctx.fillStyle = "#fff2c8";
		ctx.font = "bold 29px Arial, sans-serif";
		lines.forEach((line, i) => ctx.fillText(line, 360, 168 + i * 50));
		ctx.fillStyle = "rgba(255,242,200,0.35)";
		ctx.font = "italic 22px serif";
		ctx.fillText("from the GreasyMac wiki wall", 360, 365);

		const group = new THREE.Group();
		group.name = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-plaque`;
		group.userData.label = title;
		group.rotation.y = ry;
		group.position.set(x, y, z);
		scene.add(group);

		const frame = box(2.7, 1.55, 0.07, 0x100604, 0.7, 0.12);
		frame.name = "frame";
		group.add(frame);

		const plaque = new THREE.Mesh(
			new THREE.PlaneGeometry(2.5, 1.35),
			textureMaterial(canvasTexture(pC), {
				roughness: 0.82,
				emissive: new THREE.Color(accent).getHex(),
				emissiveIntensity: 0.07,
			})
		);
		plaque.name = "plaque";
		plaque.position.z = 0.035;
		group.add(plaque);
	};

	const makeLoreShelf = (
		x: number,
		z: number,
		ry: number,
		prop: "remote" | "nose"
	) => {
		const shelf = roundedBox(0.12, 0.16, 2.3, 0x2a1409, 0.04, 0.52, 0.1);
		shelf.position.set(x, 2.15, z);
		shelf.rotation.y = ry;
		scene.add(shelf);

		if (prop === "remote") {
			const remote = roundedBox(0.18, 0.12, 0.78, 0xf4f4ed, 0.045, 0.38);
			remote.rotation.y = ry;
			remote.position.set(x + Math.sin(ry) * 0.16, 2.42, z);
			scene.add(remote);
			for (let i = 0; i < 4; i++) {
				const btn = new THREE.Mesh(
					new THREE.CylinderGeometry(0.035, 0.035, 0.012, 14),
					new THREE.MeshStandardMaterial({ color: i === 0 ? C.red : 0x222222 })
				);
				btn.rotation.x = Math.PI / 2;
				btn.position.set(x + Math.sin(ry) * 0.23, 2.5, z - 0.22 + i * 0.12);
				scene.add(btn);
			}
		}

		if (prop === "nose") {
			const nose = new THREE.Mesh(
				new THREE.SphereGeometry(0.2, 24, 16),
				new THREE.MeshStandardMaterial({
					color: C.red,
					roughness: 0.22,
					metalness: 0.05,
					emissive: C.red,
					emissiveIntensity: 0.18,
				})
			);
			nose.position.set(x + Math.sin(ry) * 0.18, 2.42, z);
			scene.add(nose);
		}
	};

	makeLorePlaque(
		-13.78,
		5.15,
		4.65,
		Math.PI / 2,
		"WII IN THE WILD",
		["field reports from", "the public-chaos archive", "chat remains liable"],
		"#e8a946"
	);
	makeLoreShelf(-13.68, 4.95, Math.PI / 2, "remote");
	makeLorePlaque(
		-13.78,
		3.15,
		1.3,
		Math.PI / 2,
		"CLOWN CONFESSIONALS",
		["private booth stories", "from the grease era", "no refunds on truth"],
		"#fa4040"
	);
	makeLoreShelf(-13.68, 2.9, Math.PI / 2, "nose");

	const maclingRelief = makeLayeredRelief({
		path: assets.lore.ggFatArt,
		x: 13.72,
		y: 3.0,
		z: -2.15,
		w: 0.72,
		h: 0.74,
		ry: -Math.PI / 2,
		accent: C.mustard,
		label: "MACLING",
		layers: 2,
	});
	return { maclingRelief };
}
