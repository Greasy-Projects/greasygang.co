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
		class="flex relative flex-col h-full max-h-3xl pt-0 p-6 pb-2 justify-between bg-secondary rounded-xl"
	>
		<div class="relative mt-6 w-full justify-center items-center">
			<div class="flex justify-center">
				<h1
					class="font-bold z-10 text-[clamp(1.5rem,9cqw,3.75rem)] lg:text-[clamp(2.5rem,5cqw,3.75rem)] font-bebas"
				>
					{{ title }}
				</h1>
			</div>
			<div
				ref="fadeThing"
				class="absolute z-5 w-full h-1 pointer-events-none bg-gradient-to-b from-secondary to-transparent"
			></div>
		</div>
		<div
			ref="scrollContainer"
			class="overflow-scroll pt-2.5 pb-6 [&>:nth-child(-n+3)]:border-(4 inline-solid) [&>:nth-child(1)]:border-( [#ffa376]) [&>:nth-child(2)]:border-( [#fea894]) [&>:nth-child(3)]:border-( [#ff7e6c]) snap-y snap-mandatory space-y-3"
			@scroll="handleScroll"
		>
			<div
				v-for="user of watchtime"
				:key="user.displayName"
				class="bg-button snap-start scroll-my-9	 items-center justify-between pr-5 sm:pr-10 rounded-full p-2 flex"
			>
				<img class="size-15 rounded-full" :src="user.avatar ?? undefined" />
				<p class="font-bold text-[clamp(.3rem,3.5cqw,1.25rem)]">
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
