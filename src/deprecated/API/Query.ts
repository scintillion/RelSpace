import { RSLst } from '$lib/ConstList';
import Blobs from '$lib/Blobs';

export class Query {
	private query: string;
	private data: Blob[];
	private pack: RSLst.BlobPack;
	private _request: any | undefined;
	private response: boolean;

	constructor(query: string, response: boolean, ...data: Blob[]) {
		this.query = query;
		this.data = data;

		this.pack = new RSLst.BlobPack('');

		/*this.data.forEach(async blob => {
            await this.pack.Add([blob]);
        });*/

		this.data.forEach((part, index) => {
			this.pack.Add([`${index}`, part]);
		});

		console.log(this.pack);

		this.response = response;
	}

	public async exec() {
		this._request = await fetch(
			`/api/query?response=${this.response ? 'true' : 'false'}&query=${this.query}`,
			{
				method: 'POST',
				body: JSON.stringify({
					blobData: [await Blobs.toBase64.client(this.pack.BlobOut())],
					contentTypes: []
				})
			}
		);
		const response = await (this._request as Request).json();
		console.log(response);
		return response;
	}

	get request(): any {
		return this._request;
	}
}
