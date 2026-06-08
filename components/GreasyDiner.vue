<script setup lang="ts">
import * as THREE from "three";
import { gsap } from "gsap";

interface Button {
	icon: { name: string; type: string };
	text: string;
	href: string;
	tag: string;
	color: string;
}

const props = defineProps<{ buttons: Button[] }>();

const { data: sponsor } = useAsyncData("sponsor", () =>
	cms(readItem("Sponsor", 1))
);

// ── REACTIVE STATE ──────────────────────────────────
const canvas = ref<HTMLCanvasElement | null>(null);
type Section = "none" | "menu" | "about" | "leaderboard";
const activeSection = ref<Section>("none");
const isLocked = ref(false);
const showEnterHint = ref(true);

// proximity prompt: which zone the player is standing near
type ZoneKey = "none" | "menu" | "about" | "leaderboard";
const nearZone = ref<ZoneKey>("none");

// ── THREEJS REFS ─────────────────────────────────────
let renderer: THREE.WebGLRenderer | null = null;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let animId = 0;

// walking state
const euler = new THREE.Euler(0, 0, 0, "YXZ");
const vel = new THREE.Vector3();
const dir = new THREE.Vector3();
const keys: Record<string, boolean> = {};

// proximity zones (world-space centre + radius)
const ZONES: { key: ZoneKey; cx: number; cz: number; radius: number; label: string; emoji: string }[] = [
	{ key: "menu",        cx:  0,    cz: -8.0, radius: 4.5, label: "VIEW MENU",        emoji: "🍔" },
	{ key: "about",       cx: -10.5, cz: -6.5, radius: 3.8, label: "ABOUT GREASYMAC",  emoji: "🎮" },
	{ key: "leaderboard", cx:  10.5, cz: -6.5, radius: 3.8, label: "LEADERBOARD",      emoji: "🏆" },
];

// projected TV screen positions for iframe overlays
const tvOverlays = ref<{ id: string; x: number; y: number; visible: boolean }[]>([
	{ id: "twitch",      x: 0, y: 0, visible: false },
	{ id: "leaderboard", x: 0, y: 0, visible: false },
]);
const nearTV = ref(false);

// ── OPEN / CLOSE SECTION ─────────────────────────────
function openSection(sec: Section) {
	if (activeSection.value === sec) return;
	activeSection.value = sec;
	if (document.pointerLockElement) document.exitPointerLock();
}

function closeSection() {
	activeSection.value = "none";
	// Re-enter pointer lock so player can walk immediately
	nextTick(() => { canvas.value?.requestPointerLock(); });
}

// ── KEY E handler ────────────────────────────────────
function handleInteract() {
	if (!isLocked.value) return;
	if (nearZone.value !== "none") openSection(nearZone.value as Section);
}

