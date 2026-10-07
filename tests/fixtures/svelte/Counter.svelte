<script lang="ts">
  import { preferences } from "./theme.svelte.js";

  type Properties = { readonly step: number };

  const { step }: Properties = $props();
  let count = $state(0);

  function increment(): void {
    count += step;
  }
</script>

<button class={preferences.theme} type="button" onclick={increment}>
  Clicked {count} times
</button>
