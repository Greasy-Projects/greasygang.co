<script setup lang="ts">
const props = defineProps({
	all: { type: Boolean, required: false, default: false },
});
const title = props.all ? "top viewers all time" : "top viewers this month";
let watchtime: {
	avatar?: string | null | undefined;
	displayName: string;
	time: number;
}[];
try {
	watchtime = (await GqlGetWatchtime({ limit: 100, total: props.all }))
		.watchtime;
} catch {
	//
}
const scrollContainer = ref();
const fadeThing = ref();
const handleScroll = () => {
	const scrollTop = scrollContainer.value.scrollTop;
	const maxHeight = 3;
	const minHeight = 0.5;

	const height = Math.min(
		Math.max(
			((scrollTop * 1.4) / 100) * (maxHeight - minHeight) + minHeight,
			minHeight
		),
		maxHeight
	);

	fadeThing.value.style.height = height.toString() + "rem";
};
</script>

<template>
	<div
		v-if="watchtime"
		class="receipt-panel flex relative flex-col h-full max-h-3xl pt-0 p-6 pb-2 justify-between"
	>
		<div class="relative mt-6 w-full justify-center items-center">
			<div class="flex justify-center">
				<h1
					class="receipt-title font-bold z-10 text-4xl sm:text-5xl lg:text-6xl font-bebas"
				>
					{{ title }}
				</h1>
			</div>
			<div
				ref="fadeThing"
				class="absolute z-5 w-full h-1 pointer-events-none bg-gradient-to-b from-[#fff2c8] to-transparent"
			></div>
		</div>
		<div
			ref="scrollContainer"
			class="overflow-scroll pt-2.5 pb-6 snap-y snap-mandatory space-y-3"
			@scroll="handleScroll"
		>
			<div
				v-for="user of watchtime"
				:key="user.displayName"
				class="receipt-row snap-start scroll-my-9 items-center justify-between pr-5 sm:pr-10 p-2 flex"
			>
				<img
					class="receipt-avatar size-15 rounded-full"
					:src="user.avatar ?? undefined"
				/>
				<p class="font-bold text-base sm:text-lg">
					{{ user.displayName }}
				</p>
				<h1 class="receipt-time font-bebas font-bold text-xl sm:text-2xl">
					{{ user.time }}
				</h1>
			</div>
		</div>
		<div
			class="absolute bottom-1.9 z-5 left-.5% w-99% h-15 bg-gradient-to-b pointer-events-none from-transparent to-[#fff2c8]"
		></div>
	</div>
</template>

<style scoped>
.receipt-panel {
	--cream: #fff2c8;
	--mustard: #e8a946;
	--red: #fa4040;
	--ink: #25120e;
	border: 4px solid var(--ink);
	background:
		linear-gradient(90deg, rgba(37, 18, 14, 0.08) 1px, transparent 1px) 0 0 /
			18px 100%,
		var(--cream);
	color: var(--ink);
	box-shadow:
		-8px 8px 0 var(--red),
		-14px 14px 0 var(--ink);
	animation: receiptSettle 10s ease-in-out infinite;
}

.receipt-panel::before,
.receipt-panel::after {
	content: "";
	position: absolute;
	left: 0;
	right: 0;
	height: 12px;
	background:
		linear-gradient(135deg, var(--ink) 25%, transparent 25%) 0 0 / 16px 16px,
		linear-gradient(225deg, var(--ink) 25%, transparent 25%) 0 0 / 16px 16px;
	pointer-events: none;
}

.receipt-panel::before {
	top: -4px;
}

.receipt-panel::after {
	bottom: -12px;
	transform: rotate(180deg);
}

.receipt-title {
	text-align: center;
	text-transform: uppercase;
	text-shadow: 3px 3px 0 var(--mustard);
}

.receipt-row {
	border: 3px solid var(--ink);
	background: rgba(255, 231, 163, 0.78);
	box-shadow: -4px 4px 0 var(--ink);
	gap: 0.8rem;
}

.receipt-row:nth-child(1) {
	background: var(--mustard);
}

.receipt-row:nth-child(2) {
	background: #ffcf75;
}

.receipt-row:nth-child(3) {
	background: #ffb38f;
}

.receipt-avatar {
	border: 3px solid var(--ink);
	background: var(--red);
}

.receipt-time {
	min-width: 4rem;
	text-align: right;
}

@keyframes receiptSettle {
	0%,
	100% {
		transform: rotate(-0.15deg) translate3d(0, 0, 0);
	}
	50% {
		transform: rotate(0.12deg) translate3d(0.12rem, -0.08rem, 0);
	}
}

@media (prefers-reduced-motion: reduce) {
	.receipt-panel {
		animation: none;
	}
}

::-webkit-scrollbar {
	display: none;
}
</style>