onMounted(() => {
	if (!canvas.value || typeof window === "undefined") return;
	const el = canvas.value;

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x120705, 0.019);
	scene.background = new THREE.Color(0x120705);

	camera = new THREE.PerspectiveCamera(72, el.clientWidth / el.clientHeight, 0.05, 80);
	camera.position.set(0, 1.65, 7);
	euler.set(0, 0, 0); // face INTO diner (-Z = toward counter/back wall)
	camera.quaternion.setFromEuler(euler);

	renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setSize(el.clientWidth, el.clientHeight);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.15;

	const C = {
		cream: 0xfff2c8, mustard: 0xe8a946, butter: 0xf6cf5d,
		red: 0xfa4040, redDark: 0xc92828, pickle: 0x2f7f67,
		ink: 0x25120e, chrome: 0xcccccc, neonPink: 0xff2255, neonBlue: 0x22aaff,
	};

	const box = (w: number, h: number, d: number, color: number, rough = 0.6, metal = 0.0, ei = 0, ec = 0x000000) => {
		const m = new THREE.Mesh(
			new THREE.BoxGeometry(w, h, d),
			new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive: ec, emissiveIntensity: ei })
		);
		m.castShadow = true; m.receiveShadow = true; return m;
	};

	// ── FLOOR ────────────────────────────────────────
	const fc = document.createElement("canvas"); fc.width = 1024; fc.height = 1024;
	const fctx = fc.getContext("2d")!;
	const TS = 64;
	for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) {
		fctx.fillStyle = (r + c) % 2 === 0 ? "#ede4c4" : "#171008";
		fctx.fillRect(c * TS, r * TS, TS, TS);
		fctx.strokeStyle = "rgba(90,55,18,0.28)"; fctx.lineWidth = 2.5;
		fctx.strokeRect(c * TS + 1, r * TS + 1, TS - 2, TS - 2);
	}
	([[120,200,55,0.14],[420,680,70,0.10],[750,300,45,0.12],[280,850,60,0.09]] as [number,number,number,number][]).forEach(([x,y,r,a]) => {
		fctx.globalAlpha = a; fctx.fillStyle = "#2a1505";
		fctx.beginPath(); fctx.ellipse(x, y, r, r * 0.4, 0.5, 0, Math.PI * 2); fctx.fill();
	});
	fctx.globalAlpha = 1;
	const floorTex = new THREE.CanvasTexture(fc);
	floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 3);
	const floor = new THREE.Mesh(
		new THREE.PlaneGeometry(28, 24),
		new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.18, metalness: 0.12 })
	);
	floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

	// ── SUBWAY TILE TEXTURE ──────────────────────────
	const makeSubwayTex = () => {
		const sc = document.createElement("canvas"); sc.width = 512; sc.height = 256;
		const s = sc.getContext("2d")!;
		s.fillStyle = "#e8e2d0"; s.fillRect(0, 0, 512, 256);
		const TW = 80, TH = 36;
		for (let row = 0; row < 8; row++) {
			const off = row % 2 === 0 ? 0 : TW / 2;
			for (let col = -1; col < 8; col++) {
				const x = col * TW + off, y = row * TH;
				const sh = 226 + Math.floor(Math.random() * 16);
				s.fillStyle = `rgb(${sh},${sh-4},${sh-10})`; s.fillRect(x+2, y+2, TW-4, TH-4);
				s.fillStyle = "rgba(255,255,255,0.22)"; s.fillRect(x+3, y+3, TW-7, 5);
			}
		}
		const t = new THREE.CanvasTexture(sc);
		t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 1); return t;
	};
	const subwayTex = makeSubwayTex();

	// back wall
	const bwL = new THREE.Mesh(new THREE.PlaneGeometry(28, 4.5), new THREE.MeshStandardMaterial({ map: subwayTex, roughness: 0.28, metalness: 0.06 }));
	bwL.position.set(0, 2.25, -11.5); scene.add(bwL);
	const bwU = new THREE.Mesh(new THREE.PlaneGeometry(28, 5.5), new THREE.MeshStandardMaterial({ color: C.redDark, roughness: 0.75 }));
	bwU.position.set(0, 6.75, -11.5); scene.add(bwU);
	const crBack = box(28.2, 0.14, 0.08, 0x110702, 0.45, 0.18);
	crBack.position.set(0, 4.53, -11.45); scene.add(crBack);

	// side walls
	for (const [sx, ry] of [[-14, Math.PI/2], [14, -Math.PI/2]] as [number,number][]) {
		const swL = new THREE.Mesh(new THREE.PlaneGeometry(24, 4.5), new THREE.MeshStandardMaterial({ map: subwayTex, roughness: 0.28 }));
		swL.rotation.y = ry; swL.position.set(sx, 2.25, -1); scene.add(swL);
		const swU = new THREE.Mesh(new THREE.PlaneGeometry(24, 5.5), new THREE.MeshStandardMaterial({ color: sx < 0 ? 0x6e1212 : 0x5a1010, roughness: 0.8 }));
		swU.rotation.y = ry; swU.position.set(sx, 6.75, -1); scene.add(swU);
		const cr = box(0.09, 0.14, 24.2, 0x110702, 0.45, 0.18);
		cr.position.set(sx + (sx < 0 ? 0.05 : -0.05), 4.53, -1); scene.add(cr);
	}

	// ceiling
	const cc = document.createElement("canvas"); cc.width = 256; cc.height = 256;
	const cctx = cc.getContext("2d")!;
	cctx.fillStyle = "#160d07"; cctx.fillRect(0, 0, 256, 256);
	cctx.strokeStyle = "rgba(55,28,8,0.9)"; cctx.lineWidth = 2;
	for (let i = 0; i <= 4; i++) { cctx.beginPath(); cctx.moveTo(i*64,0); cctx.lineTo(i*64,256); cctx.stroke(); cctx.beginPath(); cctx.moveTo(0,i*64); cctx.lineTo(256,i*64); cctx.stroke(); }
	const ceilTex = new THREE.CanvasTexture(cc);
	ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping; ceilTex.repeat.set(6, 5);
	const ceil = new THREE.Mesh(new THREE.PlaneGeometry(28, 24), new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.95 }));
	ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 8.5, -1); scene.add(ceil);

	// ── COUNTER ──────────────────────────────────────
	const counter = box(12, 1.12, 1.4, 0x150908, 0.65);
	counter.position.set(0, 0.56, -8.8); scene.add(counter);
	const marbC = document.createElement("canvas"); marbC.width = 512; marbC.height = 128;
	const mc = marbC.getContext("2d")!;
	mc.fillStyle = "#0d0705"; mc.fillRect(0, 0, 512, 128);
	mc.strokeStyle = "rgba(70,42,18,0.55)"; mc.lineWidth = 1.5;
	for (let v = 0; v < 8; v++) { mc.beginPath(); mc.moveTo(Math.random()*512,0); mc.bezierCurveTo(Math.random()*512,40,Math.random()*512,88,Math.random()*512,128); mc.stroke(); }
	const ctop = new THREE.Mesh(new THREE.BoxGeometry(12.18, 0.1, 1.52), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(marbC), roughness: 0.07, metalness: 0.45 }));
	ctop.position.set(0, 1.17, -8.8); ctop.castShadow = true; scene.add(ctop);
	const nosing = box(12.16, 0.07, 0.05, C.mustard, 0.22, 0.45);
	nosing.position.set(0, 1.12, -8.05); scene.add(nosing);
	const reg = box(0.6, 0.55, 0.4, 0x0a0705, 0.4, 0.3);
	reg.position.set(-4.5, 1.44, -8.85); scene.add(reg);
	const regScreen = box(0.44, 0.3, 0.02, 0x001122, 0.2, 0.1, 1.5, 0x002244);
	regScreen.position.set(-4.5, 1.6, -8.65); scene.add(regScreen);
	const regGlow = new THREE.PointLight(0x0044aa, 0.3, 1.5, 2);
	regGlow.position.set(-4.5, 1.65, -8.5); scene.add(regGlow);
	const napkin = box(0.08, 0.28, 0.22, C.chrome, 0.1, 0.9);
	napkin.position.set(2.5, 1.35, -8.8); scene.add(napkin);

	// ── STOOLS ───────────────────────────────────────
	for (let i = -4.5; i <= 4.5; i += 1.5) {
		const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.1, 16), new THREE.MeshStandardMaterial({ color: C.red, roughness: 0.45 }));
		seat.position.set(i, 0.9, -7.4); seat.castShadow = true; scene.add(seat);
		const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.9, 8), new THREE.MeshStandardMaterial({ color: C.chrome, roughness: 0.08, metalness: 0.96 }));
		stem.position.set(i, 0.45, -7.4); scene.add(stem);
		const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.05, 16), new THREE.MeshStandardMaterial({ color: C.chrome, roughness: 0.08, metalness: 0.96 }));
		base.position.set(i, 0.025, -7.4); scene.add(base);
		const rest = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.017, 8, 20), new THREE.MeshStandardMaterial({ color: C.chrome, roughness: 0.08, metalness: 0.96 }));
		rest.rotation.x = Math.PI / 2; rest.position.set(i, 0.3, -7.4); scene.add(rest);
	}

	// ── NEON SIGN ────────────────────────────────────
	const signFrame = box(9.5, 2.0, 0.12, 0x080403, 0.65, 0.35);
	signFrame.position.set(0, 7.2, -11.38); scene.add(signFrame);
	const nSignC = document.createElement("canvas"); nSignC.width = 2048; nSignC.height = 340;
	const nsc = nSignC.getContext("2d")!;
	nsc.fillStyle = "#060302"; nsc.fillRect(0, 0, 2048, 340);
	for (let p = 0; p < 4; p++) {
		nsc.shadowColor = p < 2 ? "#f6cf5d" : "#ff8800"; nsc.shadowBlur = 90 - p * 18;
		nsc.fillStyle = p === 3 ? "#ffffff" : "#f6cf5d"; nsc.globalAlpha = p === 3 ? 0.55 : 1;
		nsc.font = `bold ${220 - p}px 'Arial Black', Impact, sans-serif`;
		nsc.textAlign = "center"; nsc.textBaseline = "middle";
		nsc.fillText("GREASY GANG", 1024, 170);
	}
	nsc.globalAlpha = 1;
	const neonTex = new THREE.CanvasTexture(nSignC);
	const neonMesh = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 1.8),
		new THREE.MeshStandardMaterial({ map: neonTex, transparent: true, roughness: 1, emissive: 0xffd060, emissiveMap: neonTex, emissiveIntensity: 2.8 }));
	neonMesh.position.set(0, 7.2, -11.3); scene.add(neonMesh);
	const neonLight = new THREE.PointLight(0xf6cf5d, 3.5, 10, 1.4);
	neonLight.position.set(0, 7, -10.5); scene.add(neonLight);

	// ── WALL NEON TUBES ──────────────────────────────
	const makeWallNeon = (text: string, hexColor: number, x: number, y: number, z: number, ry: number) => {
		const wc = document.createElement("canvas"); wc.width = 1024; wc.height = 160;
		const wctx = wc.getContext("2d")!;
		const hex = "#" + hexColor.toString(16).padStart(6, "0");
		wctx.shadowColor = hex; wctx.shadowBlur = 48;
		wctx.fillStyle = hex; wctx.font = "bold 90px 'Arial Black', Impact, sans-serif";
		wctx.textAlign = "center"; wctx.textBaseline = "middle"; wctx.fillText(text, 512, 80);
		wctx.shadowBlur = 20; wctx.fillStyle = "white"; wctx.globalAlpha = 0.3; wctx.fillText(text, 512, 80); wctx.globalAlpha = 1;
		const tex = new THREE.CanvasTexture(wc);
		const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.58),
			new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 1, emissive: hexColor, emissiveMap: tex, emissiveIntensity: 2.5, side: THREE.DoubleSide }));
		mesh.position.set(x, y, z); mesh.rotation.y = ry; scene.add(mesh);
		const light = new THREE.PointLight(hexColor, 1.0, 4.5, 2);
		light.position.set(x + Math.sin(ry) * 0.4, y, z + Math.cos(ry) * 0.4); scene.add(light);
		return { mesh, light };
	};
	const openSign  = makeWallNeon("OPEN 24/7",          C.neonPink, -13.5, 4.4,  1.5, Math.PI / 2);
	const greaseTube = makeWallNeon("GREASE IS THE WORD", C.neonBlue,  13.4, 4.4, -2.5, -Math.PI / 2);

	// ── ZONE INDICATOR GLOWS on floor ────────────────
	const makeZoneGlow = (x: number, z: number, color: number) => {
		const gC = document.createElement("canvas"); gC.width = 256; gC.height = 256;
		const gctx = gC.getContext("2d")!;
		const g = gctx.createRadialGradient(128, 128, 8, 128, 128, 128);
		const hex = "#" + color.toString(16).padStart(6, "0");
		g.addColorStop(0, hex + "55"); g.addColorStop(0.5, hex + "22"); g.addColorStop(1, "transparent");
		gctx.fillStyle = g; gctx.fillRect(0, 0, 256, 256);
		const m = new THREE.Mesh(
			new THREE.PlaneGeometry(5, 5),
			new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(gC), transparent: true, roughness: 0.1, metalness: 0.2, depthWrite: false })
		);
		m.rotation.x = -Math.PI / 2; m.position.set(x, 0.01, z); scene.add(m); return m;
	};
	const menuGlow  = makeZoneGlow(0,     -7.5, 0xe8a946);
	const aboutGlow = makeZoneGlow(-10.5, -6.5, 0xff2255);
	const lbGlow    = makeZoneGlow(10.5,  -6.5, 0x22aaff);

	// ── INTERACTIVE 3D SOCIAL LINK BUTTONS on back wall ─
	// These are real clickable 3D planes – no overlay needed, walk up & click
	const socialLinks: { mesh: THREE.Mesh; href: string }[] = [];
	const BTN_Y = 3.8; // eye-level on back wall
	const BTN_Z = -11.22; // just off the wall face
	props.buttons.forEach((btn, i) => {
		const bx = -9 + i * 3; // spread 7 buttons from x=-9 to x=9 (3 units apart)
		// canvas texture for this button
		const bC = document.createElement("canvas"); bC.width = 512; bC.height = 256;
		const bctx = bC.getContext("2d")!;
		// dark base
		bctx.fillStyle = "#100806"; bctx.fillRect(0, 0, 512, 256);
		// accent left stripe (platform color)
		bctx.fillStyle = btn.color; bctx.fillRect(0, 0, 14, 256);
		// outer border
		bctx.strokeStyle = btn.color; bctx.lineWidth = 3; bctx.strokeRect(2, 2, 508, 252);
		// inner dim border
		bctx.strokeStyle = "rgba(255,242,200,0.12)"; bctx.lineWidth = 1; bctx.strokeRect(18, 18, 476, 220);
		// platform color glow BG on left
		bctx.fillStyle = btn.color + "22"; bctx.fillRect(14, 0, 80, 256);
		// icon area background
		bctx.fillStyle = btn.color; bctx.fillRect(20, 50, 70, 70);
		// platform name (large)
		bctx.fillStyle = "#fff2c8"; bctx.font = "bold 72px Impact, sans-serif"; bctx.textAlign = "left";
		bctx.fillText(btn.text.toUpperCase(), 105, 148);
		// tag badge
		bctx.fillStyle = btn.color; bctx.fillRect(105, 162, bctx.measureText(btn.tag.toUpperCase()).width + 20, 36);
		bctx.fillStyle = "white"; bctx.font = "bold 24px Impact, sans-serif";
		bctx.fillText(btn.tag.toUpperCase(), 115, 190);
		// number
		bctx.fillStyle = "rgba(255,242,200,0.25)"; bctx.font = "bold 48px Impact"; bctx.textAlign = "right";
		bctx.fillText(String(i + 1).padStart(2, "0"), 498, 56);
		// "→ click" hint
		bctx.fillStyle = "rgba(255,242,200,0.28)"; bctx.font = "20px Arial"; bctx.textAlign = "right";
		bctx.fillText("→  CLICK", 498, 240);
		const btnFrame = box(2.6, 1.4, 0.07, 0x0a0604, 0.8);
		btnFrame.position.set(bx, BTN_Y, BTN_Z - 0.04); scene.add(btnFrame);
		const btnPlane = new THREE.Mesh(
			new THREE.PlaneGeometry(2.4, 1.2),
			new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(bC), roughness: 0.5, emissive: new THREE.Color(btn.color).multiplyScalar(0.18), emissiveIntensity: 1.0 })
		);
		btnPlane.position.set(bx, BTN_Y, BTN_Z); scene.add(btnPlane);
		socialLinks.push({ mesh: btnPlane, href: btn.href });
		// subtle glow
		const btnLight = new THREE.PointLight(new THREE.Color(btn.color).getHex(), 0.4, 2.5, 2);
		btnLight.position.set(bx, BTN_Y, BTN_Z + 0.5); scene.add(btnLight);
	});

	// Divider strip between sign and buttons
	const divStrip = box(22, 0.08, 0.06, 0xe8a946, 0.3, 0.4);
	divStrip.position.set(0, BTN_Y + 0.75, BTN_Z); scene.add(divStrip);
	const divStrip2 = box(22, 0.08, 0.06, 0xe8a946, 0.3, 0.4);
	divStrip2.position.set(0, BTN_Y - 0.75, BTN_Z); scene.add(divStrip2);

	// ── BACK WALL MURALS (fill empty sides of back wall) ─
	const makeMural = (x: number, text1: string, text2: string, color1: string, color2: string) => {
		const mC = document.createElement("canvas"); mC.width = 480; mC.height = 560;
		const mctx = mC.getContext("2d")!;
		// background
		mctx.fillStyle = "#1a0808"; mctx.fillRect(0,0,480,560);
		// paint strokes effect
		for (let stroke = 0; stroke < 6; stroke++) {
			mctx.fillStyle = `rgba(${40+stroke*5},${10},${10},0.18)`;
			mctx.fillRect(0, stroke * 90, 480, 95);
		}
		// outer frame
		mctx.strokeStyle = color1; mctx.lineWidth = 5; mctx.strokeRect(8,8,464,544);
		mctx.strokeStyle = "rgba(255,242,200,0.2)"; mctx.lineWidth = 1.5; mctx.strokeRect(16,16,448,528);
		// main text
		mctx.shadowColor = color1; mctx.shadowBlur = 30;
		mctx.fillStyle = color1; mctx.font = "bold 88px Impact, sans-serif"; mctx.textAlign = "center";
		mctx.fillText(text1, 240, 200);
		mctx.shadowBlur = 0;
		mctx.fillStyle = color2; mctx.font = "bold 72px Impact, sans-serif";
		mctx.fillText(text2, 240, 310);
		mctx.fillStyle = "rgba(255,242,200,0.3)"; mctx.font = "italic 26px serif";
		mctx.fillText("greasygang.co", 240, 500);
		const mfr = box(2.8, 3.3, 0.08, 0x100606, 0.8); mfr.position.set(x, 6.2, -11.38); scene.add(mfr);
		const mm = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.1), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(mC), roughness: 0.8, emissive: 0x0a0404, emissiveIntensity: 0.25 }));
		mm.position.set(x, 6.2, -11.3); scene.add(mm);
	};
	makeMural(-11.5, "OPEN", "LATE", "#fa4040", "#e8a946");
	makeMural( 11.5, "EST.", "2019", "#e8a946", "#fff2c8");

	// ── HANGING LAMPS ────────────────────────────────
	const lampLights: THREE.PointLight[] = [];
	[-4.5, 0, 4.5].forEach(lx => {
		const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0x0a0a0a }));
		cord.position.set(lx, 7.0, -7.0); scene.add(cord);
		const shade = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.75, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0x0d0d0d, side: THREE.DoubleSide, roughness: 0.35, metalness: 0.65 }));
		shade.rotation.x = Math.PI; shade.position.set(lx, 5.38, -7.0); shade.castShadow = true; scene.add(shade);
		const ring = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.022, 6, 20), new THREE.MeshStandardMaterial({ color: C.chrome, roughness: 0.08, metalness: 0.96 }));
		ring.position.set(lx, 5.04, -7.0); scene.add(ring);
		const disc = new THREE.Mesh(new THREE.CircleGeometry(0.35, 20), new THREE.MeshStandardMaterial({ color: C.butter, emissive: C.butter, emissiveIntensity: 6, roughness: 1 }));
		disc.rotation.x = Math.PI / 2; disc.position.set(lx, 5.02, -7.0); scene.add(disc);
		const pl = new THREE.PointLight(0xffcc66, 4.0, 9, 1.6);
		pl.position.set(lx, 4.9, -7.0); pl.castShadow = true; pl.shadow.mapSize.set(512, 512); scene.add(pl);
		lampLights.push(pl);
	});

	// ── BOOTHS ───────────────────────────────────────
	for (const [bx, sign] of [[-11.0, 1], [11.0, -1]] as [number, number][]) {
		const back = box(2.8, 1.6, 0.24, C.redDark, 0.6); back.position.set(bx, 1.56, -4.5); scene.add(back);
		const seat = box(2.8, 0.2, 1.15, C.red, 0.58); seat.position.set(bx, 0.76, -4.0); scene.add(seat);
		const tabletop = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.07, 20), new THREE.MeshStandardMaterial({ color: 0xede4c4, roughness: 0.32, metalness: 0.06 }));
		tabletop.position.set(bx, 0.98, -2.8); tabletop.castShadow = true; scene.add(tabletop);
		const tleg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.98, 8), new THREE.MeshStandardMaterial({ color: C.chrome, roughness: 0.08, metalness: 0.96 }));
		tleg.position.set(bx, 0.49, -2.8); scene.add(tleg);
		[[bx + sign * 0.35, 0xcc2020], [bx - sign * 0.25, 0xc89018]].forEach(([tx, col]) => {
			const bot = box(0.09, 0.44, 0.09, col as number, 0.45);
			bot.position.set(tx as number, 1.24, -2.82); scene.add(bot);
		});
	}

	// ── JUKEBOX – pulled 1.5u away from back wall to prevent clip ──
	const jbBody = box(1.15, 1.9, 0.7, 0x7a0000, 0.32, 0.18);
	jbBody.position.set(-11.5, 0.95, -9.8); scene.add(jbBody);
	const jbDome = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.56, 18, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xaa2222, roughness: 0.28, metalness: 0.22 }));
	jbDome.position.set(-11.5, 1.9, -9.8); jbDome.rotation.z = Math.PI / 2; scene.add(jbDome);
	const jbSC = document.createElement("canvas"); jbSC.width = 256; jbSC.height = 256;
	const jsc = jbSC.getContext("2d")!;
	const jg = jsc.createRadialGradient(128,128,8,128,128,128);
	jg.addColorStop(0,"#ffcc44"); jg.addColorStop(0.45,"#ff6600"); jg.addColorStop(1,"#330000");
	jsc.fillStyle = jg; jsc.fillRect(0,0,256,256);
	jsc.fillStyle = "rgba(255,220,100,0.9)"; jsc.font = "bold 44px sans-serif"; jsc.textAlign = "center";
	jsc.fillText("♫", 128, 80); jsc.font = "bold 28px Arial"; jsc.fillText("JUKEBOX", 128, 138); jsc.fillText("LIVE", 128, 184);
	const jbScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(jbSC), emissive: 0xff6600, emissiveMap: new THREE.CanvasTexture(jbSC), emissiveIntensity: 1.9, roughness: 1 }));
	jbScreen.position.set(-10.88, 1.18, -9.8); scene.add(jbScreen);
	const jbGlow = new THREE.PointLight(0xff6600, 1.4, 3.8, 2);
	jbGlow.position.set(-10.6, 1.2, -9.8); scene.add(jbGlow);

	// ── FRAMED POSTERS ───────────────────────────────
	const makePoster = (x: number, y: number, z: number, ry: number, lines: string[], bg: string) => {
		const pC = document.createElement("canvas"); pC.width = 320; pC.height = 420;
		const pctx = pC.getContext("2d")!;
		pctx.fillStyle = bg; pctx.fillRect(0,0,320,420);
		pctx.strokeStyle = "#fff2c8"; pctx.lineWidth = 9; pctx.strokeRect(10,10,300,400);
		pctx.strokeStyle = "#e8a946"; pctx.lineWidth = 3; pctx.strokeRect(20,20,280,380);
		pctx.fillStyle = "#fff2c8"; pctx.font = "bold 42px 'Arial Black', Impact, sans-serif"; pctx.textAlign = "center";
		lines.forEach((l, i) => pctx.fillText(l, 160, 110 + i * 65));
		const fr = box(0.88, 1.15, 0.045, 0x150902, 0.55); fr.position.set(x,y,z); fr.rotation.y = ry; scene.add(fr);
		const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.06), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(pC), roughness: 0.88 }));
		pm.position.set(x + Math.sin(ry)*0.025, y, z + Math.cos(ry)*0.025); pm.rotation.y = ry; scene.add(pm);
	};
	// Posters pulled 0.04u off the wall face so they don't z-fight
	makePoster(-13.82, 5.4, -5.5,  Math.PI/2, ["NO",    "REFUNDS"], "#7a0000");
	makePoster(-13.82, 5.4, -8.5,  Math.PI/2, ["GREASY","SPECIAL"], "#1a4a22");
	makePoster( 13.82, 5.4, -5.5, -Math.PI/2, ["EXTRA", "GREASY"],  "#8b4000");
	makePoster( 13.82, 5.4, -8.5, -Math.PI/2, ["OPEN",  "LATE"],    "#0a2558");

	// ── LORE NEWSPAPER CLIPPINGS (left wall) ─────────
	const makeClipping = (x: number, y: number, z: number, ry: number, headline: string, body: string[]) => {
		const pC = document.createElement("canvas"); pC.width = 480; pC.height = 560;
		const ctx = pC.getContext("2d")!;
		ctx.fillStyle = "#f5edcc"; ctx.fillRect(0,0,480,560);
		// aged paper texture
		ctx.fillStyle = "rgba(180,140,60,0.12)"; ctx.fillRect(0,0,480,560);
		// headline rule
		ctx.strokeStyle = "#1a0d06"; ctx.lineWidth = 3;
		ctx.beginPath(); ctx.moveTo(18,18); ctx.lineTo(462,18); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(18,22); ctx.lineTo(462,22); ctx.stroke();
		// masthead
		ctx.fillStyle = "#1a0d06"; ctx.font = "bold 18px serif"; ctx.textAlign = "center";
		ctx.fillText("THE GREASY GAZETTE  •  GREASYGANG EDITION", 240, 42);
		ctx.beginPath(); ctx.moveTo(18,50); ctx.lineTo(462,50); ctx.stroke();
		// headline
		ctx.fillStyle = "#1a0d06"; ctx.font = "bold 38px serif"; ctx.textAlign = "center";
		const words = headline.split(" ");
		let line = ""; let lineY = 92;
		for (const w of words) {
			const test = line + w + " ";
			if (ctx.measureText(test).width > 420 && line) { ctx.fillText(line.trim(), 240, lineY); line = w + " "; lineY += 44; }
			else line = test;
		}
		ctx.fillText(line.trim(), 240, lineY); lineY += 16;
		ctx.beginPath(); ctx.moveTo(18, lineY+8); ctx.lineTo(462, lineY+8); ctx.stroke(); lineY += 24;
		// body
		ctx.font = "15px serif"; ctx.textAlign = "left";
		body.forEach(bLine => { ctx.fillText(bLine, 22, lineY); lineY += 22; });
		// fold marks
		ctx.strokeStyle = "rgba(100,70,20,0.18)"; ctx.lineWidth = 1;
		ctx.beginPath(); ctx.moveTo(0,280); ctx.lineTo(480,280); ctx.stroke();
		const fr = box(1.6, 1.95, 0.04, 0x1a0d06, 0.8); fr.position.set(x,y,z); fr.rotation.y = ry; scene.add(fr);
		const pm = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.85), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(pC), roughness: 0.85 }));
		pm.position.set(x + Math.sin(ry)*0.022, y, z + Math.cos(ry)*0.022); pm.rotation.y = ry; scene.add(pm);
	};
	// Clippings pulled off left wall face
	makeClipping(-13.82, 3.5, -3.5, Math.PI/2,
		"40 DAY STREAM STREAK SHOCKS VIEWERS",
		["Mac goes live every single day for", "40 consecutive days, refusing to", "stop for anything. Chat descends", "into pure chaos by day 28.", "\"I cannot be stopped,\" he whispered.", "Nobody believed him. He was right."]);
	makeClipping(-13.82, 3.5, -6.5, Math.PI/2,
		"GREASYSMP SEASON 4 CONCLUDES",
		["After four legendary seasons of", "the GreasySMP, the server closes", "its doors. Drama, betrayal, and an", "astronomical amount of dirt blocks.", "GreasyCraft remains a cornerstone", "of the GreasyGang experience."]);
	makeClipping(-13.82, 3.5, -9.5, Math.PI/2,
		"CLOWN WALKS: A CULTURAL RESET",
		["Mac dons his clown suit and walks", "through public spaces as chat", "screams directions. Passersby", "confused. Chat never happier.", "\"Wii in the Wild\" spawns similarly.", "Los Angeles has not recovered."]);

	// ── LORE BOARD: Wall of Fame (right wall upper) ──
	const makeWallOfFame = () => {
		const wC2 = document.createElement("canvas"); wC2.width = 900; wC2.height = 640;
		const ctx2 = wC2.getContext("2d")!;
		ctx2.fillStyle = "#0d0805"; ctx2.fillRect(0,0,900,640);
		ctx2.strokeStyle = "#e8a946"; ctx2.lineWidth = 4;
		ctx2.strokeRect(6,6,888,628);
		ctx2.strokeStyle = "rgba(232,169,70,0.3)"; ctx2.lineWidth = 1.5;
		ctx2.strokeRect(14,14,872,612);
		ctx2.shadowColor = "#e8a946"; ctx2.shadowBlur = 18;
		ctx2.fillStyle = "#e8a946"; ctx2.font = "bold 58px 'Arial Black', Impact, sans-serif";
		ctx2.textAlign = "center"; ctx2.fillText("WALL OF LEGENDS", 450, 68);
		ctx2.shadowBlur = 0;
		ctx2.strokeStyle = "rgba(232,169,70,0.4)"; ctx2.lineWidth = 1;
		ctx2.beginPath(); ctx2.moveTo(30,82); ctx2.lineTo(870,82); ctx2.stroke();
		const events = [
			"★  The SM64 Week",
			"★  48-Hour Minecraft Build Event",
			"★  The 40-Day Daily Stream Streak",
			"★  Streamer Camp 4",
			"★  24 Hours Among Us VR",
			"★  The Breaking Bad Meth Stream",
			"★  The 1st Annual Greasy's Awards",
			"★  GreasySMP Seasons 1 – 4",
			"★  TwitchPlays",
			"★  Big Brother Subathon",
		];
		ctx2.fillStyle = "#fff2c8"; ctx2.font = "28px Arial, sans-serif"; ctx2.textAlign = "left";
		events.forEach((ev, i) => {
			if (i === 5) { ctx2.textAlign = "left"; }
			const col = i < 5 ? 42 : 470;
			const row = (i % 5);
			ctx2.fillText(ev, col, 132 + row * 96);
		});
		ctx2.fillStyle = "rgba(232,169,70,0.28)"; ctx2.font = "italic 20px serif"; ctx2.textAlign = "center";
		ctx2.fillText("\"variety streamer. los angeles. extra greasy.\"", 450, 610);
		// Wall of fame on right wall – centered at z=-6.5 (safe from back corner)
		const fr2 = box(5.5, 4.0, 0.1, 0x0a0604, 0.8); fr2.rotation.y = -Math.PI/2; fr2.position.set(13.84, 4.5, -6.5); scene.add(fr2);
		const board = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.7), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(wC2), roughness: 0.88, emissive: 0x0a0604, emissiveIntensity: 0.3 }));
		board.rotation.y = -Math.PI/2; board.position.set(13.78, 4.5, -6.5); scene.add(board);
		const boardLight = new THREE.PointLight(0xe8a946, 1.2, 6, 1.8);
		boardLight.position.set(12.0, 4.5, -6.5); scene.add(boardLight);
	};
	makeWallOfFame();

	// ── TODAY'S SPECIALS CHALKBOARD (above counter) ──
	const makeChalky = () => {
		const cC = document.createElement("canvas"); cC.width = 1024; cC.height = 380;
		const ctx3 = cC.getContext("2d")!;
		ctx3.fillStyle = "#0e1a0e"; ctx3.fillRect(0,0,1024,380);
		// chalk texture noise
		for (let i = 0; i < 800; i++) {
			ctx3.fillStyle = `rgba(255,255,255,${Math.random()*0.03})`;
			ctx3.fillRect(Math.random()*1024, Math.random()*380, Math.random()*3+1, Math.random()*2+1);
		}
		ctx3.strokeStyle = "rgba(255,255,255,0.55)"; ctx3.lineWidth = 4;
		ctx3.strokeRect(10,10,1004,360);
		ctx3.fillStyle = "rgba(255,242,200,0.85)"; ctx3.font = "bold 56px Impact, sans-serif";
		ctx3.textAlign = "center"; ctx3.shadowColor = "rgba(255,255,255,0.4)"; ctx3.shadowBlur = 8;
		ctx3.fillText("TODAY'S SPECIALS", 512, 68);
		ctx3.shadowBlur = 0;
		ctx3.strokeStyle = "rgba(255,255,255,0.25)"; ctx3.lineWidth = 1.5;
		ctx3.beginPath(); ctx3.moveTo(30,84); ctx3.lineTo(994,84); ctx3.stroke();
		const items2 = [
			["DISCORD COMBO",  "FREE"],
			["TWITCH LIVE SET", "FREE"],
			["YOUTUBE CLIPS",  "FREE"],
			["GREASY SPECIAL", "EXTRA"],
		];
		ctx3.textAlign = "left"; ctx3.font = "32px Impact, sans-serif";
		items2.forEach(([name, price], i) => {
			const row = Math.floor(i / 2), col = i % 2;
			ctx3.fillStyle = "rgba(255,242,200,0.8)"; ctx3.fillText(name, 30 + col * 510, 138 + row * 100);
			ctx3.fillStyle = "#f6cf5d"; ctx3.textAlign = "right"; ctx3.fillText(price, 486 + col * 510, 138 + row * 100);
			ctx3.textAlign = "left";
			ctx3.strokeStyle = "rgba(255,255,255,0.15)"; ctx3.lineWidth = 1;
			ctx3.beginPath(); ctx3.moveTo(30 + col*510, 148 + row*100); ctx3.lineTo(486 + col*510, 148 + row*100); ctx3.stroke();
		});
		ctx3.fillStyle = "rgba(255,242,200,0.35)"; ctx3.font = "italic 22px serif"; ctx3.textAlign = "center";
		ctx3.fillText("ask about our seasonal GreasySMP server   •   no substitutions   •   no refunds", 512, 340);
		const cfr = box(8.5, 2.85, 0.1, 0x0a0d0a, 0.85); cfr.position.set(0, 3.0, -9.48); scene.add(cfr);
		const cboard = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 2.65), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cC), roughness: 0.95, emissive: 0x0e1a0e, emissiveIntensity: 0.2 }));
		cboard.position.set(0, 3.0, -9.44); scene.add(cboard);
	};
	makeChalky();

	// ── DIRECTIONAL HANGING SIGNS ─────────────────────
	const makeHangingSign = (x: number, z: number, ry: number, text: string, arrow: string, color: number) => {
		const sC = document.createElement("canvas"); sC.width = 512; sC.height = 144;
		const sctx = sC.getContext("2d")!;
		sctx.fillStyle = "#" + color.toString(16).padStart(6,"0"); sctx.fillRect(0,0,512,144);
		sctx.fillStyle = "#25120e"; sctx.fillRect(4,4,504,136);
		sctx.fillStyle = "#" + color.toString(16).padStart(6,"0"); sctx.fillRect(8,8,496,128);
		sctx.fillStyle = "#fff2c8"; sctx.font = "bold 58px 'Arial Black', Impact, sans-serif"; sctx.textAlign = "center"; sctx.textBaseline = "middle";
		sctx.fillText(`${arrow}  ${text}`, 256, 72);
		// chains
		const chain1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,1.5,6), new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.7 }));
		chain1.position.set(x-0.8, 7.5, z); chain1.rotation.y = ry; scene.add(chain1);
		const chain2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,1.5,6), new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.7 }));
		chain2.position.set(x+0.8, 7.5, z); chain2.rotation.y = ry; scene.add(chain2);
		const sfr = box(2.4, 0.7, 0.05, 0x25120e, 0.7); sfr.position.set(x, 6.7, z); sfr.rotation.y = ry; scene.add(sfr);
		const sm = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 0.58), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(sC), roughness: 0.6, emissive: color, emissiveMap: new THREE.CanvasTexture(sC), emissiveIntensity: 0.15 }));
		sm.position.set(x + Math.sin(ry)*0.03, 6.7, z + Math.cos(ry)*0.03); sm.rotation.y = ry; scene.add(sm);
	};
	// Signs hanging from ceiling pointing to each zone
	makeHangingSign( 0,   -3.2, 0,            "MENU",        "▼", 0xe8a946);
	makeHangingSign(-5.0, -1.8, Math.PI*0.1,  "ABOUT",       "◄", 0xcc2828);
	makeHangingSign( 5.0, -1.8, -Math.PI*0.1, "LEADERBOARD", "►", 0x2255cc);

	// ── TV SCREENS (right wall – leaderboard zone only) ──────
	// Store 3D world positions for iframe overlay projection
	const TV_POSITIONS = [
		new THREE.Vector3(13.5, 5.1, -4.2),   // twitch tv
		new THREE.Vector3(13.5, 5.1, -7.2),   // leaderboard tv
	];
	const makeTV = (z: number) => {
		const tvFrame = box(3.1, 2.1, 0.12, 0x080808, 0.3, 0.5); tvFrame.rotation.y = -Math.PI/2; tvFrame.position.set(13.84, 5.1, z); scene.add(tvFrame);
		// animated canvas TV screen
		const tvC = document.createElement("canvas"); tvC.width = 512; tvC.height = 330;
		const tvCtx = tvC.getContext("2d")!;
		tvCtx.fillStyle = "#00060f"; tvCtx.fillRect(0,0,512,330);
		const scanGrad = tvCtx.createLinearGradient(0,0,0,330);
		scanGrad.addColorStop(0, "rgba(0,100,255,0.35)"); scanGrad.addColorStop(0.5, "rgba(0,60,180,0.12)"); scanGrad.addColorStop(1, "rgba(0,100,255,0.35)");
		tvCtx.fillStyle = scanGrad; tvCtx.fillRect(0,0,512,330);
		tvCtx.fillStyle = "#4488ff"; tvCtx.font = "bold 28px 'Arial Black', sans-serif"; tvCtx.textAlign = "center";
		tvCtx.fillText(z < -6 ? "LEADERBOARD" : "TWITCH LIVE", 256, 60);
		tvCtx.fillStyle = "rgba(255,0,0,0.9)"; tvCtx.font = "bold 22px sans-serif";
		tvCtx.fillText("● LIVE", 256, 100);
		tvCtx.fillStyle = "rgba(100,180,255,0.5)"; tvCtx.font = "18px Arial";
		tvCtx.fillText(z < -6 ? "walk closer & press E" : "walk closer & press E", 256, 280);
		const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.8), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(tvC), emissive: 0x002244, emissiveMap: new THREE.CanvasTexture(tvC), emissiveIntensity: 0.8, roughness: 0.1 }));
		tvScreen.rotation.y = -Math.PI/2; tvScreen.position.set(13.78, 5.1, z); scene.add(tvScreen);
		const tvGlow = new THREE.PointLight(0x4488ff, 0.6, 3, 2); tvGlow.position.set(12.5, 5.1, z); scene.add(tvGlow); return tvGlow;
	};
	const tv1Glow = makeTV(-4.2);
	const tv2Glow = makeTV(-7.2);

	// ── WINDOW (right wall, near entrance) – framed, not a blob ──
	const makeWindow = () => {
		// outer frame
		const wFrame = box(3.2, 2.6, 0.1, 0x1a0d06, 0.7); wFrame.rotation.y = -Math.PI/2; wFrame.position.set(13.84, 3.6, 2.5); scene.add(wFrame);
		// sill
		const wSill = box(0.08, 0.12, 3.3, 0x0d0703, 0.4, 0.3); wSill.position.set(13.82, 2.38, 2.5); scene.add(wSill);
		// glass – night cityscape
		const wC = document.createElement("canvas"); wC.width = 512; wC.height = 384;
		const wctx = wC.getContext("2d")!;
		// sky gradient
		const skyG = wctx.createLinearGradient(0,0,0,384);
		skyG.addColorStop(0, "#0a0318"); skyG.addColorStop(0.6, "#1a0818"); skyG.addColorStop(1, "#2a0c10");
		wctx.fillStyle = skyG; wctx.fillRect(0,0,512,384);
		// city buildings silhouette
		wctx.fillStyle = "#090308";
		[[0,180,55,204],[60,200,40,384],[110,170,50,384],[165,185,65,384],[235,160,45,384],[290,195,70,384],[370,175,55,384],[430,188,80,384]].forEach(([x,y,w,h]) => wctx.fillRect(x,y,w,h));
		// windows in buildings
		wctx.fillStyle = "rgba(255,220,120,0.85)";
		for (let b = 0; b < 55; b++) wctx.fillRect(Math.random()*490+5, 185+Math.random()*160, 5, 7);
		wctx.fillStyle = "rgba(180,220,255,0.6)";
		for (let b = 0; b < 25; b++) wctx.fillRect(Math.random()*490+5, 185+Math.random()*160, 5, 7);
		// distant neon glow on horizon
		const horizG = wctx.createLinearGradient(0,280,0,384);
		horizG.addColorStop(0, "rgba(255,80,20,0)"); horizG.addColorStop(1, "rgba(255,80,20,0.25)");
		wctx.fillStyle = horizG; wctx.fillRect(0,280,512,104);
		// window cross bar
		wctx.fillStyle = "#1a0d06"; wctx.fillRect(248,0,16,384); wctx.fillRect(0,184,512,12);
		const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.3), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(wC), roughness: 0.08, metalness: 0.08, emissive: 0x110410, emissiveIntensity: 0.5 }));
		winGlass.rotation.y = -Math.PI/2; winGlass.position.set(13.76, 3.6, 2.5); scene.add(winGlass);
		// subtle outward light cast
		const winLight = new THREE.PointLight(0xff6633, 0.8, 6, 2.0);
		winLight.position.set(12.5, 3.6, 2.5); scene.add(winLight);
	};
	makeWindow();

	// grease puddles
	([[1.2, -2.5], [-2.8, -5.0], [3.0, -7.2]] as [number,number][]).forEach(([px, pz]) => {
		const pC = document.createElement("canvas"); pC.width = 256; pC.height = 128;
		const pctx = pC.getContext("2d")!;
		const pg = pctx.createRadialGradient(128,64,4,128,64,92);
		pg.addColorStop(0,"rgba(200,145,50,0.55)"); pg.addColorStop(0.5,"rgba(130,90,22,0.22)"); pg.addColorStop(1,"rgba(0,0,0,0)");
		pctx.fillStyle = pg; pctx.ellipse(128,64,112,56,0.3,0,Math.PI*2); pctx.fill();
		const pm = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.4), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(pC), transparent: true, roughness: 0.08, metalness: 0.55, depthWrite: false }));
		pm.rotation.x = -Math.PI/2; pm.position.set(px, 0.005, pz); scene.add(pm);
	});

	// steam
	const STEAM = 50;
	const sPos = new Float32Array(STEAM * 3);
	const sPhase = new Float32Array(STEAM);
	for (let i = 0; i < STEAM; i++) {
		sPos[i*3] = (Math.random()-0.5)*10; sPos[i*3+1] = 1.2+Math.random()*2.5; sPos[i*3+2] = -8.8+(Math.random()-0.5)*0.8;
		sPhase[i] = Math.random()*Math.PI*2;
	}
	const steamGeo = new THREE.BufferGeometry();
	steamGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
	const steamMat = new THREE.PointsMaterial({ color: 0xddccbb, size: 0.2, transparent: true, opacity: 0.16, sizeAttenuation: true, depthWrite: false });
	const steam = new THREE.Points(steamGeo, steamMat); scene.add(steam);

	// ── LIGHTING ─────────────────────────────────────
	// Brighter base so nothing is pitch black
	scene.add(new THREE.AmbientLight(0x6b3820, 0.72));

	// Back wall warm rim (neon sign glow)
	const rimLight = new THREE.PointLight(C.redDark, 2.2, 18, 1.5);
	rimLight.position.set(0, 6.5, -11); scene.add(rimLight);

	// Front fill – player zone is well-lit
	const fillLight = new THREE.DirectionalLight(0xffbb66, 0.45);
	fillLight.position.set(0, 6, 9); scene.add(fillLight);

	// Left wall dedicated fill (about / lore zone)
	const leftFill1 = new THREE.PointLight(0xff4422, 1.6, 12, 1.4);
	leftFill1.position.set(-10, 4.5, -4); scene.add(leftFill1);
	const leftFill2 = new THREE.PointLight(0xffaa44, 1.2, 10, 1.5);
	leftFill2.position.set(-10, 4.5, -9); scene.add(leftFill2);

	// Right wall dedicated fill (leaderboard / TV zone)
	const rightFill1 = new THREE.PointLight(0x2266ff, 1.4, 12, 1.4);
	rightFill1.position.set(10, 4.5, -4); scene.add(rightFill1);
	const rightFill2 = new THREE.PointLight(0x4488ff, 1.2, 10, 1.5);
	rightFill2.position.set(10, 4.5, -9); scene.add(rightFill2);

	// Mid-room overhead fill lights so walking anywhere is readable
	const midLeft  = new THREE.PointLight(0xffcc88, 1.0, 14, 1.6);
	midLeft.position.set(-5, 5.5, -2); scene.add(midLeft);
	const midRight = new THREE.PointLight(0xffcc88, 1.0, 14, 1.6);
	midRight.position.set( 5, 5.5, -2); scene.add(midRight);
	const midBack  = new THREE.PointLight(0xffcc88, 0.9, 14, 1.6);
	midBack.position.set(0, 5.5, -6); scene.add(midBack);

	// ── POINTER LOCK + INTERACTION ───────────────────
	const PI_2 = Math.PI / 2;
	const raycaster = new THREE.Raycaster();
	let locked = false;

	// Mouse move: look when locked, update cursor hover when unlocked
	const mouseNDC = new THREE.Vector2();
	const onMouseMove = (e: MouseEvent) => {
		if (locked) {
			euler.y -= e.movementX * 0.0018;
			euler.x -= e.movementY * 0.0018;
			euler.x = Math.max(-PI_2 * 0.45, Math.min(PI_2 * 0.45, euler.x));
			camera.quaternion.setFromEuler(euler);
			return;
		}
		if (activeSection.value !== "none") return;
		// hover detect: update cursor to pointer if over a social link button
		const rect = el.getBoundingClientRect();
		mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(mouseNDC, camera);
		const hit = socialLinks.some(({ mesh }) => raycaster.intersectObject(mesh).length > 0);
		el.style.cursor = hit ? "pointer" : "default";
	};
	const onLockChange = () => {
		locked = document.pointerLockElement === el;
		isLocked.value = locked;
		if (locked) showEnterHint.value = false;
	};

	const onKeyDown = (e: KeyboardEvent) => {
		keys[e.code] = true;
		if (e.code === "KeyE") handleInteract();
		if (e.code === "Escape" && activeSection.value !== "none") closeSection();
	};
	const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };

	// clicking canvas: raycasting for social buttons OR pointer lock
	const onCanvasClick = (e: MouseEvent) => {
		if (activeSection.value !== "none") return;
		// Try raycasting against social link buttons first (works without pointer lock)
		const rect = el.getBoundingClientRect();
		const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
		for (const { mesh, href } of socialLinks) {
			if (raycaster.intersectObject(mesh).length > 0) {
				window.open(href, "_blank", "noopener noreferrer");
				return;
			}
		}
		// Otherwise grab pointer lock
		el.requestPointerLock();
	};
	el.addEventListener("click", onCanvasClick);
	document.addEventListener("pointerlockchange", onLockChange);
	document.addEventListener("mousemove", onMouseMove);
	document.addEventListener("keydown", onKeyDown);
	document.addEventListener("keyup", onKeyUp);

	// ── RENDER LOOP ───────────────────────────────────
	const clock = new THREE.Clock();
	let tick = 0;
	const loop = () => {
		animId = requestAnimationFrame(loop);
		const delta = Math.min(clock.getDelta(), 0.05);
		tick++;
		const t = tick * 0.005;

		// walking (only when locked AND no panel open)
		if (locked && activeSection.value === "none") {
			dir.set(0, 0, 0);
			if (keys["KeyW"] || keys["ArrowUp"])    dir.z = -1;
			if (keys["KeyS"] || keys["ArrowDown"])  dir.z =  1;
			if (keys["KeyA"] || keys["ArrowLeft"])  dir.x = -1;
			if (keys["KeyD"] || keys["ArrowRight"]) dir.x =  1;
			if (dir.length() > 0) {
				dir.normalize();
				const moveEuler = new THREE.Euler(0, euler.y, 0);
				dir.applyEuler(moveEuler);
				vel.copy(dir).multiplyScalar(5.5 * delta);
				camera.position.add(vel);
				camera.position.x = Math.max(-12.0, Math.min(12.0, camera.position.x));
				camera.position.z = Math.max(-10.8, Math.min(7.5, camera.position.z));
				camera.position.y = 1.65;
			}
		}

		// proximity detection
		let closest: ZoneKey = "none";
		let closestDist = Infinity;
		for (const zone of ZONES) {
			const dx = camera.position.x - zone.cx;
			const dz = camera.position.z - zone.cz;
			const dist = Math.sqrt(dx*dx + dz*dz);
			if (dist < zone.radius && dist < closestDist) {
				closest = zone.key; closestDist = dist;
			}
		}
		nearZone.value = closest;
		// near TV = inside leaderboard zone close to the right wall
		const distToTV = Math.sqrt((camera.position.x - 10.5)**2 + (camera.position.z + 6.5)**2);
		nearTV.value = distToTV < 3.8;

		// project all TV screen world positions → screen space for iframe overlays
		if (renderer) {
			const size = renderer.getSize(new THREE.Vector2());
			TV_POSITIONS.forEach((wp, i) => {
				const proj = wp.clone().project(camera);
				const sx = (proj.x *  0.5 + 0.5) * size.x;
				const sy = (proj.y * -0.5 + 0.5) * size.y;
				const inFront = proj.z < 1.0;
				const distTV0 = Math.sqrt((camera.position.x - 12.5)**2 + (camera.position.z + 4.2)**2);
				const distTV1 = Math.sqrt((camera.position.x - 12.5)**2 + (camera.position.z + 7.2)**2);
				const dists = [distTV0, distTV1];
				tvOverlays.value[i] = {
					id: ["twitch", "leaderboard"][i],
					x: sx, y: sy,
					visible: inFront && dists[i] < 5.5,
				};
			});
		}

		// zone glow pulse
		const inMenu  = nearest("menu");
		const inAbout = nearest("about");
		const inLB    = nearest("leaderboard");
		function nearest(k: ZoneKey) { return nearZone.value === k; }
		const gp = 0.55 + Math.sin(t * 3.5) * 0.35;
		;(menuGlow.material  as THREE.MeshStandardMaterial).opacity = inMenu  ? gp : 0.22;
		;(aboutGlow.material as THREE.MeshStandardMaterial).opacity = inAbout ? gp : 0.22;
		;(lbGlow.material    as THREE.MeshStandardMaterial).opacity = inLB    ? gp : 0.22;

		// neon flicker
		neonMesh.material.emissiveIntensity = 2.2 + Math.sin(t*1.9)*0.6 + (Math.random()>0.988 ? -1.5 : 0);
		neonLight.intensity = 2.8 + Math.sin(t*2.2)*0.7;
		const of = Math.sin(t*4.1) > 0.5 ? 1.0 : (Math.random()>0.96 ? 0.08 : 1.0);
		openSign.light.intensity = of * 1.1;
		(openSign.mesh.material  as THREE.MeshStandardMaterial).emissiveIntensity = of * 2.4;
		greaseTube.light.intensity = 0.8 + Math.sin(t*1.3)*0.3;
		lampLights.forEach((pl, i) => { pl.intensity = 3.5 + Math.sin(t*(1.5+i*0.4)+i)*0.5 + (Math.random()>0.97 ? -1 : 0); });
		jbGlow.intensity = 0.85 + Math.sin(t*4.5)*0.5;
		tv1Glow.intensity = 0.5 + Math.sin(t*0.8)*0.2;
		tv2Glow.intensity = 0.5 + Math.sin(t*0.9+1)*0.2;
		rimLight.intensity = 2.0 + Math.sin(t*0.9)*0.4;

		// steam
		const sp = steam.geometry.attributes.position.array as Float32Array;
		for (let i = 0; i < STEAM; i++) {
			sp[i*3+1] += 0.009 + Math.sin(sPhase[i]+t)*0.003;
			sp[i*3]   += Math.sin(sPhase[i]*2+t*0.5)*0.003;
			if (sp[i*3+1] > 4.2) { sp[i*3+1] = 1.15; sp[i*3] = (Math.random()-0.5)*10; }
		}
		steam.geometry.attributes.position.needsUpdate = true;
		steamMat.opacity = 0.14 + Math.sin(t*0.7)*0.04;

		renderer!.render(scene, camera);
	};
	loop();

	const onResize = () => {
		if (!renderer || !canvas.value) return;
		const w = canvas.value.clientWidth, h = canvas.value.clientHeight;
		camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
	};
	window.addEventListener("resize", onResize);

	onUnmounted(() => {
		cancelAnimationFrame(animId);
		document.removeEventListener("pointerlockchange", onLockChange);
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("keydown", onKeyDown);
		document.removeEventListener("keyup", onKeyUp);
		el.removeEventListener("click", onCanvasClick);
		window.removeEventListener("resize", onResize);
		renderer?.dispose();
		if (document.pointerLockElement === el) document.exitPointerLock();
	});
});
</script>

