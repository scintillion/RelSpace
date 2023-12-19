<script lang="ts">
	import { onMount } from 'svelte';
	import T from './T.svelte';

	$$props.styles += 'cursor:pointer;align-items:center;justify-content:center;display:flex;';

	onMount(() => {
		let tile: HTMLDivElement = document.getElementById($$props.id) as HTMLDivElement;
		if (tile) {
			tile.onclick = () => {
				window.open($$props.redirect);
			};
		}
	});
</script>

<div>
	<!-- TODO(@mtgsquad) rs-enable-click={true} -->
	<T {...$$props} />
</div>
