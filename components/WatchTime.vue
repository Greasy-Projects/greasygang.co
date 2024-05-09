<script setup>
const props = defineProps({
	all: { type: Boolean, required: false, default: false },
});
const title = props.all ? "top viewers all time" : "top viewers this month";
const watchtime = (await GqlGetWatchtime({ limit: 100 })).watchtime;

const scrollContainer = ref();
const fadeThing = ref();
const handleScroll = (s, q) => {
	console.log(scrollContainer.value.scrollTop);
	if (scrollContainer.value.scrollTop > 10) {
		fadeThing.value.style.opacity = "1";
	} else {
		fadeThing.value.style.opacity = "0";
	}
};
</script>

<template>
	<div
		class="flex relative flex-col h-full max-h-5xl p-6 pt-18 pb-2 justify-between bg-secondary rounded-xl"
	>
		<div class="absolute top-6 left-0 flex w-full justify-center items-center">
			<h1 class="font-bold z-10 text-6xl font-bebas">
				{{ title }}
			</h1>
		</div>
		<div
			ref="fadeThing"
			class="absolute top-18 z-5 left-0 op-0 transition-opacity-100 h20 pointer-events-none w-full bg-gradient-to-b from-secondary to-transparent"
		></div>
		<div
			class="absolute bottom-2 z-5 left-0 h-20 w-full bg-gradient-to-b pointer-events-none from-transparent to-secondary"
		></div>
		<div
			ref="scrollContainer"
			class="overflow-scroll nth--n+3:(border-5 border-solid) nth-1:border-[#ffa376] nth-2:border-[#ff9c80] nth-3:border-[#ff6954] snap-y snap-mandatory space-y-3 py-6"
			@scroll="handleScroll"
		>
			<div
				v-for="user of watchtime"
				:key="user.displayName"
				class="bg-button snap-start scroll-my-10 items-center justify-between pr-10 rounded-full p-2 flex"
			>
				<img
					class="bg-blue size-15 rounded-full"
					:src="user.avatar ?? undefined"
				/>
				<p class="font-bold text-xl">{{ user.displayName }}</p>
				<h1 class="font-bebas font-bold text-2xl">{{ user.time }}</h1>
			</div>
		</div>
	</div>
</template>

<style scoped>
::-webkit-scrollbar {
	display: none;
}
</style>
