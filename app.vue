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
const user = ref();
function logout() {
	const cookie = useCookie("auth_session");
	cookie.value = null;
	user.value = null;
}
try {
	user.value = await GqlGetMe();
} catch {
	/* empty */
}
</script>
<template>
	<div>
		<nav
			class="absolute w-full mx-auto flex items-center justify-between font-bebas p-4 text-lg transition-colors"
		>
			<NuxtImg src="/gg.png" class="size-11"></NuxtImg>
			<div class="flex gap-x-3">
				<NuxtLink
					href="/"
					class="text-white hover:text-gray-100 text-xl underline underline-offset-6"
					>Home</NuxtLink
				>
				<NuxtLink
					href="https://greasymac.fandom.com/wiki/GreasyMac_Wiki"
					external
					target="_blank"
					class="text-white text-xl hover:text-gray-100"
					>About</NuxtLink
				>
			</div>
			<div class="flex my-auto">
				<NuxtLink
					v-if="!user"
					:href="config.apiBase + '/login/twitch?scopes=user:read:email'"
					class="bg-#ff4040 hover:bg-#e03a3a text-white hover:text-gray-100 h-min px-5 py-1 rounded-lg text-white"
					>Login</NuxtLink
				>
				<NuxtImg
					v-if="user"
					:src="user.me.avatar"
					class="size-11"
					@click="logout"
				></NuxtImg>
			</div>
		</nav>
		<NuxtPage />
	</div>
</template>
<style>
:root {
	--primary: theme(colors.primary);
}
* {
	border: none;
}

body {
	background-color: var(--primary);
}

a {
	text-decoration: none;
	color: white;
}
</style>
