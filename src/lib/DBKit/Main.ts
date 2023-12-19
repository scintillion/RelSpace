// import { json } from '@sveltejs/kit';
import db from 'better-sqlite3';
import type { Statement } from 'sqlite';
import bsqlite from 'better-sqlite3';
// import buffer from 'node:buffer';

export class DBKit {
	private _db: typeof db.prototype;

	constructor(dbPath: string) {
		this._db = new db(dbPath);
		console.log ('Database opened at ' + dbPath);
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

/*
	private prepareStatement(query: string): any {
		const statement = this._db.prepare(query);
		return statement;
	}
*/

/*

	public executeQuery(query: string, params?: any[], res?: boolean): any[] {

//		const statement: Statement = this.prepareStatement(query) as Statement;
		const statement = this._db.prepare (query) as unknown as Statement;

		const bindData: any[] = [];

		if (params) {
			const placeholders = query.match(/(\$[a-zA-Z0-9_]+)|(\?)/g) || [];
			const blobPlaceholdersCount = placeholders.filter(
				(placeholder) => placeholder === '?'
			).length;

			if (blobPlaceholdersCount !== params.length) {
				throw new Error(
					'Number of blob parameters does not match the number of placeholders in the query.'
				);
			}

			for (const param of params) {
				bindData.push (param);
			}

			// Bind blob data to all placeholders in one go.
			//statement.bind(...bindData);
		}

		if (!res) {
			console.log('Test', ...bindData);
			statement.run(...bindData);
			return [];
		} else {
			const dbResponse = statement.all(...bindData);
			return [dbResponse];
		}
	}
*/

	public closeConnection(): void {
		this._db.close();
	}
}

export const kit = new DBKit('tile.sqlite3'); // create and export single connection to database to avoid SQLite errors.
