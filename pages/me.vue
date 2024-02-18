<script lang="ts" setup>
definePageMeta({
  middleware: "protected",
});
const user = await GqlGetMe();
</script>
<template>
  <div></div>
</template>
