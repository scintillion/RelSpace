import buffer from 'node:buffer';

// Function to convert Base64 to Blob
export function fromBase64(base64Data: string, contentType?: string) {
	contentType = contentType || '';
	const byteCharacters = atob(base64Data.split(',')[1]);
	const byteArrays = [];
	for (let i = 0; i < byteCharacters.length; i++) {
		byteArrays.push(byteCharacters.charCodeAt(i));
	}
	const byteArray = new Uint8Array(byteArrays);
	return contentType
		? new buffer.Blob([byteArray], { type: contentType })
		: new buffer.Blob([byteArray]);
}
