<script>
  import { visits } from "./visits.svelte.js";

  let isOpen = $state(false);

  function toggle() {
    isOpen = !isOpen;
  }
</script>

<button type="button" onclick={toggle}>{isOpen ? "Close" : "Open"}</button>
<p>Visits: {$visits}</p>
