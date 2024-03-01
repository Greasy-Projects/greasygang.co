<script setup lang="ts">
useHead({
	link: [{ rel: "icon", type: "image/png", href: "/favicon.webp" }],
});
useSeoMeta({
	themeColor: "#e8a946",
	ogTitle: "GreasyMac",
	ogDescription: "Welcome to the Greasy Gang",
	ogImage: "/favicon.webp",
});
const config = useRuntimeConfig().public;
const user = await GqlGetMe();
</script>
<template>
	<div class="bg-primary">
		<header
			class="absolute w-screen mx-auto flex items-center justify-between font-bebas p-4 text-lg transition-colors"
		>
			<NuxtImg src="/gg.png" class="size-11"></NuxtImg>
			<div class="flex gap-x-3">
				<NuxtLink
					href="/about"
					class="text-white hover:text-gray-100 text-xl underline underline-offset-6"
					>Home</NuxtLink
				>
				<NuxtLink
					href="https://greasymac.fandom.com/wiki/GreasyMac_Wiki"
					external
					class="text-white text-xl hover:text-gray-100"
					>About</NuxtLink
				>
			</div>
			<div class="flex my-auto">
				<NuxtLink
					v-if="!user"
					:href="
						config.apiBase +
						'/login/twitch?scopes=bits:read channel:read:editors channel:read:redemptions channel:read:subscriptions user:read:email'
					"
					class="bg-#ff4040 hover:bg-#e03a3a text-white hover:text-gray-100 h-min px-5 py-1 rounded-lg text-white"
					>Login</NuxtLink
				>
				<NuxtImg v-if="user.me.avatar" :src="user.me.avatar" class="size-11"></NuxtImg>
			</div>
		</header>
		<NuxtPage />
	</div>
</template>
