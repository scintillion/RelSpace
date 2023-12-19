<script lang="ts">
	export let styles: string = '';
	export let id: string = '';
	export let content: string = '';
</script>

<div {id} style={styles}>
	{content}
</div>
