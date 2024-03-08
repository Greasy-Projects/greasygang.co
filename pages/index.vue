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
</script>
<template>
	<main
		class="font-poppins text-white mx-5 flex min-h-screen justify-center items-center"
	>
		<div class="pt-20 pb-10 grid lg:grid-cols-2 gap-5 max-w-7xl">
			<div class="grid h-3xl xs:grid-rows-5 gap-5">
				<div class="flex flex-col gap-0 row-span-2">
					<div class="flex h-4/6 relative row-span-4">
						<NuxtImg
							src="https://cdn.discordapp.com/attachments/1201675212870144030/1215024338437152839/FC_Tips_EN_1.jpg?ex=65fb3e98&is=65e8c998&hm=4eaadcdc522fbb1270c125c53d79ff2ce4a50fb46177effdf2c2c338d4673734&"
							class="rounded-t-2xl xs:rounded-tl-10 sn:rounded-tl-20 md:rounded-tl-50 w-full h-full object-left object-cover"
						>
						</NuxtImg>
						<div
							class="absolute bg-secondary text-nowrap text-xs max-w-9/10 h-8 flex color-gray-100 items-center px-2 top-0 right-0 rounded-tr-xl rounded-bl-xl"
						>
							Use code&nbsp;<span class="font-700 color-white">JUSTFISH</span
							>&nbsp;to get<span class="lt-sm:hidden">&nbsp;in-game&nbsp;</span>rewards!
						</div>
						<div class="absolute bottom-2 right-2">
							<NuxtLink href="https://strms.net/fishing_clash_greasymac" target="_blank" class="w-full lg:w-80 select-none">
								<div
									class="rounded-xl px-4 flex bg-secondary hover:bg-button transition-colors h-15 justify-center items-center"
								>
									<p
										class="font-600 sm:text-sm lg:text-1.4vw xl:text-lg tracking-widest uppercase"
									>
										PLAY GAME
									</p>
								</div>
							</NuxtLink>
						</div>
					</div>
					<div
						class="bg-secondary rounded-b-xl row-span-2 px-4 h-2/6 px-4 py-2 gap-1 flex justify-center items-center"
					>
						<p
							class="flex items-center text-3vw sm:text-base justify-evenly lg:leading-normal leading-4 sm:leading-2.5vw"
						>
							Download Fishing Clash now and become a world class angler! Unlock
							the Lake Guntersville and Mediterranean Sea fisheries to support
							the stream.
						</p>
					</div>
				</div>
				<div class="row-span-3">
					<NuxtImg
						src="/mac/babe.png"
						class="w-full h-full object-cover rounded-xl"
					></NuxtImg>
				</div>
			</div>
			<div class="select-none lg:h-3xl flex flex-col">
				<div>
					<h1
						class="font-bebas text-20vw md:text-12vw xl:text-10em text-center"
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
