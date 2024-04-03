<script setup lang="ts">
const downloadURL = "https://cdn.greasygang.co/greasycraft/";
const files = ["curseforge.zip", "prism.zip", "modrinth.mrpack	"];
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
				<NuxtLink
					v-for="file in files"
					:key="file"
					:href="downloadURL + file"
					:style="$BGContentImage('minecraft/button.png')"
					class="mc-button bg-cover bg-center"
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
	</main>
</template>
<style>
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
.mcbutton {
	&::before {
		content: "";
		position: absolute;
		background-color: #e75d20;
		height: 5px;
		width: 100%;
		bottom: 100%;
		left: 0;
	}
	&::after {
		content: "";
		position: absolute;
		background-color: #9b3101;
		height: 5px;
		width: 100%;
		top: 100%;
		left: 0;
	}
	span::before {
		content: "";
		position: absolute;
		background-color: #9b3101;
		height: 100%;
		width: 4px;
		left: 100%;
		top: 0;
	}
	span::after {
		content: "";
		position: absolute;
		background-color: #9b3101;
		height: 100%;
		width: 4px;
		top: 0;
		right: 100%;
	}
}
</style>