<template>
	<div class="diner-root">
		<canvas ref="canvas" class="diner-canvas" />

		<!-- atmosphere -->
		<div class="scanlines" aria-hidden="true" />
		<div class="vignette"  aria-hidden="true" />

		<!-- crosshair (only when locked) -->
		<div v-if="isLocked && activeSection === 'none'" class="crosshair" aria-hidden="true">
			<span class="ch-h" /><span class="ch-v" />
		</div>

		<!-- ENTER HINT (before first click) -->
		<Transition name="fade">
			<div v-if="showEnterHint" class="enter-hint">
				<div class="eh-ring font-bebas">⊕</div>
				<p class="eh-main font-bebas">CLICK TO ENTER THE DINER</p>
				<p class="eh-sub  font-bebas">WASD WALK &nbsp;·&nbsp; MOUSE LOOK &nbsp;·&nbsp; E INTERACT</p>
			</div>
		</Transition>

		<!-- HUD: movement reminder when locked -->
		<div v-if="isLocked && activeSection === 'none'" class="hud-bar font-bebas">
			<span>W A S D — WALK</span>
			<span class="hud-sep">·</span>
			<span>MOUSE — LOOK</span>
			<span class="hud-sep">·</span>
			<span>E — INTERACT</span>
			<span class="hud-sep">·</span>
			<span>ESC — RELEASE</span>
		</div>

		<!-- PROXIMITY PROMPT -->
		<Transition name="prompt">
			<div v-if="isLocked && nearZone !== 'none' && activeSection === 'none'" class="zone-prompt font-bebas">
				<div class="zp-emoji">{{ ZONES.find(z => z.key === nearZone)?.emoji }}</div>
				<div class="zp-key">E</div>
				<div class="zp-label">{{ ZONES.find(z => z.key === nearZone)?.label }}</div>
			</div>
		</Transition>

		<!-- BACK BUTTON (when a section is open) -->
		<Transition name="fade">
			<button v-if="activeSection !== 'none'" class="back-btn font-bebas" @click="closeSection">
				← BACK TO DINER
			</button>
		</Transition>

		<!-- TV IFRAME OVERLAYS – projected from 3D world positions -->
		<template v-if="activeSection === 'none'">
			<div
				v-for="tv in tvOverlays"
				:key="tv.id"
				class="tv-overlay"
				:class="{ visible: tv.visible }"
				:style="{ left: tv.x + 'px', top: tv.y + 'px' }"
			>
				<div class="tv-label font-bebas">{{ tv.id === 'leaderboard' ? '🏆 LEADERBOARD' : '📺 TWITCH LIVE' }}</div>
				<template v-if="tv.visible">
					<iframe
						v-if="tv.id !== 'leaderboard'"
						:src="`https://player.twitch.tv/?channel=greasymac&parent=${typeof window !== 'undefined' ? window.location.hostname : 'greasygang.co'}&muted=true&autoplay=false`"
						class="tv-iframe"
						allowfullscreen
						scrolling="no"
					/>
					<div v-else class="tv-leaderboard-preview">
						<WatchTime />
					</div>
				</template>
			</div>
		</template>

		<!-- ══════════════════════════════════
		     MENU PANEL
		══════════════════════════════════ -->
		<Transition name="slide-up">
			<div v-if="activeSection === 'menu'" class="section-panel panel-menu">
				<div class="panel-header font-bebas">
					<div class="bulb-row" aria-hidden="true">
						<span v-for="n in 10" :key="n" class="bulb" :style="`animation-delay:${n*0.18}s`" />
					</div>
					<div class="panel-title-wrap">
						<p class="panel-eyebrow">GreasyGang</p>
						<h2 class="panel-title">Menu</h2>
						<p class="panel-sub">no substitutions · no refunds · no mercy</p>
					</div>
					<div class="bulb-row" aria-hidden="true">
						<span v-for="n in 10" :key="n" class="bulb" :style="`animation-delay:${n*0.18}s`" />
					</div>
				</div>
				<div class="menu-list">
					<NuxtLink
						v-for="(btn, i) in buttons"
						:key="btn.href"
						:href="btn.href"
						target="_blank"
						rel="noopener noreferrer"
						class="menu-item"
						:style="`--accent: ${btn.color}`"
					>
						<span class="item-num font-bebas">{{ String(i + 1).padStart(2, '0') }}</span>
						<span class="item-icon" :style="`background: ${btn.color}`">
							<FontAwesomeIcon :icon="[btn.icon.type, btn.icon.name]" />
						</span>
						<span class="item-name">{{ btn.text }}</span>
						<span class="item-tag font-bebas">{{ btn.tag }}</span>
						<span class="item-arrow font-bebas">→</span>
					</NuxtLink>
				</div>
				<div class="menu-footer font-bebas">
					<span>thank you for your order</span>
					<span class="footer-dots">· · · · · · · · ·</span>
					<span>come back greasier</span>
				</div>
				<div v-if="sponsor && sponsor.enabled" class="sponsor-strip">
					<div class="sponsor-badge font-bebas">sponsored</div>
					<NuxtImg densities="x1 x2" :src="$cmsImage(sponsor.image) + '/sponsor'" class="sponsor-img" :style="'object-position:' + sponsor.imagePosition" />
					<div class="sponsor-copy">
						<p v-if="sponsor.code" class="sponsor-code-line">
							<span class="font-bebas sc-label">use code</span>
							<strong class="sc-val">{{ sponsor.code }}</strong>
						</p>
						<p class="sponsor-desc">{{ sponsor.description }}</p>
						<NuxtLink :href="sponsor.url" target="_blank" class="sponsor-cta font-bebas">PLAY NOW →</NuxtLink>
					</div>
				</div>
			</div>
		</Transition>

		<!-- ══════════════════════════════════
		     ABOUT PANEL
		══════════════════════════════════ -->
		<Transition name="slide-left">
			<div v-if="activeSection === 'about'" class="section-panel panel-about">
				<div class="about-frame">
					<div class="about-sticker sticker-a font-bebas">served<br>live</div>
					<div class="about-sticker sticker-b font-bebas">extra<br>greasy</div>
					<NuxtImg :src="$cmsImage('777b4597-5c15-4835-b291-fdf8b9af3524/mac-babe')" class="about-portrait" />
					<div class="about-gloss" />
				</div>
				<div class="about-nameplate font-bebas">
					<span class="np-name">GreasyMac</span>
					<span class="np-dot">·</span>
					<span class="np-title">Streamer &amp; Entertainer</span>
				</div>
				<div class="about-stats">
					<div class="bio-stat font-bebas">
						<span class="stat-val">100K+</span>
						<span class="stat-label">Followers</span>
					</div>
					<div class="bio-stat font-bebas">
						<span class="stat-val">LIVE</span>
						<span class="stat-label">Twitch</span>
					</div>
					<div class="bio-stat font-bebas">
						<span class="stat-val">24/7</span>
						<span class="stat-label">Chaos</span>
					</div>
				</div>
				<p class="about-tagline font-bebas">"hot links · loud bits · extra sauce"</p>
			</div>
		</Transition>

		<!-- ══════════════════════════════════
		     LEADERBOARD PANEL
		══════════════════════════════════ -->
		<Transition name="slide-right">
			<div v-if="activeSection === 'leaderboard'" class="section-panel panel-leaderboard">
				<div class="lb-wrap">
					<WatchTime />
					<WatchTime all />
				</div>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
