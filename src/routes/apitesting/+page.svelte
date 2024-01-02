<script lang="ts">
	import { onMount } from 'svelte';

	import { InitClient } from '$lib/API/client/request';
	import { RS1 } from '$lib/RS';

	onMount(async () => {

		let Pack = RS1.sql.bSelDel ('S',0,'D');
		let Reply = await RS1.ReqPack (Pack);	//	 delete all in S tile
		console.log ('DelReply:\n' + Reply.desc);

		console.log ('Insert Requests:');
		for (const List of RS1.CL.Lists) {
				let Pack = List.SavePack ();
				Pack.add (['!Q','I']);
				let InsBP = await RS1.ReqPack (Pack);
				console.log (InsBP.desc);
			}

		let BP = await RS1.ReqStr ('SELECT * from S;');	//	('SELECT name from sqlite_master;');
		console.log ('Select Tile S\n' + BP.expand ());


		BP = await RS1.ReqStr ('SELECT name from sqlite_master;');
		console.log ('Select Tables\n' + BP.expand ());

		console.log ('Calling ReqTables!');
		BP = await RS1.ReqTables ();
	});


</script>

<h1>Request and Response will be logged to console!!!</h1>
