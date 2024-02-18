<script lang="ts" setup>
async function logout() {
  refreshCookie("auth_session");
}
let user: any;
</script>

<template>
  <div class="bg-gradient-to-br from-[#95765c] to-[#d5b584] svh">
    <nav
      class="flex flex-row-reverse absolute w-full items-center h-20 my-auto"
    >
      <NuxtImg
        v-if="user.me"
        :src="user.me.avatar ?? ''"
        alt="Logo"
        width="50"
        height="50"
        class="rounded-full w-10 h-10"
      />

      <button
        :onclick="logout"
        class="w-30 h-10 bg-blue-700 rounded-md border-none"
      >
        LOGOUT
      </button>
    </nav>
    <slot />
  </div>
</template>
<style>
.svh {
  height: 100vh;
  height: 100svh;
}
</style>
