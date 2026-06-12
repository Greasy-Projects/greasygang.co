<script setup lang="ts">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GREASY_ASSETS } from "./greasy-diner/assets";
import {
	DINER_OBJECTS,
	DINER_PALETTE,
	HANGING_SIGNS,
	RIGHT_WALL_TVS,
	ROOM_BOUNDS,
	ROOM_COLLIDERS,
	ROOM_DOORS,
	ROOM_SPAWNS,
	ZONE_GLOWS,
	ZONES,
	type Button,
	type RoomKey,
	type Section,
	type ZoneKey,
} from "./greasy-diner/config";
import {
	buildMainLoreClippings,
	buildSideLoreWalls,
	createClippingBuilder,
} from "./greasy-diner/objects/loreWalls";
import { createCounterArea } from "./greasy-diner/objects/counter";
import { buildJukebox } from "./greasy-diner/objects/jukebox";
import { createPendantLamp } from "./greasy-diner/objects/pendantLamp";
import {
	createGreasePuddle,
	createZoneGlow,
} from "./greasy-diner/objects/floorEffects";
import { createSideRoomBuilders } from "./greasy-diner/objects/rooms";
import { buildDinerSeating } from "./greasy-diner/objects/seating";
import { createBarStool } from "./greasy-diner/objects/stool";
import { createSceneKit } from "./greasy-diner/sceneKit";
import type { DinerDevEditor } from "./greasy-diner/dev/editor";

const props = defineProps<{ buttons: Button[] }>();

const { data: sponsor } = useAsyncData("sponsor", () =>
	cms(readItem("Sponsor", 1))
);

// ── REACTIVE STATE ──────────────────────────────────
const canvas = ref<HTMLCanvasElement | null>(null);
const activeSection = ref<Section>("none");
const isLocked = ref(false);
const showEnterHint = ref(true);
const isTeleporting = ref(false);
const isSceneReady = ref(false);
const loadingProgress = ref(4);
const loadingStatus = ref("warming the grill");
const teleportLabel = ref("Walking the hall");
const currentRoom = ref<RoomKey>("main");

// proximity prompt: which zone the player is standing near
const nearZone = ref<ZoneKey>("none");
const focusedLink = ref<string | null>(null);
const focusedLinkLabel = ref<string | null>(null);
const isAudioReady = ref(false);
const isJukeboxPlaying = ref(false);
const currentJukeboxTrack = ref(0);
const macLineIndex = ref(0);
const isMacSpeaking = ref(false);
const currentMacLineText = ref(
	"Welcome to the diner. Everything is served live, nothing is refunded, and the grease is structural."
);
const showAudioSettings = ref(false);
const musicVolume = ref(0.28);
const ambienceVolume = ref(0.18);
const dialogueVolume = ref(0.72);
const AUDIO_SETTINGS_KEY = "greasy-diner-audio-settings";

if (import.meta.client) {
	try {
		const saved = JSON.parse(
			localStorage.getItem(AUDIO_SETTINGS_KEY) ?? "{}"
		) as Partial<{
			musicVolume: number;
			ambienceVolume: number;
			dialogueVolume: number;
		}>;
		if (typeof saved.musicVolume === "number")
			musicVolume.value = THREE.MathUtils.clamp(saved.musicVolume, 0, 1);
		if (typeof saved.ambienceVolume === "number")
			ambienceVolume.value = THREE.MathUtils.clamp(saved.ambienceVolume, 0, 1);
		if (typeof saved.dialogueVolume === "number")
			dialogueVolume.value = THREE.MathUtils.clamp(saved.dialogueVolume, 0, 1);
	} catch {
		// Ignore corrupt local storage and keep the tuned defaults.
	}
}

const macLines = [
	{
		text: "Welcome to the GreasyGang diner. Order loud, tip weird, and do not ask what is in the sauce.",
		src: GREASY_ASSETS.audio.macWelcome,
		category: "greeting",
	},
	{
		text: "Oh hey! Welcome back to GreasyGang diner. I saved you the booth with the least mysterious stains.",
		src: GREASY_ASSETS.audio.macGreetingDoorbell,
		category: "greeting",
	},
	{
		text: "Today's special is extra grease, one suspicious fish, and a side of chat yelling at the menu board.",
		src: GREASY_ASSETS.audio.macSpecial,
		category: "specials",
	},
	{
		text: "Today only! Extra sauce, loud fries, and one burger that legally counts as a side quest.",
		src: GREASY_ASSETS.audio.macSpecialChaos,
		category: "specials",
	},
	{
		text: "You want extra sauce? Brave. Very brave. Nobody asks what batch it came from.",
		src: GREASY_ASSETS.audio.macSauceWarning,
		category: "sauce",
	},
	{
		text: "Extra sauce has been requested. The kitchen lights flicker. The fish approves.",
		src: GREASY_ASSETS.audio.macSauceSacred,
		category: "sauce",
	},
	{
		text: "The jukebox is warmed up. If it starts buzzing, that means it likes you. Probably.",
		src: GREASY_ASSETS.audio.macJukebox,
		category: "jukebox",
	},
	{
		text: "The jukebox takes coins, confidence, and sometimes emotional damage. Pick something greasy.",
		src: GREASY_ASSETS.audio.macJukeboxWarning,
		category: "jukebox",
	},
	{
		text: "Crank it up! If the floor starts moving, that is either bass or structural failure.",
		src: GREASY_ASSETS.audio.macJukeboxHype,
		category: "jukebox",
	},
	{
		text: "Careful in the fish freezer. The fish knows lore that no person should have to remember.",
		src: GREASY_ASSETS.audio.macFreezer,
		category: "freezer",
	},
	{
		text: "The freezer is humming again. If the fish starts singing back, do not harmonize.",
		src: GREASY_ASSETS.audio.macFreezerWhisper,
		category: "freezer",
	},
	{
		text: "Careful in there. The fish has sunglasses, lore, and absolutely no chill.",
		src: GREASY_ASSETS.audio.macFreezerWarning,
		category: "freezer",
	},
	{
		text: "I will never give your fries away. Never let the sauce tray down. Greasy forever, baby.",
		src: GREASY_ASSETS.audio.macSingSynthPromise,
		category: "song",
		title: "Synth Promise",
	},
	{
		text: "Grease! Grease! Grease in the night! Booth lights flashing and the fish feels right!",
		src: GREASY_ASSETS.audio.macSingEurodanceGrease,
		category: "song",
		title: "Eurodance Grease",
	},
	{
		text: "There once was a diner that served extra sauce. The chat yelled order, and Mac was the boss.",
		src: GREASY_ASSETS.audio.macSingSeaShanty,
		category: "song",
		title: "Diner Shanty",
	},
	{
		text: "Take my hand by the neon sign. We are two lost fries in a sauce-soaked timeline.",
		src: GREASY_ASSETS.audio.macSingBalladSauce,
		category: "song",
		title: "Sauce Timeline",
	},
	{
		text: "Running through the kitchen with a burger in my soul! GreasyGang forever, we are losing control!",
		src: GREASY_ASSETS.audio.macSingAnimeOpening,
		category: "song",
		title: "Kitchen Opening",
	},
	{
		text: "Tip jar jumping. Jukebox bumping. GreasyMac is singing and the counter keeps thumping.",
		src: GREASY_ASSETS.audio.macSingClubRemix,
		category: "song",
		title: "Counter Remix",
	},
	{
		text: "Welcome to the diner where the lights stay red and the sauce has a memory.",
		src: GREASY_ASSETS.audio.macSongFullDinerAnthem,
		category: "fullSong",
		title: "Full Diner Anthem",
	},
	{
		text: "The fish freezer hums, the sunglasses gleam, and the lore gets colder by the verse.",
		src: GREASY_ASSETS.audio.macSongFullFishFreezer,
		category: "fullSong",
		title: "Full Fish Freezer",
	},
	{
		text: "The jukebox is melting down in public and GreasyMac refuses to stop singing.",
		src: GREASY_ASSETS.audio.macSongFullJukeboxMeltdown,
		category: "fullSong",
		title: "Full Jukebox Meltdown",
	},
	{
		text: "A dramatic sauce ballad for anyone brave enough to order extra.",
		src: GREASY_ASSETS.audio.macSongFullSauceBallad,
		category: "fullSong",
		title: "Full Sauce Ballad",
	},
];
type MacLine = (typeof macLines)[number];
type MacLineCategory = MacLine["category"];
let lastMacLineIndex = -1;
const jukeboxTracks = [
	{
		name: "Greasy Mix",
		tempo: 165,
		lead: [392, 466, 523, 466, 392, 349, 392, 311],
		bass: [98, 98, 117, 98, 87, 98, 117, 131],
	},
	{
		name: "Freezer Shuffle",
		tempo: 126,
		lead: [330, 392, 440, 392, 349, 294, 330, 262],
		bass: [82, 98, 82, 110, 73, 82, 98, 73],
	},
	{
		name: "Counter Static",
		tempo: 144,
		lead: [523, 587, 466, 523, 392, 466, 349, 392],
		bass: [131, 98, 131, 147, 98, 87, 98, 117],
	},
];

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let restaurantGain: GainNode | null = null;
let freezerGain: GainNode | null = null;
let macAudio: HTMLAudioElement | null = null;
let jukeboxGain: GainNode | null = null;
let jukeboxAmbientAudio: HTMLAudioElement | null = null;
let jukeboxAmbientSource: MediaElementAudioSourceNode | null = null;
let jukeboxAmbientGain: GainNode | null = null;
let jukeboxAmbientPan: StereoPannerNode | null = null;
let jukeboxLead: OscillatorNode | null = null;
let jukeboxBass: OscillatorNode | null = null;
let jukeboxPulse: number | undefined;
let jukeboxStopTimeout: number | undefined;
let jukeboxStep = 0;
let ambientClatterPulse: number | undefined;
let ambientSongGapTimeout: number | undefined;
let ambientJukeboxMuted = false;
let ambientJukeboxPauseTimeout: number | undefined;
let currentAmbientSongIndex = 0;

// ── THREEJS REFS ─────────────────────────────────────
let renderer: THREE.WebGLRenderer | null = null;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let animId = 0;
let loadingProgressTimer: number | undefined;
let devEditor: DinerDevEditor | null = null;
let isDinerDevEditing = false;
let pendingDevEditorOpen = false;

// walking state
const euler = new THREE.Euler(0, 0, 0, "YXZ");
const vel = new THREE.Vector3();
const dir = new THREE.Vector3();
const keys: Record<string, boolean> = {};
let ensureRoomLoaded: ((room: RoomKey) => void) | null = null;
let syncRoomVisibility: ((room: RoomKey) => void) | null = null;

function setLoading(status: string, progress: number) {
	loadingStatus.value = status;
	loadingProgress.value = Math.max(
		loadingProgress.value,
		Math.min(99, Math.round(progress))
	);
}

function isDevEditorToggleKey(event: KeyboardEvent) {
	return (
		event.code === "Backquote" ||
		event.code === "F10" ||
		event.key === "`" ||
		event.key === "~"
	);
}

function finishLoadingProgress(onDone: () => void) {
	if (loadingProgressTimer) window.clearInterval(loadingProgressTimer);
	const finalSteps = [
		{ status: "plating the props", progress: 76 },
		{ status: "checking the fryer", progress: 84 },
		{ status: "opening the doors", progress: 93 },
		{ status: "served hot", progress: 100 },
	];
	let step = 0;
	loadingProgress.value = Math.max(loadingProgress.value, 68);
	loadingProgressTimer = window.setInterval(() => {
		const next = finalSteps[step++];
		if (!next) {
			if (loadingProgressTimer) window.clearInterval(loadingProgressTimer);
			loadingProgressTimer = undefined;
			onDone();
			return;
		}
		loadingStatus.value = next.status;
		loadingProgress.value = next.progress;
	}, 260);
}

function waitForLoaderStep(ms: number) {
	return new Promise<void>(resolve => window.setTimeout(resolve, ms));
}

function waitForPaint() {
	return new Promise<void>(resolve =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
	);
}

async function warmupLoaderThenBuild(el: HTMLCanvasElement) {
	const steps = [
		{ status: "checking the fryer", progress: 28 },
		{ status: "unstacking the booths", progress: 39 },
		{ status: "hanging the signs", progress: 51 },
		{ status: "rolling out the checkerboard", progress: 63 },
		{ status: "building diner geometry", progress: 72 },
	];

	for (const step of steps) {
		await waitForLoaderStep(230);
		setLoading(step.status, step.progress);
	}

	await waitForPaint();
	buildScene(el);
}

function makeNoiseBuffer(ctx: AudioContext, seconds = 1.5) {
	const buffer = ctx.createBuffer(
		1,
		Math.floor(ctx.sampleRate * seconds),
		ctx.sampleRate
	);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	return buffer;
}

const ambientSongSources = macLines
	.filter(line => line.category === "fullSong")
	.map(line => line.src);
const JUKEBOX_POSITION = new THREE.Vector3(-11.5, 1.6, -9.7);
const tmpAudioVec = new THREE.Vector3();
const tmpAudioQuat = new THREE.Quaternion();

function triggerAmbientClatter() {
	if (!audioContext || !restaurantGain) return;
	const now = audioContext.currentTime;
	const count = 1 + Math.floor(Math.random() * 2);
	for (let i = 0; i < count; i++) {
		const osc = audioContext.createOscillator();
		const gain = audioContext.createGain();
		const filter = audioContext.createBiquadFilter();
		osc.type = "triangle";
		osc.frequency.value = 360 + Math.random() * 720;
		filter.type = "bandpass";
		filter.frequency.value = 560 + Math.random() * 620;
		filter.Q.value = 2.2;
		gain.gain.setValueAtTime(0.0001, now + i * 0.045);
		gain.gain.exponentialRampToValueAtTime(
			0.004 + Math.random() * 0.01,
			now + i * 0.045 + 0.018
		);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.045 + 0.16);
		osc.connect(filter);
		filter.connect(gain);
		gain.connect(restaurantGain);
		osc.start(now + i * 0.045);
		osc.stop(now + i * 0.045 + 0.18);
	}
}

function startRestaurantAmbience() {
	if (!audioContext || !restaurantGain || ambientClatterPulse) return;

	const roomHum = audioContext.createOscillator();
	roomHum.type = "sine";
	roomHum.frequency.value = 92;
	const roomHumGain = audioContext.createGain();
	roomHumGain.gain.value = 0.018;
	roomHum.connect(roomHumGain);
	roomHumGain.connect(restaurantGain);
	roomHum.start();

	const distantFan = audioContext.createOscillator();
	distantFan.type = "triangle";
	distantFan.frequency.value = 138;
	const fanFilter = audioContext.createBiquadFilter();
	fanFilter.type = "lowpass";
	fanFilter.frequency.value = 240;
	const fanGain = audioContext.createGain();
	fanGain.gain.value = 0.008;
	distantFan.connect(fanFilter);
	fanFilter.connect(fanGain);
	fanGain.connect(restaurantGain);
	distantFan.start();

	ambientClatterPulse = window.setInterval(
		triggerAmbientClatter,
		3600 + Math.random() * 2200
	);
}

function startAmbientJukebox() {
	if (!audioContext || !musicGain) return;
	if (jukeboxAmbientAudio) {
		if (!ambientJukeboxMuted) void jukeboxAmbientAudio.play().catch(() => {});
		return;
	}
	const src =
		ambientSongSources[currentAmbientSongIndex % ambientSongSources.length];
	if (!src) return;

	jukeboxAmbientAudio = new Audio(src);
	jukeboxAmbientAudio.crossOrigin = "anonymous";
	jukeboxAmbientAudio.preload = "auto";
	jukeboxAmbientAudio.volume = 1;
	jukeboxAmbientAudio.addEventListener("ended", () => {
		if (!jukeboxAmbientAudio || !ambientSongSources.length) return;
		currentAmbientSongIndex =
			(currentAmbientSongIndex + 1) % ambientSongSources.length;
		if (ambientSongGapTimeout) window.clearTimeout(ambientSongGapTimeout);
		ambientSongGapTimeout = window.setTimeout(() => {
			if (!jukeboxAmbientAudio || ambientJukeboxMuted) return;
			jukeboxAmbientAudio.src = ambientSongSources[currentAmbientSongIndex];
			jukeboxAmbientAudio.currentTime = 0;
			void jukeboxAmbientAudio.play().catch(() => {});
		}, 2400);
	});

	jukeboxAmbientSource =
		audioContext.createMediaElementSource(jukeboxAmbientAudio);
	jukeboxAmbientGain = audioContext.createGain();
	jukeboxAmbientGain.gain.value = 0.045;
	jukeboxAmbientPan = audioContext.createStereoPanner();
	jukeboxAmbientPan.pan.value = -0.35;
	jukeboxAmbientSource.connect(jukeboxAmbientGain);
	jukeboxAmbientGain.connect(jukeboxAmbientPan);
	jukeboxAmbientPan.connect(musicGain);
	void jukeboxAmbientAudio.play().catch(() => {});
}

function setAmbientJukeboxMuted(muted: boolean, resumeDelay = 0) {
	if (!audioContext || !jukeboxAmbientGain) {
		ambientJukeboxMuted = muted;
		return;
	}
	if (ambientJukeboxPauseTimeout)
		window.clearTimeout(ambientJukeboxPauseTimeout);

	if (muted) {
		ambientJukeboxMuted = true;
		syncSpatialAudio();
		ambientJukeboxPauseTimeout = window.setTimeout(() => {
			if (ambientJukeboxMuted) jukeboxAmbientAudio?.pause();
		}, 700);
		return;
	}

	ambientJukeboxPauseTimeout = window.setTimeout(() => {
		ambientJukeboxMuted = false;
		if (jukeboxAmbientAudio) void jukeboxAmbientAudio.play().catch(() => {});
		syncSpatialAudio();
	}, resumeDelay);
}

function syncSpatialAudio() {
	if (!audioContext || !jukeboxAmbientGain || !jukeboxAmbientPan) return;
	const now = audioContext.currentTime;
	tmpAudioVec.copy(JUKEBOX_POSITION).sub(camera.position);
	const distance = Math.hypot(tmpAudioVec.x, tmpAudioVec.z);
	const proximity = THREE.MathUtils.clamp(1 - (distance - 1.2) / 10, 0, 1);
	const targetGain = ambientJukeboxMuted
		? 0
		: currentRoom.value === "main"
			? 0.035 + proximity * 0.32
			: 0.012;
	tmpAudioQuat.copy(camera.quaternion).invert();
	tmpAudioVec.applyQuaternion(tmpAudioQuat);
	const targetPan = THREE.MathUtils.clamp(
		tmpAudioVec.x / Math.max(distance * 0.75, 0.001),
		-0.85,
		0.85
	);
	jukeboxAmbientGain.gain.setTargetAtTime(targetGain, now, 0.22);
	jukeboxAmbientPan.pan.setTargetAtTime(targetPan, now, 0.18);

	if (restaurantGain) {
		const restaurantTarget =
			(currentRoom.value === "main" ? 0.46 : 0.12) * ambienceVolume.value;
		restaurantGain.gain.setTargetAtTime(restaurantTarget, now, 0.35);
	}
}

function applyAudioVolumes() {
	if (!audioContext) return;
	musicGain?.gain.setTargetAtTime(
		musicVolume.value,
		audioContext.currentTime,
		0.12
	);
	if (restaurantGain) {
		const restaurantTarget =
			(currentRoom.value === "main" ? 0.46 : 0.12) * ambienceVolume.value;
		restaurantGain.gain.setTargetAtTime(
			restaurantTarget,
			audioContext.currentTime,
			0.16
		);
	}
	syncFreezerBuzz();
	if (macAudio) macAudio.volume = dialogueVolume.value;
}

