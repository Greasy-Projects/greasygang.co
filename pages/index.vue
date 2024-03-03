<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const buttons = [
	{
		icon: { name: "discord", type: "fab" },
		text: "discord",
		href: "https://discord.gg/VmRjkGV",
	},
	{
		icon: { name: "twitch", type: "fab" },
		text: "twitch",
		href: "https://twitch.tv/greasymac",
	},
	{
		icon: { name: "youtube", type: "fab" },
		text: "youtube",
		href: "https://www.youtube.com/@GreasyMacTV",
	},
	{
		icon: { name: "tiktok", type: "fab" },
		text: "tiktok",
		href: "https://tiktok.com/@greasymac",
	},
	{
		icon: { name: "twitter", type: "fab" },
		text: "twitter",
		href: "https://twitter.com/GreasyMac_",
	},
	{
		icon: { name: "dollar-sign", type: "fas" },
		text: "donate",
		href: "https://streamelements.com/greasymac/tip",
	},
	{
		icon: { name: "spotify", type: "fab" },
		text: "playlist",
		href: "https://open.spotify.com/playlist/21phkh5dZrZtO4E9Bf9qUy",
	},
];
</script>
<template>
	<div class="font-poppins">
		<main
			class="font-barlow lt-md:pt-20 flex items-center min-h-screen gap-5 max-w-7xl w-fit mx-a px-8 py-5 space-y-5 text-white"
		>
			<div
				class="md:grid grid-cols-subgrid grid-cols-1 md:grid-cols-2 justify-center gap-5 h-min"
			>
				<NuxtImg
					src="/mac/babe.png"
					class="h-full w-full object-cover rounded-xl mx-a"
				>
				</NuxtImg>
				<div class="grid grid-rows-1 gap-2 select-none">
					<div>
						<h1
							class="font-bebas text-20vw md:text-12vw xl:text-10em text-center"
						>
							GreasyMac
						</h1>
						<div
							class="gap-4 p-6 bg-secondary color-primary rounded-xl flex flex-col"
						>
							<NuxtLink
								v-for="button in buttons"
								:key="button.href"
								:href="button.href"
								target="_blank"
								class="btn-before"
							>
								<div
									class="transition transition-colors flex bg-button shadow-2 btn px-6 py-1 h-15 gap-x-3 justify-center items-center"
								>
									<FontAwesomeIcon
										:icon="[button.icon.type, button.icon.name]"
										class="size-6"
									/>
									<p class="font-600 text-lg tracking-widest uppercase h-min">
										{{ button.text }}
									</p>
								</div>
							</NuxtLink>
						</div>
					</div>
				</div>
			</div>
		</main>
	</div>
</template>

<style scoped>
a.btn-before {
	--border: theme(colors.primary);
	position: relative;
	transition: all 0.1s;
	box-shadow: -6px 6px 0 var(--border);
	top: -3px;
	left: 3px;

	&::after {
		transition: all 0.1s;
		content: "";
		position: absolute;
		top: 2px;
		left: -4px;
		width: 8px;
		height: 8px;
		background-color: var(--border);
		transform: rotate(45deg);
		z-index: 1;
	}

	&::before {
		transition: all 0.1s;
		content: "";
		position: absolute;
		bottom: -4px;
		right: 2px;
		width: 8px;
		height: 8px;
		background-color: var(--border);
		transform: rotate(45deg);
		z-index: 1;
	}

	&:hover {
		top: 0px;
		left: 0px;
		box-shadow: -3px 3px 0 var(--border);
		
		&::after {
			top: 1px;
			left: -2px;
			width: 4px;
			height: 4px;
		}
		
		&::before {
			bottom: -2px;
			right: 1px;
			width: 4px;
			height: 4px;
		}
	}
	
	&:active:hover {
		top: 3px;
		left: -3px;
		box-shadow: 0px 0px 0 var(--border);
		&::after {
			width: 0px;
			height: 0px;
		}

		&::before {
			width: 0px;
			height: 0px;
		}
	}
}
.btn {
	box-shadow: 0.4px -0.4px 5px 0 rgba(13, 10, 8, 0.1);
	position: relative;
	z-index: 2;
}
</style>
