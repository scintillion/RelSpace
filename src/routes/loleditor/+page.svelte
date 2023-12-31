<script lang="ts">
	import { onMount } from 'svelte';
	import { LOLEditor } from '$lib/ConstListEditor';
	import { RS1 } from '../../lib/RS';

	onMount(() => {
		const container: HTMLDivElement = document.getElementById(
			'ListOfListsContainer'
		) as HTMLDivElement;
		const list1: RS1.vList = new RS1.vList(
			'Test1|Name:[%=Jane]Your Name|XY:[#=1]A Number Value|'
		);
		const list2: RS1.vList = new RS1.vList(
			'Test2|Name:[%=John]Your Name|XY:[#=2]A Number Value|'
		);
		const list3: RS1.vList = new RS1.vList(
			'Test3|Name:[%=Jacob]Your Name|XY:[#=3]A Number Value|'
		);
		const LoL: RS1.ListOfLists = new RS1.ListOfLists();
		LoL.Add(list1.Str);
		LoL.Add(list2.Str);
		LoL.Add(list3.Str);

		const LoLEditor: LOLEditor = new LOLEditor(LoL, container);
		LoLEditor.Populate();
	});
</script>

<div id="ListOfListsContainer" />

<style lang="scss">
	#ListOfListsContainer {
		width: 100vw;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 25px;
	}
</style>
