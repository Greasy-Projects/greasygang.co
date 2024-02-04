<script lang="ts" setup>
	definePageMeta({
		middleware: ["protected"],
	});

	const user = useAuthenticatedUser();
</script>

<template>
	<div class="font-IBM p-2">
		<h1 class="text-2xl">Dashboard</h1>
		<h2 class="text-xl flex gap-x-2">Hello, <span class="flex gap-x-2">
			<img class="w-8 h-8 rounded-full" :src="user.avatar" :alt="user.username" />
			{{ user.username }}
		</span></h2>
		<a href="/link/discord">Link Discord</a>
	</div>
</template>
