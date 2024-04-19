<script setup lang="ts">
import { ScopesArray, type Scopes } from "~/constants";

// Create an array of all scopes
const selectedScopes = ref<Scopes[]>([]);
const { $login } = useNuxtApp();
const loginUrl = computed(() => $login(selectedScopes.value));
const user = useUser();
if (user?.me.scope) {
	const scopes = user.me.scope
		.split(/\s/)
		.filter(s => ScopesArray.includes(s as Scopes)) as Scopes[];
	selectedScopes.value.push(...scopes);
}
</script>
<template>
	<div class="min-h-dvh flex justify-center items-center">
		<div class="flex py-20 space-y-5 flex-col justify-center items-center">
			<div class="flex flex-wrap justify-center">
				<label
					v-for="(scope, index) in ScopesArray"
					:key="index"
					class="min-w-70 items-center space-y-2"
				>
					<input
						v-model="selectedScopes"
						type="checkbox"
						:value="scope"
						class="form-checkbox h-5 w-5"
					/>
					<span class="ml-2 text-gray-700">{{ scope }}</span>
				</label>
			</div>

			{{ selectedScopes }}
			<button @click="selectedScopes = []">clear all</button>
			<NuxtLink :href="loginUrl">
				<button>login with scopes</button>
			</NuxtLink>
		</div>
	</div>
</template>
