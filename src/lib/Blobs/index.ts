import { toBase64Client, toBase64Server } from './toBase64';
import { fromBase64 } from './fromBase64';
import { bufferToBlob } from './bufferToBlob';

export default {
	toBase64: {
		server: toBase64Server,
		client: toBase64Client
	},
	fromBase64,
	bufferToBlob
};
