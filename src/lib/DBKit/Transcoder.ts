export class URLTranscoder {
	// URLTranscoder is used to essentially add handling for invalid data, empty strings and whatever to the basic encodeURIComponent & decodeURIComponent, simple yet useful, saving us time on repeated code.
	data: string | null;

	constructor(data: string | null) {
		this.data = data;
	}

	encode(): string {
		if (!this.data) {
			return '';
		}

		const encoded = encodeURIComponent(this.data);
		return encoded;
	}

	decode(): string {
		if (!this.data) {
			return '';
		}

		const decoded = decodeURIComponent(this.data);
		return decoded;
	}

	encodeFull(): string {
		if (!this.data) {
			return '';
		}

		const encoded = encodeURI(this.data);
		return encoded;
	}

	decodeFull(): string {
		if (!this.data) {
			return '';
		}

		const decoded = decodeURI(this.data);
		return decoded;
	}
}
