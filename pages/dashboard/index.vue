<script lang="ts" setup>
    definePageMeta({
        middleware: "protected"
    });

    const user = useAuthenticatedUser();
</script>


<template>
    <div class="font-IBM p-2">
        <h1 class="text-2xl">Dashboard</h1>
        <h2 class="text-xl">Hello, {{ user.id }}</h2>
    </div>
</template>