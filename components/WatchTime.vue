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
	watchtime = (await GqlGetWatchtime({ limit: 100 })).watchtime;
} catch {
	//
}
const scrollContainer = ref();
const fadeThing = ref();
const handleScroll = () => {
	const scrollTop = scrollContainer.value.scrollTop;
	const maxHeight = 3;
	const minHeight = 1.25;

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
		class="flex relative flex-col h-full max-h-5xl p-6 pt-18 pb-2 justify-between bg-secondary rounded-xl"
	>
		<div class="absolute top-6 left-0 flex w-full justify-center items-center">
			<h1
				class="font-bold z-10 text-[clamp(1.5rem,10cqw,3.75rem)] lg:text-[clamp(2.5rem,5cqw,3.75rem)] font-bebas"
			>
				{{ title }}
			</h1>
		</div>
		<div
			ref="fadeThing"
			class="absolute top-18 z-5 left-.5% w-99% h-5 rounded-b-full pointer-events-none bg-gradient-to-b from-secondary to-transparent"
		></div>
		<div
			ref="scrollContainer"
			class="overflow-scroll [&>:nth-child(-n+3)]:border-(4 inline-solid) [&>:nth-child(1)]:border-( [#ffa376]) [&>:nth-child(2)]:border-( [#fea894]) [&>:nth-child(3)]:border-( [#ff7e6c]) snap-y snap-mandatory space-y-3 py-6"
			@scroll="handleScroll"
		>
			<div
				v-for="user of watchtime"
				:key="user.displayName"
				class="bg-button snap-start scroll-my-10 items-center justify-between pr-10 rounded-full p-2 flex"
			>
				<img class="size-15 rounded-full" :src="user.avatar ?? undefined" />
				<p class="font-bold text-[clamp(.3rem,3cqw,1.25rem)]">
					{{ user.displayName }}
				</p>
				<h1 class="font-bebas font-bold text-[clamp(.3rem,4.5cqw,1.50rem)]">
					{{ user.time }}
				</h1>
			</div>
		</div>
		<div
			class="absolute bottom-1.9 rounded-b-lg z-5 left-.5% w-99% h-15 bg-gradient-to-b pointer-events-none from-transparent to-secondary"
		></div>
	</div>
</template>

<style scoped>
::-webkit-scrollbar {
	display: none;
}
</style>
