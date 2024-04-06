<script setup lang="ts">
const { $ContentImage, $ogTitle, $PreContentImage } = useNuxtApp();
useHead({
	title: "GreasyCraft",
	link: [
		{
			rel: "preload",
			as: "image",
			href: $PreContentImage("minecraft/dirt.png", 100, 100),
		},
	],
});
useSeoMeta({
	ogTitle: $ogTitle("GreasyCraft"),
	ogDescription: "Downloads and setup instructions for the GreasyCraft Modpack",
	twitterCard: "summary_large_image",
	ogImage: $ContentImage("minecraft/greasycraft.png"),
});

const downloadURL = "https://cdn.greasygang.co/greasycraft/";
const files = ["curseforge.zip", "prism.zip"];

const showModal = ref<string | null>(null);
</script>

<template>
	<main>
		<NuxtImg
			class="absolute -z-100 size-full op-80 overflow-hidden object-cover"
			:src="$ContentImage('GoopBGTransparent.png')"
		></NuxtImg>
		<div class="flex flex-col justify-center items-center h-dvh">
			<div
				class="flex flex-col space-y-4 w-90vw max-w-lg p-6 justify-between rounded-xl"
				:style="$BGContentImage('minecraft/background.png')"
			>
				<NuxtImg
					class="w-full overflow-hidden object-cover"
					:src="$ContentImage('minecraft/greasycraft.png')"
				></NuxtImg>
				<div class="space-y-2">
					<div v-for="file in files" :key="file" class="gap-2 flex">
						<div
							class="mc-button mc-font size-11 bg-cover bg-center"
							:style="$BGContentImage('minecraft/button.png')"
							@click="showModal = file"
						>
							<div class="h-full title flex justify-center items-center">
								<FontAwesomeIcon :icon="['fas', 'info']" class="size-4" />
							</div>
						</div>
						<NuxtLink
							:href="downloadURL + file"
							download
							class="mc-button mc-font w-90% bg-cover bg-center"
							:style="$BGContentImage('minecraft/button.png')"
						>
							<div class="relative title flex h-10 justify-center items-center">
								<div
									class="font-600 h-full flex justify-center w-full items-center text-[clamp(0rem,4vw,1.125rem)] sm:text-lg tracking-widest uppercase"
								>
									{{ file }}
								</div>
								<FontAwesomeIcon
									:icon="['fas', 'download']"
									class="size-4 sm:size-5 absolute right-2.5"
								/>
							</div>
						</NuxtLink>
					</div>
				</div>
			</div>
		</div>

		<!-- Prism Modal -->
		<Transition>
			<div
				v-if="showModal"
				class="fixed inset-0 h-dvh flex justify-center items-center"
			>
				<div
					class="absolute w-full h-100vh bg-gray-900 bg-opacity-50 transition-opacity"
					@click="showModal = null"
				></div>
				<div class="mc-font mc-modal max-w-lg z-10 transition-all">
					<div class="flex items-center justify-center">
						<div
							class="bg-repeat m-5 p-6 rounded-lg border-solid border-3 border-white shadow-inner shadow-gray-900"
							aria-labelledby="modal-title"
							role="dialog"
							aria-modal="true"
							:style="
								$BGContentImage('minecraft/dirt.png', 100, 100, {
									darken: 0.3,
								})
							"
						>
							<div class="flex justify-between items-center">
								<h2 id="modal-title" class="text-lg font-medium text-white">
									Install instructions
								</h2>
								<button class="text-white hover:text-gray-300 bg-transparent">
									<FontAwesomeIcon
										:icon="['fas', 'xmark']"
										class="h-5 w-5 my-auto"
										@click="showModal = null"
									/>
								</button>
							</div>
							<div class="mt-4 text-sm text-white">
								<p v-if="showModal === 'curseforge.zip'">
									1. Download and install Curseforge from
									<a href="https://www.curseforge.com/download/app"
										>curseforge.com</a
									><br />
									2. Click "Minecraft" (it may need to install)<br />
									3. In the Minecraft tab, click Create Custom Profile in the
									top right.<br />
									4. Click "Import"<br />
									5. Select
									<a href="https://cdn.greasygang.co/greasycraft/curseforge.zip"
										>CurseForge.zip</a
									><br />
									6. After it's done initializing, launch the modpack.<br />
									7. Log into the Minecraft launcher with your Microsoft account
									if it isn't already<br />
									8. Click Play.
								</p>
								<p v-if="showModal === 'prism.zip'">
									1. Download and install Prism from
									<a href="prismlauncher.org/download/">prismlauncher.org</a
									><br />
									2. Log in to Prism with your Microsoft account.<br />
									3. Drag and drop
									<a href="https://cdn.greasygang.co/greasycraft/prism.zip"
										>Prism.zip</a
									>
									onto the main window.<br />
									4. Launch the modpack by double clicking the GreasyCraft icon
									or by clicking the GreasyCraft icon and then pressing Launch
									on the right sidebar.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</main>
</template>

<style>
.mc-modal {
	a {
		color: #55ffff;
		font-weight: 700;
		&:hover {
			color: #32d1c4;
		}
	}
}
.v-enter-active,
.v-leave-active {
	transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
	opacity: 0;
}
@font-face {
	font-family: "Minecraft";
	src: url("https://cdn.greasygang.co/fonts/minecraft.woff") format("woff");
}

.mc-font {
	font-family: "Minecraft";
	color: #ddd;
	text-shadow: 2px 2px #000a;
}

.mc-button {
	cursor: pointer;
	overflow: hidden;
	white-space: nowrap;
	user-select: none;

	image-rendering: pixelated;
	border: 2px solid #000;

	/* Mouse over */
	&:hover .title {
		background-color: rgba(100, 100, 255, 0.45);
		text-shadow: 2px 2px #202013cc;
		color: #ffffa0;
	}
	&:active .title {
		box-shadow:
			inset -2px -4px #0004,
			inset 2px 2px #fff5;
	}

	/* Button title */
	.title {
		color: #ddd;
		text-shadow: 2px 2px #000a;
		box-shadow:
			inset -2px -4px #0006,
			inset 2px 2px #fff7;
	}
	.title > svg {
		filter: drop-shadow(2px 2px #000a);
	}
}
</style>
