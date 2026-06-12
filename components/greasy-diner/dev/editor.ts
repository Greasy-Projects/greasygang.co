import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { ROOM_BOUNDS, type ResolvedLayoutObject, type RoomKey } from "../config";

type EditableValue =
	| { kind: "vec3"; value: { x: number; y: number; z: number } }
	| { kind: "vec2"; value: { x: number; z: number } }
	| { kind: "scalar-z"; value: number };

interface EditorTarget {
	id: string;
	source: "layout" | "scene";
	collectionKey: string;
	objectKey: string;
	label: string;
	room?: RoomKey;
	path: string[];
	kind: EditableValue["kind"];
	worldPosition: THREE.Vector3;
	localOffset: THREE.Vector3;
	size: THREE.Vector3;
	color: number;
	saveable: boolean;
	sceneObject?: THREE.Object3D;
	parentHandleId?: string;
}

interface EditorHandle extends EditorTarget {
	mesh: THREE.Mesh;
	originalPosition: THREE.Vector3;
	originalQuaternion: THREE.Quaternion;
	syncedPosition: THREE.Vector3;
	syncedQuaternion: THREE.Quaternion;
	boundObjects: THREE.Object3D[];
}

interface HistoryEntry {
	handleId: string;
	position: THREE.Vector3;
	quaternion: THREE.Quaternion;
}

interface DinerDevEditorOptions {
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	renderer: THREE.WebGLRenderer;
	canvas: HTMLCanvasElement;
	objects: ResolvedLayoutObject[];
	getRoom: () => RoomKey;
	onEditingChange?: (editing: boolean) => void;
}

export interface DinerDevEditor {
	update: () => void;
	toggle: (enabled?: boolean) => void;
	dispose: () => void;
}

const round = (value: number) => Number(value.toFixed(3));

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isVec2(value: unknown): value is { x: number; z: number } {
	return (
		isRecord(value) &&
		typeof value.x === "number" &&
		typeof value.z === "number" &&
		!("y" in value)
	);
}

function isVec3(value: unknown): value is { x: number; y: number; z: number } {
	return (
		isRecord(value) &&
		typeof value.x === "number" &&
		typeof value.y === "number" &&
		typeof value.z === "number"
	);
}

function getByPath(value: unknown, path: string[]) {
	let current = value;
	for (const part of path) {
		if (!isRecord(current)) return undefined;
		current = current[part];
	}
	return current;
}

function colorForPath(path: string[]) {
	const key = path.join(".");
	if (key === "position") return 0xffcc44;
	if (key.endsWith(".position")) {
		if (path[0] === "door") return 0x66ccff;
		if (path[0] === "zone") return 0x88ff88;
		if (path[0] === "glow") return 0xffaa44;
		if (path[0] === "hangingSign") return 0xff66cc;
	}
	return 0x6688ff;
}

function materialFor(color: number) {
	return new THREE.MeshBasicMaterial({
		color,
		wireframe: true,
		transparent: true,
		opacity: 0.58,
		depthTest: false,
	});
}

function inferTargetSize(
	object: ResolvedLayoutObject,
	path: string[],
	kind: EditableValue["kind"]
) {
	if (kind === "vec3" && object.size) {
		return new THREE.Vector3(object.size.x, object.size.y, object.size.z);
	}
	if (path[0] === "door") return new THREE.Vector3(1.2, 2.5, 0.28);
	if (path[0] === "zone" && object.zone) {
		return new THREE.Vector3(
			object.zone.radius * 2,
			0.16,
			object.zone.radius * 2
		);
	}
	if (path[0] === "glow") return new THREE.Vector3(0.55, 0.55, 0.55);
	if (path[0] === "hangingSign") return new THREE.Vector3(2.8, 0.7, 0.16);
	if (path[0] === "rightWallTV") return new THREE.Vector3(3.6, 2.35, 0.24);
	return new THREE.Vector3(0.8, 0.8, 0.8);
}

