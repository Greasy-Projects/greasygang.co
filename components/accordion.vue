<script setup>
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ref } from 'vue';

  const props = defineProps({
    title: { type: String, required: true },
    ariaTitle: { type: String, required: true }
  });

  const showPanel = ref(false);
  const togglePanel = (event) => {
    showPanel.value = !showPanel.value;
  }
</script>

<template>
  <div class="border-2 rounded-lg">
    <button
      :arial-controls="'accordion-content-' + ariaTitle"
      :id="'accordion-control-' + ariaTitle"
      @click.prevent="togglePanel"
      class="font-poppins py-4 w-full font-medium text-gray-500 flex flex-row items-center justify-between bg-transparent border-solid border-t-2 border-b-0 border-x-0 border-gray-100">
      {{ title }}
      <FontAwesomeIcon
        v-if="showPanel" 
        class="rotate-180"
        :icon="['fas', 'chevron-down']"
        />
    <FontAwesomeIcon
        v-else
        :icon="['fas', 'chevron-down']"
    />
    </button>
    <Transition>
    <div
      :aria-hidden="!showPanel"
      :id="'content-' + ariaTitle"
      class="p-4"
      v-if="showPanel">
      <slot></slot>
    </div>
    </Transition>
  </div>
</template>