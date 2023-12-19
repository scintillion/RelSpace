export class Builder {
	private _query: string;

	constructor() {
		// Constructor
		this._query = ``; // internal operations done on this property, while query is used for ext.
	}

	/** Get Final Built Query */

	get query(): string {
		return this._query; // simply returns internal var, cannot be modified by any string options outside
	}

	/** Add to Statement */

	public addStmnt(type: string, ...args: string[] | number[]): void {
		// case statement used to identify type of SQLite STMNT, and what function will be used for the correct Fmt. Custom built queries i.e predefined strings are also set to work with DBKit.
		switch (type) {
			case 'select':
				this._select(args[0] as string);
				break;
			case 'update':
				this._update(args[0] as string);
				break;
			case 'insertInto':
				this._insertInto(args[0] as string, args[1] as string, args[2] as string);
				break;
			case 'deleteFrom':
				this._deleteFrom(args[0] as string);
				break;
			case 'createTable':
				this._createTable(args[0] as string, args[1] as string);
				break;
			case 'dropTable':
				this._dropTable(args[0] as string);
				break;
			case 'where':
				this._where(args[0] as string);
				break;
			case 'orderBy':
				this._orderBy(args[0] as string);
				break;
			case 'limit':
				this._limit(args[0] as number);
				break;
			case 'from':
				this._from(args[0] as string);
				break;
			default:
				throw new Error(`Invalid SQL statement type: ${type}`);
		}
	}

	/* Types of Queries */

	private _select(fields: string): void {
		this._query += `SELECT ${fields} `;
	}

	private _from(table: string): void {
		this._query += `FROM ${table}`;
	}

	private _update(table: string): void {
		this._query += `UPDATE ${table} `;
	}

	private _insertInto(table: string, columns: string, values: string): void {
		this._query += `INSERT INTO ${table} (${columns}) VALUES (${values}) `;
	}

	private _deleteFrom(table: string): void {
		this._query += `DELETE FROM ${table} `;
	}

	private _createTable(table: string, columns: string): void {
		this._query += `CREATE TABLE ${table} (${columns}) `;
	}

	private _dropTable(table: string): void {
		this._query += `DROP TABLE ${table} `;
	}

	private _where(condition: string): void {
		this._query += `WHERE ${condition} `;
	}

	private _orderBy(field: string): void {
		this._query += `ORDER BY ${field} `;
	}

	private _limit(num: number): void {
		this._query += `LIMIT ${num} `;
	}
}
