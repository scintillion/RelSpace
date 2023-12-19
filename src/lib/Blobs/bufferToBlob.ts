export function bufferToBlob(
	buffer: Buffer | { type: 'Buffer'; data: number[] },
	mimeType: string
): Blob {
	// If the input is an object from Better-SQLite3
	if (typeof buffer === 'object' && buffer.type === 'Buffer' && Array.isArray(buffer.data)) {
		// Convert the Better-SQLite3 Buffer object to a Node.js Buffer
		buffer = Buffer.from(buffer.data);
	}

	// If the Buffer is a Node.js Buffer
	if (Buffer.isBuffer(buffer)) {
		return new Blob([buffer], { type: mimeType });
	}

	// If the Buffer is a Uint8Array (e.g., from a browser FileReader.readAsArrayBuffer())
	if (buffer instanceof Uint8Array) {
		return new Blob([buffer], { type: mimeType });
	}

	// If the Buffer is neither a Node.js Buffer nor a Uint8Array
	throw new Error(
		'Unsupported buffer type. The input must be a Buffer from Better-SQLite3, a Node.js Buffer, or a Uint8Array.'
	);
}
