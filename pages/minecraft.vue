<script setup lang="ts">
const downloadURL = "https://cdn.greasygang.co/greasycraft/";
const files = ["curseforge.zip", "prism.zip"];

const isAccordionOpen = ref(false);
</script>

<template>
	<main>
		<NuxtImg
			class="absolute -z-100 size-full op-80 overflow-hidden object-cover"
			src="GoopBGTransparent.png"
		></NuxtImg>
		<div class="flex flex-col justify-center items-center h-dvh">
			<div
				class="flex flex-col space-y-4 w-lg p-6 justify-between rounded-xl"
				:style="$BGContentImage('minecraft/background.png')"
			>
				<NuxtImg
					class="w-full overflow-hidden object-cover"
					:src="$ContentImage('minecraft/greasycraft.png')"
				></NuxtImg>
				<div class="space-y-2">
					<div v-for="file in files" :key="file" class="gap-2 flex">
						<div
							class="mc-button size-11 bg-cover bg-center"
							:style="$BGContentImage('minecraft/button.png')"
						>
							<div class="h-full title flex justify-center items-center">
								<FontAwesomeIcon :icon="['fas', 'info']" class="size-4" />
							</div>
						</div>
						<NuxtLink
							:href="downloadURL + file"
							download
							class="mc-button w-90% bg-cover bg-center"
							:style="$BGContentImage('minecraft/button.png')"
						>
							<div class="relative title flex h-10 justify-center items-center">
								<div
									class="font-600 h-full flex justify-center w-full items-center text-lg tracking-widest uppercase"
								>
									{{ file }}
								</div>
								<FontAwesomeIcon
									:icon="['fas', 'download']"
									class="size-5 absolute right-2.5"
								/>
							</div>
						</NuxtLink>
					</div>
				</div>
			</div>
			<div
				class="h-100 w-100 bg-repeat bg-center object-cover"
				:style="$BGContentImage('minecraft/dirt.png', 100, 100)"
			>
				<div class="my-4">
					<AccordionMenu title="Prism" aria-title="prism">
						<p>
							1. Download and install Prism from
							<a
								class="text-gray-500 hover:text-gray-600 underline"
								href="https://prismlauncher.org"
								>prismlauncher.org</a
							><br />
							2. Log in to Prism with your Microsoft account.<br />
							3. Drag and drop the downloaded ZIP file
							<a
								class="text-blue-500 hover:text-blue-600"
								href="https://cdn.greasygang.co/greasycraft/prism.zip"
								>(Prism.zip)</a
							>
							onto the main window.<br />
							4. Launch the modpack by double clicking the GreasyCraft icon or
							clicking the GreasyCraft icon and then pressing Launch on the
							right sidebar.
						</p>
					</AccordionMenu>
					<AccordionMenu title="CurseForge" aria-title="curseforge">
						<p>
							1. Download and install Curseforge from
							<a
								class="text-gray-500 hover:text-gray-600 underline"
								href="https://www.curseforge.com"
								>curseforge.com</a
							><br />
							2. Click "Minecraft" (it may need to install)<br />
							3. In the Minecraft tab, click Create Custom Profile in the top
							right.<br />
							4. Click "Import"<br />
							5. Browse to the downloaded file
							<a
								class="text-blue-500 hover:text-blue-600"
								href="https://cdn.greasygang.co/greasycraft/curseforge.zip"
								>(CurseForge.zip)</a
							><br />
							6. After it's done initializing, launch the modpack.<br />
							7. Log into the Minecraft launcher with your Microsoft account if
							it isn't already<br />
							8. Click Play.
						</p>
					</AccordionMenu>
				</div>
			</div>
			<div class="m-2" @click="isAccordionOpen = true">
				<button
					class="font-bebas bg-#ff4040 hover:bg-#e03a3a text-white hover:text-gray-100 h-min px-5 py-1 rounded-lg text-white text-lg"
				>
					Instructions
				</button>
			</div>
		</div>

		<Transition>
			<div
				v-if="isAccordionOpen"
				class="font-poppins relative z-10 transition-all"
			>
				<div
					class="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
				></div>

				<div class="fixed inset-0 flex items-center justify-center">
					<div
						class="bg-white p-6 rounded-lg lg:w-2/6 md:w-1/2 w-full md:mx-0 mx-4"
						aria-labelledby="modal-title"
						role="dialog"
						aria-modal="true"
					>
						<div class="flex justify-between items-center">
							<h2 id="modal-title" class="text-lg font-medium text-gray-900">
								Instructions
							</h2>
							<button class="text-gray-400 hover:text-gray-500 bg-transparent">
								<FontAwesomeIcon
									:icon="['fas', 'xmark']"
									class="h-4 w-4"
									@click="isAccordionOpen = false"
								/>
							</button>
						</div>
						<div class="mt-4 text-sm text-gray-500">
							<p>
								Currently, we are supporting 2 modpack launchers, those being
								<a
									class="text-gray-500 hover:text-gray-600 underline"
									href="https://prismlauncher.org/"
									>Prism</a
								>
								and
								<a
									class="text-gray-500 hover:text-gray-600 underline"
									href="https://www.curseforge.com/"
									>CurseForge</a
								>.
							</p>
							<br />
							<div
								class="border-solid border-y-0 border-r-0 border-l-2 border-yellow-400 px-2 py-1"
							>
								<p class="text-yellow-400 mb-1">⚠️ Warning</p>
								We personally recommend you to use
								<a
									class="text-gray-500 hover:text-gray-600 underline"
									href="https://prismlauncher.org/"
									>Prism</a
								>, though it is completely up to you. If you choose to use
								another modpack launcher, or to manually install it, we will
								only be able to give limited support.
							</div>

							<div class="my-4">
								<AccordionMenu title="Prism" aria-title="prism">
									<p>
										1. Download and install Prism from
										<a
											class="text-gray-500 hover:text-gray-600 underline"
											href="https://prismlauncher.org"
											>prismlauncher.org</a
										><br />
										2. Log in to Prism with your Microsoft account.<br />
										3. Drag and drop the downloaded ZIP file
										<a
											class="text-blue-500 hover:text-blue-600"
											href="https://cdn.greasygang.co/greasycraft/prism.zip"
											>(Prism.zip)</a
										>
										onto the main window.<br />
										4. Launch the modpack by double clicking the GreasyCraft
										icon or clicking the GreasyCraft icon and then pressing
										Launch on the right sidebar.
									</p>
								</AccordionMenu>
								<AccordionMenu title="CurseForge" aria-title="curseforge">
									<p>
										1. Download and install Curseforge from
										<a
											class="text-gray-500 hover:text-gray-600 underline"
											href="https://www.curseforge.com"
											>curseforge.com</a
										><br />
										2. Click "Minecraft" (it may need to install)<br />
										3. In the Minecraft tab, click Create Custom Profile in the
										top right.<br />
										4. Click "Import"<br />
										5. Browse to the downloaded file
										<a
											class="text-blue-500 hover:text-blue-600"
											href="https://cdn.greasygang.co/greasycraft/curseforge.zip"
											>(CurseForge.zip)</a
										><br />
										6. After it's done initializing, launch the modpack.<br />
										7. Log into the Minecraft launcher with your Microsoft
										account if it isn't already<br />
										8. Click Play.
									</p>
								</AccordionMenu>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</main>
</template>

<style>
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
.mc-button {
	font-family: "Minecraft";
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
}
</style>
