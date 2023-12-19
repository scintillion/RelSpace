// Import necessary types
import { Buffer } from 'buffer';

// Client-side (browser) function
import type buffer from 'node:buffer';

export function toBase64Client(blob: Blob | buffer.Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = function () {
			const base64Data = reader.result as string;
			resolve(base64Data);
		};
		reader.onerror = function () {
			reject(new Error('Failed to convert blob to base64'));
		};
		reader.readAsDataURL(blob as Blob);
	});
}

// Server-side (Node.js) function
export function toBase64Server(data: Buffer | Blob): string {
	if (Buffer.isBuffer(data)) {
		return Buffer.from(data).toString('base64');
	} else if (typeof Blob !== 'undefined' && data instanceof Blob) {
		return URL.createObjectURL(data);
	} else {
		throw new Error('Unsupported data type on the server side');
	}
}