function inferEditableTargets(objects: ResolvedLayoutObject[]): EditorTarget[] {
	const targets: EditorTarget[] = [];
	const candidatePaths = [
		["position"],
		["door", "position"],
		["zone", "position"],
		["glow", "position"],
		["hangingSign", "position"],
		["rightWallTV", "z"],
	] as const;

	for (const object of objects) {
		for (const path of candidatePaths) {
			const value = getByPath(object, [...path]);
			let editable: EditableValue | null = null;
			if (isVec3(value)) editable = { kind: "vec3", value };
			else if (isVec2(value)) editable = { kind: "vec2", value };
			else if (
				path.join(".") === "rightWallTV.z" &&
				typeof value === "number"
			) {
				editable = { kind: "scalar-z", value };
			}
			if (!editable) continue;

			const base = object.worldPosition
				? new THREE.Vector3(
						object.worldPosition.x,
						object.worldPosition.y,
						object.worldPosition.z
					)
				: new THREE.Vector3();
			const worldPosition =
				editable.kind === "vec3"
					? new THREE.Vector3(
							editable.value.x,
							editable.value.y,
							editable.value.z
						)
					: editable.kind === "vec2"
						? new THREE.Vector3(
								base.x + editable.value.x,
								path[0] === "hangingSign" ? 6.7 : 0.08,
								base.z + editable.value.z
							)
						: new THREE.Vector3(13.8, 4.75, editable.value);
			const localOffset = editable.kind === "vec2" ? base : new THREE.Vector3();
			const room = object.zone?.room ?? object.room;

			targets.push({
				id: `${object.collectionKey}:${object.key}:${path.join(".")}`,
				source: "layout",
				collectionKey: object.collectionKey,
				objectKey: object.key,
				label: object.label ?? object.key,
				room,
				path: [...path],
				kind: editable.kind,
				worldPosition,
				localOffset,
				size: inferTargetSize(object, [...path], editable.kind),
				color: colorForPath([...path]),
				saveable: true,
			});
		}
	}
	return targets;
}

function createHandleMesh(size: THREE.Vector3, color: number) {
	const geometry = new THREE.BoxGeometry(
		Math.max(size.x, 0.42),
		Math.max(size.y, 0.42),
		Math.max(size.z, 0.42)
	);
	const mesh = new THREE.Mesh(geometry, materialFor(color));
	mesh.renderOrder = 999;
	mesh.userData.dinerDevEditor = true;
	return mesh;
}

function objectLabel(object: THREE.Object3D, index: number) {
	const rawName = object.name || object.userData.label || object.type;
	return `${String(rawName).replace(/([a-z])([A-Z])/g, "$1 $2")} #${index}`;
}