watch([musicVolume, ambienceVolume, dialogueVolume], () => {
	applyAudioVolumes();
	if (!import.meta.client) return;
	localStorage.setItem(
		AUDIO_SETTINGS_KEY,
		JSON.stringify({
			musicVolume: musicVolume.value,
			ambienceVolume: ambienceVolume.value,
			dialogueVolume: dialogueVolume.value,
		})
	);
});

async function ensureAudio() {
	if (!audioContext) {
		audioContext = new AudioContext();
		masterGain = audioContext.createGain();
		masterGain.gain.value = 0.78;
		masterGain.connect(audioContext.destination);

		musicGain = audioContext.createGain();
		musicGain.gain.value = musicVolume.value;
		musicGain.connect(masterGain);

		restaurantGain = audioContext.createGain();
		restaurantGain.gain.value = 0.42 * ambienceVolume.value;
		restaurantGain.connect(masterGain);

		freezerGain = audioContext.createGain();
		freezerGain.gain.value = 0;
		freezerGain.connect(masterGain);

		const hum = audioContext.createOscillator();
		hum.type = "sawtooth";
		hum.frequency.value = 58;
		const humGain = audioContext.createGain();
		humGain.gain.value = 0.22;
		hum.connect(humGain);
		humGain.connect(freezerGain);
		hum.start();

		const noise = audioContext.createBufferSource();
		noise.buffer = makeNoiseBuffer(audioContext);
		noise.loop = true;
		const filter = audioContext.createBiquadFilter();
		filter.type = "bandpass";
		filter.frequency.value = 185;
		filter.Q.value = 0.72;
		const noiseGain = audioContext.createGain();
		noiseGain.gain.value = 0.18;
		noise.connect(filter);
		filter.connect(noiseGain);
		noiseGain.connect(freezerGain);
		noise.start();

		startRestaurantAmbience();
	}
	if (audioContext.state === "suspended") await audioContext.resume();
	startAmbientJukebox();
	isAudioReady.value = true;
	syncFreezerBuzz();
	syncSpatialAudio();
}

function syncFreezerBuzz() {
	if (!audioContext || !freezerGain) return;
	const target =
		(currentRoom.value === "fish" ? 0.12 : 0) * ambienceVolume.value;
	freezerGain.gain.cancelScheduledValues(audioContext.currentTime);
	freezerGain.gain.linearRampToValueAtTime(
		target,
		audioContext.currentTime + 0.55
	);
}

function clearJukeboxNodes() {
	if (jukeboxPulse) window.clearInterval(jukeboxPulse);
	if (jukeboxStopTimeout) window.clearTimeout(jukeboxStopTimeout);
	jukeboxPulse = undefined;
	jukeboxStopTimeout = undefined;
	try {
		jukeboxLead?.stop();
		jukeboxBass?.stop();
	} catch {
		// Oscillators throw if they have already been stopped.
	}
	jukeboxLead = null;
	jukeboxBass = null;
	jukeboxGain = null;
}

function stopJukebox(resumeAmbient = true, fade = true) {
	if (!fade || !audioContext || !jukeboxGain) {
		clearJukeboxNodes();
		isJukeboxPlaying.value = false;
		if (resumeAmbient) setAmbientJukeboxMuted(false, 1600);
		return;
	}

	if (jukeboxPulse) window.clearInterval(jukeboxPulse);
	jukeboxPulse = undefined;
	const now = audioContext.currentTime;
	jukeboxGain.gain.cancelScheduledValues(now);
	jukeboxGain.gain.setValueAtTime(
		Math.max(jukeboxGain.gain.value, 0.0001),
		now
	);
	jukeboxGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
	jukeboxStopTimeout = window.setTimeout(() => {
		clearJukeboxNodes();
	}, 560);
	isJukeboxPlaying.value = false;
	if (resumeAmbient) setAmbientJukeboxMuted(false, 1600);
}

async function startJukebox(trackIndex = currentJukeboxTrack.value) {
	await ensureAudio();
	if (!audioContext) return;
	stopJukebox(false, false);
	setAmbientJukeboxMuted(true);
	currentJukeboxTrack.value = trackIndex;
	const track = jukeboxTracks[trackIndex];
	jukeboxStep = 0;

	jukeboxGain = audioContext.createGain();
	jukeboxGain.gain.value = 0.0001;
	jukeboxGain.connect(musicGain ?? masterGain ?? audioContext.destination);
	jukeboxGain.gain.exponentialRampToValueAtTime(
		0.12,
		audioContext.currentTime + 0.5
	);

	jukeboxLead = audioContext.createOscillator();
	jukeboxLead.type = "square";
	jukeboxLead.frequency.value = track.lead[0];
	const leadFilter = audioContext.createBiquadFilter();
	leadFilter.type = "lowpass";
	leadFilter.frequency.value = 1250;
	jukeboxLead.connect(leadFilter);
	leadFilter.connect(jukeboxGain);

	jukeboxBass = audioContext.createOscillator();
	jukeboxBass.type = "triangle";
	jukeboxBass.frequency.value = track.bass[0];
	const bassGain = audioContext.createGain();
	bassGain.gain.value = 0.55;
	jukeboxBass.connect(bassGain);
	bassGain.connect(jukeboxGain);

	jukeboxLead.start();
	jukeboxBass.start();
	isJukeboxPlaying.value = true;

	const beatMs = Math.max(90, Math.round(60000 / track.tempo));
	jukeboxPulse = window.setInterval(() => {
		if (!audioContext || !jukeboxLead || !jukeboxBass || !jukeboxGain) return;
		const now = audioContext.currentTime;
		const lead = track.lead[jukeboxStep % track.lead.length];
		const bass = track.bass[jukeboxStep % track.bass.length];
		jukeboxLead.frequency.setTargetAtTime(lead, now, 0.025);
		jukeboxBass.frequency.setTargetAtTime(bass, now, 0.04);
		jukeboxGain.gain.cancelScheduledValues(now);
		jukeboxGain.gain.setValueAtTime(0.18, now);
		jukeboxGain.gain.exponentialRampToValueAtTime(0.08, now + beatMs / 1000);
		jukeboxStep++;
	}, beatMs);
}

function toggleJukebox(trackIndex = currentJukeboxTrack.value) {
	if (isJukeboxPlaying.value && trackIndex === currentJukeboxTrack.value) {
		stopJukebox();
		return;
	}
	void startJukebox(trackIndex);
	void playRandomMacLine("song");
}

function pickMacLine(category?: MacLineCategory) {
	const candidates = macLines
		.map((line, index) => ({ line, index }))
		.filter(({ line }) => !category || line.category === category);
	const pool = candidates.length
		? candidates
		: macLines.map((line, index) => ({ line, index }));
	const freshPool =
		pool.length > 1
			? pool.filter(({ index }) => index !== lastMacLineIndex)
			: pool;
	return freshPool[Math.floor(Math.random() * freshPool.length)];
}

async function playMacLine(index = macLineIndex.value) {
	await ensureAudio();
	const line = macLines[index % macLines.length];
	macLineIndex.value = index % macLines.length;
	lastMacLineIndex = index % macLines.length;
	currentMacLineText.value = line.text;
	isMacSpeaking.value = true;
	macAudio?.pause();
	macAudio = new Audio(line.src);
	macAudio.volume = dialogueVolume.value;
	macAudio.addEventListener("ended", () => {
		isMacSpeaking.value = false;
	});
	try {
		await macAudio.play();
	} catch {
		isMacSpeaking.value = false;
		if ("speechSynthesis" in window) {
			const utterance = new SpeechSynthesisUtterance(line.text);
			utterance.rate = 0.92;
			utterance.pitch = 0.88;
			utterance.volume = dialogueVolume.value;
			window.speechSynthesis.speak(utterance);
		}
	}
	macLineIndex.value = (macLineIndex.value + 1) % macLines.length;
}

async function playRandomMacLine(category?: MacLineCategory) {
	const picked = pickMacLine(category);
	await playMacLine(picked.index);
}

// ── OPEN / CLOSE SECTION ─────────────────────────────
function openSection(sec: Section) {
	if (activeSection.value === sec) return;
	void ensureAudio();
	activeSection.value = sec;
	if (sec === "mac") void playRandomMacLine("greeting");
	if (document.pointerLockElement) document.exitPointerLock();
}

function closeSection() {
	activeSection.value = "none";
	// Re-enter pointer lock so player can walk immediately
	nextTick(() => {
		if (!isDinerDevEditing) canvas.value?.requestPointerLock();
	});
}

function placePlayer(x: number, z: number, yaw: number) {
	camera.position.set(x, 1.65, z);
	euler.set(0, yaw, 0);
	camera.quaternion.setFromEuler(euler);
}

async function enterRoom(room: RoomKey) {
	if (isTeleporting.value) return;
	void ensureAudio();
	isTeleporting.value = true;
	teleportLabel.value =
		room === "main"
			? "Returning to the diner"
			: `Entering ${
					room === "lore"
						? "Lore Hall"
						: room === "fish"
							? "Fish Freezer"
							: room === "kitchen"
								? "Kitchen"
								: "Live Room"
				}`;
	focusedLink.value = null;
	focusedLinkLabel.value = null;
	ensureRoomLoaded?.(room);
	syncRoomVisibility?.(currentRoom.value);
	await new Promise(resolve => window.setTimeout(resolve, 520));
	currentRoom.value = room;
	syncFreezerBuzz();
	if (room === "fish") void playRandomMacLine("freezer");
	syncRoomVisibility?.(room);
	const spawn = ROOM_SPAWNS[room];
	placePlayer(spawn.x, spawn.z, spawn.yaw);
	await nextTick();
	isTeleporting.value = false;
	if (!isDinerDevEditing && document.pointerLockElement !== canvas.value) {
		canvas.value?.requestPointerLock();
	}
}

// ── KEY E handler ────────────────────────────────────
function handleInteract() {
	if (!isLocked.value || isTeleporting.value || isDinerDevEditing) return;
	if (nearZone.value === "mac") {
		openSection("mac");
		return;
	}
	if (nearZone.value === "loreRoom") {
		enterRoom("lore");
		return;
	}
	if (nearZone.value === "fishRoom") {
		enterRoom("fish");
		return;
	}
	if (nearZone.value === "liveRoom") {
		enterRoom("live");
		return;
	}
	if (nearZone.value === "kitchenRoom") {
		enterRoom("kitchen");
		return;
	}
	if (nearZone.value === "exitMain") {
		enterRoom("main");
		return;
	}
	if (nearZone.value !== "none") {
		openSection(nearZone.value as Section);
		return;
	}
	if (focusedLink.value) {
		window.open(focusedLink.value, "_blank", "noopener noreferrer");
		return;
	}
}

onMounted(() => {
	if (!canvas.value || typeof window === "undefined") return;
	const el = canvas.value;
	loadingProgress.value = 4;
	loadingStatus.value = "warming the grill";

	setLoading("starting the renderer", 8);
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x120705, 0.019);
	scene.background = new THREE.Color(0x120705);

	camera = new THREE.PerspectiveCamera(
		72,
		el.clientWidth / el.clientHeight,
		0.05,
		80
	);
	camera.position.set(0, 1.65, 7);
	euler.set(0, 0, 0);
	camera.quaternion.setFromEuler(euler);

	renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap at 1.5 instead of 2
	renderer.setSize(el.clientWidth, el.clientHeight);
	// Use BasicShadowMap – far cheaper, good enough for diner scale
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.28;
	setLoading("prepping the diner floor", 16);

	// Let the loader visibly progress before the synchronous scene build starts.
	void warmupLoaderThenBuild(el);
});

