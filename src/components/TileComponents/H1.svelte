<script lang="ts">
	import Editor from './TextEditHandler.svelte';
	export let defaultText: string;
</script>

<h1>
	<Editor bind:value={defaultText} on:submit={console.log(defaultText)} />
</h1>
