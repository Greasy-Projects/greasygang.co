<script setup lang="ts">
const canvas = ref<HTMLCanvasElement | null>(null);

type Slick = {
	x: number;
	y: number;
	width: number;
	height: number;
	color: string;
	alpha: number;
	phase: number;
	speed: number;
	points: number;
};

type Fleck = {
	x: number;
	y: number;
	radius: number;
	color: string;
	alpha: number;
	phase: number;
};

let animationFrame = 0;
let reducedMotion = false;
let slicks: Slick[] = [];
let flecks: Fleck[] = [];

const colors = {
	ink: "#25120e",
	mustard: "#e8a946",
	butter: "#f6cf5d",
	red: "#fa4040",
	pickle: "#2f7f67",
	seafoam: "#9bdcc8",
	cream: "#fff2c8",
};

const random = (min: number, max: number) => Math.random() * (max - min) + min;

const makeSlicks = (width: number, height: number): Slick[] => [
	{
		x: width * 0.13,
		y: height * 0.2,
		width: width * 0.2,
		height: height * 0.08,
		color: colors.seafoam,
		alpha: 0.12,
		phase: 0,
		speed: 0.00042,
		points: 9,
	},
	{
		x: width * 0.76,
		y: height * 0.17,
		width: width * 0.17,
		height: height * 0.07,
		color: colors.red,
		alpha: 0.11,
		phase: 1.8,
		speed: 0.00036,
		points: 8,
	},
	{
		x: width * 0.47,
		y: height * 0.74,
		width: width * 0.28,
		height: height * 0.1,
		color: colors.mustard,
		alpha: 0.17,
		phase: 3.2,
		speed: 0.0003,
		points: 11,
	},
	{
		x: width * 0.9,
		y: height * 0.84,
		width: width * 0.13,
		height: height * 0.06,
		color: colors.pickle,
		alpha: 0.12,
		phase: 4.6,
		speed: 0.00046,
		points: 7,
	},
];

const makeFlecks = (width: number, height: number): Fleck[] =>
	Array.from({ length: Math.min(34, Math.floor(width / 44)) }, () => ({
		x: random(0, width),
		y: random(0, height),
		radius: random(1.5, 4.8),
		color: [colors.mustard, colors.red, colors.pickle, colors.seafoam][
			Math.floor(random(0, 4))
		],
		alpha: random(0.16, 0.42),
		phase: random(0, Math.PI * 2),
	}));

const drawOrganicBlob = (
	context: CanvasRenderingContext2D,
	slick: Slick,
	time: number
) => {
	const wobble = reducedMotion ? 0 : time * slick.speed;
	const cx = slick.x + Math.sin(wobble + slick.phase) * 14;
	const cy = slick.y + Math.cos(wobble * 0.8 + slick.phase) * 9;

	context.save();
	context.globalAlpha = slick.alpha;
	context.fillStyle = slick.color;
	context.strokeStyle = colors.ink;
	context.lineWidth = 2.4;
	context.lineJoin = "round";

	context.beginPath();
	for (let index = 0; index <= slick.points; index += 1) {
		const angle = (index / slick.points) * Math.PI * 2;
		const noise =
			1 +
			Math.sin(angle * 3 + wobble * 3 + slick.phase) * 0.12 +
			Math.cos(angle * 5 - wobble * 2) * 0.07;
		const x = cx + Math.cos(angle) * slick.width * 0.5 * noise;
		const y = cy + Math.sin(angle) * slick.height * 0.5 * noise;

		if (index === 0) context.moveTo(x, y);
		else context.lineTo(x, y);
	}
	context.closePath();
	context.fill();
	context.globalAlpha = slick.alpha * 0.55;
	context.stroke();

	context.globalAlpha = slick.alpha * 0.72;
	context.strokeStyle = colors.cream;
	context.lineWidth = 4;
	context.beginPath();
	context.ellipse(
		cx - slick.width * 0.16,
		cy - slick.height * 0.12,
		slick.width * 0.13,
		slick.height * 0.16,
		-0.35,
		0.1,
		Math.PI * 1.25
	);
	context.stroke();
	context.restore();
};

const drawSketchArc = (
	context: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	time: number,
	offset: number
) => {
	const sway = reducedMotion ? 0 : Math.sin(time * 0.0005 + offset) * 8;
	context.save();
	context.globalAlpha = 0.08;
	context.strokeStyle = colors.ink;
	context.lineWidth = 3;
	context.beginPath();
	context.moveTo(x, y + sway);
	context.bezierCurveTo(
		x + width * 0.25,
		y - height + sway,
		x + width * 0.75,
		y + height + sway * 0.2,
		x + width,
		y + sway * 0.5
	);
	context.stroke();
	context.restore();
};

const drawFleck = (
	context: CanvasRenderingContext2D,
	fleck: Fleck,
	time: number
) => {
	const pulse = reducedMotion ? 0 : Math.sin(time * 0.001 + fleck.phase);

	context.save();
	context.globalAlpha = fleck.alpha + pulse * 0.04;
	context.fillStyle = fleck.color;
	context.beginPath();
	context.ellipse(
		fleck.x + pulse * 2,
		fleck.y - pulse * 1.5,
		fleck.radius * (1.25 + pulse * 0.08),
		fleck.radius * (0.8 - pulse * 0.05),
		fleck.phase,
		0,
		Math.PI * 2
	);
	context.fill();
	context.restore();
};

const sizeCanvas = () => {
	const element = canvas.value;
	if (!element) return;

	const rect = element.getBoundingClientRect();
	const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

	element.width = Math.max(1, Math.floor(rect.width * pixelRatio));
	element.height = Math.max(1, Math.floor(rect.height * pixelRatio));

	const context = element.getContext("2d");
	context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

	slicks = makeSlicks(rect.width, rect.height);
	flecks = makeFlecks(rect.width, rect.height);
};

const render = (time = 0) => {
	const element = canvas.value;
	const context = element?.getContext("2d");
	if (!element || !context) return;

	const { width, height } = element.getBoundingClientRect();
	context.clearRect(0, 0, width, height);

	drawSketchArc(
		context,
		width * 0.03,
		height * 0.18,
		width * 0.34,
		36,
		time,
		1
	);
	drawSketchArc(context, width * 0.62, height * 0.12, width * 0.3, 28, time, 4);
	drawSketchArc(
		context,
		width * 0.08,
		height * 0.78,
		width * 0.28,
		24,
		time,
		7
	);

	slicks.forEach(slick => drawOrganicBlob(context, slick, time));
	flecks.forEach(fleck => drawFleck(context, fleck, time));

	if (!reducedMotion) {
		animationFrame = requestAnimationFrame(render);
	}
};

onMounted(() => {
	reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	sizeCanvas();
	render();
	window.addEventListener("resize", sizeCanvas);
});

onBeforeUnmount(() => {
	cancelAnimationFrame(animationFrame);
	window.removeEventListener("resize", sizeCanvas);
});
</script>

<template>
	<canvas ref="canvas" class="grease-motion" aria-hidden="true"></canvas>
</template>

<style scoped>
.grease-motion {
	position: absolute;
	inset: 0;
	z-index: 1;
	width: 100%;
	height: 100%;
	pointer-events: none;
	mix-blend-mode: multiply;
	opacity: 0.95;
}
</style>
