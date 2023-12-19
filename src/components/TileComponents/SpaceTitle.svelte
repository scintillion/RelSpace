<script lang="ts">
	import Editor from './TextEditHandler.svelte';
	export let defaultText: string;
</script>

<span>
	<Editor bind:value={defaultText} on:submit={console.log(defaultText)} />
</span>

<style lang="scss">
	span {
		font-family: 'Montserrat', sans-serif;
		font-style: normal;
		font-weight: 800;
		font-size: 36px;
		line-height: 44px;
		color: #ffffff;
		max-width: 500px;
	}
</style>
