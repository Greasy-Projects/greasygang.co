<script setup>
import { ref } from "vue";

defineProps({
	all: { type: Boolean, required: false, default: false },
});

const watchtime = (await GqlGetWatchtime({ limit: 100 })).watchtime;
</script>

<template>
	<div
		class="flex flex-col space-y-4 h-full max-h-5xl p-6 justify-between bg-secondary rounded-xl"
	>
		<h1 class="font-bold text-5xl mx-a font-bebas">Top viewers all time</h1>
		<div class="overflow-scroll space-y-3.5">
			<div
				v-for="user of watchtime"
				:key="user.displayName"
				class="bg-button items-center justify-between pr-10 rounded-full p-2 flex"
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