/* ── ROOT ───────────────────────────────────────────── */
.diner-root {
	position: relative;
	width: 100%;
	height: 100svh;
	min-height: 560px;
	overflow: hidden;
	background: #0f0805;
}

.diner-canvas {
	position: absolute; inset: 0;
	width: 100%; height: 100%;
	display: block; cursor: none;
}

/* ── SCANLINES + VIGNETTE ───────────────────────────── */
.scanlines {
	position: absolute; inset: 0; z-index: 2; pointer-events: none;
	background: repeating-linear-gradient(to bottom, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px);
}
.vignette {
	position: absolute; inset: 0; z-index: 3; pointer-events: none;
	background: radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,0.72) 100%);
}

/* ── CROSSHAIR ──────────────────────────────────────── */
.crosshair {
	position: absolute; top: 50%; left: 50%; z-index: 12; pointer-events: none;
	transform: translate(-50%, -50%);
}
.ch-h, .ch-v { position: absolute; background: rgba(255,242,200,0.65); }
.ch-h { width: 14px; height: 1.5px; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.ch-v { width: 1.5px; height: 14px; top: 50%; left: 50%; transform: translate(-50%, -50%); }

/* ── ENTER HINT ─────────────────────────────────────── */
.enter-hint {
	position: absolute; inset: 0; z-index: 20;
	display: flex; flex-direction: column; align-items: center;
	justify-content: flex-end; padding-bottom: 12%;
	pointer-events: none; text-align: center;
}
.eh-ring {
	font-size: 3rem; color: rgba(255,242,200,0.5);
	animation: hintPulse 2s ease-in-out infinite; line-height: 1; margin-bottom: 0.5rem;
}
.eh-main {
	font-size: clamp(0.9rem, 2.2vw, 1.3rem); letter-spacing: 0.2em;
	color: rgba(255,242,200,0.8); text-transform: uppercase; margin-bottom: 0.3rem;
}
.eh-sub {
	font-size: clamp(0.6rem, 1.2vw, 0.82rem); letter-spacing: 0.18em;
	color: rgba(232,169,70,0.5); text-transform: uppercase;
}

/* ── HUD BAR ────────────────────────────────────────── */
.hud-bar {
	position: absolute; bottom: 1.4rem; left: 50%; transform: translateX(-50%);
	z-index: 12; display: flex; align-items: center; gap: 0.8rem;
	background: rgba(0,0,0,0.55); border: 1px solid rgba(232,169,70,0.28);
	color: rgba(255,242,200,0.5); font-size: 0.75rem; letter-spacing: 0.15em;
	padding: 0.35rem 1rem 0.25rem; pointer-events: none; white-space: nowrap;
}
.hud-sep { color: rgba(232,169,70,0.28); }

/* ── PROXIMITY PROMPT ───────────────────────────────── */
.zone-prompt {
	position: absolute; bottom: 22%; left: 50%; transform: translateX(-50%);
	z-index: 15; display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
	pointer-events: none; text-align: center;
}
.zp-emoji { font-size: 2rem; line-height: 1; }
.zp-key {
	width: 2rem; height: 2rem; border: 2px solid #e8a946; color: #e8a946;
	font-size: 1.25rem; line-height: 1; display: grid; place-items: center;
	padding-top: 0.1rem;
	box-shadow: 0 0 10px rgba(232,169,70,0.4);
	animation: keyPulse 1s ease-in-out infinite;
}
.zp-label {
	font-size: clamp(0.75rem, 1.8vw, 1rem); letter-spacing: 0.18em;
	color: rgba(255,242,200,0.85); text-transform: uppercase;
}

/* ── BACK BUTTON ────────────────────────────────────── */
.back-btn {
	position: absolute; top: 1.2rem; left: 1.4rem; z-index: 40;
	background: rgba(37,18,14,0.88); color: #e8a946;
	border: 2px solid #e8a946; cursor: pointer;
	font-size: 0.95rem; letter-spacing: 0.15em;
	padding: 0.5rem 1.1rem 0.38rem;
	box-shadow: 3px 3px 0 #25120e;
	transition: background 0.12s;
}
.back-btn:hover { background: rgba(200,80,20,0.9); color: white; }

/* ══════════════════════════════════════════════════════
   SHARED PANEL BASE
══════════════════════════════════════════════════════ */
.section-panel {
	position: absolute; z-index: 30; pointer-events: all;
}

/* ══════════════════════════════════════════════════════
   MENU PANEL
══════════════════════════════════════════════════════ */
.panel-menu {
	inset: 0;
	display: flex; flex-direction: column;
	align-items: center; justify-content: center;
	padding: 5rem 1rem 1rem; gap: 0;
	pointer-events: none;
}
.panel-menu .panel-header,
.panel-menu .menu-list,
.panel-menu .menu-footer,
.panel-menu .sponsor-strip { pointer-events: all; }

.panel-header {
	display: flex; align-items: center; justify-content: space-between; gap: 0.8rem;
	background: #25120e; border: 4px solid #e8a946; border-bottom: none;
	padding: 0.7rem 1.1rem 0.55rem; width: 100%; max-width: 660px;
}
.bulb-row { display: flex; gap: 5px; align-items: center; }
.bulb {
	display: block; width: 9px; height: 9px; border-radius: 50%;
	background: #f6cf5d; box-shadow: 0 0 7px 2px rgba(246,207,93,0.7);
	animation: bulbPulse 1.8s ease-in-out infinite;
}
.panel-title-wrap { text-align: center; }
.panel-eyebrow { font-size: 0.75rem; letter-spacing: 0.25em; color: #e8a946; text-transform: uppercase; margin: 0; }
.panel-title { font-size: clamp(2rem, 4vw, 3.5rem); line-height: 0.9; color: #fff2c8; text-shadow: 3px 3px 0 rgba(232,169,70,0.4); text-transform: uppercase; margin: 0; }
.panel-sub { font-size: 0.62rem; letter-spacing: 0.15em; color: rgba(255,242,200,0.38); text-transform: uppercase; margin: 0.1rem 0 0; }

.menu-list {
	width: 100%; max-width: 660px;
	background: linear-gradient(90deg, rgba(37,18,14,0.08) 1px, transparent 1px) 0 0 / 18px 100%, #180904;
	border: 4px solid #e8a946; border-top: none;
}
.menu-item {
	display: grid; grid-template-columns: 2.2rem 3rem 1fr auto 1.8rem;
	align-items: center; gap: 0.6rem; padding: 0.65rem 1rem;
	border-bottom: 1px solid rgba(232,169,70,0.14);
	text-decoration: none; color: #fff2c8;
	transition: background 0.12s, padding-left 0.12s;
	position: relative; overflow: hidden;
}
.menu-item:last-child { border-bottom: none; }
.menu-item::before {
	content: ""; position: absolute; inset: 0;
	background: linear-gradient(90deg, var(--accent, #fa4040) 0%, transparent 50%);
	opacity: 0; transition: opacity 0.16s;
}
.menu-item:hover::before { opacity: 0.18; }
.menu-item:hover { padding-left: 1.3rem; }
.menu-item > * { position: relative; z-index: 1; }
.item-num   { font-size: 1rem; color: rgba(232,169,70,0.4); line-height: 1; }
.item-icon  { display: grid; place-items: center; width: 2.6rem; height: 2.6rem; border: 2px solid #25120e; color: white; }
.item-name  { font-size: 1.05rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em; }
.item-tag   { border: 1px solid rgba(255,242,200,0.2); color: rgba(255,242,200,0.45); font-size: 0.75rem; letter-spacing: 0.1em; padding: 0.16rem 0.5rem 0.1rem; text-transform: uppercase; white-space: nowrap; }
.item-arrow { font-size: 1.05rem; color: rgba(232,169,70,0.32); transition: color 0.12s, transform 0.12s; }
.menu-item:hover .item-arrow { color: #e8a946; transform: translateX(3px); }

.menu-footer {
	width: 100%; max-width: 660px;
	display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem;
	background: #25120e; border: 4px solid #e8a946; border-top: 2px dashed rgba(232,169,70,0.35);
	color: rgba(255,242,200,0.4); font-size: 0.8rem; letter-spacing: 0.1em;
	text-transform: uppercase; padding: 0.5rem 1rem 0.38rem;
}
.footer-dots { color: rgba(232,169,70,0.18); }

.sponsor-strip {
	position: relative; display: flex; align-items: center; gap: 0.9rem;
	width: 100%; max-width: 660px; margin-top: 0.6rem;
	border: 3px solid #2f7f67; background: #ffe7a3; color: #25120e;
	padding: 0.5rem 0.75rem;
}
.sponsor-badge { position: absolute; top: 0.35rem; right: 0.45rem; background: #e8a946; color: #25120e; border: 2px solid #25120e; font-size: 0.68rem; letter-spacing: 0.1em; padding: 0.08rem 0.4rem; text-transform: uppercase; }
.sponsor-img { width: 4.5rem; height: 3.5rem; object-fit: cover; border: 2px solid #25120e; flex-shrink: 0; }
.sponsor-copy { flex: 1; }
.sponsor-code-line { display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.2rem; }
.sc-label { font-size: 0.7rem; letter-spacing: 0.08em; opacity: 0.6; text-transform: uppercase; }
.sc-val { background: #fa4040; color: white; border: 1.5px solid #25120e; padding: 0.08rem 0.38rem; font-size: 0.88rem; }
.sponsor-desc { font-weight: 700; font-size: 0.75rem; line-height: 1.35; }
.sponsor-cta { display: inline-block; background: #25120e; color: #fff2c8; font-size: 0.9rem; letter-spacing: 0.1em; padding: 0.28rem 0.75rem 0.2rem; text-decoration: none; margin-top: 0.25rem; }
.sponsor-cta:hover { background: #c92828; }

/* ══════════════════════════════════════════════════════
   ABOUT PANEL
══════════════════════════════════════════════════════ */
.panel-about {
	top: 50%; left: 50%; transform: translate(-50%, -50%);
	width: min(400px, 92vw);
	display: flex; flex-direction: column; align-items: center;
}
.about-frame {
	position: relative; border: 5px solid #25120e; background: #c92828;
	box-shadow: -10px 10px 0 #e8a946, -18px 18px 0 #16100d;
	overflow: hidden; width: 100%;
	border-radius: 10px 2px 8px 2px;
}
.about-portrait { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; filter: saturate(1.1) contrast(1.04); }
.about-gloss    { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(135deg, rgba(255,242,200,0.18) 0 18%, transparent 20%), linear-gradient(180deg, transparent 58%, rgba(37,18,14,0.55)); }
.about-sticker  { position: absolute; z-index: 3; border: 3px solid #25120e; font-size: 1.1rem; line-height: 1.1; letter-spacing: 0.04em; text-transform: uppercase; padding: 0.4rem 0.6rem 0.25rem; box-shadow: 4px 4px 0 #25120e; text-align: center; }
.sticker-a { top: 0.8rem; left: 0.8rem; background: #ffe7a3; color: #25120e; transform: rotate(-7deg); animation: stickerWiggle 6s ease-in-out infinite; }
.sticker-b { bottom: 3.5rem; right: 0.8rem; background: #2f7f67; color: white; transform: rotate(5deg); animation: stickerWiggle 7s ease-in-out infinite reverse; }
.about-nameplate { display: flex; align-items: center; gap: 0.6rem; justify-content: center; background: #25120e; color: #fff2c8; font-size: 1.05rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.55rem 1rem 0.42rem; border-top: 4px solid #e8a946; width: 100%; }
.np-dot { color: #e8a946; font-size: 1.5rem; line-height: 0; transform: translateY(2px); }
.about-stats { display: flex; background: #180904; border: 3px solid #e8a946; border-top: none; width: 100%; }
.bio-stat { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 0.65rem 0.5rem 0.5rem; border-right: 2px solid rgba(232,169,70,0.2); }
.bio-stat:last-child { border-right: none; }
.stat-val { font-size: 1.4rem; color: #e8a946; line-height: 1; }
.stat-label { font-size: 0.62rem; letter-spacing: 0.12em; color: rgba(255,242,200,0.4); text-transform: uppercase; }
.about-tagline { font-size: 0.75rem; letter-spacing: 0.15em; color: rgba(232,169,70,0.45); text-transform: uppercase; margin-top: 0.65rem; text-align: center; }

/* ══════════════════════════════════════════════════════
   LEADERBOARD PANEL
══════════════════════════════════════════════════════ */
.panel-leaderboard {
	inset: 0;
	display: flex; align-items: center; justify-content: center;
	padding: 5rem 2rem 2rem;
}
.lb-wrap {
	display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;
	width: 100%; max-width: 1100px;
}
.lb-wrap > * { border: 4px solid #e8a946; background: rgba(12,6,3,0.88); box-shadow: -8px 8px 0 #25120e; }

/* ── TV OVERLAYS – live iframes projected into 3D ── */
.tv-overlay {
	position: absolute;
	z-index: 20;
	pointer-events: none;
	transform: translate(-50%, -50%);
	opacity: 0;
	transition: opacity 0.4s ease;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.4rem;
}

.tv-overlay.visible {
	opacity: 1;
	pointer-events: all;
}

.tv-label {
	background: rgba(0,0,0,0.75);
	border: 1px solid rgba(68,136,255,0.5);
	color: #4488ff;
	font-size: 0.7rem;
	letter-spacing: 0.18em;
	padding: 0.18rem 0.6rem 0.1rem;
	text-transform: uppercase;
}

.tv-iframe {
	width: 320px;
	height: 180px;
	border: 3px solid #25120e;
	box-shadow: 0 0 24px rgba(0,80,200,0.55), -5px 5px 0 #25120e;
	background: #000;
	display: block;
}

.tv-leaderboard-preview {
	width: 320px;
	max-height: 380px;
	overflow: hidden;
	border: 3px solid #e8a946;
	box-shadow: 0 0 24px rgba(232,169,70,0.4), -5px 5px 0 #25120e;
	background: rgba(12,6,3,0.95);
}
.fade-enter-active, .fade-leave-active         { transition: opacity 0.5s ease; }
.fade-enter-from,   .fade-leave-to             { opacity: 0; }

.prompt-enter-active, .prompt-leave-active     { transition: opacity 0.3s ease, transform 0.3s ease; }
.prompt-enter-from,   .prompt-leave-to         { opacity: 0; transform: translateX(-50%) translateY(8px); }

.slide-up-enter-active, .slide-up-leave-active { transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1); }
.slide-up-enter-from,   .slide-up-leave-to     { opacity: 0; transform: translateY(55px); }

.slide-left-enter-active, .slide-left-leave-active { transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1); }
.slide-left-enter-from,   .slide-left-leave-to     { opacity: 0; transform: translateX(-55px); }

.slide-right-enter-active, .slide-right-leave-active { transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1); }
.slide-right-enter-from,   .slide-right-leave-to     { opacity: 0; transform: translateX(55px); }

/* ══════════════════════════════════════════════════════
   KEYFRAMES
══════════════════════════════════════════════════════ */
@keyframes hintPulse {
	0%, 100% { opacity: 0.5; transform: scale(1); }
	50%       { opacity: 0.9; transform: scale(1.1); }
}

@keyframes keyPulse {
	0%, 100% { box-shadow: 0 0 10px rgba(232,169,70,0.4); }
	50%       { box-shadow: 0 0 22px rgba(232,169,70,0.85); }
}

@keyframes bulbPulse {
	0%, 100% { opacity: 1;   box-shadow: 0 0 7px 2px rgba(246,207,93,0.7); }
	50%       { opacity: 0.3; box-shadow: 0 0 2px 1px rgba(246,207,93,0.2); }
}

@keyframes stickerWiggle {
	0%, 100% { scale: 1; }
	50%       { scale: 1.06; }
}

/* ══════════════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════════════ */
@media (max-width: 700px) {
	.lb-wrap    { grid-template-columns: 1fr; }
	.bulb-row   { display: none; }
	.menu-item  { grid-template-columns: 2rem 2.8rem 1fr auto; }
	.item-arrow { display: none; }
	.panel-about { width: 92vw; }
	.hud-bar { font-size: 0.62rem; gap: 0.5rem; }
}

@media (prefers-reduced-motion: reduce) {
	.bulb, .sticker-a, .sticker-b, .eh-ring, .zp-key { animation: none; }
}
</style>
