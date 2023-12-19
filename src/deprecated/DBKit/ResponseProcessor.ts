import Blobs from '$lib/Blobs/index';
import buffer from 'node:buffer';

/*
export class ResponseProcessor {
	private _dbres: any;

	constructor(response: any) {
		this._dbres = response;
	}

	public async process(): Promise<any> {
		const processedResponse = [];
		for (const item of this._dbres) {
			const processedItem = await this.processItemWithBlobs(item);
			processedResponse.push(processedItem);
		}
		return processedResponse;
	}

	private async processItemWithBlobs(item: any): Promise<any> {
		const processedItem = { ...item };
		const keys = Object.keys(item);
		for (const key of keys) {
			const value = item[key];
			if (value instanceof buffer.Blob) {
				// Convert blob to Base64
				const base64Data = await Blobs.toBase64(value);
				processedItem[key] = base64Data;
			} else if (Array.isArray(value)) {
				// Recursively process arrays
				const processedArray = [];
				for (let i = 0; i < value.length; i++) {
					const processedValue = await this.processItemWithBlobs(value[i]);
					processedArray.push(processedValue);
				}
				processedItem[key] = processedArray;
			} else if (typeof value === 'object' && value !== null) {
				// Recursively process nested objects
				const processedValue = await this.processItemWithBlobs(value);
				processedItem[key] = processedValue;
			}
		}
		return processedItem;
	}
}
*/