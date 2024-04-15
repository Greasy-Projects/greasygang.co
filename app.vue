<script setup lang="ts">
const { $ogTitle } = useNuxtApp();
useHead({
	link: [{ rel: "icon", type: "image/png", href: "/favicon.webp" }],
});
useSeoMeta({
	themeColor: "#e8a946",
	ogTitle: $ogTitle(),

	ogImage: "/favicon.webp",
});

const config = useRuntimeConfig().public;
const user = ref();
function logout() {
	const cookie = useCookie("auth_session");
	cookie.value = null;
	user.value = null;
}
user.value = await GqlGetMe().catch(() => {});
const route = useRoute();
const navs: { name: string; path: string }[] = [
	{ name: "home", path: "/" },
	{ name: "minecraft", path: "/minecraft" },
	{ name: "about", path: "https://greasymac.fandom.com/wiki/GreasyMac_Wiki" },
];
</script>
<template>
	<div>
		<Notivue v-slot="item" class="font-poppins">
			<Notification :item="item" />
		</Notivue>
		<nav
			class="absolute w-full mx-auto flex items-center justify-between font-bebas p-4 text-lg"
		>
			<NuxtImg :src="$ContentImage('/gg.png')" class="size-11"></NuxtImg>
			<div class="flex gap-x-3">
				<NuxtLink
					v-for="nav in navs"
					:key="nav.path"
					:href="nav.path"
					:class="{
						underline: nav.path === route.path,
						'hover:scale-110': nav.path !== route.path,
					}"
					class="text-white text-xl transition-(transform color) underline-offset-6"
					>{{ nav.name }}</NuxtLink
				>
			</div>
			<div class="flex my-auto">
				<NuxtLink
					v-if="!user"
					:href="
						config.apiBase +
						'/login/twitch?scopes=user:read:email&redirect=' +
						$route.fullPath
					"
					class="bg-#ff4040 hover:bg-#e03a3a text-white hover:text-gray-100 h-min px-5 py-1 rounded-lg text-white"
					>Login</NuxtLink
				>
				<NuxtImg
					v-if="user"
					:src="user.me.avatar"
					class="size-11 rounded-full"
					@click="logout"
				></NuxtImg>
			</div>
		</nav>
		<NuxtPage :user="user" />
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
