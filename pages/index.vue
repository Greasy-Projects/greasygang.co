<script setup lang="ts">
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

const { data: sponsor } = useAsyncData("sponsor", () =>
	cms(readItem("Sponsor", 1))
);
</script>
<template>
	<main
		class="font-poppins text-white mx-5 flex min-h-screen justify-center items-center"
	>
		<div class="pt-20 pb-10 grid lg:grid-cols-2 gap-5 w-full max-w-7xl">
			<div
				:class="{ 'h-3xl': sponsor?.enabled, 'lt-lg:h-lg': !sponsor?.enabled }"
				class="grid w-full xs:grid-rows-5 gap-5"
			>
				<div v-if="sponsor && sponsor.enabled" class="flex flex-col row-span-2">
					<div class="flex h-full relative row-span-4">
						<NuxtImg
							densities="x1 x2"
							layout="responsive"
							:src="$cmsImage(sponsor.image) + '/sponsor'"
							class="rounded-xl rounded-tl-[clamp(3rem,10vw,10rem)] w-full h-full object-left object-cover"
							:style="'object-position:' + sponsor.imagePosition"
						>
						</NuxtImg>

						<div
							v-if="sponsor.code"
							class="absolute bg-secondary text-nowrap overflow-hidden lt-sm:text-xs max-w-9/10 h-8 flex color-gray-100 items-center px-2 top-0 right-0 rounded-tr-xl rounded-bl-xl"
						>
							Use code&nbsp;<span class="font-700 color-white">{{
								sponsor.code
							}}</span
							>&nbsp;to get<span class="lt-sm:hidden">&nbsp;in-game</span
							>&nbsp;rewards!
						</div>
						<div
							class="absolute bg-gradient-to-t rounded-xl from-black via-black/80 to-transparent sm:flex bottom-0 p4 px-3.5 gap-2"
						>
							<div>
								<p
									class="rounded-xl items-center text-sm sm:text-base lg:leading-normal leading-4 sm:leading-2.5vw mx-auto"
								>
									{{ sponsor.description }}
								</p>
							</div>
							<NuxtLink
								densities="x1 x2"
								layout="responsive"
								:href="sponsor.url"
								target="_blank"
								class="w-70 select-none"
							>
								<div
									class="rounded-lg px-4 flex bg-secondary hover:bg-button transition-colors h-10 lt-sm:mt-2.5 sm:h-full justify-center items-center"
								>
									<p
										class="font-600 sm:text-sm lg:text-1.4vw xl:text-lg tracking-widest text-nowrap uppercase"
									>
										PLAY GAME
									</p>
								</div>
							</NuxtLink>
						</div>
					</div>
				</div>
				<div
					:class="{
						'row-span-3': sponsor && sponsor.enabled,
						'row-span-full': !sponsor?.enabled,
					}"
				>
					<NuxtImg
						:src="$cmsImage('777b4597-5c15-4835-b291-fdf8b9af3524/mac-babe')"
						class="w-full h-full object-cover rounded-xl"
					></NuxtImg>
				</div>
			</div>
			<div class="select-none lg:h-3xl flex flex-col">
				<div>
					<h1
						class="font-bebas text-25vw lg:text-12vw xl:text-10em text-center"
					>
						GreasyMac
					</h1>
				</div>
				<div
					class="flex flex-col space-y-4 h-full p-6 justify-between bg-secondary rounded-xl"
				>
					<NuxtLink
						v-for="button in buttons"
						:key="button.href"
						:href="button.href"
						target="_blank"
						class="btn-before"
					>
						<div
							class="transition transition-colors flex bg-button btn h-15 gap-x-3 justify-center items-center"
						>
							<FontAwesomeIcon
								:icon="[button.icon.type, button.icon.name]"
								class="size-6"
							/>
							<p class="font-600 text-lg tracking-widest uppercase">
								{{ button.text }}
							</p>
						</div>
					</NuxtLink>
				</div>
			</div>
			<WatchTime />
			<WatchTime all />
		</div>
	</main>
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
