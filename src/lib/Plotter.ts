import type { RS1 } from './RS';
import * as components from '../components/tiles/index';
import type { SvelteComponent } from 'svelte';

export class Plotter {
	container: HTMLDivElement;
	list: RS1.TileList;

	constructor(List: RS1.TileList, container: HTMLDivElement) {
		this.list = List;
		this.container = container;
	}

	public PlotTiles() {
		console.log(this.list);

		this.list.tiles.forEach((tile: RS1.TDE, index: number) => {
			let HTMLTile = this.CreateTile(tile);
			if (!tile.parent) {
				this.container.innerHTML += HTMLTile;
			} else if (tile.parent) {
				let parent = this.container.querySelector(`#tile${tile.parent}`);
				if (parent) {
					parent.innerHTML += HTMLTile;
				}
			}
		});
	}

	public RenderComponent(component: SvelteComponent, properties: object): string {
		return this.GetHTML(component, properties);
	}

	private GetHTML(comp: any, props: object): string {
		const div = document.createElement('div');
		new comp({
			target: div,
			props: props
		});
		return div.innerHTML;
	}

	private CheckNum(str: string) {
		return /^\d+$/.test(str);
	}

	private CreateTile(tile: RS1.TDE) {
		if (!tile.aList) {
			return '<p>Invalid</p>';
			throw 'Error: Invalid Tile';
		}

		if (!tile.sList) {
			return '<p>Invalid</p>';
			throw 'Error: Invalid Tile';
		}

		if (!tile.List) {
			return '<p>Invalid</p>';
			throw 'Error: Invalid Tile';
		}

		let styles = ``;
		let index = this.list.tiles.indexOf(tile);
		const cssProperties = tile.sList.IDsToCIDs(undefined);
		cssProperties.forEach((property) => {
			if (property.Name !== 'row' && property.Name !== 'column') {
				if (this.CheckNum(property.Desc)) {
					styles += `${property.Name}:${property.Desc}px;`;
				} else styles += `${property.Name}:${property.Desc};`;
			} else {
				if (tile.sList?.GetNum(property.Name) === 1) {
					styles += `flex-direction:${property.Name};`;
				}
			}
		});

		const properties = tile.aList.IDsToCIDs(undefined);
		let attributes: any = {};
		properties.forEach((property) => {
			attributes[property.Name] = property.Desc;
		});

		let content = tile.aList?.GetDesc('inner') !== undefined ? tile.aList?.GetDesc('inner') : '';

		const componentName = tile.List.Name + '_TC';
		const component = components[componentName as keyof typeof components];
		let html = this.GetHTML(component, {
			styles: styles,
			id: `tile${index}`,
			content: content,
			...attributes
		});
		return html;
	}
}

export function RenderComponent(component: any, properties: object, target?: HTMLElement): string {
	if (target) {
		new component({
			target,
			props: properties
		});
		return '';
	} else {
		const div = document.createElement('div');
		new component({
			target: div,
			props: properties
		});
		return div.innerHTML;
	}
}
