<script setup lang="ts">
const buttons = [
	{
		icon: { name: "discord", type: "fab" },
		text: "discord",
		href: "https://discord.gg/VmRjkGV",
		tag: "combo",
		color: "#5865F2",
	},
	{
		icon: { name: "twitch", type: "fab" },
		text: "twitch",
		href: "https://twitch.tv/greasymac",
		tag: "live",
		color: "#9146FF",
	},
	{
		icon: { name: "youtube", type: "fab" },
		text: "youtube",
		href: "https://www.youtube.com/@GreasyMacTV",
		tag: "clips",
		color: "#FF0000",
	},
	{
		icon: { name: "tiktok", type: "fab" },
		text: "tiktok",
		href: "https://tiktok.com/@greasymac",
		tag: "shorts",
		color: "#010101",
	},
	{
		icon: { name: "twitter", type: "fab" },
		text: "twitter",
		href: "https://twitter.com/GreasyMac_",
		tag: "noise",
		color: "#1DA1F2",
	},
	{
		icon: { name: "dollar-sign", type: "fas" },
		text: "donate",
		href: "https://streamelements.com/greasymac/tip",
		tag: "tip jar",
		color: "#2f7f67",
	},
	{
		icon: { name: "spotify", type: "fab" },
		text: "playlist",
		href: "https://open.spotify.com/playlist/21phkh5dZrZtO4E9Bf9qUy",
		tag: "jukebox",
		color: "#1DB954",
	},
];
</script>

<template>
	<ClientOnly>
		<LazyGreasyDiner :buttons="buttons" />
		<template #fallback>
			<GreasyDinerFallback />
		</template>
	</ClientOnly>
</template>

<style>
/* Make the page body fill screen edge to edge, no scroll */
html,
body {
	height: 100%;
	overflow: hidden;
}
</style>
