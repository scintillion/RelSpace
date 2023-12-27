import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
// import { URLTranscoder } from '$lib/DBKit/Transcoder';
// import Blobs from '$lib/Blobs/index';
// import buffer from "node:buffer";
import { RSLst } from '$lib/ConstList';

import db from 'better-sqlite3';
import type { Statement } from 'sqlite';
import bsqlite from 'better-sqlite3';

class DBKit {
	private _db: typeof db.prototype;

	constructor(dbPath: string) {
		this._db = new db(dbPath);
		console.log ('Database opened at ' + dbPath);

		RSLst.ReqAB = ReqAB;
		RSLst.ReqPack = ReqPack;
	}

	get db() {
		return this._db;
	}

	get name() {
		return this._db.name;
	}

	public TestLine () {
		console.log ('kit.TestLine ()');
	}

	public close() {
		this._db.close();
	}


	public execQ (Pack : RSLst.BufPack, Params : any[]) : RSLst.BufPack {
		let Query = Pack.Str ('!Q');
		console.log ('ExecQ QUERY=' + Query + '.');
		// Query = "SELECT name FROM sqlite_master";	// retrieve all tables
		const statement = this._db.prepare (Query) as unknown as Statement;

		let dbResponse;
		if (Query[0].toUpperCase () === 'S') {
			dbResponse = statement.all (Params); // run  for update/?delete // (Params);
			let RecArray = dbResponse as unknown as object[];
			console.log ("RecArray: length = " + RecArray.length.toString () + '\n' + RecArray);
			console.log (RecArray);
			
			let BPs = Array (RecArray.length);
			let countBP = 0;
			console.log ('Server receives Record Array from Query, length = ' + RecArray.length.toString ());
			for (let Each of RecArray) {
				let Obj = Each as object;
				let BP = new RSLst.BufPack ();
				BP.objectIn (Obj);
				BPs[countBP++] = BP;
				}
				Pack.Cs = [];
				Pack.Pack (BPs);
				console.log ('Server packs ' + BPs.length.toString () + ' records to send to client');
				console.log (Pack.Desc ());
				let newBPs = new RSLst.BufPack ();
				newBPs.BufIn (Pack.BufOut ());
			}
		else {
			console.log ('Dumping dbResponse after run');
			dbResponse = statement.run (Params);
			Pack.objectIn (dbResponse);

			console.log (dbResponse);
		}


		return Pack;

		// return dbResponse;
	}

}

const DBK = new DBKit('tile.sqlite3');

async function ReqPack (InPack : RSLst.BufPack) : Promise<RSLst.BufPack> {
	let Params = RSLst.sql.buildQ (InPack);
	let OutPack = DBK.execQ (InPack, Params);

	console.log ('ServerResult BP:\n' + OutPack.Desc ());
	return OutPack;
}

async function ReqAB (AB : ArrayBuffer) : Promise<ArrayBuffer> {
	let BP = new RSLst.BufPack ();
	BP.BufIn (AB);

	let ResultPack = await RSLst.ReqPack (BP);
	let ResultAB = ResultPack.BufOut ();
	return ResultAB;
}

export const POST = (async ({ request, url }) => {

	const ClientAB = await request.arrayBuffer();

	console.log ('---\n---\n---\n---\n---\nServer receives INCOMING Client Request AB bytes = ' + ClientAB.byteLength.toString ());

	let ServerAB = await RSLst.ReqAB (ClientAB);
	console.log ('ServerAB Bytes Sent to Client= ' + ServerAB.byteLength.toString ());

	return new Response(ServerAB);
}) satisfies RequestHandler;
