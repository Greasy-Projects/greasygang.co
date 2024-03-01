<script setup lang="ts">
const config = useRuntimeConfig().public;
const buttons = [
	{
		icon: { name: "twitch", type: "fab" },
		href:
			config.apiBase +
			"/login/twitch?scopes=bits:read channel:read:editors channel:read:redemptions channel:read:subscriptions user:read:email",
	},
	{
		icon: { name: "discord", type: "fab" },
		href: config.apiBase + "/login/discord?scopes=identify email connections",
	},
];
</script>
<template>
	<div class="font-IBM">
		<div class="max-w-xl mx-auto p-2">
			<NuxtLink
				v-for="button in buttons"
				:key="button.href"
				:href="button.href"
				target="_blank"
				class="transition flex w-13 origin-center hover:transform-scale-108 h-13 m-1 justify-center text-white items-center duration-300 xs:m-2 md:m-3 mt-4 sm:(w-15 h-15) rounded-2xl bg-home-button- hover:bg-home-button-hovered border-none"
			>
				<font-awesome-icon
					:icon="`fa-brands ${button.icon}`"
					class="sm:(w-10 h-10) w-8 h-8"
				>
					<use :xlink:href="button.icon" />
				</font-awesome-icon>
			</NuxtLink>
		</div>
	</div>
</template>
