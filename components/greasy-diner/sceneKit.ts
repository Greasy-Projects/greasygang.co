import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export interface DinerPalette {
	cream: number;
	mustard: number;
	butter: number;
	red: number;
	redDark: number;
	pickle: number;
	ink: number;
	chrome: number;
	neonPink: number;
	neonBlue: number;
	sauce: number;
	amber: number;
	teal: number;
}

interface SceneKitOptions {
	scene: THREE.Scene;
	renderer: THREE.WebGLRenderer;
	gltfLoader: GLTFLoader;
	loadingManager?: THREE.LoadingManager;
	palette: DinerPalette;
}

export function createSceneKit({
	scene,
	renderer,
	gltfLoader,
	loadingManager,
	palette: C,
}: SceneKitOptions) {
	const box = (
		w: number,
		h: number,
		d: number,
		color: number,
		rough = 0.6,
		metal = 0.0,
		ei = 0,
		ec = 0x000000
	) => {
		const m = new THREE.Mesh(
			new THREE.BoxGeometry(w, h, d),
			new THREE.MeshStandardMaterial({
				color,
				roughness: rough,
				metalness: metal,
				emissive: ec,
				emissiveIntensity: ei,
			})
		);
		m.castShadow = true;
		m.receiveShadow = true;
		return m;
	};

	const roundedBox = (
		w: number,
		h: number,
		d: number,
		color: number,
		radius = 0.08,
		rough = 0.55,
		metal = 0
	) => {
		const m = new THREE.Mesh(
			new RoundedBoxGeometry(w, h, d, 3, radius),
			new THREE.MeshStandardMaterial({
				color,
				roughness: rough,
				metalness: metal,
			})
		);
		m.castShadow = true;
		m.receiveShadow = true;
		return m;
	};

	const canvasTexture = (source: HTMLCanvasElement) => {
		const texture = new THREE.CanvasTexture(source);
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
		return texture;
	};

	const setCanvasNoise = (
		ctx: CanvasRenderingContext2D,
		width: number,
		height: number,
		alpha = 0.08
	) => {
		const dots = Math.floor((width * height) / 220);
		for (let i = 0; i < dots; i++) {
			const shade = 120 + Math.random() * 80;
			ctx.fillStyle = `rgba(${shade},${shade * 0.9},${shade * 0.55},${alpha})`;
			ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
		}
	};

	const textureMaterial = (
		texture: THREE.Texture,
		options: Partial<THREE.MeshStandardMaterialParameters> = {}
	) =>
		new THREE.MeshStandardMaterial({
			map: texture,
			roughness: 0.72,
			polygonOffset: true,
			polygonOffsetFactor: -2,
			polygonOffsetUnits: -2,
			...options,
		});

	const makeGreaseSlick = (
		w = 256,
		h = 128,
		color = "#7a2f05",
		alpha = 0.45
	) => {
		const pC = document.createElement("canvas");
		pC.width = w;
		pC.height = h;
		const pctx = pC.getContext("2d")!;
		const pg = pctx.createRadialGradient(
			w * 0.48,
			h * 0.52,
			4,
			w * 0.5,
			h * 0.5,
			Math.max(w, h) * 0.42
		);
		pg.addColorStop(0, `rgba(246,207,93,${alpha})`);
		pg.addColorStop(0.42, color + "88");
		pg.addColorStop(1, "rgba(0,0,0,0)");
		pctx.fillStyle = pg;
		pctx.beginPath();
		pctx.ellipse(w * 0.5, h * 0.5, w * 0.44, h * 0.38, -0.18, 0, Math.PI * 2);
		pctx.fill();
		pctx.fillStyle = "rgba(255,242,200,0.3)";
		pctx.beginPath();
		pctx.ellipse(w * 0.32, h * 0.42, w * 0.08, h * 0.07, -0.4, 0, Math.PI * 2);
		pctx.fill();
		return canvasTexture(pC);
	};

	const textureLoader = new THREE.TextureLoader(loadingManager);
	const loadAssetTexture = (path: string) => {
		const texture = textureLoader.load(path);
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
		return texture;
	};

	const makeAssetStandee = (
		path: string,
		x: number,
		y: number,
		z: number,
		w: number,
		h: number,
		ry = 0
	) => {
		const tex = loadAssetTexture(path);
		const mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(w, h),
			new THREE.MeshStandardMaterial({
				map: tex,
				transparent: true,
				alphaTest: 0.08,
				side: THREE.DoubleSide,
				roughness: 0.72,
				metalness: 0.02,
				emissive: 0x150906,
				emissiveIntensity: 0.08,
			})
		);
		mesh.position.set(x, y, z);
		mesh.rotation.y = ry;
		mesh.castShadow = true;
		scene.add(mesh);
		return mesh;
	};

	const loadGlbProp = ({
		path,
		x,
		y,
		z,
		scale = 1,
		ry = 0,
		rx = 0,
		rz = 0,
		tint,
	}: {
		path: string;
		x: number;
		y: number;
		z: number;
		scale?: number;
		ry?: number;
		rx?: number;
		rz?: number;
		tint?: number;
	}) => {
		const holder = new THREE.Group();
		holder.position.set(x, y, z);
		holder.rotation.set(rx, ry, rz);
		scene.add(holder);

		gltfLoader.load(
			path,
			gltf => {
				const root = gltf.scene;
				root.scale.setScalar(scale);
				root.updateWorldMatrix(true, true);
				const bounds = new THREE.Box3().setFromObject(root);
				const center = bounds.getCenter(new THREE.Vector3());
				root.position.x -= center.x;
				root.position.z -= center.z;
				root.position.y -= bounds.min.y;
				root.traverse(obj => {
					if (!(obj instanceof THREE.Mesh)) return;
					obj.castShadow = true;
					obj.receiveShadow = true;
					const material = obj.material;
					if (material instanceof THREE.MeshStandardMaterial) {
						material.roughness = Math.min(material.roughness ?? 0.55, 0.62);
						material.metalness = material.metalness ?? 0.04;
						if (tint) material.color.lerp(new THREE.Color(tint), 0.35);
					}
				});
				holder.add(root);
			},
			undefined,
			error => {
				console.warn(`Could not load GLB prop: ${path}`, error);
			}
		);

		return holder;
	};

	const makeLayeredRelief = ({
		path,
		x,
		y,
		z,
		w,
		h,
		ry = 0,
		accent = C.mustard,
		label,
		layers = 2,
	}: {
		path: string;
		x: number;
		y: number;
		z: number;
		w: number;
		h: number;
		ry?: number;
		accent?: number;
		label: string;
		layers?: number;
	}) => {
		const group = new THREE.Group();
		group.position.set(x, y, z);
		group.rotation.y = ry;

		const back = roundedBox(
			w + 0.42,
			h + 0.42,
			0.16,
			0x100604,
			0.055,
			0.7,
			0.1
		);
		back.position.z = -0.06;
		group.add(back);

		const matboard = roundedBox(
			w + 0.24,
			h + 0.24,
			0.08,
			0x21100a,
			0.035,
			0.62,
			0.04
		);
		matboard.position.z = 0.02;
		group.add(matboard);

		const tex = loadAssetTexture(path);
		const planeGeo = new THREE.PlaneGeometry(w, h);
		for (let i = 0; i < layers; i++) {
			const lift = i / Math.max(1, layers - 1);
			const relief = new THREE.Mesh(
				planeGeo,
				new THREE.MeshStandardMaterial({
					map: tex,
					transparent: true,
					alphaTest: 0.08,
					side: THREE.DoubleSide,
					roughness: 0.45,
					metalness: 0.02,
					emissive: accent,
					emissiveIntensity: 0.025 + lift * 0.018,
					polygonOffset: true,
					polygonOffsetFactor: -4 - i,
					polygonOffsetUnits: -4 - i,
				})
			);
			relief.position.z = 0.085 + i * 0.018;
			relief.position.y = lift * 0.018;
			relief.scale.setScalar(1 + lift * 0.012);
			relief.castShadow = i === layers - 1; // only top layer casts shadow
			group.add(relief);
		}

		const glossC = document.createElement("canvas");
		glossC.width = 256;
		glossC.height = 256;
		const glossCtx = glossC.getContext("2d")!;
		const gloss = glossCtx.createLinearGradient(0, 0, 256, 256);
		gloss.addColorStop(0, "rgba(255,255,255,0)");
		gloss.addColorStop(0.38, "rgba(255,255,255,0)");
		gloss.addColorStop(0.5, "rgba(255,242,200,0.23)");
		gloss.addColorStop(0.62, "rgba(255,255,255,0)");
		gloss.addColorStop(1, "rgba(255,255,255,0)");
		glossCtx.fillStyle = gloss;
		glossCtx.fillRect(0, 0, 256, 256);
		const sheen = new THREE.Mesh(
			new THREE.PlaneGeometry(w + 0.05, h + 0.05),
			new THREE.MeshBasicMaterial({
				map: canvasTexture(glossC),
				transparent: true,
				depthWrite: false,
				blending: THREE.AdditiveBlending,
			})
		);
		sheen.position.z = 0.19;
		group.add(sheen);

		const plaqueC = document.createElement("canvas");
		plaqueC.width = 512;
		plaqueC.height = 128;
		const plaqueCtx = plaqueC.getContext("2d")!;
		plaqueCtx.fillStyle = "#100604";
		plaqueCtx.fillRect(0, 0, 512, 128);
		plaqueCtx.strokeStyle = `#${accent.toString(16).padStart(6, "0")}`;
		plaqueCtx.lineWidth = 8;
		plaqueCtx.strokeRect(8, 8, 496, 112);
		plaqueCtx.fillStyle = "#fff2c8";
		plaqueCtx.font = "bold 38px 'Arial Black', Impact, sans-serif";
		plaqueCtx.textAlign = "center";
		plaqueCtx.textBaseline = "middle";
		plaqueCtx.fillText(label, 256, 64);
		const plaque = new THREE.Mesh(
			new THREE.PlaneGeometry(Math.min(w + 0.2, 2.1), 0.32),
			textureMaterial(canvasTexture(plaqueC), {
				roughness: 0.5,
				metalness: 0.12,
				emissive: accent,
				emissiveIntensity: 0.08,
			})
		);
		plaque.position.set(0, -(h / 2 + 0.3), 0.2);
		group.add(plaque);

		const ledge = roundedBox(
			Math.min(w + 0.45, 2.25),
			0.12,
			0.26,
			accent,
			0.04,
			0.38,
			0.18
		);
		ledge.position.set(0, -(h / 2 + 0.1), 0.05);
		group.add(ledge);

		scene.add(group);
		return group;
	};

	return {
		box,
		canvasTexture,
		loadAssetTexture,
		loadGlbProp,
		makeAssetStandee,
		makeGreaseSlick,
		makeLayeredRelief,
		roundedBox,
		setCanvasNoise,
		textureMaterial,
	};
}