function buildScene(el: HTMLCanvasElement) {
	const activeRenderer = renderer;
	if (!activeRenderer) return;

	const C = DINER_PALETTE;

	setLoading("hanging signs and lights", 28);
	const loadingManager = new THREE.LoadingManager();
	loadingManager.onStart = () => setLoading("fetching diner assets", 34);
	loadingManager.onProgress = (_url, loaded, total) => {
		if (!total) return;
		setLoading("fetching diner assets", 34 + (loaded / total) * 42);
	};
	loadingManager.onLoad = () => setLoading("plating the props", 78);
	loadingManager.onError = () => setLoading("using fallback props", 72);
	const gltfLoader = new GLTFLoader(loadingManager);
	const {
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
	} = createSceneKit({
		scene,
		renderer: activeRenderer,
		gltfLoader,
		loadingManager,
		palette: C,
	});

	// ── FLOOR ────────────────────────────────────────
	setLoading("laying the checkerboard", 38);
	const fc = document.createElement("canvas");
	fc.width = 1024;
	fc.height = 1024;
	const fctx = fc.getContext("2d")!;
	const TS = 64;
	for (let r = 0; r < 16; r++)
		for (let c = 0; c < 16; c++) {
			fctx.fillStyle = (r + c) % 2 === 0 ? "#ede4c4" : "#171008";
			fctx.fillRect(c * TS, r * TS, TS, TS);
			fctx.strokeStyle = "rgba(90,55,18,0.28)";
			fctx.lineWidth = 2.5;
			fctx.strokeRect(c * TS + 1, r * TS + 1, TS - 2, TS - 2);
		}
	(
		[
			[120, 200, 55, 0.14],
			[420, 680, 70, 0.1],
			[750, 300, 45, 0.12],
			[280, 850, 60, 0.09],
		] as [number, number, number, number][]
	).forEach(([x, y, r, a]) => {
		fctx.globalAlpha = a;
		fctx.fillStyle = "#2a1505";
		fctx.beginPath();
		fctx.ellipse(x, y, r, r * 0.4, 0.5, 0, Math.PI * 2);
		fctx.fill();
	});
	fctx.globalAlpha = 1;
	const floorTex = canvasTexture(fc);
	floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
	floorTex.repeat.set(3, 3);
	const floor = new THREE.Mesh(
		new THREE.PlaneGeometry(28, 24),
		new THREE.MeshStandardMaterial({
			map: floorTex,
			roughness: 0.18,
			metalness: 0.12,
		})
	);
	floor.rotation.x = -Math.PI / 2;
	floor.receiveShadow = true;
	scene.add(floor);

	// ── SUBWAY TILE TEXTURE ──────────────────────────
	const makeSubwayTex = () => {
		const sc = document.createElement("canvas");
		sc.width = 512;
		sc.height = 256;
		const s = sc.getContext("2d")!;
		s.fillStyle = "#e8e2d0";
		s.fillRect(0, 0, 512, 256);
		const TW = 80,
			TH = 36;
		for (let row = 0; row < 8; row++) {
			const off = row % 2 === 0 ? 0 : TW / 2;
			for (let col = -1; col < 8; col++) {
				const x = col * TW + off,
					y = row * TH;
				const sh = 226 + Math.floor(Math.random() * 16);
				s.fillStyle = `rgb(${sh},${sh - 4},${sh - 10})`;
				s.fillRect(x + 2, y + 2, TW - 4, TH - 4);
				s.fillStyle = "rgba(255,255,255,0.22)";
				s.fillRect(x + 3, y + 3, TW - 7, 5);
			}
		}
		const t = canvasTexture(sc);
		t.wrapS = t.wrapT = THREE.RepeatWrapping;
		t.repeat.set(4, 1);
		return t;
	};
	const subwayTex = makeSubwayTex();

	// back wall
	const bwL = new THREE.Mesh(
		new THREE.PlaneGeometry(28, 4.5),
		new THREE.MeshStandardMaterial({
			map: subwayTex,
			roughness: 0.28,
			metalness: 0.06,
		})
	);
	bwL.position.set(0, 2.25, -11.5);
	scene.add(bwL);
	const bwU = new THREE.Mesh(
		new THREE.PlaneGeometry(28, 5.5),
		new THREE.MeshStandardMaterial({ color: C.redDark, roughness: 0.75 })
	);
	bwU.position.set(0, 6.75, -11.5);
	scene.add(bwU);
	const crBack = box(28.2, 0.14, 0.08, 0x110702, 0.45, 0.18);
	crBack.position.set(0, 4.53, -11.45);
	scene.add(crBack);

	// side walls
	for (const [sx, ry] of [
		[-14, Math.PI / 2],
		[14, -Math.PI / 2],
	] as [number, number][]) {
		const swL = new THREE.Mesh(
			new THREE.PlaneGeometry(24, 4.5),
			new THREE.MeshStandardMaterial({ map: subwayTex, roughness: 0.28 })
		);
		swL.rotation.y = ry;
		swL.position.set(sx, 2.25, -1);
		scene.add(swL);
		const swU = new THREE.Mesh(
			new THREE.PlaneGeometry(24, 5.5),
			new THREE.MeshStandardMaterial({
				color: sx < 0 ? 0x6e1212 : 0x5a1010,
				roughness: 0.8,
			})
		);
		swU.rotation.y = ry;
		swU.position.set(sx, 6.75, -1);
		scene.add(swU);
		const cr = box(0.09, 0.14, 24.2, 0x110702, 0.45, 0.18);
		cr.position.set(sx + (sx < 0 ? 0.05 : -0.05), 4.53, -1);
		scene.add(cr);
	}

	// ceiling
	const cc = document.createElement("canvas");
	cc.width = 256;
	cc.height = 256;
	const cctx = cc.getContext("2d")!;
	cctx.fillStyle = "#160d07";
	cctx.fillRect(0, 0, 256, 256);
	cctx.strokeStyle = "rgba(55,28,8,0.9)";
	cctx.lineWidth = 2;
	for (let i = 0; i <= 4; i++) {
		cctx.beginPath();
		cctx.moveTo(i * 64, 0);
		cctx.lineTo(i * 64, 256);
		cctx.stroke();
		cctx.beginPath();
		cctx.moveTo(0, i * 64);
		cctx.lineTo(256, i * 64);
		cctx.stroke();
	}
	const ceilTex = canvasTexture(cc);
	ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping;
	ceilTex.repeat.set(6, 5);
	const ceil = new THREE.Mesh(
		new THREE.PlaneGeometry(28, 24),
		new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.95 })
	);
	ceil.rotation.x = Math.PI / 2;
	ceil.position.set(0, 8.5, -1);
	scene.add(ceil);

	// ── COUNTER ──────────────────────────────────────
	scene.add(createCounterArea({ C, box, canvasTexture, makeGreaseSlick }));

	// ── STOOLS ───────────────────────────────────────
	for (let i = -4.5, index = 1; i <= 4.5; i += 1.5, index++) {
		scene.add(createBarStool({ C, x: i, z: -7.4, key: `bar-stool-${index}` }));
	}

	// ── MAC NPC + COUNTER CHARACTER PIECES ───────────
	const macStandee = makeAssetStandee(
		GREASY_ASSETS.maclings.greasyHappy,
		-0.72,
		2.58,
		-9.9,
		2.15,
		3.7
	);
	macStandee.renderOrder = 2;
	const macBase = roundedBox(1.32, 0.08, 0.5, 0x2a1208, 0.04, 0.5, 0.22);
	macBase.position.set(-0.72, 1.2, -9.75);
	scene.add(macBase);
	const macGlow = new THREE.PointLight(0xffc077, 1.1, 4.2, 1.6);
	macGlow.position.set(-0.75, 3.15, -8.8);
	scene.add(macGlow);

	const talkC = document.createElement("canvas");
	talkC.width = 512;
	talkC.height = 180;
	const talkCtx = talkC.getContext("2d")!;
	talkCtx.fillStyle = "#130806";
	talkCtx.fillRect(0, 0, 512, 180);
	setCanvasNoise(talkCtx, 512, 180, 0.12);
	talkCtx.fillStyle = "#e8a946";
	talkCtx.fillRect(16, 16, 86, 132);
	talkCtx.fillStyle = "#25120e";
	talkCtx.font = "bold 90px Impact, sans-serif";
	talkCtx.textAlign = "center";
	talkCtx.fillText("E", 59, 112);
	talkCtx.fillStyle = "#fff2c8";
	talkCtx.font = "bold 58px Impact, sans-serif";
	talkCtx.textAlign = "left";
	talkCtx.fillText("TALK", 128, 92);
	talkCtx.fillStyle = "#fa4040";
	talkCtx.font = "bold 24px Arial, sans-serif";
	talkCtx.fillText("ASK FOR EXTRA SAUCE", 132, 132);
	talkCtx.strokeStyle = "#e8a946";
	talkCtx.lineWidth = 6;
	talkCtx.strokeRect(8, 8, 496, 164);
	const talkTex = canvasTexture(talkC);
	const talkSign = new THREE.Mesh(
		new THREE.PlaneGeometry(1.55, 0.54),
		textureMaterial(talkTex, {
			roughness: 0.62,
			emissive: C.mustard,
			emissiveMap: talkTex,
			emissiveIntensity: 0.22,
		})
	);
	talkSign.position.set(0.85, 3.55, -9.65);
	scene.add(talkSign);

	const maclingCards = [
		[GREASY_ASSETS.maclings.grumbsUp, -3.35, -10.72, 0.62, 0.62],
		[GREASY_ASSETS.maclings.stare, 3.2, -10.72, 0.62, 0.62],
		[GREASY_ASSETS.maclings.caught, 4.05, -10.72, 0.72, 0.62],
	] as [string, number, number, number, number][];
	maclingCards.forEach(([path, x, z, w, h]) => {
		const card = makeAssetStandee(path, x, 2.05, z, w, h);
		card.position.z = z;
	});

	const addGgModelFallback = () => {
		const fallback = roundedBox(0.7, 0.42, 0.18, C.mustard, 0.08, 0.4, 0.1);
		fallback.position.set(4.6, 1.42, -8.15);
		scene.add(fallback);
	};
	const loadGgModel = async () => {
		try {
			const { STLLoader } = await import("three/addons/loaders/STLLoader.js");
			new STLLoader().load(
				GREASY_ASSETS.models.ggStl,
				geometry => {
					geometry.computeVertexNormals();
					geometry.center();
					const ggModel = new THREE.Mesh(
						geometry,
						new THREE.MeshStandardMaterial({
							color: C.mustard,
							roughness: 0.36,
							metalness: 0.18,
							emissive: C.redDark,
							emissiveIntensity: 0.12,
						})
					);
					ggModel.scale.setScalar(0.006);
					ggModel.rotation.set(-Math.PI / 2, 0, -0.18);
					ggModel.position.set(4.6, 1.42, -8.15);
					ggModel.castShadow = true;
					ggModel.receiveShadow = true;
					scene.add(ggModel);
				},
				undefined,
				addGgModelFallback
			);
		} catch {
			addGgModelFallback();
		}
	};
	window.setTimeout(loadGgModel, 900);

	// ── NEON SIGN ────────────────────────────────────
	const signFrame = box(9.5, 2.0, 0.12, 0x080403, 0.65, 0.35);
	signFrame.position.set(0, 7.2, -11.38);
	scene.add(signFrame);
	const nSignC = document.createElement("canvas");
	nSignC.width = 2048;
	nSignC.height = 340;
	const nsc = nSignC.getContext("2d")!;
	nsc.fillStyle = "#060302";
	nsc.fillRect(0, 0, 2048, 340);
	for (let p = 0; p < 4; p++) {
		nsc.shadowColor = p < 2 ? "#f6cf5d" : "#ff8800";
		nsc.shadowBlur = 90 - p * 18;
		nsc.fillStyle = p === 3 ? "#ffffff" : "#f6cf5d";
		nsc.globalAlpha = p === 3 ? 0.55 : 1;
		nsc.font = `bold ${220 - p}px 'Arial Black', Impact, sans-serif`;
		nsc.textAlign = "center";
		nsc.textBaseline = "middle";
		nsc.fillText("GREASY GANG", 1024, 170);
	}
	nsc.globalAlpha = 1;
	const neonTex = canvasTexture(nSignC);
	const neonMesh = new THREE.Mesh(
		new THREE.PlaneGeometry(9.2, 1.8),
		new THREE.MeshStandardMaterial({
			map: neonTex,
			transparent: true,
			roughness: 1,
			emissive: 0xffd060,
			emissiveMap: neonTex,
			emissiveIntensity: 2.8,
		})
	);
	neonMesh.position.set(0, 7.2, -11.3);
	scene.add(neonMesh);
	const neonLight = new THREE.PointLight(0xf6cf5d, 3.5, 10, 1.4);
	neonLight.position.set(0, 7, -10.5);
	scene.add(neonLight);

	// ── WALL NEON TUBES ──────────────────────────────
	const makeWallNeon = (
		text: string,
		hexColor: number,
		x: number,
		y: number,
		z: number,
		ry: number
	) => {
		const wc = document.createElement("canvas");
		wc.width = 1024;
		wc.height = 160;
		const wctx = wc.getContext("2d")!;
		const hex = "#" + hexColor.toString(16).padStart(6, "0");
		wctx.shadowColor = hex;
		wctx.shadowBlur = 48;
		wctx.fillStyle = hex;
		let neonFont = 90;
		wctx.font = `bold ${neonFont}px 'Arial Black', Impact, sans-serif`;
		while (wctx.measureText(text).width > 900 && neonFont > 44) {
			neonFont -= 4;
			wctx.font = `bold ${neonFont}px 'Arial Black', Impact, sans-serif`;
		}
		wctx.textAlign = "center";
		wctx.textBaseline = "middle";
		wctx.fillText(text, 512, 80);
		wctx.shadowBlur = 20;
		wctx.fillStyle = "white";
		wctx.globalAlpha = 0.3;
		wctx.fillText(text, 512, 80);
		wctx.globalAlpha = 1;
		const tex = canvasTexture(wc);
		const mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(Math.max(3.6, text.length * 0.24), 0.58),
			new THREE.MeshStandardMaterial({
				map: tex,
				transparent: true,
				roughness: 1,
				emissive: hexColor,
				emissiveMap: tex,
				emissiveIntensity: 2.5,
				side: THREE.DoubleSide,
			})
		);
		mesh.position.set(x, y, z);
		mesh.rotation.y = ry;
		scene.add(mesh);
		const light = new THREE.PointLight(hexColor, 1.0, 4.5, 2);
		light.position.set(x + Math.sin(ry) * 0.4, y, z + Math.cos(ry) * 0.4);
		scene.add(light);
		return { mesh, light };
	};
	const openSign = makeWallNeon(
		"OPEN 24/7",
		C.neonPink,
		-13.5,
		4.4,
		1.5,
		Math.PI / 2
	);
	const greaseTube = makeWallNeon(
		"GREASE IS THE WORD",
		C.neonBlue,
		13.4,
		5.65,
		5.55,
		-Math.PI / 2
	);

	// ── ZONE INDICATOR GLOWS on floor ────────────────
	const zoneGlows = Object.fromEntries(
		ZONE_GLOWS.map(glow => [
			glow.key,
			createZoneGlow({ scene, canvasTexture }, glow.x, glow.z, glow.color),
		])
	) as Record<(typeof ZONE_GLOWS)[number]["key"], THREE.Mesh>;

	// ── INTERACTIVE 3D SOCIAL LINK BUTTONS on back wall ─
	// These are real clickable 3D planes – no overlay needed, walk up & click
	const socialLinks: {
		hitbox: THREE.Mesh;
		visual: THREE.Mesh;
		href: string;
		label: string;
	}[] = [];
	const SOCIAL_Y = 5.02;
	const SOCIAL_Z = -11.22;
	const SOCIAL_X_START = -4.65;
	props.buttons.forEach((btn, i) => {
		const bx = SOCIAL_X_START + i * 1.55;
		// canvas texture for this button
		const bC = document.createElement("canvas");
		bC.width = 512;
		bC.height = 256;
		const bctx = bC.getContext("2d")!;
		bctx.fillStyle = "#100806";
		bctx.fillRect(0, 0, 512, 256);
		bctx.fillStyle = btn.color;
		bctx.fillRect(0, 0, 14, 256);
		bctx.strokeStyle = btn.color;
		bctx.lineWidth = 3;
		bctx.strokeRect(2, 2, 508, 252);
		bctx.strokeStyle = "rgba(255,242,200,0.12)";
		bctx.lineWidth = 1;
		bctx.strokeRect(18, 18, 476, 220);
		bctx.fillStyle = btn.color + "22";
		bctx.fillRect(14, 0, 80, 256);
		bctx.fillStyle = btn.color;
		bctx.fillRect(20, 50, 70, 70);
		bctx.fillStyle = "#fff2c8";
		bctx.font = "bold 72px Impact, sans-serif";
		bctx.textAlign = "left";
		bctx.fillText(btn.text.toUpperCase(), 105, 148);
		bctx.fillStyle = btn.color;
		bctx.fillRect(
			105,
			162,
			bctx.measureText(btn.tag.toUpperCase()).width + 20,
			36
		);
		bctx.fillStyle = "white";
		bctx.font = "bold 24px Impact, sans-serif";
		bctx.fillText(btn.tag.toUpperCase(), 115, 190);
		bctx.fillStyle = "rgba(255,242,200,0.25)";
		bctx.font = "bold 48px Impact";
		bctx.textAlign = "right";
		bctx.fillText(String(i + 1).padStart(2, "0"), 498, 56);
		const tex = canvasTexture(bC);
		const btnFrame = box(1.38, 0.76, 0.07, 0x0a0604, 0.8);
		btnFrame.position.set(bx, SOCIAL_Y, SOCIAL_Z - 0.04);
		scene.add(btnFrame);
		const btnPlane = new THREE.Mesh(
			new THREE.PlaneGeometry(1.27, 0.66),
			textureMaterial(tex, {
				roughness: 0.5,
				emissive: new THREE.Color(btn.color).multiplyScalar(0.2),
				emissiveMap: tex,
				emissiveIntensity: 0.9,
			})
		);
		btnPlane.position.set(bx, SOCIAL_Y, SOCIAL_Z);
		scene.add(btnPlane);
		const hitbox = new THREE.Mesh(
			new THREE.PlaneGeometry(1.38, 0.76),
			new THREE.MeshBasicMaterial({
				transparent: true,
				opacity: 0,
				depthWrite: false,
			})
		);
		hitbox.position.set(bx, SOCIAL_Y, SOCIAL_Z + 0.03);
		hitbox.userData.href = btn.href;
		hitbox.userData.label = btn.text;
		scene.add(hitbox);
		socialLinks.push({
			hitbox,
			visual: btnPlane,
			href: btn.href,
			label: btn.text,
		});
		// subtle glow
		const btnLight = new THREE.PointLight(
			new THREE.Color(btn.color).getHex(),
			0.4,
			2.5,
			2
		);
		btnLight.position.set(bx, SOCIAL_Y, SOCIAL_Z + 0.5);
		scene.add(btnLight);
	});

	// Divider strip between sign and buttons
	const divStrip = box(11.4, 0.055, 0.06, 0xe8a946, 0.3, 0.4);
	divStrip.position.set(0, SOCIAL_Y + 0.44, SOCIAL_Z);
	scene.add(divStrip);
	const divStrip2 = box(11.4, 0.055, 0.06, 0xe8a946, 0.3, 0.4);
	divStrip2.position.set(0, SOCIAL_Y - 0.44, SOCIAL_Z);
	scene.add(divStrip2);

	// ── BACK WALL MURALS (fill empty sides of back wall) ─
	const makeMural = (
		x: number,
		text1: string,
		text2: string,
		color1: string,
		color2: string
	) => {
		const mC = document.createElement("canvas");
		mC.width = 480;
		mC.height = 560;
		const mctx = mC.getContext("2d")!;
		// background
		mctx.fillStyle = "#1a0808";
		mctx.fillRect(0, 0, 480, 560);
		// paint strokes effect
		for (let stroke = 0; stroke < 6; stroke++) {
			mctx.fillStyle = `rgba(${40 + stroke * 5},${10},${10},0.18)`;
			mctx.fillRect(0, stroke * 90, 480, 95);
		}
		// outer frame
		mctx.strokeStyle = color1;
		mctx.lineWidth = 5;
		mctx.strokeRect(8, 8, 464, 544);
		mctx.strokeStyle = "rgba(255,242,200,0.2)";
		mctx.lineWidth = 1.5;
		mctx.strokeRect(16, 16, 448, 528);
		// main text
		mctx.shadowColor = color1;
		mctx.shadowBlur = 30;
		mctx.fillStyle = color1;
		mctx.font = "bold 88px Impact, sans-serif";
		mctx.textAlign = "center";
		mctx.fillText(text1, 240, 200);
		mctx.shadowBlur = 0;
		mctx.fillStyle = color2;
		mctx.font = "bold 72px Impact, sans-serif";
		mctx.fillText(text2, 240, 310);
		mctx.fillStyle = "rgba(255,242,200,0.3)";
		mctx.font = "italic 26px serif";
		mctx.fillText("greasygang.co", 240, 500);
		const mfr = box(2.8, 3.3, 0.08, 0x100606, 0.8);
		mfr.position.set(x, 6.2, -11.38);
		scene.add(mfr);
		const mm = new THREE.Mesh(
			new THREE.PlaneGeometry(2.6, 3.1),
			textureMaterial(canvasTexture(mC), {
				roughness: 0.8,
				emissive: 0x0a0404,
				emissiveIntensity: 0.25,
			})
		);
		mm.position.set(x, 6.2, -11.3);
		scene.add(mm);
	};
	makeMural(-11.5, "OPEN", "LATE", "#fa4040", "#e8a946");
	makeMural(11.5, "EST.", "2019", "#e8a946", "#fff2c8");

	// ── HANGING LAMPS ────────────────────────────────
	const lampLights: THREE.PointLight[] = [];
	[
		{ x: -5.8, z: -6.15, key: "pendant-lamp-left" },
		{ x: 5.8, z: -6.15, key: "pendant-lamp-right" },
	].forEach(({ x, z, key }) => {
		const { group, light } = createPendantLamp({
			C,
			assets: GREASY_ASSETS,
			loadGlbProp,
			x,
			z,
			key,
		});
		scene.add(group);
		lampLights.push(light);
	});

	buildDinerSeating({
		scene,
		C,
		assets: GREASY_ASSETS,
		box,
		roundedBox,
		makeGreaseSlick,
		loadGlbProp,
	});
	const { glow: jbGlow } = buildJukebox({
		scene,
		C,
		roundedBox,
		canvasTexture,
	});

	// ── FRAMED POSTERS ───────────────────────────────
	const makePoster = (
		x: number,
		y: number,
		z: number,
		ry: number,
		lines: string[],
		bg: string
	) => {
		const pC = document.createElement("canvas");
		pC.width = 320;
		pC.height = 420;
		const pctx = pC.getContext("2d")!;
		pctx.fillStyle = bg;
		pctx.fillRect(0, 0, 320, 420);
		pctx.strokeStyle = "#fff2c8";
		pctx.lineWidth = 9;
		pctx.strokeRect(10, 10, 300, 400);
		pctx.strokeStyle = "#e8a946";
		pctx.lineWidth = 3;
		pctx.strokeRect(20, 20, 280, 380);
		pctx.fillStyle = "#fff2c8";
		pctx.font = "bold 42px 'Arial Black', Impact, sans-serif";
		pctx.textAlign = "center";
		lines.forEach((l, i) => pctx.fillText(l, 160, 110 + i * 65));
		const fr = box(0.88, 1.15, 0.045, 0x150902, 0.55);
		fr.position.set(x, y, z);
		fr.rotation.y = ry;
		scene.add(fr);
		const pm = new THREE.Mesh(
			new THREE.PlaneGeometry(0.8, 1.06),
			textureMaterial(canvasTexture(pC), { roughness: 0.88 })
		);
		pm.position.set(x + Math.sin(ry) * 0.025, y, z + Math.cos(ry) * 0.025);
		pm.rotation.y = ry;
		scene.add(pm);
	};
	// Posters pulled 0.04u off the wall face so they don't z-fight
	makePoster(-13.82, 5.4, -5.5, Math.PI / 2, ["NO", "REFUNDS"], "#7a0000");
	makePoster(-13.82, 5.4, -8.5, Math.PI / 2, ["GREASY", "SPECIAL"], "#1a4a22");
	makePoster(13.82, 2.55, -5.2, -Math.PI / 2, ["EXTRA", "GREASY"], "#8b4000");
	makePoster(13.82, 2.55, -9.15, -Math.PI / 2, ["OPEN", "LATE"], "#0a2558");

	// ── ROOM PORTALS ─────────────────────────────────
	const makeRoomDoor = ({
		x,
		y,
		z,
		ry,
		title,
		subtitle,
		accent,
	}: {
		x: number;
		y: number;
		z: number;
		ry: number;
		title: string;
		subtitle: string;
		accent: number;
	}) => {
		const doorC = document.createElement("canvas");
		doorC.width = 512;
		doorC.height = 768;
		const dctx = doorC.getContext("2d")!;
		const accentHex = `#${accent.toString(16).padStart(6, "0")}`;
		const base = dctx.createLinearGradient(0, 0, 512, 768);
		base.addColorStop(0, "#240b07");
		base.addColorStop(0.42, "#100604");
		base.addColorStop(1, "#050303");
		dctx.fillStyle = base;
		dctx.fillRect(0, 0, 512, 768);
		setCanvasNoise(dctx, 512, 768, 0.11);
		dctx.strokeStyle = accentHex;
		dctx.lineWidth = 18;
		dctx.strokeRect(34, 34, 444, 700);
		dctx.lineWidth = 7;
		dctx.strokeStyle = "rgba(255,242,200,0.18)";
		dctx.strokeRect(64, 72, 384, 622);
		for (let i = 0; i < 4; i++) {
			dctx.fillStyle =
				i % 2 === 0 ? "rgba(255,242,200,0.045)" : "rgba(0,0,0,0.16)";
			dctx.fillRect(86, 110 + i * 142, 340, 88);
			dctx.strokeStyle = "rgba(255,242,200,0.11)";
			dctx.lineWidth = 3;
			dctx.strokeRect(86, 110 + i * 142, 340, 88);
		}
		dctx.fillStyle = accentHex;
		dctx.globalAlpha = 0.2;
		for (let y = 74; y < 720; y += 46) dctx.fillRect(42, y, 436, 2);
		dctx.globalAlpha = 1;
		const handleX = ry > 0 ? 128 : 384;
		dctx.fillStyle = "#e8a946";
		dctx.beginPath();
		dctx.arc(handleX, 394, 22, 0, Math.PI * 2);
		dctx.fill();
		dctx.fillStyle = "rgba(255,242,200,0.75)";
		dctx.beginPath();
		dctx.arc(handleX - 7, 386, 6, 0, Math.PI * 2);
		dctx.fill();
		dctx.fillStyle = "#fff2c8";
		dctx.font = "bold 34px Impact, sans-serif";
		dctx.textAlign = "center";
		dctx.fillText(title, 256, 660);

		const door = roundedBox(1.55, 2.45, 0.16, 0x170806, 0.06, 0.62, 0.08);
		door.position.set(x, y, z);
		door.rotation.y = ry;
		scene.add(door);

		const inset = roundedBox(1.24, 1.95, 0.08, 0x080504, 0.04, 0.5, 0.16);
		inset.position.set(
			x + Math.sin(ry) * 0.055,
			y + 0.03,
			z + Math.cos(ry) * 0.055
		);
		inset.rotation.y = ry;
		scene.add(inset);

		const doorSkinTex = canvasTexture(doorC);
		const doorSkin = new THREE.Mesh(
			new THREE.PlaneGeometry(1.18, 1.86),
			textureMaterial(doorSkinTex, {
				roughness: 0.58,
				metalness: 0.1,
				emissive: accent,
				emissiveMap: doorSkinTex,
				emissiveIntensity: 0.06,
			})
		);
		doorSkin.position.set(
			x + Math.sin(ry) * 0.102,
			y + 0.03,
			z + Math.cos(ry) * 0.102
		);
		doorSkin.rotation.y = ry;
		scene.add(doorSkin);

		const trimTop = box(1.72, 0.09, 0.08, accent, 0.22, 0.42);
		trimTop.position.set(
			x + Math.sin(ry) * 0.09,
			y + 1.28,
			z + Math.cos(ry) * 0.09
		);
		trimTop.rotation.y = ry;
		scene.add(trimTop);
		const trimBottom = box(1.72, 0.09, 0.08, accent, 0.22, 0.42);
		trimBottom.position.set(
			x + Math.sin(ry) * 0.09,
			y - 1.23,
			z + Math.cos(ry) * 0.09
		);
		trimBottom.rotation.y = ry;
		scene.add(trimBottom);

		const signC = document.createElement("canvas");
		signC.width = 640;
		signC.height = 220;
		const signCtx = signC.getContext("2d")!;
		signCtx.fillStyle = "#100604";
		signCtx.fillRect(0, 0, 640, 220);
		signCtx.strokeStyle = `#${accent.toString(16).padStart(6, "0")}`;
		signCtx.lineWidth = 12;
		signCtx.strokeRect(12, 12, 616, 196);
		signCtx.fillStyle = "#fff2c8";
		signCtx.font = "bold 62px 'Arial Black', Impact, sans-serif";
		signCtx.textAlign = "center";
		signCtx.fillText(title, 320, 92);
		signCtx.fillStyle = `#${accent.toString(16).padStart(6, "0")}`;
		signCtx.font = "bold 31px Impact, sans-serif";
		signCtx.fillText(subtitle, 320, 150);
		signCtx.fillStyle = "rgba(255,242,200,0.3)";
		signCtx.font = "bold 24px Impact, sans-serif";
		signCtx.fillText("PRESS E", 320, 188);

		const signTex = canvasTexture(signC);
		const sign = new THREE.Mesh(
			new THREE.PlaneGeometry(1.7, 0.58),
			textureMaterial(signTex, {
				roughness: 0.62,
				emissive: accent,
				emissiveMap: signTex,
				emissiveIntensity: 0.38,
			})
		);
		sign.position.set(
			x + Math.sin(ry) * 0.12,
			y + 1.58,
			z + Math.cos(ry) * 0.12
		);
		sign.rotation.y = ry;
		scene.add(sign);

		const glow = new THREE.PointLight(accent, 0.85, 3.2, 2);
		glow.position.set(
			x + Math.sin(ry) * 0.55,
			y + 0.48,
			z + Math.cos(ry) * 0.55
		);
		scene.add(glow);
		return { door, sign, glow };
	};
	const roomDoors = Object.fromEntries(
		ROOM_DOORS.map(door => [door.key, door])
	) as Record<(typeof ROOM_DOORS)[number]["key"], (typeof ROOM_DOORS)[number]>;
	const makePlacedRoomDoor = (key: keyof typeof roomDoors) => {
		const door = roomDoors[key];
		return makeRoomDoor({
			x: door.position.x,
			y: door.position.y,
			z: door.position.z,
			ry: door.ry,
			title: door.title,
			subtitle: door.subtitle,
			accent: door.accent,
		});
	};

	const loreDoor = makePlacedRoomDoor("loreRoom");
	const fishDoor = makePlacedRoomDoor("fishRoom");
	const liveDoor = makePlacedRoomDoor("liveRoom");
	const kitchenDoor = makePlacedRoomDoor("kitchenRoom");

	// ── ENTERABLE SIDE ROOMS ─────────────────────────
	const makeRoomSign = (
		text: string,
		accent: number,
		x: number,
		y: number,
		z: number,
		ry: number,
		w = 2.6,
		h = 0.7
	) => {
		const sC = document.createElement("canvas");
		sC.width = 720;
		sC.height = 220;
		const sctx = sC.getContext("2d")!;
		sctx.fillStyle = "#100604";
		sctx.fillRect(0, 0, 720, 220);
		sctx.strokeStyle = `#${accent.toString(16).padStart(6, "0")}`;
		sctx.lineWidth = 14;
		sctx.strokeRect(18, 18, 684, 184);
		sctx.fillStyle = "#fff2c8";
		sctx.font = "bold 68px 'Arial Black', Impact, sans-serif";
		sctx.textAlign = "center";
		sctx.fillText(text, 360, 134);
		const tex = canvasTexture(sC);
		const sign = new THREE.Mesh(
			new THREE.PlaneGeometry(w, h),
			textureMaterial(tex, {
				emissive: accent,
				emissiveMap: tex,
				emissiveIntensity: 0.36,
			})
		);
		sign.position.set(x, y, z);
		sign.rotation.y = ry;
		scene.add(sign);
		return sign;
	};

	let freezerWallTex: THREE.Texture | null = null;
	let freezerFloorTex: THREE.Texture | null = null;
	const getFreezerWallTexture = () => {
		if (freezerWallTex) return freezerWallTex;
		const c = document.createElement("canvas");
		c.width = 512;
		c.height = 512;
		const ctx = c.getContext("2d")!;
		const gradient = ctx.createLinearGradient(0, 0, 0, 512);
		gradient.addColorStop(0, "#d9fff8");
		gradient.addColorStop(0.42, "#93c7bf");
		gradient.addColorStop(1, "#345c59");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, 512, 512);
		for (let y = 0; y < 512; y += 96) {
			ctx.fillStyle =
				y % 192 === 0 ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.1)";
			ctx.fillRect(0, y, 512, 42);
			ctx.strokeStyle = "rgba(0,60,70,0.28)";
			ctx.lineWidth = 4;
			ctx.strokeRect(10, y + 8, 492, 78);
		}
		for (let x = 48; x < 512; x += 96) {
			for (let y = 42; y < 512; y += 96) {
				ctx.fillStyle = "rgba(240,255,255,0.45)";
				ctx.beginPath();
				ctx.arc(x, y, 5, 0, Math.PI * 2);
				ctx.fill();
				ctx.strokeStyle = "rgba(20,70,72,0.45)";
				ctx.stroke();
			}
		}
		for (let i = 0; i < 70; i++) {
			const x = Math.random() * 512;
			const y = Math.random() * 512;
			const h = 12 + Math.random() * 52;
			ctx.strokeStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.18})`;
			ctx.lineWidth = 2 + Math.random() * 3;
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + Math.random() * 24 - 12, y + h);
			ctx.stroke();
		}
		setCanvasNoise(ctx, 512, 512, 0.07);
		freezerWallTex = canvasTexture(c);
		freezerWallTex.wrapS = THREE.RepeatWrapping;
		freezerWallTex.wrapT = THREE.RepeatWrapping;
		freezerWallTex.repeat.set(2, 1);
		return freezerWallTex;
	};
	const getFreezerFloorTexture = () => {
		if (freezerFloorTex) return freezerFloorTex;
		const c = document.createElement("canvas");
		c.width = 512;
		c.height = 512;
		const ctx = c.getContext("2d")!;
		ctx.fillStyle = "#0b1618";
		ctx.fillRect(0, 0, 512, 512);
		for (let y = 0; y < 512; y += 64) {
			for (let x = 0; x < 512; x += 64) {
				ctx.fillStyle = (x / 64 + y / 64) % 2 === 0 ? "#25454a" : "#101c20";
				ctx.fillRect(x, y, 64, 64);
				ctx.strokeStyle = "rgba(180,255,245,0.22)";
				ctx.lineWidth = 2;
				ctx.strokeRect(x + 2, y + 2, 60, 60);
			}
		}
		setCanvasNoise(ctx, 512, 512, 0.1);
		freezerFloorTex = canvasTexture(c);
		freezerFloorTex.wrapS = THREE.RepeatWrapping;
		freezerFloorTex.wrapT = THREE.RepeatWrapping;
		freezerFloorTex.repeat.set(3, 3);
		return freezerFloorTex;
	};

	const makeRoomShell = ({
		cx,
		cz,
		w,
		d,
		accent,
		title,
		variant = "diner",
	}: {
		cx: number;
		cz: number;
		w: number;
		d: number;
		accent: number;
		title: string;
		variant?: "diner" | "freezer";
	}) => {
		const group = new THREE.Group();
		group.position.set(cx, 0, cz);
		scene.add(group);

		const freezer = variant === "freezer";
		const floor = new THREE.Mesh(
			new THREE.PlaneGeometry(w, d),
			new THREE.MeshStandardMaterial({
				map: freezer ? getFreezerFloorTexture() : floorTex,
				roughness: freezer ? 0.32 : 0.18,
				metalness: freezer ? 0.28 : 0.12,
			})
		);
		floor.rotation.x = -Math.PI / 2;
		floor.position.y = -0.006;
		floor.receiveShadow = true;
		group.add(floor);

		const wallMat = new THREE.MeshStandardMaterial({
			map: freezer ? getFreezerWallTexture() : null,
			color: freezer ? 0xb7fff6 : 0x3a100d,
			roughness: freezer ? 0.48 : 0.78,
			metalness: freezer ? 0.18 : 0.02,
		});
		const lowerMat = new THREE.MeshStandardMaterial({
			map: freezer ? getFreezerWallTexture() : subwayTex,
			color: freezer ? 0xc9fff8 : 0xffe3b0,
			roughness: freezer ? 0.42 : 0.66,
			metalness: freezer ? 0.22 : 0.02,
		});
		const ceilingMat = new THREE.MeshStandardMaterial({
			color: freezer ? 0x061012 : 0x090302,
			roughness: freezer ? 0.68 : 0.85,
			metalness: freezer ? 0.2 : 0,
		});

		const back = new THREE.Mesh(new THREE.BoxGeometry(w, 4.8, 0.18), wallMat);
		back.position.set(0, 2.4, -d / 2);
		group.add(back);
		const front = new THREE.Mesh(new THREE.BoxGeometry(w, 4.8, 0.18), wallMat);
		front.position.set(0, 2.4, d / 2);
		group.add(front);
		const left = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.8, d), wallMat);
		left.position.set(-w / 2, 2.4, 0);
		group.add(left);
		const right = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.8, d), wallMat);
		right.position.set(w / 2, 2.4, 0);
		group.add(right);

		for (const wall of [
			{ x: 0, z: -d / 2 + 0.1, ry: 0, ww: w - 0.3 },
			{ x: 0, z: d / 2 - 0.1, ry: Math.PI, ww: w - 0.3 },
			{ x: -w / 2 + 0.1, z: 0, ry: Math.PI / 2, ww: d - 0.3 },
			{ x: w / 2 - 0.1, z: 0, ry: -Math.PI / 2, ww: d - 0.3 },
		]) {
			const lower = new THREE.Mesh(
				new THREE.PlaneGeometry(wall.ww, 2.2),
				lowerMat
			);
			lower.position.set(wall.x, 1.35, wall.z);
			lower.rotation.y = wall.ry;
			group.add(lower);
			const rail = new THREE.Mesh(
				new THREE.BoxGeometry(wall.ww, 0.08, 0.08),
				new THREE.MeshStandardMaterial({ color: 0x120604, roughness: 0.6 })
			);
			rail.position.set(wall.x, 2.5, wall.z);
			rail.rotation.y = wall.ry;
			group.add(rail);
		}

		const ceiling = new THREE.Mesh(
			new THREE.BoxGeometry(w, 0.12, d),
			ceilingMat
		);
		ceiling.position.set(0, 4.78, 0);
		group.add(ceiling);

		const roomLight = new THREE.PointLight(accent, 1.2, 10, 1.7);
		roomLight.position.set(0, 3.5, 0);
		group.add(roomLight);
		if (freezer) {
			const coldLight = new THREE.PointLight(0xcfffff, 0.75, 8, 1.8);
			coldLight.position.set(-2.2, 2.7, -1.1);
			group.add(coldLight);
			for (const zLine of [-d / 2 + 1.0, 0, d / 2 - 1.0]) {
				const pipe = new THREE.Mesh(
					new THREE.CylinderGeometry(0.035, 0.035, w - 1.2, 16),
					new THREE.MeshStandardMaterial({
						color: 0xbbeee6,
						roughness: 0.28,
						metalness: 0.48,
					})
				);
				pipe.rotation.z = Math.PI / 2;
				pipe.position.set(0, 4.18, zLine);
				group.add(pipe);
			}
			for (let i = 0; i < 18; i++) {
				const frost = new THREE.Mesh(
					new THREE.PlaneGeometry(0.25 + Math.random() * 0.35, 0.18),
					new THREE.MeshStandardMaterial({
						color: 0xe8ffff,
						transparent: true,
						opacity: 0.28,
						roughness: 0.2,
						depthWrite: false,
					})
				);
				frost.position.set(
					-w / 2 + 0.18,
					1.4 + Math.random() * 2.2,
					-d / 2 + 0.8 + Math.random() * (d - 1.6)
				);
				frost.rotation.y = Math.PI / 2;
				group.add(frost);
			}
		}
		makeRoomSign(title, accent, cx, 3.55, cz - d / 2 + 0.12, 0, 3.1, 0.72);
		return group;
	};

	const makeRoomScreen = ({
		title,
		lines,
		x,
		y,
		z,
		ry,
		w,
		h,
		accent,
	}: {
		title: string;
		lines: string[];
		x: number;
		y: number;
		z: number;
		ry: number;
		w: number;
		h: number;
		accent: number;
	}) => {
		const sc = document.createElement("canvas");
		sc.width = 900;
		sc.height = 520;
		const ctx = sc.getContext("2d")!;
		ctx.fillStyle = "#040709";
		ctx.fillRect(0, 0, 900, 520);
		const glow = ctx.createRadialGradient(450, 270, 20, 450, 260, 420);
		glow.addColorStop(0, `#${accent.toString(16).padStart(6, "0")}66`);
		glow.addColorStop(0.55, "rgba(20,30,60,0.35)");
		glow.addColorStop(1, "rgba(0,0,0,0)");
		ctx.fillStyle = glow;
		ctx.fillRect(0, 0, 900, 520);
		ctx.strokeStyle = `#${accent.toString(16).padStart(6, "0")}`;
		ctx.lineWidth = 10;
		ctx.strokeRect(18, 18, 864, 484);
		ctx.fillStyle = "#fff2c8";
		ctx.font = "bold 58px 'Arial Black', Impact, sans-serif";
		ctx.fillText(title, 48, 86);
		ctx.font = "bold 30px Impact, sans-serif";
		lines.forEach((line, i) => ctx.fillText(line, 58, 160 + i * 48));
		ctx.fillStyle = `#${accent.toString(16).padStart(6, "0")}`;
		for (let i = 0; i < 22; i++) {
			ctx.globalAlpha = 0.18 + Math.random() * 0.45;
			ctx.fillRect(
				70 + Math.random() * 760,
				130 + Math.random() * 330,
				18 + Math.random() * 60,
				3
			);
		}
		ctx.globalAlpha = 1;

		const tex = canvasTexture(sc);
		const frame = roundedBox(
			w + 0.18,
			h + 0.18,
			0.16,
			0x030202,
			0.05,
			0.48,
			0.2
		);
		frame.position.set(x - Math.sin(ry) * 0.04, y, z - Math.cos(ry) * 0.04);
		frame.rotation.y = ry;
		scene.add(frame);
		const screen = new THREE.Mesh(
			new THREE.PlaneGeometry(w, h),
			textureMaterial(tex, {
				emissive: accent,
				emissiveMap: tex,
				emissiveIntensity: 0.72,
				roughness: 0.28,
				metalness: 0.08,
			})
		);
		screen.position.set(x, y, z);
		screen.rotation.y = ry;
		scene.add(screen);
		return screen;
	};

	const roomObjects: Partial<Record<RoomKey, THREE.Object3D[]>> = {};
	const captureRoomBuild = (room: RoomKey, build: () => void) => {
		if (roomObjects[room]) return;
		const before = new Set(scene.children);
		build();
		const created = scene.children.filter(child => !before.has(child));
		created.forEach(child => {
			child.visible = currentRoom.value === room;
		});
		roomObjects[room] = created;
	};

	const makeClipping = createClippingBuilder({
		scene,
		box,
		canvasTexture,
		textureMaterial,
	});
	buildMainLoreClippings(makeClipping);

	const { buildLoreRoom, buildFishRoom, buildLiveRoom, buildKitchenRoom } =
		createSideRoomBuilders({
			scene,
			C,
			assets: GREASY_ASSETS,
			roundedBox,
			textureMaterial,
			loadAssetTexture,
			makeGreaseSlick,
			makeRoomShell,
			makePlacedRoomDoor,
			loadGlbProp,
			makeRoomSign,
			makeRoomScreen,
			makeLayeredRelief,
			makeClipping,
		});

	ensureRoomLoaded = (room: RoomKey) => {
		if (room === "main") return;
		if (room === "lore") captureRoomBuild("lore", buildLoreRoom);
		if (room === "fish") captureRoomBuild("fish", buildFishRoom);
		if (room === "live") captureRoomBuild("live", buildLiveRoom);
		if (room === "kitchen") captureRoomBuild("kitchen", buildKitchenRoom);
	};
	syncRoomVisibility = (room: RoomKey) => {
		for (const [key, objects] of Object.entries(roomObjects) as [
			RoomKey,
			THREE.Object3D[],
		][]) {
			objects.forEach(object => {
				object.visible = key === room;
			});
		}
	};

	const { maclingRelief } = buildSideLoreWalls({
		scene,
		C,
		assets: GREASY_ASSETS,
		box,
		roundedBox,
		canvasTexture,
		textureMaterial,
		setCanvasNoise,
		makeLayeredRelief,
	});

	// ── LORE BOARD: Wall of Fame (right wall upper) ──
	const makeWallOfFame = () => {
		const wC2 = document.createElement("canvas");
		wC2.width = 900;
		wC2.height = 640;
		const ctx2 = wC2.getContext("2d")!;
		ctx2.fillStyle = "#0d0805";
		ctx2.fillRect(0, 0, 900, 640);
		ctx2.strokeStyle = "#e8a946";
		ctx2.lineWidth = 4;
		ctx2.strokeRect(6, 6, 888, 628);
		ctx2.strokeStyle = "rgba(232,169,70,0.3)";
		ctx2.lineWidth = 1.5;
		ctx2.strokeRect(14, 14, 872, 612);
		ctx2.shadowColor = "#e8a946";
		ctx2.shadowBlur = 18;
		ctx2.fillStyle = "#e8a946";
		ctx2.font = "bold 58px 'Arial Black', Impact, sans-serif";
		ctx2.textAlign = "center";
		ctx2.fillText("WALL OF LEGENDS", 450, 68);
		ctx2.shadowBlur = 0;
		ctx2.strokeStyle = "rgba(232,169,70,0.4)";
		ctx2.lineWidth = 1;
		ctx2.beginPath();
		ctx2.moveTo(30, 82);
		ctx2.lineTo(870, 82);
		ctx2.stroke();
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
		ctx2.fillStyle = "#fff2c8";
		ctx2.font = "28px Arial, sans-serif";
		ctx2.textAlign = "left";
		events.forEach((ev, i) => {
			if (i === 5) {
				ctx2.textAlign = "left";
			}
			const col = i < 5 ? 42 : 470;
			const row = i % 5;
			ctx2.fillText(ev, col, 132 + row * 96);
		});
		ctx2.fillStyle = "rgba(232,169,70,0.28)";
		ctx2.font = "italic 20px serif";
		ctx2.textAlign = "center";
		ctx2.fillText('"variety streamer. los angeles. extra greasy."', 450, 610);
		// Wall of fame lives in the rear-right corner, clear of the TV bank.
		const group = new THREE.Group();
		group.name = "wall-of-legends";
		group.userData.label = "Wall of Legends";
		group.rotation.y = -Math.PI / 2;
		group.position.set(13.84, 4.7, -9.85);
		scene.add(group);

		const fr2 = box(3.75, 2.95, 0.1, 0x0a0604, 0.8);
		fr2.name = "frame";
		group.add(fr2);

		const boardTex = canvasTexture(wC2);
		const board = new THREE.Mesh(
			new THREE.PlaneGeometry(3.45, 2.65),
			textureMaterial(boardTex, {
				roughness: 0.88,
				emissive: 0x0a0604,
				emissiveIntensity: 0.3,
			})
		);
		board.name = "board";
		board.position.z = 0.08;
		group.add(board);

		const boardLight = new THREE.PointLight(0xe8a946, 1.2, 6, 1.8);
		boardLight.name = "glow";
		boardLight.position.z = 1.84;
		group.add(boardLight);
	};
	makeWallOfFame();

	// ── ORDER RAIL (above counter) ──
	const makeChalky = () => {
		const boardX = 2.4;
		const cC = document.createElement("canvas");
		cC.width = 1024;
		cC.height = 250;
		const ctx3 = cC.getContext("2d")!;
		ctx3.fillStyle = "#fff2c8";
		ctx3.fillRect(0, 0, 1024, 250);
		ctx3.fillStyle = "#c92828";
		ctx3.fillRect(0, 0, 1024, 24);
		ctx3.fillRect(0, 226, 1024, 24);
		ctx3.fillStyle = "rgba(232,169,70,0.26)";
		for (let i = 0; i < 160; i++) {
			ctx3.fillRect(
				Math.random() * 1024,
				Math.random() * 250,
				Math.random() * 16 + 4,
				1
			);
		}
		ctx3.strokeStyle = "#25120e";
		ctx3.lineWidth = 10;
		ctx3.strokeRect(8, 8, 1008, 234);
		ctx3.strokeStyle = "rgba(37,18,14,0.35)";
		ctx3.lineWidth = 3;
		ctx3.strokeRect(28, 32, 968, 186);
		ctx3.fillStyle = "#25120e";
		ctx3.font = "bold 46px Impact, sans-serif";
		ctx3.textAlign = "center";
		ctx3.fillText("TODAY'S GREASY SPECIALS", 512, 74);
		ctx3.fillStyle = "#c92828";
		ctx3.font = "bold 25px Impact, sans-serif";
		ctx3.fillText("aim at the wall signs or press E near a zone", 512, 110);
		const items2 = [
			["DISCORD COMBO", "FREE"],
			["TWITCH LIVE SET", "FREE"],
			["CLIPS & SHORTS", "FREE"],
		];
		ctx3.textAlign = "left";
		ctx3.font = "30px Impact, sans-serif";
		items2.forEach(([name, price], i) => {
			const x = 72 + i * 315;
			ctx3.fillStyle = "#25120e";
			ctx3.fillText(name, x, 171);
			ctx3.fillStyle = "#2f7f67";
			ctx3.textAlign = "right";
			ctx3.fillText(price, x + 250, 171);
			ctx3.textAlign = "left";
			ctx3.strokeStyle = "rgba(37,18,14,0.25)";
			ctx3.lineWidth = 2;
			ctx3.beginPath();
			ctx3.moveTo(x, 181);
			ctx3.lineTo(x + 250, 181);
			ctx3.stroke();
		});
		const tex = canvasTexture(cC);
		const cfr = box(8.3, 1.34, 0.08, 0x25120e, 0.72);
		cfr.position.set(boardX, 2.25, -11.35);
		scene.add(cfr);
		const cboard = new THREE.Mesh(
			new THREE.PlaneGeometry(8.0, 1.16),
			new THREE.MeshStandardMaterial({
				map: tex,
				roughness: 0.62,
				emissive: 0xffaa44,
				emissiveMap: tex,
				emissiveIntensity: 0.08,
			})
		);
		cboard.position.set(boardX, 2.25, -11.28);
		scene.add(cboard);
	};
	makeChalky();

	// ── DIRECTIONAL HANGING SIGNS ─────────────────────
	const makeHangingSign = (
		x: number,
		z: number,
		ry: number,
		text: string,
		arrow: string,
		color: number
	) => {
		const sC = document.createElement("canvas");
		sC.width = 512;
		sC.height = 144;
		const sctx = sC.getContext("2d")!;
		sctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
		sctx.fillRect(0, 0, 512, 144);
		sctx.fillStyle = "#25120e";
		sctx.fillRect(4, 4, 504, 136);
		sctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
		sctx.fillRect(8, 8, 496, 128);
		sctx.fillStyle = "#fff2c8";
		const label = `${arrow}  ${text}`;
		let signFont = 58;
		sctx.font = `bold ${signFont}px 'Arial Black', Impact, sans-serif`;
		while (sctx.measureText(label).width > 430 && signFont > 34) {
			signFont -= 3;
			sctx.font = `bold ${signFont}px 'Arial Black', Impact, sans-serif`;
		}
		sctx.textAlign = "center";
		sctx.textBaseline = "middle";
		sctx.fillText(label, 256, 72);
		const worldW = text.length > 8 ? 3.25 : 2.4;
		// chains
		const chain1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.012, 0.012, 1.5, 6),
			new THREE.MeshStandardMaterial({
				color: 0x888888,
				roughness: 0.3,
				metalness: 0.7,
			})
		);
		chain1.position.set(x - worldW * 0.35, 7.5, z);
		chain1.rotation.y = ry;
		scene.add(chain1);
		const chain2 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.012, 0.012, 1.5, 6),
			new THREE.MeshStandardMaterial({
				color: 0x888888,
				roughness: 0.3,
				metalness: 0.7,
			})
		);
		chain2.position.set(x + worldW * 0.35, 7.5, z);
		chain2.rotation.y = ry;
		scene.add(chain2);
		const sfr = box(worldW, 0.7, 0.05, 0x25120e, 0.7);
		sfr.position.set(x, 6.7, z);
		sfr.rotation.y = ry;
		scene.add(sfr);
		const signTex = canvasTexture(sC);
		const sm = new THREE.Mesh(
			new THREE.PlaneGeometry(worldW - 0.15, 0.58),
			textureMaterial(signTex, {
				roughness: 0.6,
				emissive: color,
				emissiveMap: signTex,
				emissiveIntensity: 0.15,
			})
		);
		sm.position.set(x + Math.sin(ry) * 0.03, 6.7, z + Math.cos(ry) * 0.03);
		sm.rotation.y = ry;
		scene.add(sm);
	};
	// Signs hanging from ceiling pointing to each zone
	HANGING_SIGNS.forEach(sign => {
		makeHangingSign(sign.x, sign.z, sign.ry, sign.text, sign.arrow, sign.color);
	});

	// ── IN-WORLD TV CABINETS (right wall, no DOM overlays) ──────
	const liveScreens: {
		ctx: CanvasRenderingContext2D;
		texture: THREE.CanvasTexture;
		mode: "twitch" | "leaderboard";
	}[] = [];
	const makeTV = (
		z: number,
		mode: "twitch" | "leaderboard",
		accent: number
	) => {
		const frameColor = mode === "twitch" ? 0x160916 : 0x070d18;
		const tvFrame = roundedBox(3.55, 2.35, 0.2, frameColor, 0.07, 0.32, 0.45);
		tvFrame.rotation.y = -Math.PI / 2;
		tvFrame.position.set(13.82, 4.75, z);
		scene.add(tvFrame);

		const lip = roundedBox(3.75, 2.55, 0.08, 0x060302, 0.05, 0.36, 0.5);
		lip.rotation.y = -Math.PI / 2;
		lip.position.set(13.88, 4.75, z);
		scene.add(lip);

		const bracket = box(0.14, 1.5, 0.9, 0x050505, 0.42, 0.72);
		bracket.rotation.y = -Math.PI / 2;
		bracket.position.set(13.94, 4.75, z);
		scene.add(bracket);

		// animated canvas TV screen
		const tvC = document.createElement("canvas");
		tvC.width = 768;
		tvC.height = 432;
		const tvCtx = tvC.getContext("2d")!;
		const tvTex = canvasTexture(tvC);
		const tvScreen = new THREE.Mesh(
			new THREE.PlaneGeometry(3.05, 1.72),
			textureMaterial(tvTex, {
				emissive: accent,
				emissiveMap: tvTex,
				emissiveIntensity: 0.9,
				roughness: 0.1,
				metalness: 0.05,
			})
		);
		tvScreen.rotation.y = -Math.PI / 2;
		tvScreen.position.set(13.68, 4.75, z);
		scene.add(tvScreen);

		const statusBulb = new THREE.Mesh(
			new THREE.SphereGeometry(0.055, 16, 10),
			new THREE.MeshStandardMaterial({
				color: mode === "twitch" ? C.red : C.butter,
				emissive: mode === "twitch" ? C.red : C.butter,
				emissiveIntensity: 1.6,
				roughness: 0.25,
			})
		);
		statusBulb.position.set(13.56, 5.77, z - 1.35);
		scene.add(statusBulb);

		const tvGlow = new THREE.PointLight(accent, 0.75, 4.2, 2);
		tvGlow.position.set(12.4, 4.75, z);
		scene.add(tvGlow);
		liveScreens.push({ ctx: tvCtx, texture: tvTex, mode });
		return tvGlow;
	};
	const rightWallTVGlows = Object.fromEntries(
		RIGHT_WALL_TVS.map(tv => [tv.key, makeTV(tv.z, tv.key, tv.accent)])
	) as Record<(typeof RIGHT_WALL_TVS)[number]["key"], THREE.PointLight>;
	const renderLiveScreen = (
		screen: (typeof liveScreens)[number],
		time: number,
		frame: number
	) => {
		const { ctx, texture, mode } = screen;
		const w = ctx.canvas.width;
		const h = ctx.canvas.height;
		const bg = ctx.createLinearGradient(0, 0, w, h);
		bg.addColorStop(0, mode === "twitch" ? "#110525" : "#041027");
		bg.addColorStop(0.55, "#050508");
		bg.addColorStop(1, mode === "twitch" ? "#2a0612" : "#071a2f");
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = "rgba(255,255,255,0.055)";
		for (let y = 0; y < h; y += 8) ctx.fillRect(0, y, w, 1);
		setCanvasNoise(ctx, w, h, 0.05);
		const pulse = 0.5 + Math.sin(time * 2.4) * 0.5;
		const accent = mode === "twitch" ? "#9d65ff" : "#4fb8ff";
		ctx.fillStyle = accent;
		ctx.shadowColor = accent;
		ctx.shadowBlur = 24 + pulse * 16;
		ctx.font = "bold 42px 'Arial Black', Impact, sans-serif";
		ctx.textAlign = "left";
		ctx.fillText(mode === "twitch" ? "TWITCH LIVE" : "WATCHTIME BOARD", 42, 70);
		ctx.shadowBlur = 0;
		ctx.fillStyle = mode === "twitch" ? "#ff4040" : "#e8a946";
		ctx.font = "bold 22px Arial, sans-serif";
		ctx.fillText(
			mode === "twitch" ? "ON AIR WHEN MAC IS LIVE" : "TOP GREASE THIS MONTH",
			46,
			112
		);
		ctx.strokeStyle = "rgba(255,242,200,0.22)";
		ctx.lineWidth = 2;
		ctx.strokeRect(34, 30, w - 68, h - 60);
		ctx.fillStyle = "rgba(255,242,200,0.9)";
		ctx.font = "bold 24px Arial, sans-serif";
		if (mode === "twitch") {
			[
				"GreasyMac camera feed",
				"Chat crawl: !lurk !discord !watchtime",
				"Signal source: CMS / Twitch",
			].forEach((line, i) => ctx.fillText(line, 56, 174 + i * 52));
			ctx.fillStyle = "rgba(255,64,64,0.85)";
			ctx.beginPath();
			ctx.arc(58 + Math.sin(time * 3) * 4, 340, 13 + pulse * 4, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = "#fff2c8";
			ctx.font = "bold 34px Impact, sans-serif";
			ctx.fillText("LIVE DINER TV", 92, 350);
		} else {
			[
				"1  greasymac     extra sauced",
				"2  chat          still arguing",
				"3  greasygang    no refunds",
				"4  twitchplays   in progress",
			].forEach((line, i) => ctx.fillText(line, 56, 170 + i * 48));
			ctx.fillStyle = "rgba(79,184,255,0.38)";
			ctx.fillRect(42 + ((frame * 7) % 520), 338, 160, 7);
		}
		texture.needsUpdate = true;
	};

	// ── WINDOW (right wall, near entrance) – framed, not a blob ──
	const makeWindow = () => {
		const wz = 3.65;
		// outer frame
		const wFrame = box(3.2, 2.6, 0.1, 0x1a0d06, 0.7);
		wFrame.rotation.y = -Math.PI / 2;
		wFrame.position.set(13.84, 3.6, wz);
		scene.add(wFrame);
		// sill
		const wSill = box(0.08, 0.12, 3.3, 0x0d0703, 0.4, 0.3);
		wSill.position.set(13.82, 2.38, wz);
		scene.add(wSill);
		// glass – night cityscape
		const wC = document.createElement("canvas");
		wC.width = 512;
		wC.height = 384;
		const wctx = wC.getContext("2d")!;
		// sky gradient
		const skyG = wctx.createLinearGradient(0, 0, 0, 384);
		skyG.addColorStop(0, "#0a0318");
		skyG.addColorStop(0.6, "#1a0818");
		skyG.addColorStop(1, "#2a0c10");
		wctx.fillStyle = skyG;
		wctx.fillRect(0, 0, 512, 384);
		// city buildings silhouette
		wctx.fillStyle = "#090308";
		[
			[0, 180, 55, 204],
			[60, 200, 40, 384],
			[110, 170, 50, 384],
			[165, 185, 65, 384],
			[235, 160, 45, 384],
			[290, 195, 70, 384],
			[370, 175, 55, 384],
			[430, 188, 80, 384],
		].forEach(([x, y, w, h]) => wctx.fillRect(x, y, w, h));
		// windows in buildings
		wctx.fillStyle = "rgba(255,220,120,0.85)";
		for (let b = 0; b < 55; b++)
			wctx.fillRect(Math.random() * 490 + 5, 185 + Math.random() * 160, 5, 7);
		wctx.fillStyle = "rgba(180,220,255,0.6)";
		for (let b = 0; b < 25; b++)
			wctx.fillRect(Math.random() * 490 + 5, 185 + Math.random() * 160, 5, 7);
		// distant neon glow on horizon
		const horizG = wctx.createLinearGradient(0, 280, 0, 384);
		horizG.addColorStop(0, "rgba(255,80,20,0)");
		horizG.addColorStop(1, "rgba(255,80,20,0.25)");
		wctx.fillStyle = horizG;
		wctx.fillRect(0, 280, 512, 104);
		// window cross bar
		wctx.fillStyle = "#1a0d06";
		wctx.fillRect(248, 0, 16, 384);
		wctx.fillRect(0, 184, 512, 12);
		const winTex = canvasTexture(wC);
		const winGlass = new THREE.Mesh(
			new THREE.PlaneGeometry(2.9, 2.3),
			textureMaterial(winTex, {
				roughness: 0.08,
				metalness: 0.08,
				emissive: 0x110410,
				emissiveIntensity: 0.5,
			})
		);
		winGlass.rotation.y = -Math.PI / 2;
		winGlass.position.set(13.76, 3.6, wz);
		scene.add(winGlass);
		// subtle outward light cast
		const winLight = new THREE.PointLight(0xff6633, 0.8, 6, 2.0);
		winLight.position.set(12.5, 3.6, wz);
		scene.add(winLight);
	};
	makeWindow();

	// grease puddles
	(
		[
			[1.2, -2.5],
			[-2.8, -5.0],
			[3.0, -7.2],
		] as [number, number][]
	).forEach(([px, pz]) => {
		createGreasePuddle({ scene, canvasTexture }, px, pz);
	});

	// steam
	const STEAM = 32;
	const sPos = new Float32Array(STEAM * 3);
	const sPhase = new Float32Array(STEAM);
	for (let i = 0; i < STEAM; i++) {
		sPos[i * 3] = (Math.random() - 0.5) * 10;
		sPos[i * 3 + 1] = 1.2 + Math.random() * 2.5;
		sPos[i * 3 + 2] = -8.8 + (Math.random() - 0.5) * 0.8;
		sPhase[i] = Math.random() * Math.PI * 2;
	}
	const steamGeo = new THREE.BufferGeometry();
	steamGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
	const steamMat = new THREE.PointsMaterial({
		color: 0xddccbb,
		size: 0.2,
		transparent: true,
		opacity: 0.16,
		sizeAttenuation: true,
		depthWrite: false,
	});
	const steam = new THREE.Points(steamGeo, steamMat);
	scene.add(steam);

	// ── LIGHTING ─────────────────────────────────────
	// Warm base so nothing is pitch black, with a cool ceiling wash for contrast.
	scene.add(new THREE.AmbientLight(0x8a4b28, 0.5));
	scene.add(new THREE.HemisphereLight(0xffd39a, 0x160604, 0.42));

	// Back wall warm rim (neon sign glow)
	const rimLight = new THREE.PointLight(C.redDark, 2.8, 18, 1.5);
	rimLight.position.set(0, 6.5, -11);
	scene.add(rimLight);

	// Front fill – player zone is well-lit
	const fillLight = new THREE.DirectionalLight(0xffbb66, 0.72);
	fillLight.position.set(0, 6, 9);
	scene.add(fillLight);
	const counterWash = new THREE.SpotLight(
		0xffc777,
		3.2,
		13,
		Math.PI / 4,
		0.55,
		1.3
	);
	counterWash.position.set(0, 6.8, -3.4);
	counterWash.target.position.set(0, 1.1, -8.6);
	scene.add(counterWash);
	scene.add(counterWash.target);
	const entryWash = new THREE.PointLight(0xff9f55, 1.35, 12, 1.7);
	entryWash.position.set(0, 3.2, 3.5);
	scene.add(entryWash);

	// Left wall dedicated fill (about / lore zone)
	const leftFill1 = new THREE.PointLight(0xff4422, 1.9, 12, 1.4);
	leftFill1.position.set(-10, 4.5, -4);
	scene.add(leftFill1);
	const leftFill2 = new THREE.PointLight(0xffaa44, 1.2, 10, 1.5);
	leftFill2.position.set(-10, 4.5, -9);
	scene.add(leftFill2);

	// Right wall dedicated fill (leaderboard / TV zone)
	const rightFill1 = new THREE.PointLight(0x2266ff, 1.7, 12, 1.4);
	rightFill1.position.set(10, 4.5, -4);
	scene.add(rightFill1);
	const rightFill2 = new THREE.PointLight(0x4488ff, 1.2, 10, 1.5);
	rightFill2.position.set(10, 4.5, -9);
	scene.add(rightFill2);

	// Mid-room overhead fill lights so walking anywhere is readable
	const midLeft = new THREE.PointLight(0xffcc88, 1.0, 14, 1.6);
	midLeft.position.set(-5, 5.5, -2);
	scene.add(midLeft);
	const midRight = new THREE.PointLight(0xffcc88, 1.0, 14, 1.6);
	midRight.position.set(5, 5.5, -2);
	scene.add(midRight);
	const midBack = new THREE.PointLight(0xffcc88, 0.9, 14, 1.6);
	midBack.position.set(0, 5.5, -6);
	scene.add(midBack);

	setLoading("lighting the booths", 86);

	// ── POINTER LOCK + INTERACTION ───────────────────
	const PI_2 = Math.PI / 2;
	const raycaster = new THREE.Raycaster();
	let locked = false;
	const centerNDC = new THREE.Vector2(0, 0);
	const clearFocusedSocial = () => {
		focusedLink.value = null;
		focusedLinkLabel.value = null;
		socialLinks.forEach(item => {
			const mat = item.visual.material as THREE.MeshStandardMaterial;
			mat.emissiveIntensity = 0.88;
			item.visual.scale.setScalar(1);
		});
	};

	const getSocialHit = (pointer?: THREE.Vector2) => {
		raycaster.setFromCamera(pointer ?? centerNDC, camera);
		const hits = raycaster.intersectObjects(
			socialLinks.map(link => link.hitbox),
			false
		);
		const firstHit = hits[0];
		if (!firstHit || firstHit.distance > 3.8) return null;
		const hitObject = firstHit.object as THREE.Mesh | undefined;
		if (!hitObject) return null;
		return socialLinks.find(link => link.hitbox === hitObject) ?? null;
	};

	const updateFocusedLink = () => {
		if (nearZone.value !== "none") {
			clearFocusedSocial();
			return;
		}
		const link = getSocialHit();
		focusedLink.value = link?.href ?? null;
		focusedLinkLabel.value = link?.label ?? null;
		socialLinks.forEach(item => {
			const mat = item.visual.material as THREE.MeshStandardMaterial;
			const active = item.href === focusedLink.value;
			mat.emissiveIntensity = active ? 1.9 : 0.88;
			item.visual.scale.setScalar(active ? 1.045 : 1);
		});
	};

	// Mouse move: look when locked, update cursor hover when unlocked
	const mouseNDC = new THREE.Vector2();
	const onMouseMove = (e: MouseEvent) => {
		if (isDinerDevEditing) return;
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
		const hit = !!getSocialHit(mouseNDC);
		el.style.cursor = hit ? "pointer" : "default";
	};
	const onLockChange = () => {
		locked = document.pointerLockElement === el;
		isLocked.value = locked;
		if (locked) showEnterHint.value = false;
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if (import.meta.dev && isDevEditorToggleKey(e)) {
			e.preventDefault();
			e.stopImmediatePropagation();
			pendingDevEditorOpen = !isDinerDevEditing;
			devEditor?.toggle(pendingDevEditorOpen);
			return;
		}
		if (isDinerDevEditing) {
			keys[e.code] = false;
			if (e.code === "Escape" && activeSection.value !== "none") closeSection();
			return;
		}
		keys[e.code] = true;
		if (e.code === "KeyE") handleInteract();
		if (e.code === "Escape" && activeSection.value !== "none") closeSection();
	};
	const onKeyUp = (e: KeyboardEvent) => {
		keys[e.code] = false;
	};

	// clicking canvas: raycasting for social buttons OR pointer lock
	const onCanvasClick = (e: MouseEvent) => {
		if (!isSceneReady.value) return;
		if (isDinerDevEditing) return;
		void ensureAudio();
		if (activeSection.value !== "none") return;
		if (locked) {
			if (nearZone.value !== "none") return;
			const hit = getSocialHit();
			if (hit) {
				window.open(hit.href, "_blank", "noopener noreferrer");
			}
			return;
		}
		// Try raycasting against social link buttons first (works without pointer lock)
		const rect = el.getBoundingClientRect();
		const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
		const hit = getSocialHit(new THREE.Vector2(ndcX, ndcY));
		if (hit) {
			window.open(hit.href, "_blank", "noopener noreferrer");
			return;
		}
		// Otherwise grab pointer lock
		el.requestPointerLock();
	};
	el.addEventListener("click", onCanvasClick);
	document.addEventListener("pointerlockchange", onLockChange);
	document.addEventListener("mousemove", onMouseMove);
	document.addEventListener("keydown", onKeyDown);
	document.addEventListener("keyup", onKeyUp);

	if (import.meta.dev) {
		void import("./greasy-diner/dev/editor").then(
			({ createDinerDevEditor }) => {
				if (!renderer) return;
				devEditor = createDinerDevEditor({
					scene,
					camera,
					renderer,
					canvas: el,
					objects: DINER_OBJECTS,
					getRoom: () => currentRoom.value,
					onEditingChange: editing => {
						isDinerDevEditing = editing;
						if (editing && document.pointerLockElement === el)
							document.exitPointerLock();
					},
				});
				if (pendingDevEditorOpen) devEditor.toggle(true);
			}
		);
	}

	// ── RENDER LOOP ───────────────────────────────────
	const clock = new THREE.Clock();
	let tick = 0;
	let markedSceneReady = false;
	let readyTimeout: number | undefined;
	const loadStartedAt = performance.now();
	const PLAYER_RADIUS = 0.28;
	const isBlocked = (x: number, z: number, room: RoomKey) => {
		return ROOM_COLLIDERS[room].some(
			collider =>
				x > collider.minX - PLAYER_RADIUS &&
				x < collider.maxX + PLAYER_RADIUS &&
				z > collider.minZ - PLAYER_RADIUS &&
				z < collider.maxZ + PLAYER_RADIUS
		);
	};
	const clampToRoom = (x: number, z: number, room: RoomKey) => {
		const bounds = ROOM_BOUNDS[room];
		return {
			x: Math.max(
				bounds.minX + PLAYER_RADIUS,
				Math.min(bounds.maxX - PLAYER_RADIUS, x)
			),
			z: Math.max(
				bounds.minZ + PLAYER_RADIUS,
				Math.min(bounds.maxZ - PLAYER_RADIUS, z)
			),
		};
	};
	const loop = () => {
		animId = requestAnimationFrame(loop);
		const delta = Math.min(clock.getDelta(), 0.05);
		tick++;
		const t = tick * 0.005;

		// walking (only when locked AND no panel open)
		if (
			locked &&
			activeSection.value === "none" &&
			!isTeleporting.value &&
			!isDinerDevEditing
		) {
			dir.set(0, 0, 0);
			if (keys["KeyW"] || keys["ArrowUp"]) dir.z = -1;
			if (keys["KeyS"] || keys["ArrowDown"]) dir.z = 1;
			if (keys["KeyA"] || keys["ArrowLeft"]) dir.x = -1;
			if (keys["KeyD"] || keys["ArrowRight"]) dir.x = 1;
			if (dir.length() > 0) {
				dir.normalize();
				const moveEuler = new THREE.Euler(0, euler.y, 0);
				dir.applyEuler(moveEuler);
				vel.copy(dir).multiplyScalar(5.5 * delta);
				const room = currentRoom.value;
				const prevX = camera.position.x;
				const prevZ = camera.position.z;
				let next = clampToRoom(prevX + vel.x, prevZ, room);
				if (!isBlocked(next.x, next.z, room)) camera.position.x = next.x;
				next = clampToRoom(camera.position.x, prevZ + vel.z, room);
				if (!isBlocked(next.x, next.z, room)) camera.position.z = next.z;
				camera.position.y = 1.65;
			}
		}

		// proximity detection
		let closest: ZoneKey = "none";
		let closestDist = Infinity;
		for (const zone of ZONES) {
			if ((zone.room ?? "main") !== currentRoom.value) continue;
			const dx = camera.position.x - zone.cx;
			const dz = camera.position.z - zone.cz;
			const dist = Math.sqrt(dx * dx + dz * dz);
			if (dist < zone.radius && dist < closestDist) {
				closest = zone.key;
				closestDist = dist;
			}
		}
		nearZone.value = closest;
		if (locked && activeSection.value === "none" && !isDinerDevEditing)
			updateFocusedLink();
		else {
			focusedLink.value = null;
			focusedLinkLabel.value = null;
		}
		// zone glow pulse
		const inMenu = nearest("menu");
		const inAbout = nearest("about");
		const inLB = nearest("leaderboard");
		const inJukebox = nearest("jukebox");
		const inLore = nearest("loreRoom");
		const inFishRoom = nearest("fishRoom");
		const inLiveRoom = nearest("liveRoom");
		const inKitchenRoom = nearest("kitchenRoom");
		function nearest(k: ZoneKey) {
			return nearZone.value === k;
		}
		const gp = 0.55 + Math.sin(t * 3.5) * 0.35;
		(zoneGlows.menu.material as THREE.MeshStandardMaterial).opacity = inMenu
			? gp
			: 0.22;
		(zoneGlows.about.material as THREE.MeshStandardMaterial).opacity = inAbout
			? gp
			: 0.22;
		(zoneGlows.leaderboard.material as THREE.MeshStandardMaterial).opacity =
			inLB ? gp : 0.22;
		(zoneGlows.jukebox.material as THREE.MeshStandardMaterial).opacity =
			inJukebox ? gp : 0.2;
		(zoneGlows.loreRoom.material as THREE.MeshStandardMaterial).opacity = inLore
			? gp
			: 0.18;
		(zoneGlows.fishRoom.material as THREE.MeshStandardMaterial).opacity =
			inFishRoom ? gp : 0.18;
		(zoneGlows.liveRoom.material as THREE.MeshStandardMaterial).opacity =
			inLiveRoom ? gp : 0.18;
		(zoneGlows.kitchenRoom.material as THREE.MeshStandardMaterial).opacity =
			inKitchenRoom ? gp : 0.18;

		loreDoor.glow.intensity = (inLore ? 1.25 : 0.52) + Math.sin(t * 2.4) * 0.12;
		fishDoor.glow.intensity =
			(inFishRoom ? 1.3 : 0.56) + Math.sin(t * 2.1 + 1.4) * 0.12;
		liveDoor.glow.intensity =
			(inLiveRoom ? 1.35 : 0.58) + Math.sin(t * 2.8 + 0.6) * 0.14;
		kitchenDoor.glow.intensity =
			(inKitchenRoom ? 1.25 : 0.52) + Math.sin(t * 2.3 + 0.9) * 0.12;

		// neon flicker
		const neonDrop = tick % 283 === 0 ? -1.35 : 0;
		neonMesh.material.emissiveIntensity =
			2.2 + Math.sin(t * 1.9) * 0.6 + neonDrop;
		neonLight.intensity = 2.8 + Math.sin(t * 2.2) * 0.7;
		const of = Math.sin(t * 4.1) > 0.5 || tick % 191 > 5 ? 1.0 : 0.08;
		openSign.light.intensity = of * 1.1;
		(openSign.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
			of * 2.4;
		greaseTube.light.intensity = 0.8 + Math.sin(t * 1.3) * 0.3;
		lampLights.forEach((pl, i) => {
			pl.intensity =
				3.5 +
				Math.sin(t * (1.5 + i * 0.4) + i) * 0.5 +
				(tick % (241 + i * 37) === 0 ? -0.85 : 0);
		});
		jbGlow.intensity = (inJukebox ? 1.4 : 0.85) + Math.sin(t * 4.5) * 0.42;
		macGlow.intensity = 0.85 + Math.sin(t * 2.1) * 0.2;
		(talkSign.material as THREE.MeshStandardMaterial).emissiveIntensity =
			0.22 + Math.sin(t * 3.2) * 0.07;
		maclingRelief.position.y = 3.0 + Math.sin(t * 1.7) * 0.012;
		maclingRelief.rotation.y = -Math.PI / 2 + Math.sin(t * 1.15) * 0.012;
		const kitchenMacRig = scene.getObjectByName("kitchen-mac-cook-rig") as
			| THREE.Group
			| undefined;
		if (kitchenMacRig) {
			const dx = camera.position.x - kitchenMacRig.position.x;
			const dz = camera.position.z - kitchenMacRig.position.z;
			kitchenMacRig.rotation.y = Math.atan2(dx, dz);
			const parts = kitchenMacRig.userData.parts as
				| {
						head?: THREE.Object3D;
						spatulaArm?: THREE.Object3D;
						gestureArm?: THREE.Object3D;
						steam?: THREE.Object3D;
				  }
				| undefined;
			if (parts?.head) {
				parts.head.rotation.z = Math.sin(t * 1.7) * 0.018;
				const head = parts.head as THREE.Mesh<
					THREE.PlaneGeometry,
					THREE.MeshBasicMaterial
				>;
				const expressionTextures = head.userData.expressionTextures as
					| Record<string, THREE.Texture>
					| undefined;
				if (expressionTextures) {
					const talkFrames = ["talkSmall", "talkWide", "talkSmall"];
					const idleFrames = [
						"neutralOpen",
						"neutralOpen",
						"suspicious",
						"smug",
						"laughing",
						"neutralOpen",
						"shocked",
						"clownReaction",
					];
					const isTalking = Math.floor(t / 5) % 2 === 0;
					const expressionKey = isTalking
						? talkFrames[Math.floor(t * 7) % talkFrames.length]
						: idleFrames[Math.floor(t / 2.2) % idleFrames.length];
					const nextTexture = expressionTextures[expressionKey];
					if (nextTexture && head.userData.expressionKey !== expressionKey) {
						head.material.map = nextTexture;
						head.material.needsUpdate = true;
						head.userData.expressionKey = expressionKey;
					}
				}
			}
			if (parts?.spatulaArm) {
				parts.spatulaArm.rotation.z = -0.34 + Math.sin(t * 3.6) * 0.11;
				parts.spatulaArm.position.y = 2.02 + Math.sin(t * 3.6 + 0.4) * 0.025;
			}
			if (parts?.gestureArm) {
				parts.gestureArm.rotation.z = 0.22 + Math.sin(t * 2.2 + 1.2) * 0.045;
			}
			if (parts?.steam) {
				parts.steam.position.y = 1.05 + Math.sin(t * 1.8) * 0.03;
				parts.steam.children.forEach((child, index) => {
					child.position.y = index * 0.08 + ((t * 0.28 + index * 0.19) % 0.32);
					child.rotation.z =
						(index - 1) * 0.18 + Math.sin(t * 2 + index) * 0.08;
				});
			}
		}
		rightWallTVGlows.twitch.intensity = 0.5 + Math.sin(t * 0.8) * 0.2;
		rightWallTVGlows.leaderboard.intensity = 0.5 + Math.sin(t * 0.9 + 1) * 0.2;
		if (tick % 18 === 0) {
			liveScreens.forEach(screen => renderLiveScreen(screen, t, tick));
		}
		rimLight.intensity = 2.0 + Math.sin(t * 0.9) * 0.4;

		// steam
		const sp = steam.geometry.attributes.position.array as Float32Array;
		if (tick % 2 === 0) {
			for (let i = 0; i < STEAM; i++) {
				sp[i * 3 + 1] += 0.018 + Math.sin(sPhase[i] + t) * 0.006;
				sp[i * 3] += Math.sin(sPhase[i] * 2 + t * 0.5) * 0.006;
				if (sp[i * 3 + 1] > 4.2) {
					sp[i * 3 + 1] = 1.15;
					sp[i * 3] = (Math.random() - 0.5) * 10;
				}
			}
			steam.geometry.attributes.position.needsUpdate = true;
		}
		steamMat.opacity = 0.14 + Math.sin(t * 0.7) * 0.04;

		if (tick % 3 === 0) syncSpatialAudio();
		devEditor?.update();
		renderer!.render(scene, camera);
		if (!markedSceneReady) {
			markedSceneReady = true;
			loadingStatus.value = "first render served";
			loadingProgress.value = Math.max(loadingProgress.value, 68);
			// Keep the in-component loader readable after the first WebGL frame.
			const elapsed = performance.now() - loadStartedAt;
			const remaining = Math.max(180, 520 - elapsed);
			readyTimeout = window.setTimeout(() => {
				finishLoadingProgress(() => {
					isSceneReady.value = true;
				});
			}, remaining);
		}
	};
	loop();

	const onResize = () => {
		if (!renderer || !canvas.value) return;
		const w = canvas.value.clientWidth,
			h = canvas.value.clientHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
	};
	window.addEventListener("resize", onResize);

	onUnmounted(() => {
		cancelAnimationFrame(animId);
		stopJukebox(false);
		if (ambientClatterPulse) window.clearInterval(ambientClatterPulse);
		if (jukeboxStopTimeout) window.clearTimeout(jukeboxStopTimeout);
		if (ambientSongGapTimeout) window.clearTimeout(ambientSongGapTimeout);
		if (ambientJukeboxPauseTimeout)
			window.clearTimeout(ambientJukeboxPauseTimeout);
		if (loadingProgressTimer) window.clearInterval(loadingProgressTimer);
		ambientClatterPulse = undefined;
		jukeboxStopTimeout = undefined;
		ambientSongGapTimeout = undefined;
		ambientJukeboxPauseTimeout = undefined;
		loadingProgressTimer = undefined;
		jukeboxAmbientAudio?.pause();
		jukeboxAmbientAudio = null;
		jukeboxAmbientSource?.disconnect();
		jukeboxAmbientSource = null;
		jukeboxAmbientGain = null;
		jukeboxAmbientPan = null;
		macAudio?.pause();
		if (freezerGain && audioContext) {
			freezerGain.gain.setValueAtTime(0, audioContext.currentTime);
		}
		if (readyTimeout) window.clearTimeout(readyTimeout);
		devEditor?.dispose();
		devEditor = null;
		isDinerDevEditing = false;
		pendingDevEditorOpen = false;
		document.removeEventListener("pointerlockchange", onLockChange);
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("keydown", onKeyDown);
		document.removeEventListener("keyup", onKeyUp);
		el.removeEventListener("click", onCanvasClick);
		window.removeEventListener("resize", onResize);
		renderer?.dispose();
		if (document.pointerLockElement === el) document.exitPointerLock();
	});
}
</script>

<template>
	<div class="diner-root">
		<canvas ref="canvas" class="diner-canvas" />

		<Transition name="loader">
			<div v-if="!isSceneReady" class="web-loader">
				<div class="loader-scene" aria-hidden="true">
					<div class="loader-back-wall">
						<div class="loader-neon">GREASY GANG</div>
						<div class="loader-board loader-board-left">
							<span>MENU</span>
							<small>discord · twitch · youtube</small>
						</div>
						<div class="loader-board loader-board-right">
							<span>TODAY</span>
							<small>hot · loud · extra</small>
						</div>
						<div class="loader-lamp loader-lamp-a" />
						<div class="loader-lamp loader-lamp-b" />
						<div class="loader-lamp loader-lamp-c" />
					</div>
					<div class="loader-counter" />
					<div class="loader-floor" />
				</div>
				<div class="loader-copy font-bebas">
					<p class="loader-kicker">EST. 2019 · OPEN LATE · EXTRA GREASY</p>
					<h1>GREASYGANG</h1>
					<p class="loader-sub">{{ loadingStatus }}</p>
					<div class="loader-bar">
						<span :style="{ transform: `scaleX(${loadingProgress / 100})` }" />
					</div>
					<p class="loader-percent">{{ loadingProgress }}%</p>
				</div>
			</div>
		</Transition>

		<!-- atmosphere -->
		<div class="scanlines" aria-hidden="true" />
		<div class="vignette" aria-hidden="true" />

		<Transition name="fade">
			<div v-if="isTeleporting" class="teleport-screen">
				<div class="teleport-tunnel" aria-hidden="true">
					<span
						v-for="n in 9"
						:key="n"
						:style="{
							width: `${12 + n * 5}rem`,
							height: `${4 + n * 2}rem`,
							animationDelay: `${n * -0.08}s`,
							'--z': `${n * -42}px`,
							'--r': `${n * 1.5}deg`,
						}"
					/>
				</div>
				<p class="teleport-title font-bebas">{{ teleportLabel }}</p>
				<p class="teleport-sub font-bebas">follow the greasy hallway</p>
			</div>
		</Transition>

		<!-- crosshair (only when locked) -->
		<div
			v-if="isLocked && activeSection === 'none' && !isTeleporting"
			class="crosshair"
			aria-hidden="true"
		>
			<span class="ch-h" /><span class="ch-v" />
		</div>

		<!-- ENTER HINT (before first click) -->
		<Transition name="fade">
			<div v-if="showEnterHint && isSceneReady" class="enter-hint">
				<div class="eh-ring font-bebas">⊕</div>
				<p class="eh-main font-bebas">CLICK TO ENTER THE DINER</p>
				<p class="eh-sub font-bebas">
					WASD WALK &nbsp;·&nbsp; MOUSE LOOK &nbsp;·&nbsp; E INTERACT
				</p>
			</div>
		</Transition>

		<!-- HUD: movement reminder when locked -->
		<div
			v-if="isLocked && activeSection === 'none' && !isTeleporting"
			class="hud-bar font-bebas"
		>
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
			<div
				v-if="
					isLocked && focusedLink && activeSection === 'none' && !isTeleporting
				"
				class="zone-prompt font-bebas"
			>
				<div class="zp-emoji">↗</div>
				<div class="zp-key">E</div>
				<div class="zp-label">OPEN {{ focusedLinkLabel }}</div>
			</div>
			<div
				v-else-if="
					isLocked &&
					nearZone !== 'none' &&
					activeSection === 'none' &&
					!isTeleporting
				"
				class="zone-prompt font-bebas"
			>
				<div class="zp-emoji">
					{{ ZONES.find(z => z.key === nearZone)?.emoji }}
				</div>
				<div class="zp-key">E</div>
				<div class="zp-label">
					{{ ZONES.find(z => z.key === nearZone)?.label }}
				</div>
			</div>
		</Transition>

		<!-- BACK BUTTON (when a section is open) -->
		<Transition name="fade">
			<button
				v-if="activeSection !== 'none'"
				class="back-btn font-bebas"
				@click="closeSection"
			>
				← BACK TO DINER
			</button>
		</Transition>

		<button
			type="button"
			class="audio-toggle font-bebas"
			:class="{ active: showAudioSettings }"
			@click="showAudioSettings = !showAudioSettings"
		>
			AUDIO
		</button>

		<Transition name="slide-right">
			<div v-if="showAudioSettings" class="audio-panel font-bebas">
				<div class="audio-panel-head">
					<p>Sound Mix</p>
					<button type="button" @click="showAudioSettings = false">×</button>
				</div>
				<label>
					<span>Music</span>
					<input
						v-model.number="musicVolume"
						type="range"
						min="0"
						max="1"
						step="0.01"
					/>
					<small>{{ Math.round(musicVolume * 100) }}%</small>
				</label>
				<label>
					<span>Ambience</span>
					<input
						v-model.number="ambienceVolume"
						type="range"
						min="0"
						max="1"
						step="0.01"
					/>
					<small>{{ Math.round(ambienceVolume * 100) }}%</small>
				</label>
				<label>
					<span>Dialogue</span>
					<input
						v-model.number="dialogueVolume"
						type="range"
						min="0"
						max="1"
						step="0.01"
					/>
					<small>{{ Math.round(dialogueVolume * 100) }}%</small>
				</label>
			</div>
		</Transition>

		<!-- ══════════════════════════════════
			     MENU PANEL
			══════════════════════════════════ -->
		<Transition name="slide-up">
			<div v-if="activeSection === 'menu'" class="section-panel panel-menu">
				<div class="panel-header font-bebas">
					<div class="bulb-row" aria-hidden="true">
						<span
							v-for="n in 10"
							:key="n"
							class="bulb"
							:style="`animation-delay:${n * 0.18}s`"
						/>
					</div>
					<div class="panel-title-wrap">
						<p class="panel-eyebrow">GreasyGang</p>
						<h2 class="panel-title">Menu</h2>
						<p class="panel-sub">no substitutions · no refunds · no mercy</p>
					</div>
					<div class="bulb-row" aria-hidden="true">
						<span
							v-for="n in 10"
							:key="n"
							class="bulb"
							:style="`animation-delay:${n * 0.18}s`"
						/>
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
						<span class="item-num font-bebas">{{
							String(i + 1).padStart(2, "0")
						}}</span>
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
					<NuxtImg
						densities="x1 x2"
						:src="$cmsImage(sponsor.image) + '/sponsor'"
						class="sponsor-img"
						:style="'object-position:' + sponsor.imagePosition"
					/>
					<div class="sponsor-copy">
						<p v-if="sponsor.code" class="sponsor-code-line">
							<span class="font-bebas sc-label">use code</span>
							<strong class="sc-val">{{ sponsor.code }}</strong>
						</p>
						<p class="sponsor-desc">{{ sponsor.description }}</p>
						<NuxtLink
							:href="sponsor.url"
							target="_blank"
							class="sponsor-cta font-bebas"
							>PLAY NOW →</NuxtLink
						>
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
					<div class="about-sticker sticker-a font-bebas">served<br />live</div>
					<div class="about-sticker sticker-b font-bebas">
						extra<br />greasy
					</div>
					<NuxtImg
						:src="$cmsImage('777b4597-5c15-4835-b291-fdf8b9af3524/mac-babe')"
						class="about-portrait"
					/>
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
				<p class="about-tagline font-bebas">
					"hot links · loud bits · extra sauce"
				</p>
			</div>
		</Transition>

		<!-- ══════════════════════════════════
		     LEADERBOARD PANEL
		══════════════════════════════════ -->
		<Transition name="slide-right">
			<div
				v-if="activeSection === 'leaderboard'"
				class="section-panel panel-leaderboard"
			>
				<div class="lb-wrap">
					<WatchTime />
					<WatchTime all />
				</div>
			</div>
		</Transition>

		<!-- ══════════════════════════════════
		     MAC TALK PANEL
		══════════════════════════════════ -->
		<Transition name="slide-up">
			<div v-if="activeSection === 'mac'" class="section-panel panel-mac">
				<div class="mac-dialogue">
					<img
						:src="GREASY_ASSETS.maclings.greasyHappy"
						alt=""
						class="mac-dialogue-img"
					/>
					<div class="mac-dialogue-copy">
						<p class="panel-eyebrow">Behind the counter</p>
						<h2 class="panel-title">GreasyMac</h2>
						<p class="mac-line">{{ currentMacLineText }}</p>
						<p class="audio-state font-bebas">
							{{ isMacSpeaking ? "MAC IS TALKING" : "VOICE READY" }}
						</p>
						<div class="mac-options font-bebas">
							<button type="button" @click="playRandomMacLine('specials')">
								ASK ABOUT THE SPECIALS
							</button>
							<button type="button" @click="playRandomMacLine('sauce')">
								REQUEST EXTRA SAUCE
							</button>
							<button type="button" @click="playRandomMacLine('song')">
								SING FROM PLAYLIST
							</button>
							<button type="button" @click="playRandomMacLine('fullSong')">
								SING A FULL SONG
							</button>
							<button type="button" @click="closeSection">LEAVE QUIETLY</button>
						</div>
					</div>
				</div>
			</div>
		</Transition>

		<!-- ══════════════════════════════════
		     JUKEBOX / ROOM PANELS
		══════════════════════════════════ -->
		<Transition name="slide-up">
			<div
				v-if="activeSection === 'jukebox'"
				class="section-panel panel-room panel-jukebox"
			>
				<p class="panel-eyebrow">Corner cabinet</p>
				<h2 class="panel-title">Greasy Jukebox</h2>
				<p class="room-copy">
					{{ isJukeboxPlaying ? "Now spinning" : "The cabinet hums warm" }}:
					{{ jukeboxTracks[currentJukeboxTrack].name }}
				</p>
				<div class="room-actions font-bebas">
					<button
						v-for="(track, index) in jukeboxTracks"
						:key="track.name"
						type="button"
						:class="{
							active: isJukeboxPlaying && currentJukeboxTrack === index,
						}"
						@click="toggleJukebox(index)"
					>
						{{
							isJukeboxPlaying && currentJukeboxTrack === index
								? "STOP"
								: "PLAY"
						}}
						{{ track.name }}
					</button>
					<button type="button" @click="playRandomMacLine('song')">
						MAKE MAC SING
					</button>
					<button type="button" @click="playRandomMacLine('fullSong')">
						FULL MAC SONG
					</button>
					<button type="button" @click="closeSection">WALK AWAY</button>
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
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	display: block;
	cursor: none;
}

