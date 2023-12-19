<script lang="ts">
	import Editor from './TextEditHandler.svelte';
	export let defaultText: string;
</script>

<span>
	<Editor bind:value={defaultText} on:submit={console.log(defaultText)} />
</span>
