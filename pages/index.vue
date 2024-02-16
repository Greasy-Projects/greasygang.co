<script setup lang="ts">
const buttons = [
	{ icon: "#i-discord", href: "https://discord.gg/VmRjkGV" },
	{ icon: "#i-twitch", href: "https://twitch.tv/greasymac" },
	{ icon: "#i-tiktok", href: "https://tiktok.com/@greasymac" },
	{ icon: "#i-youtube", href: "https://www.youtube.com/@GreasyMacTV" },
	{ icon: "#i-twitter", href: "https://twitter.com/GreasyMac_" },
	{
		icon: "#i-streamelements",
		href: "https://streamelements.com/greasymac/tip",
	},
	{
		icon: "#i-spotify",
		href: "https://open.spotify.com/playlist/21phkh5dZrZtO4E9Bf9qUy",
	},
];
</script>
<template>
	<main>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			version="1.1"
			xmlns:xlink="http://www.w3.org/1999/xlink"
			viewBox="0 0 40 40"
			display="none"
			width="0"
			height="0"
		>
			<symbol id="i-discord" viewBox="0 0 40 40">
				<path
					d="M33.2,8.3c-2.5-1.1-5.1-1.9-7.9-2.4c-0.3,0.6-0.7,1.4-1,2c-2.9-0.4-5.8-0.4-8.7,0c-0.3-0.6-0.7-1.4-1-2 c-2.8,0.5-5.4,1.3-7.9,2.4c-5,7.2-6.3,14.2-5.6,21.1c3.3,2.3,6.5,3.8,9.6,4.7c0.8-1,1.5-2.1,2.1-3.3c-1.1-0.4-2.2-0.9-3.2-1.5 c0.3-0.2,0.5-0.4,0.8-0.6c6.3,2.8,13,2.8,19.2,0c0.3,0.2,0.5,0.4,0.8,0.6c-1,0.6-2.1,1.1-3.2,1.5c0.6,1.1,1.3,2.2,2.1,3.3 c3.1-0.9,6.3-2.4,9.6-4.7C39.7,21.4,37.5,14.4,33.2,8.3z M13.7,25.1c-1.9,0-3.4-1.7-3.4-3.7s1.5-3.7,3.4-3.7c1.9,0,3.5,1.7,3.4,3.7 C17.1,23.4,15.6,25.1,13.7,25.1z M26.3,25.1c-1.9,0-3.4-1.7-3.4-3.7s1.5-3.7,3.4-3.7c1.9,0,3.5,1.7,3.4,3.7 C29.7,23.4,28.2,25.1,26.3,25.1z"
				/>
			</symbol>
			<symbol id="i-tiktok" viewBox="0 0 40 40">
				<path
					d="M36.1,11.7v5c-3.3,0-6.3-1-8.8-2.8v12.9c0,6.5-5.2,11.7-11.7,11.7c-2.4,0-4.6-0.7-6.5-2c0,0,0,0,0,0 c-3.1-2.1-5.2-5.7-5.2-9.7c0-6.5,5.2-11.7,11.7-11.7c0.5,0,1.1,0,1.6,0.1v1.4c0,0,0,0,0,0v5c-0.5-0.2-1.1-0.3-1.6-0.3 c-2.9,0-5.3,2.4-5.3,5.4c0,2.1,1.2,3.9,2.9,4.8c0.7,0.4,1.5,0.6,2.4,0.6c2.9,0,5.3-2.4,5.3-5.3V1.5h6.3v0.8c0,0.2,0.1,0.5,0.1,0.7 c0.4,2.5,1.9,4.7,4,6c0,0,0.1,0.1,0.1,0.1c0,0-0.1-0.1-0.1-0.1c1.4,0.9,3,1.3,4.7,1.3V11.7"
				/>
			</symbol>
			<symbol id="i-youtube" viewBox="0 0 40 40">
				<path
					d="M37.6,27.1c0,0-0.3,2.4-1.4,3.5c-1.4,1.4-2.9,1.4-3.6,1.5c-5,0.4-12.4,0.4-12.4,0.4s-9.2-0.1-12.1-0.4 c-0.8-0.1-2.6-0.1-3.9-1.5c-1.1-1.1-1.4-3.5-1.4-3.5s-0.4-2.9-0.4-5.7v-2.7c0-2.9,0.4-5.7,0.4-5.7s0.3-2.4,1.4-3.5 C5.5,8,7,8,7.7,7.9c5-0.4,12.4-0.4,12.4-0.4h0c0,0,7.5,0,12.4,0.4C33.3,8,34.8,8,36.2,9.4c1.1,1.1,1.4,3.5,1.4,3.5s0.4,2.9,0.4,5.7 v2.7C37.9,24.2,37.6,27.1,37.6,27.1z M16.5,14.6l0,9.9l9.6-5L16.5,14.6z"
				/>
			</symbol>
			<symbol id="i-twitch" viewBox="0 0 40 40">
				<path
					d="M20,13.9v8.4h-2.8v-8.4H20z M27.7,13.9v8.4h-2.8v-8.4H27.7z M27.7,28.5l4.9-4.9V8.3h-23v20.2h6.3v4.2l4.2-4.2 C20,28.5,27.7,28.5,27.7,28.5z M35.4,5.5v19.6l-8.4,8.4h-6.3l-4.2,4.2h-4.2v-4.2H4.6V11.1l2.1-5.6H35.4L35.4,5.5z"
				/>
			</symbol>
			<symbol id="i-twitter" viewBox="0 0 40 40">
				<path
					d="M36.3,10.2c-1,1.3-2.1,2.5-3.4,3.5c0,0.2,0,0.4,0,1c0,1.7-0.2,3.6-0.9,5.3c-0.6,1.7-1.2,3.5-2.4,5.1 c-1.1,1.5-2.3,3.1-3.7,4.3c-1.4,1.2-3.3,2.3-5.3,3c-2.1,0.8-4.2,1.2-6.6,1.2c-3.6,0-7-1-10.2-3c0.4,0,1.1,0.1,1.5,0.1 c3.1,0,5.9-1,8.2-2.9c-1.4,0-2.7-0.4-3.8-1.3c-1.2-1-1.9-2-2.2-3.3c0.4,0.1,1,0.1,1.2,0.1c0.6,0,1.2-0.1,1.7-0.2 c-1.4-0.3-2.7-1.1-3.7-2.3s-1.4-2.6-1.4-4.2v-0.1c1,0.6,2,0.9,3,0.9c-1-0.6-1.5-1.3-2.2-2.4c-0.6-1-0.9-2.1-0.9-3.3s0.3-2.3,1-3.4 c1.5,2.1,3.6,3.6,6,4.9s4.9,2,7.6,2.1c-0.1-0.6-0.1-1.1-0.1-1.4c0-1.8,0.8-3.5,2-4.7c1.2-1.2,2.9-2,4.7-2c2,0,3.6,0.8,4.8,2.1 c1.4-0.3,2.9-0.9,4.2-1.5c-0.4,1.5-1.4,2.7-2.9,3.6C33.8,11.2,35.1,10.9,36.3,10.2L36.3,10.2z"
				/>
			</symbol>
			<symbol id="i-streamelements" viewBox="0 0 40 40">
				<path
					d="M15.8,12.9c0,2.2,2.5,2.9,5.5,4c5.1,1.7,9.4,3.8,9.4,8.9c0,5.5-4.2,9.2-11.2,9.6l-0.6,2.9c-0.1,0.5-0.6,0.9-1.2,0.9h-4.4 c-0.1,0-0.1,0-0.2,0c-0.7-0.1-1.1-0.8-0.9-1.4l0.7-3.1c-2.6-0.7-5-2-7-3.8c0,0,0,0,0,0c-0.4-0.5-0.4-1.2,0-1.7l2.4-2.4 c0.5-0.4,1.2-0.4,1.7,0c2.2,2.1,5.2,3.3,8.3,3.2c3.2,0,5.3-1.3,5.3-3.5s-2.2-2.7-6.2-4.2c-4.3-1.5-8.4-3.7-8.4-8.8 c0-5.9,4.9-8.7,10.7-9l0.6-3c0.1-0.5,0.6-0.9,1.2-0.9h4.4c0.1,0,0.2,0,0.2,0c0.6,0.1,1,0.8,0.9,1.4l-0.7,3.3c2.2,0.7,4.3,1.9,6,3.4 c0,0,0,0,0.1,0.1c0.5,0.5,0.4,1.2,0,1.6L30,12.8c-0.5,0.4-1.2,0.5-1.6,0c-2.2-1.9-5-2.9-7.9-2.9C18.1,10,15.8,10.8,15.8,12.9z"
				/>
			</symbol>
			<symbol id="i-spotify" viewBox="0 0 40 40">
				<path
					d="M26.9,26.3c0-0.4-0.2-0.8-0.6-1c-2.6-1.5-5.6-2.3-9-2.3c-1.8,0-3.7,0.2-5.8,0.7c-0.6,0.1-0.8,0.5-0.8,1 c0,0.3,0.1,0.5,0.3,0.7c0.2,0.2,0.4,0.3,0.7,0.3c0.1,0,0.3-0.1,0.7-0.2c1.8-0.4,3.4-0.5,4.9-0.5c3,0,5.7,0.7,8,2.1 c0.3,0.1,0.5,0.2,0.7,0.2c0.3,0,0.5-0.1,0.7-0.3C26.8,26.8,26.9,26.6,26.9,26.3L26.9,26.3z M28.8,22c0-0.5-0.2-0.9-0.7-1.2 c-3.2-1.9-6.8-2.8-11-2.8c-2,0-4.1,0.3-6.1,0.8c-0.6,0.2-1,0.6-1,1.3c0,0.3,0.1,0.6,0.4,0.9c0.2,0.2,0.5,0.4,0.9,0.4 c0.1,0,0.3-0.1,0.7-0.2c1.6-0.4,3.3-0.7,5-0.7c3.7,0,7,0.8,9.8,2.5c0.3,0.2,0.6,0.3,0.8,0.3c0.3,0,0.6-0.1,0.9-0.4 C28.7,22.6,28.8,22.3,28.8,22L28.8,22z M31,17c0-0.6-0.3-1.1-0.8-1.4c-1.7-1-3.6-1.7-5.9-2.2c-2.2-0.5-4.5-0.8-6.9-0.8 c-2.7,0-5.2,0.3-7.3,0.9c-0.3,0.1-0.6,0.3-0.8,0.5c-0.2,0.2-0.3,0.6-0.3,1c0,0.4,0.1,0.8,0.4,1c0.3,0.3,0.6,0.4,1,0.4 c0.1,0,0.4-0.1,0.8-0.2c1.8-0.5,3.8-0.7,6.2-0.7c2.1,0,4.2,0.2,6.2,0.7c2,0.5,3.7,1.1,5.1,1.9c0.3,0.2,0.5,0.2,0.8,0.2 c0.4,0,0.7-0.1,1-0.4C30.8,17.8,31,17.4,31,17L31,17z M35.1,20c0,2.8-0.7,5.4-2.1,7.7c-1.4,2.4-3.3,4.2-5.6,5.6 c-2.4,1.4-4.9,2.1-7.7,2.1c-2.8,0-5.4-0.7-7.7-2.1c-2.4-1.4-4.2-3.3-5.6-5.6S4.2,22.8,4.2,20s0.7-5.4,2.1-7.7S9.5,8,11.9,6.6 s4.9-2.1,7.7-2.1c2.8,0,5.4,0.7,7.7,2.1s4.2,3.3,5.6,5.6C34.4,14.6,35.1,17.2,35.1,20z"
				/>
			</symbol>
		</svg>
		<div class="fade-out bg-#370f0f absolute -z-1 w-full h-full h-20"></div>
		<NuxtImg
			src="/bg.png"
			class="h-screen transition-all object-cover object-bottom absolute w-full -z-10"
			:modifiers="{ blur: '5' }"
			height="500"
			width="500"
		></NuxtImg>
		<div
			class="font-IBM justify-center flex h-screen object-cover items-center text-white"
			style="
				background-image: linear-gradient(
					45deg,
					rgba(100, 0, 700, 0.1) 0%,
					/* rgba(100, 0, 0, 0.6) 10%, */ rgba(999, 0, 0, 0.3) 100%
				);
			"
		>
			<div class="m-10 flex lt-lg:flex-col fade-in pop-in items-center">
				<div class="flex fade-in">
					<NuxtImg
						width="200"
						src="/pfp.png"
						preload
						class="transition-all fade-in w-55 opacity-0 lg:mr-10 lg:w-70 h-a"
						alt="GreasyMac Profile Picture"
					/>
				</div>
				<div class="flex flex-col fade-in items-center">
					<h1
						class="lg:text-25 text-12 xs:text-15 md:text-20 m-2 transition-all font-700"
					>
						GreasyMac
					</h1>
					<p class="text-3.5 xs:text-4 md:text-6 xs:my-2 md:my-4 font-600">
						Welcome to the greasy gang.
					</p>
					<div
						class="flex flex-wrap justify-center xs:(min-w-xs w-60vw) sm:w-sm md:w-a"
					>
						<NuxtLink
							v-for="button in buttons"
							:key="button.href"
							:href="button.href"
							target="_blank"
							class="transition flex w-13 origin-center hover:transform-scale-108 h-13 m-1 justify-center text-white items-center duration-300 xs:m-2 md:m-3 mt-4 sm:(w-15 h-15) rounded-2xl bg-home-button- hover:bg-home-button-hovered border-none"
						>
							<svg class="sm:(w-10 h-10) w-8 h-8">
								<use :xlink:href="button.icon" />
							</svg>
						</NuxtLink>
					</div>
				</div>
			</div>
		</div>
	</main>
</template>

<style scoped>
.fade-out {
	animation: fadeOut 1.5s ease-in-out 1s forwards;
}

@keyframes fadeOut {
	from {
		opacity: 1;
	}
	to {
		opacity: 0;
	}
}
.fade-in {
	animation: fadeIn 1.5s ease-in-out forwards;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

.pop-in {
	animation: popIn 1s ease-out;
}

@keyframes popIn {
	from {
		transform: translateY(50px);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}
</style>
