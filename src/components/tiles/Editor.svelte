<script lang="ts">
	import { onMount } from 'svelte';
	import { Editor } from '$lib/ConstListEditor';
	import { RSLst } from '../../lib/ConstList';

	export let CLString: string = '';

	const list1: RSLst.constList = new RSLst.constList(
		'Test1|Test1Name:[%=Jane]Your Name|ListNum:[#=1]The List Number|'
	);
	const list2: RSLst.constList = new RSLst.constList(
		'Test2|Test2Name:[%=John]Your Name|ListNum:[#=2]The List Number|'
	);
	const list3: RSLst.constList = new RSLst.constList(
		'Test3|Test3Name:[%=Jacob]Your Name|ListNum:[#=3]The List Number|'
	);
	const LoL: RSLst.ListOfLists = new RSLst.ListOfLists();
	LoL.Add(list1.Str);
	LoL.Add(list2.Str);
	LoL.Add(list3.Str);

	onMount(async () => {
		const container: HTMLDivElement | null = document.getElementById(
			'cledit'
		) as HTMLDivElement | null;

		if (container) {
			const list: RSLst.constList = new RSLst.constList(CLString);
			const edit: Editor = new Editor(container, list, LoL);
			edit.Populate();
		}
	});
</script>

<div class="editor">
	<div id="cledit">
		<div class="selectContainer" />
		<div class="cidOperations">
			<div class="functions" id="Line1">
				<label for="name">Name: </label>
				<input type="text" name="name" placeholder="No Use Unless You Add" />
				<label for="desc">Desc: </label>
				<input type="text" name="desc" />
				<label for="value">Value:</label>
				<input type="text" name="value" />
			</div>
			<div class="functions" id="Line2">
				<label for="format">Format: </label>
				<select name="format" placeholder="Format" id="format">
					<option value="Dollar">Dollar</option>
					<option value="Int">Int</option>
					<option value="Num">Num</option>
					<option value="Nums">Nums</option>
					<option value="Ord">Ord</option>
					<option value="Pair">Pair</option>
					<option value="Range">Range</option>
					<option value="Str">Str</option>
					<option value="Upper">Upper</option>
					<option value="Member">Member</option>
					<option value="Set">Set</option>
				</select>
				<label for="fmtstr">Format Str:</label>
				<input type="text" name="fmtstr" />
			</div>
			<div class="buttons">
				<button id="save">Save</button>
				<button id="del">Delete</button>
				<button id="clear">Clear</button>
				<button id="copy">Copy</button>
				<button id="up">Up</button>
				<button id="down">Down</button>
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.cidOperations {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20px;
		flex-direction: column;
		min-height: 400px;
	}

	.editor {
		width: 100%;
		height: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		gap: 20px;
	}

	#cledit {
		display: inherit;
		align-items: inherit;
		justify-content: inherit;
		flex-direction: column;
		gap: 20px;
		width: inherit;
		height: inherit;
	}

	.functions {
		align-items: center;
		justify-content: center;
		display: flex;
		flex-direction: row;
		gap: 5px;
	}

	input,
	select {
		width: 200px;
		height: 40px;
		border-radius: 10px;
		font-family: inherit;
		outline: none;
		border: none;
		padding-left: 10px;
		transition: 0.3s linear;
	}

	select[name='format'] {
		width: 100px;
	}

	input[name='fmtstr'] {
		width: 70px;
	}

	button {
		margin-top: 10px;
		width: 100px;
		height: 40px;
		border-radius: 8px;
		font-family: inherit;
		background: black;
		outline: none;
		border: none;
		cursor: pointer;
		color: white;
		transition: 0.3s linear;

		&:hover {
			background: lighten($color: #000000, $amount: 7%);
		}
	}

	.selectContainer {
		width: 100%;
		height: 100%;
		padding: 35px;
	}
</style>
