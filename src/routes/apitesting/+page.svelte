<script lang="ts">
	import { onMount } from 'svelte';

	import { InitClient } from '$lib/API/client/request';
	import { RSLst } from '$lib/ConstList';

	onMount(async () => {

		let Pack = RSLst.sql.bSelDel ('S',0,'D');
		let Reply = await RSLst.ReqPack (Pack);	//	 delete all in S tile
		console.log ('DelReply:\n' + Reply.Desc ());

		console.log ('Insert Requests:');
		for (const List of RSLst.CL.Lists) {
				let Pack = List.InitPack ();
				Pack.Add (['!Q','I']);
				let InsBP = await RSLst.ReqPack (Pack);
				console.log ('  Ins:\n' + InsBP.Desc ());
			}

		let BP = await RSLst.ReqStr ('SELECT * from S;');	//	('SELECT name from sqlite_master;');
		console.log ('Select Tile S\n' + BP.Expand ());


		BP = await RSLst.ReqStr ('SELECT name from sqlite_master;');
		console.log ('Select Tables\n' + BP.Expand ());

		console.log ('Calling ReqTables!');
		BP = await RSLst.ReqTables ();
	});


</script>

<h1>Request and Response will be logged to console!!!</h1>