/* ── FIRST LOAD FALLBACK ───────────────────────────── */
.web-loader {
	position: absolute;
	inset: 0;
	z-index: 40;
	display: grid;
	place-items: center;
	overflow: hidden;
	background:
		radial-gradient(
			circle at 50% 42%,
			rgba(250, 64, 64, 0.18),
			transparent 32%
		),
		linear-gradient(180deg, #030101 0%, #100402 56%, #050202 100%);
	color: #fff2c8;
	pointer-events: auto;
}

.loader-scene {
	position: absolute;
	inset: 0;
	perspective: 680px;
	overflow: hidden;
}

.loader-back-wall {
	position: absolute;
	left: 50%;
	top: 13%;
	width: min(48rem, 74vw);
	height: min(21rem, 42vh);
	transform: translateX(-50%) rotateX(7deg);
	transform-origin: 50% 100%;
	background:
		linear-gradient(
			90deg,
			transparent 0 18%,
			rgba(0, 0, 0, 0.28) 18% 19%,
			transparent 19% 81%,
			rgba(0, 0, 0, 0.28) 81% 82%,
			transparent 82%
		),
		repeating-linear-gradient(
			0deg,
			rgba(255, 242, 200, 0.045) 0 2px,
			transparent 2px 7px
		),
		linear-gradient(180deg, #9e1510 0 46%, #1b0906 46% 48%, #e1ad67 48% 100%);
	box-shadow: 0 0 5rem rgba(232, 169, 70, 0.18);
}

.loader-neon {
	position: absolute;
	left: 50%;
	top: 16%;
	width: min(22rem, 48vw);
	padding: 0.55rem 1rem;
	transform: translateX(-50%);
	border: 0.28rem solid #170806;
	background: #080302;
	color: #fff6c8;
	font-family: Impact, "Arial Black", sans-serif;
	font-size: clamp(1.8rem, 5vw, 4rem);
	line-height: 1;
	text-align: center;
	text-shadow:
		0 0 0.4rem #fff2c8,
		0 0 1.1rem #f6cf5d,
		0 0 2rem #e8a946;
	animation: loaderNeon 1.45s ease-in-out infinite;
}

.loader-board {
	position: absolute;
	bottom: 17%;
	width: 7.8rem;
	height: 5rem;
	border: 0.22rem solid #1b0804;
	background: #0b0302;
	color: #e8a946;
	display: grid;
	place-items: center;
	text-align: center;
	box-shadow: 0 0 1.2rem rgba(0, 0, 0, 0.5);
}

.loader-board span {
	font-family: Impact, "Arial Black", sans-serif;
	font-size: 1.2rem;
}

.loader-board small {
	display: block;
	max-width: 6.5rem;
	color: rgba(255, 242, 200, 0.56);
	font-size: 0.58rem;
	text-transform: uppercase;
}

.loader-board-left {
	left: 23%;
}

.loader-board-right {
	right: 23%;
}

.loader-lamp {
	position: absolute;
	top: 3%;
	width: 3.4rem;
	height: 2rem;
	border-radius: 50%;
	background:
		radial-gradient(ellipse at 50% 70%, #fff2c8 0 22%, transparent 23%),
		radial-gradient(
			ellipse at 50% 45%,
			#080403 0 56%,
			#e8a946 57% 62%,
			transparent 63%
		);
	filter: drop-shadow(0 0 1.1rem rgba(232, 169, 70, 0.6));
}

.loader-lamp::before {
	content: "";
	position: absolute;
	left: 50%;
	bottom: 72%;
	width: 1px;
	height: 8rem;
	background: rgba(232, 169, 70, 0.28);
}

.loader-lamp-a {
	left: 28%;
}

.loader-lamp-b {
	left: 50%;
	transform: translateX(-50%);
}

.loader-lamp-c {
	right: 28%;
}

.loader-counter {
	position: absolute;
	left: 50%;
	top: 57%;
	width: min(37rem, 64vw);
	height: 4.2rem;
	transform: translateX(-50%) rotateX(12deg);
	background:
		linear-gradient(180deg, #210806 0 18%, #080302 18% 100%),
		linear-gradient(
			90deg,
			transparent 0 9%,
			rgba(250, 64, 64, 0.35) 9% 10%,
			transparent 10% 90%,
			rgba(250, 64, 64, 0.35) 90% 91%,
			transparent 91%
		);
	box-shadow:
		0 -0.3rem 0 #e8a946,
		0 1.8rem 3rem rgba(0, 0, 0, 0.65);
}

.loader-floor {
	position: absolute;
	left: -10%;
	right: -10%;
	bottom: -22%;
	height: 52%;
	transform: rotateX(64deg);
	transform-origin: 50% 100%;
	background:
		linear-gradient(rgba(232, 169, 70, 0.08), rgba(0, 0, 0, 0.6)),
		repeating-linear-gradient(90deg, #070302 0 3rem, #b47b37 3rem 6rem),
		repeating-linear-gradient(
			0deg,
			transparent 0 3rem,
			rgba(0, 0, 0, 0.7) 3rem 6rem
		);
	background-blend-mode: normal, difference, normal;
	animation: loaderFloor 1.8s linear infinite;
}

.loader-copy {
	position: relative;
	z-index: 2;
	margin-top: 8vh;
	text-align: center;
	text-transform: uppercase;
	text-shadow: 0 0.28rem 0 rgba(0, 0, 0, 0.45);
}

.loader-kicker,
.loader-sub {
	margin: 0;
	color: rgba(255, 242, 200, 0.82);
	font-size: clamp(0.8rem, 1.7vw, 1.15rem);
	letter-spacing: 0.3em;
}

.loader-copy h1 {
	margin: 0.45rem 0 0.8rem;
	color: #fff2c8;
	font-size: clamp(4.8rem, 15vw, 12rem);
	line-height: 0.82;
	text-shadow:
		0 0.25rem 0 #6d2a05,
		0 0 1.8rem rgba(232, 169, 70, 0.45);
}

.loader-bar {
	width: min(16rem, 52vw);
	height: 0.42rem;
	margin: 1.25rem auto 0;
	border: 1px solid rgba(255, 242, 200, 0.34);
	background: rgba(0, 0, 0, 0.35);
	overflow: hidden;
}

.loader-bar span {
	display: block;
	width: 100%;
	height: 100%;
	background: #fa4040;
	box-shadow: 0 0 1rem #fa4040;
	transform: scaleX(0);
	transform-origin: left center;
	transition: transform 0.36s ease;
}
.loader-percent {
	margin: 0.55rem 0 0;
	color: rgba(232, 169, 70, 0.84);
	font-size: clamp(0.75rem, 1.5vw, 0.98rem);
	letter-spacing: 0.22em;
	text-transform: uppercase;
}

.loader-enter-active,
.loader-leave-active {
	transition:
		opacity 0.45s ease,
		transform 0.45s ease;
}

.loader-enter-from,
.loader-leave-to {
	opacity: 0;
	transform: scale(1.02);
}

/* ── SCANLINES + VIGNETTE ───────────────────────────── */
.scanlines {
	position: absolute;
	inset: 0;
	z-index: 2;
	pointer-events: none;
	background: repeating-linear-gradient(
		to bottom,
		transparent,
		transparent 5px,
		rgba(0, 0, 0, 0.025) 5px,
		rgba(0, 0, 0, 0.025) 6px
	);
}
.vignette {
	position: absolute;
	inset: 0;
	z-index: 3;
	pointer-events: none;
	background: radial-gradient(
		ellipse at 50% 45%,
		transparent 35%,
		rgba(0, 0, 0, 0.72) 100%
	);
}

/* ── CROSSHAIR ──────────────────────────────────────── */
.crosshair {
	position: absolute;
	top: 50%;
	left: 50%;
	z-index: 12;
	pointer-events: none;
	transform: translate(-50%, -50%);
}
.ch-h,
.ch-v {
	position: absolute;
	background: rgba(255, 242, 200, 0.65);
}
.ch-h {
	width: 14px;
	height: 1.5px;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
.ch-v {
	width: 1.5px;
	height: 14px;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

/* ── ENTER HINT ─────────────────────────────────────── */
.enter-hint {
	position: absolute;
	inset: 0;
	z-index: 20;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-end;
	padding-bottom: 12%;
	pointer-events: none;
	text-align: center;
}
.eh-ring {
	font-size: 3rem;
	color: rgba(255, 242, 200, 0.5);
	animation: hintPulse 2s ease-in-out infinite;
	line-height: 1;
	margin-bottom: 0.5rem;
}
.eh-main {
	font-size: clamp(0.9rem, 2.2vw, 1.3rem);
	letter-spacing: 0.2em;
	color: rgba(255, 242, 200, 0.8);
	text-transform: uppercase;
	margin-bottom: 0.3rem;
}
.eh-sub {
	font-size: clamp(0.6rem, 1.2vw, 0.82rem);
	letter-spacing: 0.18em;
	color: rgba(232, 169, 70, 0.5);
	text-transform: uppercase;
}

/* ── ROOM TRANSITION ───────────────────────────────── */
.teleport-screen {
	position: absolute;
	inset: 0;
	z-index: 45;
	display: grid;
	place-items: center;
	overflow: hidden;
	background:
		radial-gradient(
			circle at 50% 50%,
			rgba(232, 169, 70, 0.14),
			transparent 24rem
		),
		#070302;
	color: #fff2c8;
	pointer-events: none;
}
.teleport-tunnel {
	position: absolute;
	inset: 0;
	perspective: 720px;
	opacity: 0.72;
}
.teleport-tunnel span {
	position: absolute;
	top: 50%;
	left: 50%;
	border: 2px solid rgba(232, 169, 70, 0.18);
	transform: translate(-50%, -50%) translateZ(var(--z)) rotate(var(--r));
	animation: tunnelWalk 0.72s linear infinite;
}
.teleport-title {
	position: relative;
	z-index: 1;
	font-size: clamp(1.5rem, 4vw, 3.2rem);
	letter-spacing: 0.16em;
	text-transform: uppercase;
	text-shadow: 0 0 24px rgba(232, 169, 70, 0.45);
}
.teleport-sub {
	position: absolute;
	bottom: 26%;
	z-index: 1;
	font-size: 0.8rem;
	letter-spacing: 0.2em;
	color: rgba(232, 169, 70, 0.56);
	text-transform: uppercase;
}

/* ── HUD BAR ────────────────────────────────────────── */
.hud-bar {
	position: absolute;
	bottom: 1.4rem;
	left: 50%;
	transform: translateX(-50%);
	z-index: 12;
	display: flex;
	align-items: center;
	gap: 0.8rem;
	background: rgba(0, 0, 0, 0.55);
	border: 1px solid rgba(232, 169, 70, 0.28);
	color: rgba(255, 242, 200, 0.5);
	font-size: 0.75rem;
	letter-spacing: 0.15em;
	padding: 0.35rem 1rem 0.25rem;
	pointer-events: none;
	white-space: nowrap;
}
.hud-sep {
	color: rgba(232, 169, 70, 0.28);
}

/* ── PROXIMITY PROMPT ───────────────────────────────── */
.zone-prompt {
	position: absolute;
	bottom: 22%;
	left: 50%;
	transform: translateX(-50%);
	z-index: 15;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.3rem;
	pointer-events: none;
	text-align: center;
}
.zp-emoji {
	font-size: 2rem;
	line-height: 1;
}
.zp-key {
	width: 2rem;
	height: 2rem;
	border: 2px solid #e8a946;
	color: #e8a946;
	font-size: 1.25rem;
	line-height: 1;
	display: grid;
	place-items: center;
	padding-top: 0.1rem;
	box-shadow: 0 0 10px rgba(232, 169, 70, 0.4);
	animation: keyPulse 1s ease-in-out infinite;
}
.zp-label {
	font-size: clamp(0.75rem, 1.8vw, 1rem);
	letter-spacing: 0.18em;
	color: rgba(255, 242, 200, 0.85);
	text-transform: uppercase;
}

/* ── BACK BUTTON ────────────────────────────────────── */
.back-btn {
	position: absolute;
	top: 1.2rem;
	left: 1.4rem;
	z-index: 40;
	background: rgba(37, 18, 14, 0.88);
	color: #e8a946;
	border: 2px solid #e8a946;
	cursor: pointer;
	font-size: 0.95rem;
	letter-spacing: 0.15em;
	padding: 0.5rem 1.1rem 0.38rem;
	box-shadow: 3px 3px 0 #25120e;
	transition: background 0.12s;
}
.back-btn:hover {
	background: rgba(200, 80, 20, 0.9);
	color: white;
}

.audio-toggle {
	position: absolute;
	top: 5rem;
	right: 1.4rem;
	z-index: 42;
	border: 2px solid rgba(232, 169, 70, 0.72);
	background: rgba(37, 18, 14, 0.84);
	color: #e8a946;
	padding: 0.42rem 0.9rem 0.3rem;
	font-size: 0.86rem;
	letter-spacing: 0.14em;
	cursor: pointer;
	box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.45);
}
.audio-toggle:hover,
.audio-toggle.active {
	background: rgba(232, 169, 70, 0.18);
	color: #fff2c8;
	border-color: #fff2c8;
}
.audio-panel {
	position: absolute;
	top: 8.2rem;
	right: 1.4rem;
	z-index: 43;
	width: min(280px, calc(100vw - 2rem));
	border: 3px solid #e8a946;
	background:
		linear-gradient(rgba(255, 242, 200, 0.04), transparent),
		rgba(21, 8, 5, 0.94);
	color: #fff2c8;
	padding: 0.75rem;
	box-shadow: 5px 5px 0 rgba(0, 0, 0, 0.55);
}
.audio-panel-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.65rem;
	border-bottom: 1px dashed rgba(232, 169, 70, 0.34);
	padding-bottom: 0.45rem;
}
.audio-panel-head p {
	margin: 0;
	color: #e8a946;
	font-size: 1rem;
	letter-spacing: 0.12em;
	text-transform: uppercase;
}
.audio-panel-head button {
	border: 1px solid rgba(232, 169, 70, 0.45);
	background: rgba(250, 64, 64, 0.18);
	color: #fff2c8;
	cursor: pointer;
	font: inherit;
	line-height: 1;
	width: 1.45rem;
	height: 1.45rem;
}
.audio-panel label {
	display: grid;
	grid-template-columns: 5.2rem 1fr 2.4rem;
	align-items: center;
	gap: 0.55rem;
	margin: 0.55rem 0;
	color: rgba(255, 242, 200, 0.82);
	font-size: 0.78rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}
.audio-panel input[type="range"] {
	width: 100%;
	accent-color: #e8a946;
	cursor: pointer;
}
.audio-panel small {
	color: rgba(232, 169, 70, 0.72);
	text-align: right;
}

/* ══════════════════════════════════════════════════════
	   SHARED PANEL BASE
══════════════════════════════════════════════════════ */
.section-panel {
	position: absolute;
	z-index: 30;
	pointer-events: all;
}

/* ══════════════════════════════════════════════════════
   MENU PANEL
══════════════════════════════════════════════════════ */
.panel-menu {
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 5rem 1rem 1rem;
	gap: 0;
	pointer-events: none;
}
.panel-menu .panel-header,
.panel-menu .menu-list,
.panel-menu .menu-footer,
.panel-menu .sponsor-strip {
	pointer-events: all;
}

.panel-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.8rem;
	background: #25120e;
	border: 4px solid #e8a946;
	border-bottom: none;
	padding: 0.7rem 1.1rem 0.55rem;
	width: 100%;
	max-width: 660px;
}
.bulb-row {
	display: flex;
	gap: 5px;
	align-items: center;
}
.bulb {
	display: block;
	width: 9px;
	height: 9px;
	border-radius: 50%;
	background: #f6cf5d;
	box-shadow: 0 0 7px 2px rgba(246, 207, 93, 0.7);
	animation: bulbPulse 1.8s ease-in-out infinite;
}
.panel-title-wrap {
	text-align: center;
}
.panel-eyebrow {
	font-size: 0.75rem;
	letter-spacing: 0.25em;
	color: #e8a946;
	text-transform: uppercase;
	margin: 0;
}
.panel-title {
	font-size: clamp(2rem, 4vw, 3.5rem);
	line-height: 0.9;
	color: #fff2c8;
	text-shadow: 3px 3px 0 rgba(232, 169, 70, 0.4);
	text-transform: uppercase;
	margin: 0;
}
.panel-sub {
	font-size: 0.62rem;
	letter-spacing: 0.15em;
	color: rgba(255, 242, 200, 0.38);
	text-transform: uppercase;
	margin: 0.1rem 0 0;
}

.menu-list {
	width: 100%;
	max-width: 660px;
	background:
		linear-gradient(90deg, rgba(37, 18, 14, 0.08) 1px, transparent 1px) 0 0 /
			18px 100%,
		#180904;
	border: 4px solid #e8a946;
	border-top: none;
}
.menu-item {
	display: grid;
	grid-template-columns: 2.2rem 3rem 1fr auto 1.8rem;
	align-items: center;
	gap: 0.6rem;
	padding: 0.65rem 1rem;
	border-bottom: 1px solid rgba(232, 169, 70, 0.14);
	text-decoration: none;
	color: #fff2c8;
	transition:
		background 0.12s,
		padding-left 0.12s;
	position: relative;
	overflow: hidden;
}
.menu-item:last-child {
	border-bottom: none;
}
.menu-item::before {
	content: "";
	position: absolute;
	inset: 0;
	background: linear-gradient(
		90deg,
		var(--accent, #fa4040) 0%,
		transparent 50%
	);
	opacity: 0;
	transition: opacity 0.16s;
}
.menu-item:hover::before {
	opacity: 0.18;
}
.menu-item:hover {
	padding-left: 1.3rem;
}
.menu-item > * {
	position: relative;
	z-index: 1;
}
.item-num {
	font-size: 1rem;
	color: rgba(232, 169, 70, 0.4);
	line-height: 1;
}
.item-icon {
	display: grid;
	place-items: center;
	width: 2.6rem;
	height: 2.6rem;
	border: 2px solid #25120e;
	color: white;
}
.item-name {
	font-size: 1.05rem;
	font-weight: 900;
	text-transform: uppercase;
	letter-spacing: 0.03em;
}
.item-tag {
	border: 1px solid rgba(255, 242, 200, 0.2);
	color: rgba(255, 242, 200, 0.45);
	font-size: 0.75rem;
	letter-spacing: 0.1em;
	padding: 0.16rem 0.5rem 0.1rem;
	text-transform: uppercase;
	white-space: nowrap;
}
.item-arrow {
	font-size: 1.05rem;
	color: rgba(232, 169, 70, 0.32);
	transition:
		color 0.12s,
		transform 0.12s;
}
.menu-item:hover .item-arrow {
	color: #e8a946;
	transform: translateX(3px);
}

.menu-footer {
	width: 100%;
	max-width: 660px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.4rem;
	background: #25120e;
	border: 4px solid #e8a946;
	border-top: 2px dashed rgba(232, 169, 70, 0.35);
	color: rgba(255, 242, 200, 0.4);
	font-size: 0.8rem;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	padding: 0.5rem 1rem 0.38rem;
}
.footer-dots {
	color: rgba(232, 169, 70, 0.18);
}

.sponsor-strip {
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.9rem;
	width: 100%;
	max-width: 660px;
	margin-top: 0.6rem;
	border: 3px solid #2f7f67;
	background: #ffe7a3;
	color: #25120e;
	padding: 0.5rem 0.75rem;
}
.sponsor-badge {
	position: absolute;
	top: 0.35rem;
	right: 0.45rem;
	background: #e8a946;
	color: #25120e;
	border: 2px solid #25120e;
	font-size: 0.68rem;
	letter-spacing: 0.1em;
	padding: 0.08rem 0.4rem;
	text-transform: uppercase;
}
.sponsor-img {
	width: 4.5rem;
	height: 3.5rem;
	object-fit: cover;
	border: 2px solid #25120e;
	flex-shrink: 0;
}
.sponsor-copy {
	flex: 1;
}
.sponsor-code-line {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	margin-bottom: 0.2rem;
}
.sc-label {
	font-size: 0.7rem;
	letter-spacing: 0.08em;
	opacity: 0.6;
	text-transform: uppercase;
}
.sc-val {
	background: #fa4040;
	color: white;
	border: 1.5px solid #25120e;
	padding: 0.08rem 0.38rem;
	font-size: 0.88rem;
}
.sponsor-desc {
	font-weight: 700;
	font-size: 0.75rem;
	line-height: 1.35;
}
.sponsor-cta {
	display: inline-block;
	background: #25120e;
	color: #fff2c8;
	font-size: 0.9rem;
	letter-spacing: 0.1em;
	padding: 0.28rem 0.75rem 0.2rem;
	text-decoration: none;
	margin-top: 0.25rem;
}
.sponsor-cta:hover {
	background: #c92828;
}

/* ══════════════════════════════════════════════════════
   ABOUT PANEL
══════════════════════════════════════════════════════ */
.panel-about {
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: min(400px, 92vw);
	display: flex;
	flex-direction: column;
	align-items: center;
}
.about-frame {
	position: relative;
	border: 5px solid #25120e;
	background: #c92828;
	box-shadow:
		-10px 10px 0 #e8a946,
		-18px 18px 0 #16100d;
	overflow: hidden;
	width: 100%;
	border-radius: 10px 2px 8px 2px;
}
.about-portrait {
	width: 100%;
	aspect-ratio: 3/4;
	object-fit: cover;
	display: block;
	filter: saturate(1.1) contrast(1.04);
}
.about-gloss {
	position: absolute;
	inset: 0;
	pointer-events: none;
	background:
		linear-gradient(135deg, rgba(255, 242, 200, 0.18) 0 18%, transparent 20%),
		linear-gradient(180deg, transparent 58%, rgba(37, 18, 14, 0.55));
}
.about-sticker {
	position: absolute;
	z-index: 3;
	border: 3px solid #25120e;
	font-size: 1.1rem;
	line-height: 1.1;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	padding: 0.4rem 0.6rem 0.25rem;
	box-shadow: 4px 4px 0 #25120e;
	text-align: center;
}
.sticker-a {
	top: 0.8rem;
	left: 0.8rem;
	background: #ffe7a3;
	color: #25120e;
	transform: rotate(-7deg);
	animation: stickerWiggle 6s ease-in-out infinite;
}
.sticker-b {
	bottom: 3.5rem;
	right: 0.8rem;
	background: #2f7f67;
	color: white;
	transform: rotate(5deg);
	animation: stickerWiggle 7s ease-in-out infinite reverse;
}
.about-nameplate {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	justify-content: center;
	background: #25120e;
	color: #fff2c8;
	font-size: 1.05rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.55rem 1rem 0.42rem;
	border-top: 4px solid #e8a946;
	width: 100%;
}
.np-dot {
	color: #e8a946;
	font-size: 1.5rem;
	line-height: 0;
	transform: translateY(2px);
}
.about-stats {
	display: flex;
	background: #180904;
	border: 3px solid #e8a946;
	border-top: none;
	width: 100%;
}
.bio-stat {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0.65rem 0.5rem 0.5rem;
	border-right: 2px solid rgba(232, 169, 70, 0.2);
}
.bio-stat:last-child {
	border-right: none;
}
.stat-val {
	font-size: 1.4rem;
	color: #e8a946;
	line-height: 1;
}
.stat-label {
	font-size: 0.62rem;
	letter-spacing: 0.12em;
	color: rgba(255, 242, 200, 0.4);
	text-transform: uppercase;
}
.about-tagline {
	font-size: 0.75rem;
	letter-spacing: 0.15em;
	color: rgba(232, 169, 70, 0.45);
	text-transform: uppercase;
	margin-top: 0.65rem;
	text-align: center;
}

/* ══════════════════════════════════════════════════════
   LEADERBOARD PANEL
══════════════════════════════════════════════════════ */
.panel-leaderboard {
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 5rem 2rem 2rem;
}
.lb-wrap {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 2rem;
	width: 100%;
	max-width: 1100px;
}
.lb-wrap > * {
	border: 4px solid #e8a946;
	background: rgba(12, 6, 3, 0.88);
	box-shadow: -8px 8px 0 #25120e;
}

/* ══════════════════════════════════════════════════════
   MAC TALK PANEL
══════════════════════════════════════════════════════ */
.panel-mac {
	left: 50%;
	bottom: 4.5rem;
	transform: translateX(-50%);
	width: min(760px, calc(100vw - 2rem));
}
.mac-dialogue {
	display: grid;
	grid-template-columns: 9rem 1fr;
	align-items: end;
	gap: 1rem;
	background:
		linear-gradient(90deg, rgba(232, 169, 70, 0.12) 1px, transparent 1px) 0 0 /
			18px 100%,
		rgba(18, 8, 5, 0.94);
	border: 4px solid #e8a946;
	box-shadow:
		-7px 7px 0 #25120e,
		0 0 32px rgba(232, 169, 70, 0.16);
	padding: 0.9rem;
}
.mac-dialogue-img {
	width: 100%;
	height: 10rem;
	object-fit: contain;
	object-position: bottom center;
	filter: drop-shadow(0 0 12px rgba(250, 64, 64, 0.22));
}
.mac-dialogue-copy {
	min-width: 0;
}
.mac-line {
	color: rgba(255, 242, 200, 0.82);
	font-weight: 800;
	line-height: 1.4;
	margin: 0.45rem 0 0.8rem;
}
.audio-state {
	display: inline-flex;
	align-items: center;
	width: fit-content;
	margin: 0 0 0.65rem;
	border: 2px solid rgba(250, 64, 64, 0.48);
	background: rgba(250, 64, 64, 0.14);
	color: #ff8a6f;
	font-size: 0.72rem;
	letter-spacing: 0.12em;
	padding: 0.25rem 0.5rem 0.17rem;
}
.mac-options {
	display: flex;
	flex-wrap: wrap;
	gap: 0.45rem;
}
.mac-options button,
.room-actions button {
	border: 2px solid rgba(232, 169, 70, 0.5);
	color: #e8a946;
	background: rgba(37, 18, 14, 0.86);
	padding: 0.28rem 0.55rem 0.18rem;
	font-size: 0.75rem;
	letter-spacing: 0.08em;
	font: inherit;
	cursor: pointer;
	text-transform: uppercase;
	box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.34);
	transition:
		transform 0.16s ease,
		border-color 0.16s ease,
		color 0.16s ease;
}
.mac-options button:hover,
.room-actions button:hover,
.room-actions button.active {
	border-color: #fff2c8;
	color: #fff2c8;
	transform: translate(-1px, 1px);
}

/* ══════════════════════════════════════════════════════
   ROOM / JUKEBOX PANELS
══════════════════════════════════════════════════════ */
.panel-room {
	left: 50%;
	bottom: 4.5rem;
	transform: translateX(-50%);
	width: min(620px, calc(100vw - 2rem));
	background:
		linear-gradient(90deg, rgba(232, 169, 70, 0.12) 1px, transparent 1px) 0 0 /
			18px 100%,
		rgba(18, 8, 5, 0.94);
	border: 4px solid #e8a946;
	box-shadow:
		-7px 7px 0 #25120e,
		0 0 32px rgba(232, 169, 70, 0.16);
	padding: 1rem 1.1rem 1.05rem;
}
.panel-jukebox {
	border-color: #ff6600;
	box-shadow:
		-7px 7px 0 #25120e,
		0 0 34px rgba(255, 102, 0, 0.2);
}
.panel-fish-room {
	border-color: #2f7f67;
	box-shadow:
		-7px 7px 0 #25120e,
		0 0 34px rgba(47, 127, 103, 0.22);
}
.panel-live-room {
	border-color: #4aa3ff;
	box-shadow:
		-7px 7px 0 #25120e,
		0 0 34px rgba(74, 163, 255, 0.22);
}
.room-copy {
	color: rgba(255, 242, 200, 0.82);
	font-weight: 800;
	line-height: 1.45;
	margin: 0.55rem 0 0.9rem;
	max-width: 54ch;
}
.room-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.45rem;
}
.room-actions button.active {
	background: rgba(255, 102, 0, 0.28);
	box-shadow:
		3px 3px 0 rgba(0, 0, 0, 0.34),
		0 0 18px rgba(255, 102, 0, 0.22);
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.prompt-enter-active,
.prompt-leave-active {
	transition:
		opacity 0.3s ease,
		transform 0.3s ease;
}
.prompt-enter-from,
.prompt-leave-to {
	opacity: 0;
	transform: translateX(-50%) translateY(8px);
}

.slide-up-enter-active,
.slide-up-leave-active {
	transition:
		opacity 0.5s ease,
		transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
	opacity: 0;
	transform: translateY(55px);
}

.slide-left-enter-active,
.slide-left-leave-active {
	transition:
		opacity 0.5s ease,
		transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-left-enter-from,
.slide-left-leave-to {
	opacity: 0;
	transform: translateX(-55px);
}

.slide-right-enter-active,
.slide-right-leave-active {
	transition:
		opacity 0.5s ease,
		transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-right-enter-from,
.slide-right-leave-to {
	opacity: 0;
	transform: translateX(55px);
}

/* ══════════════════════════════════════════════════════
   KEYFRAMES
══════════════════════════════════════════════════════ */
@keyframes hintPulse {
	0%,
	100% {
		opacity: 0.5;
		transform: scale(1);
	}
	50% {
		opacity: 0.9;
		transform: scale(1.1);
	}
}

@keyframes loaderNeon {
	0%,
	100% {
		filter: brightness(1);
	}
	48% {
		filter: brightness(1.18);
	}
	51% {
		filter: brightness(0.78);
	}
	54% {
		filter: brightness(1.25);
	}
}

@keyframes loaderFloor {
	from {
		background-position:
			0 0,
			0 0,
			0 0;
	}
	to {
		background-position:
			0 0,
			0 0,
			0 6rem;
	}
}

@keyframes loaderBar {
	0% {
		transform: translateX(-105%);
	}
	100% {
		transform: translateX(225%);
	}
}

@keyframes tunnelWalk {
	0% {
		opacity: 0;
		transform: translate(-50%, -50%) translateZ(-420px) scale(0.55) rotate(0deg);
	}
	24% {
		opacity: 0.82;
	}
	100% {
		opacity: 0;
		transform: translate(-50%, -50%) translateZ(120px) scale(1.45) rotate(4deg);
	}
}

@keyframes keyPulse {
	0%,
	100% {
		box-shadow: 0 0 10px rgba(232, 169, 70, 0.4);
	}
	50% {
		box-shadow: 0 0 22px rgba(232, 169, 70, 0.85);
	}
}

@keyframes bulbPulse {
	0%,
	100% {
		opacity: 1;
		box-shadow: 0 0 7px 2px rgba(246, 207, 93, 0.7);
	}
	50% {
		opacity: 0.3;
		box-shadow: 0 0 2px 1px rgba(246, 207, 93, 0.2);
	}
}

@keyframes stickerWiggle {
	0%,
	100% {
		scale: 1;
	}
	50% {
		scale: 1.06;
	}
}

/* ══════════════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════════════ */
@media (max-width: 700px) {
	.lb-wrap {
		grid-template-columns: 1fr;
	}
	.bulb-row {
		display: none;
	}
	.menu-item {
		grid-template-columns: 2rem 2.8rem 1fr auto;
	}
	.item-arrow {
		display: none;
	}
	.panel-about {
		width: 92vw;
	}
	.hud-bar {
		font-size: 0.62rem;
		gap: 0.5rem;
	}
}

@media (prefers-reduced-motion: reduce) {
	.bulb,
	.sticker-a,
	.sticker-b,
	.eh-ring,
	.zp-key {
		animation: none;
	}
}
</style>
