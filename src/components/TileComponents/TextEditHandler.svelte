<script>
	// @ts-nocheck
	import { createEventDispatcher, onMount } from 'svelte';

	export let value,
		required = true;
	export let color;

	const dispatch = createEventDispatcher();
	let editing = false,
		original;

	function cssVariables(node, variables) {
		setCssVariables(node, variables);

		return {
			update(variables) {
				setCssVariables(node, variables);
			}
		};
	}

	function setCssVariables(node, variables) {
		for (const name in variables) {
			node.style.setProperty(`--${name}`, variables[name]);
		}
	}

	onMount(() => {
		original = value;
	});

	function edit() {
		editing = true;
	}

	function submit() {
		if (value != original) {
			dispatch('submit', value);
		}

		editing = false;
	}

	function keydown(event) {
		if (event.key == 'Escape') {
			event.preventDefault();
			value = original;
			editing = false;
		}
	}

	function focus(element) {
		element.focus();
	}
</script>

{#if color}
	{#if editing}
		<form on:submit|preventDefault={submit} on:keydown={keydown}>
			<input bind:value on:blur={submit} {required} use:focus />
		</form>
	{:else}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<span use:cssVariables={{ color }} on:click={edit}>
			{value}
		</span>
	{/if}
{:else if editing}
	<form on:submit|preventDefault={submit} on:keydown={keydown}>
		<input bind:value on:blur={submit} {required} use:focus />
	</form>
{:else}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<span on:click={edit}>
		{value}
	</span>
{/if}

<style>
	span {
		font-size: inherit;
	}

	input {
		border: none;
		background: none;
		color: inherit;
		font-family: inherit;
		font-style: inherit;
		font-size: inherit;
		font-weight: inherit;
		line-height: inherit;
		min-width: 120px;
		width: inherit;
		outline: none;
		border: none;
		background: rgba(0, 0, 0, 0.11);
		padding: 7px;
		border-radius: 8px;
		text-align: inherit;
		box-shadow: none;
	}
</style>
