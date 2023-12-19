export function prepareForJSON(queryResult: any) {
	return queryResult.map((row: any) => {
		const newRow: any = {};
		for (const key in row) {
			const value = row[key];
			if (value instanceof Buffer) {
				// If the value is already a Buffer, convert it to Base64
				newRow[key] = value.toString('base64');
			} else if (typeof value === 'object') {
				// If the value is an object, assume it needs to be converted to a Buffer
				const objectAsBuffer = Buffer.from(JSON.stringify(value));
				newRow[key] = objectAsBuffer.toString('base64');
			} else {
				// Otherwise, keep the value as is
				newRow[key] = value;
			}
			console.log(typeof newRow[key]);
		}

		return newRow;
	});
}
