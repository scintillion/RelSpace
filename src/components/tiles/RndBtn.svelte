<script lang="ts">
	import Btn from './Btn.svelte';

	$$props.styles += 'border-radius:8px;';
</script>

<div>
	<Btn {...$$props} />
</div>
