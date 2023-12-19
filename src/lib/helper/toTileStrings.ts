interface Tile {
	TileID: number;
	Tile: string;
	Name: string;
	TileString: string;
}

function getTileStrings(jsonString: any): string[] {
	const strings: string[] = [];
	jsonString.forEach((tile: Tile) => {
		strings.push(tile.TileString);
	});
	return strings;
}

export default getTileStrings;
