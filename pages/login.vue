<script setup lang="ts">
const buttons = [
  {
    icon: "fa-twitch",
    href: "http://localhost:4000/login/twitch?scopes=bits:read channel:read:editors channel:read:redemptions channel:read:subscriptions user:read:email",
  },
  {
    icon: "fa-discord",
    href: "http://localhost:4000/login/discord?scopes=identify email connections",
  },
];
const appConfig = useRuntimeConfig();
</script>
<template>
  <main
    class="flex min-h-screen justify-center font-IBM bg-gradient-to-b from-[#20113f] to-[#12131c] py-14"
  >
    <div
      class="container flex max-w-fit flex-col items-center justify-center px-4"
    >
      <div
        class="twitchplays_card h-auto w-full rounded-xl bg-[#0d1117]/60 py-2 sm:py-4"
      >
        <h1
          class="xs:text-5xl w-full select-none bg-gradient-to-br from-[#7d2be1] to-[#9b30ff] bg-clip-text px-5 pb-4 text-center text-[clamp(3rem,19vw,4.5rem)] font-[900] uppercase leading-none text-transparent sm:px-5 sm:pb-5 sm:pt-0 sm:text-7xl"
        >
          login
        </h1>
        <hr
          class="mb-4 h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-neutral-500 to-transparent opacity-25"
        />

        <div
          id="inputs"
          class="mx-3 flex flex-col flex-wrap content-center items-center"
        >
          <NuxtLink
            :href="
              appConfig.public.apiBase + '/login/twitch?scopes=user:read:email'
            "
            class="text-md group relative flex w-full justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 font-medium tracking-tighter text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Log In
          </NuxtLink>
        </div>
      </div>
    </div>
  </main>
</template>