function makeSceneObjectKey(object: THREE.Object3D, index: number) {
	return (
		object.name ||
		String(object.userData.label ?? "") ||
		`${object.type}-${index}`
	)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function makePanel() {
	const panel = document.createElement("div");
	panel.className = "diner-dev-editor";
	panel.innerHTML = `
		<div class="diner-dev-editor__title">Diner Layout Editor</div>
		<div class="diner-dev-editor__row">
			<button data-action="toggle">Enable</button>
			<button data-action="mode-translate">Move</button>
			<button data-action="mode-rotate">Rotate</button>
			<button data-action="drill-in">Drill In</button>
			<button data-action="drill-out">Up</button>
			<button data-action="release">Release</button>
			<button data-action="undo">Undo</button>
			<button data-action="reset">Reset</button>
			<button data-action="save">Save</button>
			<button data-action="copy">Copy</button>
		</div>
		<label class="diner-dev-editor__picker">
			<span>Target</span>
			<select data-role="target-list"></select>
		</label>
		<div class="diner-dev-editor__hint">Backtick/F10 toggles. Pick a target or click a wire box. Drag the gizmo arrows/rings. Esc releases. [ enters a group, ] goes up. Ctrl+S saves all dirty layout targets.</div>
		<pre data-role="status">disabled</pre>
	`;
	const style = document.createElement("style");
	style.textContent = `
		.diner-dev-editor {
			position: fixed;
			left: 12px;
			bottom: 12px;
			z-index: 10000;
			width: min(460px, calc(100vw - 24px));
			padding: 10px;
			background: rgba(8, 4, 3, 0.88);
			border: 1px solid rgba(246, 207, 93, 0.55);
			color: #fff2c8;
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			font-size: 12px;
			box-shadow: 0 10px 30px rgba(0,0,0,0.45);
		}
		.diner-dev-editor__title {
			font-weight: 800;
			letter-spacing: .08em;
			margin-bottom: 8px;
			color: #f6cf5d;
		}
		.diner-dev-editor__row {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin-bottom: 8px;
		}
		.diner-dev-editor button {
			border: 1px solid rgba(246, 207, 93, 0.5);
			background: #25120e;
			color: #fff2c8;
			padding: 5px 8px;
			cursor: pointer;
		}
		.diner-dev-editor button:hover {
			background: #3a1b12;
		}
		.diner-dev-editor__hint {
			opacity: .76;
			margin-bottom: 8px;
		}
		.diner-dev-editor__picker {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr);
			align-items: center;
			gap: 8px;
			margin-bottom: 8px;
		}
		.diner-dev-editor__picker span {
			color: #f6cf5d;
			font-weight: 800;
			letter-spacing: .06em;
		}
		.diner-dev-editor select {
			min-width: 0;
			width: 100%;
			border: 1px solid rgba(246, 207, 93, 0.5);
			background: #140806;
			color: #fff2c8;
			padding: 5px 7px;
		}
		.diner-dev-editor pre {
			white-space: pre-wrap;
			margin: 0;
			max-height: 170px;
			overflow: auto;
			color: #b7ffcf;
		}
	`;
	document.head.appendChild(style);
	document.body.appendChild(panel);
	return {
		panel,
		style,
		status: panel.querySelector("pre")!,
		targetList: panel.querySelector<HTMLSelectElement>(
			'[data-role="target-list"]'
		)!,
	};
}

export function createDinerDevEditor({
	scene,
	camera,
	renderer,
	canvas,
	objects,
	getRoom,
	onEditingChange,
}: DinerDevEditorOptions) {
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	const handles: EditorHandle[] = [];
	const handlesById = new Map<string, EditorHandle>();
	const sceneHandleIds = new Set<string>();
	const { panel, style, status, targetList } = makePanel();
	let enabled = false;
	let selected: EditorHandle | null = null;
	let saving = false;
	let lastListedRoom: RoomKey | null = null;
	let lastListedEnabled = false;
	let lastListedHandleCount = -1;
	let lastListedScope: string | null = null;
	let activeParentScopeId: string | null = null;
	let lastGoodPosition = new THREE.Vector3();
	let dragStartPosition: THREE.Vector3 | null = null;
	let dragStartQuaternion: THREE.Quaternion | null = null;
	const history: HistoryEntry[] = [];
	const dirtyHandleIds = new Set<string>();

	const controls = new TransformControls(camera, renderer.domElement);
	controls.setMode("translate");
	controls.setSize(0.85);
	controls.setSpace("world");
	const controlsHelper = controls.getHelper();
	controlsHelper.visible = false;
	controlsHelper.userData.dinerDevEditor = true;
	controlsHelper.traverse(child => {
		child.userData.dinerDevEditor = true;
		child.renderOrder = 1000;
		const mesh = child as THREE.Mesh;
		if (!("material" in mesh)) return;
		if (Array.isArray(mesh.material)) {
			mesh.material.forEach(material => {
				material.depthTest = false;
			});
		} else if (mesh.material) {
			mesh.material.depthTest = false;
		}
	});
	scene.add(controlsHelper);

	const setStatus = (message: string) => {
		status.textContent = message;
	};

	const addHandle = (target: EditorTarget) => {
		const mesh = createHandleMesh(target.size, target.color);
		mesh.position.copy(target.worldPosition);
		mesh.userData.devEditorHandleId = target.id;
		scene.add(mesh);
		const handle: EditorHandle = {
			...target,
			mesh,
			originalPosition: target.worldPosition.clone(),
			originalQuaternion: mesh.quaternion.clone(),
			syncedPosition: target.worldPosition.clone(),
			syncedQuaternion: mesh.quaternion.clone(),
			boundObjects: [],
		};
		handles.push(handle);
		handlesById.set(handle.id, handle);
	};

	for (const target of inferEditableTargets(objects)) addHandle(target);

	const roomMatches = (handle: EditorHandle, room: RoomKey) =>
		!handle.room || handle.room === room;

	const refreshTargetList = () => {
		const room = getRoom();
		if (
			room === lastListedRoom &&
			enabled === lastListedEnabled &&
			handles.length === lastListedHandleCount &&
			activeParentScopeId === lastListedScope
		)
			return;
		lastListedRoom = room;
		lastListedEnabled = enabled;
		lastListedHandleCount = handles.length;
		lastListedScope = activeParentScopeId;
		targetList.innerHTML = "";

		const empty = document.createElement("option");
		empty.value = "";
		empty.textContent = enabled
			? "Select a layout target..."
			: "Editor disabled";
		targetList.appendChild(empty);

		if (!enabled) {
			targetList.disabled = true;
			return;
		}

		targetList.disabled = !!selected;
		for (const handle of handles.filter(
			item => roomMatches(item, room) && scopeMatches(item)
		)) {
			const option = document.createElement("option");
			option.value = handle.id;
			option.textContent = `${handle.saveable ? "layout" : "scene"} / ${handle.collectionKey} / ${handle.label} / ${handle.path.join(".")}`;
			targetList.appendChild(option);
		}
		if (selected && roomMatches(selected, room)) targetList.value = selected.id;
	};

	const updateSelectionVisuals = () => {
		for (const handle of handles) {
			const material = handle.mesh.material as THREE.MeshBasicMaterial;
			const active = handle === selected;
			material.opacity = active ? 0.92 : 0.58;
			handle.mesh.scale.setScalar(active ? 1.04 : 1);
		}
	};

	const updateVisibility = () => {
		if (enabled && !selected) indexSceneObjects();
		const room = getRoom();
		for (const handle of handles) {
			handle.mesh.visible =
				enabled &&
				roomMatches(handle, room) &&
				scopeMatches(handle) &&
				(!selected || handle === selected);
		}
		controlsHelper.visible = enabled && !!selected;
		refreshTargetList();
	};

	const isFiniteVector = (vector: THREE.Vector3) =>
		Number.isFinite(vector.x) &&
		Number.isFinite(vector.y) &&
		Number.isFinite(vector.z);

	const isBindableSceneObject = (object: THREE.Object3D, nested = false) => {
		if (object.userData.dinerDevEditor) return false;
		if (object === camera || object === controlsHelper) return false;
		if (!nested && object.parent !== scene) return false;
		return (
			object instanceof THREE.Mesh ||
			object instanceof THREE.Group ||
			object instanceof THREE.Light
		);
	};

	const roomForPosition = (position: THREE.Vector3): RoomKey | undefined => {
		for (const [room, bounds] of Object.entries(ROOM_BOUNDS) as [
			RoomKey,
			(typeof ROOM_BOUNDS)[RoomKey],
		][]) {
			if (
				position.x >= bounds.minX &&
				position.x <= bounds.maxX &&
				position.z >= bounds.minZ &&
				position.z <= bounds.maxZ
			) {
				return room;
			}
		}
		return undefined;
	};

	const scopeMatches = (handle: EditorHandle) =>
		activeParentScopeId
			? handle.parentHandleId === activeParentScopeId
			: !handle.parentHandleId;

	const sizeForObject = (object: THREE.Object3D) => {
		const box = new THREE.Box3().setFromObject(object);
		const size = new THREE.Vector3();
		box.getSize(size);
		if (!isFiniteVector(size) || size.lengthSq() < 0.0001) {
			if (object instanceof THREE.Light) return new THREE.Vector3(0.7, 0.7, 0.7);
			return new THREE.Vector3(0.8, 0.8, 0.8);
		}
		size.x = Math.min(Math.max(size.x, 0.42), 5.5);
		size.y = Math.min(Math.max(size.y, 0.42), 5.5);
		size.z = Math.min(Math.max(size.z, 0.42), 5.5);
		return size;
	};

	const objectInsideLayoutHandle = (object: THREE.Object3D) => {
		const worldPosition = new THREE.Vector3();
		object.getWorldPosition(worldPosition);
		return handles.some(
			handle =>
				handle.source === "layout" &&
				handle.saveable &&
				pointInsideTarget(worldPosition, handle)
		);
	};

	const addSceneObjectHandle = (
		object: THREE.Object3D,
		index: number,
		parentHandleId?: string
	) => {
		if (!parentHandleId && objectInsideLayoutHandle(object)) return;
		const worldPosition = new THREE.Vector3();
		object.getWorldPosition(worldPosition);
		if (!isFiniteVector(worldPosition)) return;
		const objectKey = makeSceneObjectKey(object, index) || `object-${index}`;
		const id = parentHandleId
			? `scene-child:${parentHandleId}:${object.uuid}`
			: `scene:${object.uuid}`;
		if (handlesById.has(id)) return;
		sceneHandleIds.add(id);
		addHandle({
			id,
			source: "scene",
			collectionKey: "scene",
			objectKey,
			label: objectLabel(object, index),
			room: roomForPosition(worldPosition),
			path: ["position"],
			kind: "vec3",
			worldPosition,
			localOffset: new THREE.Vector3(),
			size: sizeForObject(object),
			color: object instanceof THREE.Light ? 0xffdd66 : 0x44bbff,
			saveable: false,
			sceneObject: object,
			parentHandleId,
		});
	};

	const indexSceneObjects = () => {
		let index = 0;
		for (const object of scene.children) {
			if (!isBindableSceneObject(object)) continue;
			addSceneObjectHandle(object, index++);
		}
	};

	const ensureChildHandles = (handle: EditorHandle) => {
		const parents =
			handle.source === "scene" && handle.sceneObject
				? [handle.sceneObject]
				: handle.boundObjects;
		let index = 0;
		for (const parent of parents) {
			for (const child of parent.children) {
				if (!isBindableSceneObject(child, true)) continue;
				addSceneObjectHandle(child, index++, handle.id);
			}
		}
		return handles.filter(item => item.parentHandleId === handle.id);
	};

	const drillIn = () => {
		if (!selected) {
			setStatus("select a group or object before drilling in");
			return;
		}
		bindSceneObjects(selected);
		const childHandles = ensureChildHandles(selected);
		if (!childHandles.length) {
			setStatus(`${selected.label}\nhas no editable child objects`);
			return;
		}
		activeParentScopeId = selected.id;
		select(null);
		lastListedRoom = null;
		updateVisibility();
		setStatus(
			`inside ${handlesById.get(activeParentScopeId)?.label ?? "group"}\n${childHandles.length} child target${childHandles.length === 1 ? "" : "s"}\nselect a child, or press ] / Up`
		);
	};

	const drillOut = () => {
		if (!activeParentScopeId) {
			setStatus("already at top level");
			return;
		}
		const parent = handlesById.get(activeParentScopeId) ?? null;
		activeParentScopeId = null;
		select(parent);
		lastListedRoom = null;
		updateVisibility();
	};

	const pointInsideTarget = (
		point: THREE.Vector3,
		handle: EditorHandle,
		center = handle.mesh.position
	) => {
		const size = handle.size.clone().multiplyScalar(1.28);
		size.x = Math.max(size.x, 0.95);
		size.y = Math.max(size.y, 0.95);
		size.z = Math.max(size.z, 0.95);
		return (
			Math.abs(point.x - center.x) <= size.x / 2 &&
			Math.abs(point.y - center.y) <= size.y / 2 &&
			Math.abs(point.z - center.z) <= size.z / 2
		);
	};

	const bindSceneObjects = (handle: EditorHandle) => {
		if (handle.source === "scene" && handle.sceneObject) {
			handle.boundObjects = [handle.sceneObject];
			handle.syncedPosition.copy(handle.mesh.position);
			handle.syncedQuaternion.copy(handle.mesh.quaternion);
			return;
		}
		const bound: THREE.Object3D[] = [];
		scene.traverse(object => {
			if (object.userData.devLayoutTargetId === handle.id) bound.push(object);
		});
		if (bound.length) {
			handle.boundObjects = bound;
			handle.syncedPosition.copy(handle.mesh.position);
			handle.syncedQuaternion.copy(handle.mesh.quaternion);
			return;
		}
		const worldPosition = new THREE.Vector3();
		for (const object of scene.children) {
			if (!isBindableSceneObject(object)) continue;
			object.getWorldPosition(worldPosition);
			if (pointInsideTarget(worldPosition, handle)) bound.push(object);
		}
		handle.boundObjects = bound;
		handle.syncedPosition.copy(handle.mesh.position);
		handle.syncedQuaternion.copy(handle.mesh.quaternion);
	};

	const syncBoundObjects = (handle: EditorHandle) => {
		if (!isFiniteVector(handle.mesh.position)) return;
		const deltaPosition = handle.mesh.position.clone().sub(handle.syncedPosition);
		const hasMoved = deltaPosition.lengthSq() > 0.000001;
		const hasRotated =
			handle.mesh.quaternion.angleTo(handle.syncedQuaternion) > 0.0001;
		if (!hasMoved && !hasRotated) return;

		const oldCenter = handle.syncedPosition.clone();
		const deltaQuaternion = handle.mesh.quaternion
			.clone()
			.multiply(handle.syncedQuaternion.clone().invert());

		for (const object of handle.boundObjects) {
			const objectWorldPosition = new THREE.Vector3();
			const objectWorldQuaternion = new THREE.Quaternion();
			object.getWorldPosition(objectWorldPosition);
			object.getWorldQuaternion(objectWorldQuaternion);
			const nextWorldPosition = hasRotated
				? objectWorldPosition
						.clone()
						.sub(oldCenter)
						.applyQuaternion(deltaQuaternion)
						.add(oldCenter)
				: objectWorldPosition.clone();
			if (hasMoved) nextWorldPosition.add(deltaPosition);
			const nextWorldQuaternion = hasRotated
				? deltaQuaternion.clone().multiply(objectWorldQuaternion)
				: objectWorldQuaternion;

			if (object.parent) {
				object.position.copy(object.parent.worldToLocal(nextWorldPosition));
			} else {
				object.position.copy(nextWorldPosition);
			}
			if (hasRotated) {
				if (object.parent) {
					const parentWorldQuaternion = new THREE.Quaternion();
					object.parent.getWorldQuaternion(parentWorldQuaternion);
					object.quaternion.copy(
						parentWorldQuaternion.invert().multiply(nextWorldQuaternion)
					);
				} else {
					object.quaternion.copy(nextWorldQuaternion);
				}
			}
			object.updateMatrixWorld(true);
		}

		handle.syncedPosition.copy(handle.mesh.position);
		handle.syncedQuaternion.copy(handle.mesh.quaternion);
	};

	const constrainHandlePosition = (handle: EditorHandle) => {
		if (!isFiniteVector(handle.mesh.position)) {
			handle.mesh.position.copy(lastGoodPosition);
			handle.mesh.updateMatrixWorld(true);
			return;
		}
		if (handle.kind === "vec2") {
			handle.mesh.position.y = handle.worldPosition.y;
		}
		if (handle.kind === "scalar-z") {
			handle.mesh.position.x = handle.worldPosition.x;
			handle.mesh.position.y = handle.worldPosition.y;
		}
		lastGoodPosition.copy(handle.mesh.position);
		handle.mesh.updateMatrixWorld(true);
	};

	const updateStatus = (handle: EditorHandle) => {
		setStatus(
			[
				`${handle.label}`,
				`${handle.collectionKey}.${handle.objectKey}`,
				`path: ${handle.path.join(".")}`,
				`kind: ${handle.kind}`,
				`source: ${handle.source}${handle.saveable ? "" : " (scene-only)"}`,
				`locked: yes - press Esc to release`,
				`dirty: ${dirtyHandleIds.size}`,
				`bound: ${handle.boundObjects.length} scene objects`,
				`world: ${handle.mesh.position
					.toArray()
					.map(value => round(value))
					.join(", ")}`,
			].join("\n")
		);
	};

	const markDirty = (handle: EditorHandle) => {
		dirtyHandleIds.add(handle.id);
	};

	const applyPosition = (handle: EditorHandle, position: THREE.Vector3) => {
		handle.mesh.position.copy(position);
		constrainHandlePosition(handle);
		syncBoundObjects(handle);
		if (selected === handle) {
			controls.attach(handle.mesh);
			controlsHelper.visible = enabled;
			updateStatus(handle);
		}
	};

	const pushHistory = (
		handle: EditorHandle,
		position: THREE.Vector3,
		quaternion = handle.mesh.quaternion
	) => {
		const previous = history.at(-1);
		if (
			previous?.handleId === handle.id &&
			previous.position.distanceTo(position) < 0.001 &&
			previous.quaternion.angleTo(quaternion) < 0.001
		)
			return;
		history.push({
			handleId: handle.id,
			position: position.clone(),
			quaternion: quaternion.clone(),
		});
		if (history.length > 80) history.shift();
	};

	const undo = () => {
		const entry = history.pop();
		if (!entry) {
			setStatus("nothing to undo");
			return;
		}
		const handle = handlesById.get(entry.handleId);
		if (!handle) return;
		select(handle);
		handle.mesh.quaternion.copy(entry.quaternion);
		applyPosition(handle, entry.position);
		markDirty(handle);
		setStatus(
			`undid\n${handle.collectionKey}.${handle.objectKey}\n${handle.path.join(".")}`
		);
	};

	const resetSelected = () => {
		if (!selected) {
			setStatus("select a target before reset");
			return;
		}
		pushHistory(selected, selected.mesh.position, selected.mesh.quaternion);
		selected.mesh.quaternion.copy(selected.originalQuaternion);
		applyPosition(selected, selected.originalPosition);
		markDirty(selected);
		setStatus(
			`reset\n${selected.collectionKey}.${selected.objectKey}\n${selected.path.join(".")}`
		);
	};

	const select = (handle: EditorHandle | null) => {
		selected = handle;
		if (!handle) {
			controls.detach();
			controlsHelper.visible = false;
			targetList.value = "";
			targetList.disabled = !enabled;
			updateSelectionVisuals();
			setStatus(
				enabled
					? activeParentScopeId
						? `inside ${handlesById.get(activeParentScopeId)?.label ?? "group"}\nno selection`
						: "enabled\nno selection"
					: "disabled"
			);
			updateVisibility();
			return;
		}
		constrainHandlePosition(handle);
		lastGoodPosition.copy(handle.mesh.position);
		bindSceneObjects(handle);
		controls.attach(handle.mesh);
		controlsHelper.visible = enabled;
		targetList.value = handle.id;
		targetList.disabled = true;
		updateSelectionVisuals();
		updateVisibility();
		updateStatus(handle);
	};

	const setEnabled = (next: boolean) => {
		enabled = next;
		onEditingChange?.(enabled);
		if (enabled && document.pointerLockElement) document.exitPointerLock();
		if (!enabled) select(null);
		lastListedRoom = null;
		updateVisibility();
		setStatus(
			enabled
				? `enabled\n${handles.length} inferred handles\nclick a wire box`
				: "disabled"
		);
	};

	const getPayload = (handle: EditorHandle) => {
		if (!handle.saveable) {
			throw new Error(
				`${handle.label} is a live scene object. Copy its layout snippet and move it into a layout file before saving.`
			);
		}
		constrainHandlePosition(handle);
		const world = handle.mesh.position;
		const local = world.clone().sub(handle.localOffset);
		if (!isFiniteVector(world) || !isFiniteVector(local)) {
			throw new Error("Selected layout target has an invalid transform.");
		}
		const payload: Record<string, unknown> = {
			collectionKey: handle.collectionKey,
			objectKey: handle.objectKey,
			path: handle.path,
		};
		if (handle.kind === "vec3") {
			payload.value = {
				x: round(local.x),
				y: round(local.y),
				z: round(local.z),
			};
		} else if (handle.kind === "vec2") {
			payload.value = { x: round(local.x), z: round(local.z) };
		} else {
			payload.value = round(world.z);
		}
		return payload;
	};

	const getLayoutSnippet = (handle: EditorHandle) => {
		const world = handle.mesh.position;
		const size = handle.size;
		return [
			"{",
			`	key: "${handle.objectKey}",`,
			`	label: "${handle.label.toUpperCase()}",`,
			`	position: { x: ${round(world.x)}, y: ${round(world.y)}, z: ${round(world.z)} },`,
			`	size: { x: ${round(size.x)}, y: ${round(size.y)}, z: ${round(size.z)} },`,
			"},",
		].join("\n");
	};

	const save = async () => {
		if (saving) return;
		let payloads: Record<string, unknown>[] = [];
		const dirtyHandles = [...dirtyHandleIds]
			.map(id => handlesById.get(id))
			.filter((handle): handle is EditorHandle => !!handle);
		const sceneOnlyCount = dirtyHandles.filter(handle => !handle.saveable).length;
		try {
			payloads = dirtyHandles
				.filter(handle => handle.saveable)
				.map(handle => getPayload(handle));
		} catch (error) {
			setStatus(
				`save failed\n${error instanceof Error ? error.message : String(error)}`
			);
			return;
		}
		if (!payloads.length) {
			setStatus(
				sceneOnlyCount
					? `${sceneOnlyCount} dirty scene-only target${sceneOnlyCount === 1 ? "" : "s"} cannot be saved yet\nUse Copy to create a layout snippet.`
					: "nothing dirty to save"
			);
			return;
		}
		saving = true;
		setStatus(`saving ${payloads.length} dirty target${payloads.length === 1 ? "" : "s"}...`);
		try {
			const response = await fetch("/api/dev/diner-layout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ updates: payloads }),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result?.message ?? response.statusText);
			for (const handle of dirtyHandles.filter(handle => handle.saveable)) {
				handle.originalPosition.copy(handle.mesh.position);
				handle.originalQuaternion.copy(handle.mesh.quaternion);
				dirtyHandleIds.delete(handle.id);
			}
			setStatus(
				`saved ${result.count ?? payloads.length} target${payloads.length === 1 ? "" : "s"}${sceneOnlyCount ? `\n${sceneOnlyCount} scene-only target${sceneOnlyCount === 1 ? "" : "s"} still need layout snippets` : ""}\n${(result.files ?? []).join("\n")}`
			);
		} catch (error) {
			setStatus(
				`save failed\n${error instanceof Error ? error.message : String(error)}`
			);
		} finally {
			saving = false;
		}
	};

	const copy = async () => {
		let payload: Record<string, unknown> | null = null;
		try {
			if (!selected) return;
			if (!selected.saveable) {
				const snippet = getLayoutSnippet(selected);
				await navigator.clipboard.writeText(snippet);
				setStatus(`copied layout snippet\n${snippet}`);
				return;
			}
			payload = getPayload(selected);
		} catch (error) {
			setStatus(
				`copy failed\n${error instanceof Error ? error.message : String(error)}`
			);
			return;
		}
		if (!payload) return;
		await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
		setStatus(`copied\n${JSON.stringify(payload, null, 2)}`);
	};

	const onPointerDown = (event: PointerEvent) => {
		if (!enabled) return;
		if (selected) return;
		const rect = canvas.getBoundingClientRect();
		pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(pointer, camera);
		const visibleMeshes = handles
			.filter(handle => handle.mesh.visible)
			.map(handle => handle.mesh);
		const hit = raycaster.intersectObjects(visibleMeshes, false)[0];
		if (!hit) return;
		const id = hit.object.userData.devEditorHandleId;
		if (selected?.id === id) return;
		event.preventDefault();
		event.stopPropagation();
		select(handlesById.get(id) ?? null);
	};

	const isToggleKey = (event: KeyboardEvent) =>
		event.code === "Backquote" ||
		event.code === "F10" ||
		event.key === "`" ||
		event.key === "~";

	const onKeyDown = (event: KeyboardEvent) => {
		if (isToggleKey(event)) {
			event.preventDefault();
			setEnabled(!enabled);
			return;
		}
		if (!enabled) return;
		if (event.code === "Escape") {
			event.preventDefault();
			if (selected) select(null);
			else if (activeParentScopeId) drillOut();
			return;
		}
		if (event.code === "BracketLeft") {
			event.preventDefault();
			drillIn();
			return;
		}
		if (event.code === "BracketRight") {
			event.preventDefault();
			drillOut();
			return;
		}
		if (event.code === "KeyZ" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			undo();
			return;
		}
		if (event.code === "KeyW") controls.setMode("translate");
		if (event.code === "KeyE") controls.setMode("rotate");
		if (event.code === "KeyS" && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			void save();
		}
	};

	const onPanelClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement;
		const action = target.dataset.action;
		if (!action) return;
		if (action === "toggle") setEnabled(!enabled);
		if (action === "mode-translate") controls.setMode("translate");
		if (action === "mode-rotate") controls.setMode("rotate");
		if (action === "drill-in") drillIn();
		if (action === "drill-out") drillOut();
		if (action === "release") select(null);
		if (action === "undo") undo();
		if (action === "reset") resetSelected();
		if (action === "save") void save();
		if (action === "copy") void copy();
	};

	const onPanelChange = (event: Event) => {
		const target = event.target as HTMLElement;
		if (target !== targetList) return;
		select(handlesById.get(targetList.value) ?? null);
	};

	controls.addEventListener("change", () => {
		if (!selected) return;
		constrainHandlePosition(selected);
		syncBoundObjects(selected);
		updateStatus(selected);
	});
	controls.addEventListener("dragging-changed", event => {
		const dragging = Boolean(event.value);
		if (dragging && selected) {
			dragStartPosition = selected.mesh.position.clone();
			dragStartQuaternion = selected.mesh.quaternion.clone();
		}
		if (!dragging && selected && dragStartPosition && dragStartQuaternion) {
			constrainHandlePosition(selected);
			if (
				selected.mesh.position.distanceTo(dragStartPosition) > 0.001 ||
				selected.mesh.quaternion.angleTo(dragStartQuaternion) > 0.001
			) {
				pushHistory(selected, dragStartPosition, dragStartQuaternion);
				markDirty(selected);
				updateStatus(selected);
			}
			dragStartPosition = null;
			dragStartQuaternion = null;
		}
		onEditingChange?.(enabled || dragging);
	});
	canvas.addEventListener("pointerdown", onPointerDown, true);
	document.addEventListener("keydown", onKeyDown);
	panel.addEventListener("click", onPanelClick);
	panel.addEventListener("change", onPanelChange);
	setEnabled(false);

	return {
		update: updateVisibility,
		toggle(next?: boolean) {
			setEnabled(next ?? !enabled);
		},
		dispose() {
			canvas.removeEventListener("pointerdown", onPointerDown, true);
			document.removeEventListener("keydown", onKeyDown);
			panel.removeEventListener("click", onPanelClick);
			panel.removeEventListener("change", onPanelChange);
			controls.detach();
			scene.remove(controlsHelper);
			controls.dispose();
			for (const handle of handles) {
				scene.remove(handle.mesh);
				handle.mesh.geometry.dispose();
				if (Array.isArray(handle.mesh.material)) {
					handle.mesh.material.forEach(material => material.dispose());
				} else {
					handle.mesh.material.dispose();
				}
			}
			panel.remove();
			style.remove();
		},
	};
}
