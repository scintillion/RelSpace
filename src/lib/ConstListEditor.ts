import { RS1 } from '$lib/RS';
import { Editor_TC } from '../components/tiles';
import * as Plotter from './Plotter';

export class Editor {
	private container: HTMLDivElement;
	private vList: RS1.vList;
	private selectbox: HTMLSelectElement;
	private i: {
		name: HTMLInputElement;
		description: HTMLInputElement;
		fmt: HTMLSelectElement;
		value: HTMLInputElement;
		fmtstr: HTMLInputElement;
		list: HTMLSelectElement;
		vID: HTMLSelectElement;
		save: HTMLButtonElement;
		del: HTMLButtonElement;
		clear: HTMLButtonElement;
		copy: HTMLButtonElement;
		up: HTMLButtonElement;
		down: HTMLButtonElement;
	}; // HTMLElement(s)
	private selectContainer: HTMLDivElement;
	private lol: RS1.ListOfLists;
	private formats: RS1.vList = RS1.CL.FT as RS1.vList;

	/** Public Functions (External Calls) */

	constructor(
		container: HTMLDivElement | null,
		vList: RS1.vList,
		ListOfLists: RS1.ListOfLists = RS1.CL,
		linkedvList?: RS1.vList
	) {
		// Constructor
		this.container = container as HTMLDivElement;
		this.vList = vList as RS1.vList;

		this.lol = ListOfLists;

		// SelectBox
		this.selectContainer = this.container.querySelector('.selectContainer') as HTMLDivElement;
		const select = this.container.ownerDocument.createElement('select');
		this.selectbox = select as HTMLSelectElement;
		this.selectbox.style.width = '100%';
		this.selectbox.style.height = '100%';
		this.selectbox.style.paddingLeft = '5px';
		this.selectbox.style.borderRadius = '5px';
		this.selectbox.setAttribute('size', '10');
		this.selectbox.style.padding = '3px';
		this.selectbox.setAttribute('multiple', '');

		const firstLine: HTMLDivElement = this.container.querySelector(
			'.functions#Line1'
		) as HTMLDivElement;

		this.i = {
			name: this.container.querySelector("input[name='name']") as HTMLInputElement,
			description: this.container.querySelector("input[name='desc']") as HTMLInputElement,
			fmt: this.container.querySelector('select#format') as HTMLSelectElement,
			value: this.container.querySelector("input[name='value']") as HTMLInputElement,
			fmtstr: this.container.querySelector("input[name='fmtstr']") as HTMLInputElement,
			save: this.container.querySelector('#save') as HTMLButtonElement,
			del: this.container.querySelector('#del') as HTMLButtonElement,
			clear: this.container.querySelector('#clear') as HTMLButtonElement,
			copy: this.container.querySelector('#copy') as HTMLButtonElement,
			up: this.container.querySelector('#up') as HTMLButtonElement,
			down: this.container.querySelector('#down') as HTMLButtonElement,
			list: firstLine.appendChild(this.container.ownerDocument.createElement('select')),
			vID: firstLine.appendChild(this.container.ownerDocument.createElement('select'))
		};

		this.i.vID.multiple = false;

		this.i.list.style.cssText =
			'display: none; width: 100px; height: 40px; border-radius: 10px; font-family: inherit; outline: none; border: none; padding-left: 10px; transition: 0.3s linear;';
		this.i.vID.style.cssText =
			'display: none; width: 100px; height: 40px; border-radius: 10px; font-family: inherit; outline: none; border: none; padding-left: 10px; transition: 0.3s linear;';

		/** Preset Event Handlers  */
		this.i.save.onclick = () => {
			if (this.selectbox.value) {
				this.UpdateVID(this.i.name.value);
				this.Reload();
			} else {
				this.CreateVID();
				this.Reload();
			}
		};
		this.i.fmt.onselectionchange = () => this.FormatChangeHandler();
	}

	public Populate(): void {
		// public/Populate
		this.CLToSelect();

		const FirstVID: RS1.vID = this.vList.ToSortedVIDs()[0] as RS1.vID;

		const vIDs = this.vList.ToSortedVIDs();
		this.selectbox.onchange = () => {
			console.log(this.vList.Str);
			const selected = this.selectbox.value;
			const VID: RS1.vID = vIDs.find((VID) => VID.Name === selected) as RS1.vID;
			this.DefineFields(VID);
		};
	}

	public Destroy(): void {
		// public/Destroy
		this.selectbox.onchange = () => {};
		this.selectbox.outerHTML = '';
		this.ClearRef();
	}

	public Reload(): void {
		this.Destroy();
		this.Populate();
	}

	/** Start of Private Functions (Internal Use Only)  */

	private CLToSelect(reload?: boolean): void {
		if (reload && reload === true) {
			this.selectbox.innerHTML = '';
		}

		this.vList.ToSelect(this.selectbox);
		this.selectContainer.appendChild(this.selectbox);
	}

	private ClearRef(): void {
		this.UnloadMemberAndSetFields();
		this.i.description.value = '';
		this.i.fmt.value = '';
		this.i.name.value = '';
		this.i.value.value = '';
		this.i.fmtstr.value = '';
		this.selectbox.selectedIndex = -1;
	}

	private DefineFields(vID: RS1.vID): void {
		if (vID) {
			this.i.name.value = vID.Name ? vID.Name : '';
			this.i.description.value = vID.Desc ? vID.Desc : '';

			console.log(vID.Fmt?.Ch !== '');

			const rawFMT = vID.Fmt as RS1.IFmt;
			const format = this.formats.GetDesc(rawFMT.Ch) as string;

			if (format === 'Member') {
				this.LoadMemberAndSetFields();
			} else if (format === 'Set') {
				this.LoadMemberAndSetFields('Set');
			} else this.UnloadMemberAndSetFields();

			this.i.fmtstr.value = rawFMT.Str.slice(rawFMT.Ch.length);
			this.i.fmt.value = format;
			this.i.value.value = rawFMT.Value._Str as string;

			this.i.del.onclick = () => this.DeleteVID(vID.Name);
			this.i.clear.onclick = () => this.ClearRef();
			this.i.copy.onclick = () => this.CopyVID(vID);
			this.i.up.onclick = () => this.MoveElement('up', vID);
			this.i.down.onclick = () => this.MoveElement('down', vID);
		} else return;
	}

	private LoadMemberAndSetFields(field?: string) {
		console.log('LoadMemberAndSetFields');
		this.i.value.style.display = 'none';
		this.i.list.style.cssText =
			'display: block; width: 100px; height: 40px; border-radius: 10px; font-family: inherit; outline: none; border: none; padding-left: 10px; transition: 0.3s linear;';
		const CL = this.lol.TovList() as RS1.vList;
		CL.ToSelect(this.i.list);
		this.i.vID.style.cssText =
			'display: block; width: 100px; height: 40px; border-radius: 10px; font-family: inherit; outline: none; border: none; padding-left: 10px; transition: 0.3s linear;';
		this.i.list.onchange = () => {
			const List = this.lol.ListByName(this.i.list.value) as RS1.vList;
			List.ToSelect(this.i.vID);
		};

		if (field === 'Set') {
			this.i.vID.multiple = true;
		}
	}

	private UnloadMemberAndSetFields() {
		this.i.list.style.cssText =
			'display: none; width: 100px; height: 40px; border-radius: 10px; font-family: inherit; outline: none; border: none; padding-left: 10px; transition: 0.3s linear;';
		this.i.vID.style.cssText =
			'display: none; width: 100px; height: 40px; border-radius: 10px; font-family: inherit; outline: none; border: none; padding-left: 10px; transition: 0.3s linear;';
		this.i.value.style.display = 'block';
		this.i.vID.multiple = false;
	}

	private CreateVID(): void {
		const format: string = this.formats.NameByDesc(
			this.RemovePossibleDelim(this.i.fmt.value)
		) as string;
		let value: string = this.RemovePossibleDelim(this.i.value.value) as string;
		const fmtstr: string = this.RemovePossibleDelim(this.i.fmtstr.value) as string;
		let description: string = this.RemovePossibleDelim(this.i.description.value) as string;

		if (!this.checkFormat(value, format)) {
			alert('Error: Invalid Format');
			return;
		}

		let validDesc: string = `[${format}=${value}]${description}` as string;

		if (fmtstr) {
			validDesc = `[${format + fmtstr}=${value}]${description}` as string;
		}

		if (format === 'Member') {
			validDesc = `[@${this.RemoveWhitespace(this.i.list.value)}=${this.RemoveWhitespace(
				this.i.vID.value
			)}]${description}` as string;
		}

		if (format === 'Set') {
			const selected = this.GetSelected(this.i.vID).join(',');
			validDesc = `[{${this.RemoveWhitespace(this.i.list.value)}=${selected}]`;
		}

		let vID: RS1.vID = new RS1.vID(this.i.name.value, validDesc, this.vList);
		// Update vList
		this.vList.UpdateVID(vID);
		this.CLToSelect();
		vID = vID.Copy(this.vList);
		this.ClearRef();
		console.log('Create', vID);
		console.log('Create', this.vList.Str);
	}

	private GetSelected(Select: HTMLSelectElement): string[] {
		const response: string[] = [];
		for (let i = 0; i < Select.selectedOptions.length; i++) {
			response.push(Select.selectedOptions[i].value);
		}
		return response;
	}

	private UpdateVID(name: string): void {
		const format: string = this.formats.NameByDesc(
			this.RemovePossibleDelim(this.i.fmt.value)
		) as string;
		let value: string = this.RemovePossibleDelim(this.i.value.value) as string;
		const updatedName: string = this.RemovePossibleDelim(this.i.name.value) as string;
		const fmtstr: string = this.RemovePossibleDelim(this.i.fmtstr.value) as string;
		let description: string = this.RemovePossibleDelim(this.i.description.value) as string;

		if (format === 'A' && value.includes('[')) {
			value = value.replace(/[\[\]()]/g, '');
		}

		if (!this.checkFormat(value, format)) {
			alert('Error: Invalid Format');
			return;
		}

		let validDesc: string = `[${format}=${value}]${description}` as string;

		if (fmtstr) {
			validDesc = `[${format + fmtstr}=${value}]${description}` as string;
			console.log(validDesc);
		}

		if (format === 'Member') {
			console.log(this.i.list.value, 'this is the list selected');
			console.log(this.i.vID.value, 'this is the vID selected');
			validDesc = `[@${this.RemoveWhitespace(this.i.list.value)}=${this.RemoveWhitespace(
				this.i.vID.value
			)}]${description}` as string;
		}

		if (format === 'Set') {
			const selected = this.GetSelected(this.i.vID).join(',');
			validDesc = `[{${this.RemoveWhitespace(this.i.list.value)}=${selected}]`;
		}

		let vID = new RS1.vID(`${name}:${validDesc}`, this.vList);

		if (updatedName) {
			this.vList.UpdateVID(vID, true);
			vID.SetName(updatedName);
		}

		this.vList.UpdateVID(vID, false);
		this.CLToSelect();
		vID = vID.Copy(this.vList);
		console.log(this.vList.Str);
	}

	private RemoveWhitespace(str: string): string {
		return str.replace(/(\s+Bad\s+List\s+Name\s+|\s+)/g, '');
	}

	private DeleteVID(name: string): void {
		const vID: RS1.vID = this.vList.GetVID(name) as RS1.vID;
		this.vList.UpdateVID(vID, true);
		this.CLToSelect();
		console.log(this.vList.Str);
	}

	private CopyVID(vID: RS1.vID) {
		const newvID = vID.Copy(this.vList);
		newvID.SetName(`${newvID.Name} Copy`);
		this.vList.UpdateVID(newvID, false);
		this.ClearRef();
		this.Populate();
		console.log(this.vList.Str);
	}

	private MoveElement(direction: string, vID: RS1.vID): void {
		if (direction === 'up') {
			this.vList.Bubble(vID.Name, -1);
			this.CLToSelect(true);
			return;
		} else if (direction === 'down') {
			this.vList.Bubble(vID.Name, 1);
			this.CLToSelect(true);
			return;
		} else return;
	}

	private checkFormat(value: string, format: string): boolean {
		const validFormat = this.formats.GetVID(format);

		if (!validFormat) {
			return false;
		}

		value = value.trim();

		switch (validFormat.Desc) {
			case 'Int':
				return /^\d+$/.test(value);
				break;
			case 'Str':
				return true;
				break;
			case 'Num':
				return this.isNum(value);
			case 'Dollar':
				return /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/.test(value);
				break;
			case 'Range':
				return /^\d+$/.test(value);
				break;
			case 'Nums':
				return /^\s*\d+\s*(,\s*\d+\s*)*$/.test(value);
				break;
			case 'Upper':
				return value.toUpperCase() === value;
				break;
			case 'Ord':
				return /^\d{1,2}(st|nd|rd|th)$/.test(value);
				break;
			case 'Pair':
				return /^\s*\d+\s*,\s*\d+\s*$/.test(value);
				break;
			case 'Member':
			case 'Set':
				return true;
			default:
				return false;
				break;
		}
	}

	private isNum(v: string): boolean {
		const num = parseFloat(v);
		return !isNaN(num) && isFinite(num);
	}

	private FormatChangeHandler() {
		if (this.i.fmt.value === 'Member') {
			this.LoadMemberAndSetFields();
		} else if (this.i.fmt.value === 'Set') {
			this.LoadMemberAndSetFields('Set');
		} else {
			this.UnloadMemberAndSetFields();
		}
	}

	private RemovePossibleDelim(str: string): string {
		return str.replace(/[\t\n\f|:]/g, '');
	}
}

export class LOLEditor {
	private LOL: RS1.ListOfLists;
	private container: HTMLDivElement;
	private select: HTMLSelectElement;
	private selected: string;
	private btnsContainer: HTMLDivElement;
	private editorComponent: any | null; // New property to store the editor component instance
	private buttons: { Copy: HTMLButtonElement; Merge: HTMLButtonElement };

	get CL(): RS1.vList | undefined {
		return this.ListOfLists.TovList();
	}

	constructor(ListOfLists: RS1.ListOfLists, container: HTMLDivElement) {
		this.LOL = ListOfLists;
		this.container = container;

		this.select = this.container.ownerDocument.createElement('select');
		this.select.style.width = '250px';
		this.select.style.paddingLeft = '5px';
		this.select.style.borderRadius = '5px';
		this.select.setAttribute('size', '10');
		this.select.style.padding = '3px';
		this.select.setAttribute('multiple', '');

		this.selected = '';
		this.editorComponent = null; // Initialize the editor component instance

		this.btnsContainer = this.container.ownerDocument.createElement('div');
		this.btnsContainer.style.display = 'flex';
		this.btnsContainer.style.width = 'auto';
		this.btnsContainer.style.padding = '10px';
		this.btnsContainer.style.gap = '5px';
		this.btnsContainer.style.flexDirection = 'row';
		this.btnsContainer.style.alignItems = 'center';
		this.btnsContainer.style.justifyContent = 'center';
		this.container.appendChild(this.btnsContainer);

		this.buttons = {
			Copy: this.container.ownerDocument.createElement('button'),
			Merge: this.container.ownerDocument.createElement('button')
		};
	}

	get ListOfLists(): RS1.ListOfLists {
		return this.LOL;
	}

	public Reload(): void {
		this.Destroy();
		this.Populate();
	}

	public Destroy(): void {
		this.container.innerHTML = '';
	}

	public Populate(): void {
		this.LoadSelect();
	}

	private LoadSelect(): void {
		this.LOL.ToSelect(this.select);

		this.select.onchange = () => this.ListChangeHandler();

		this.container.append(this.select);

		this.LoadButtons();
	}

	private ListChangeHandler(): void {
		this.selected = this.select.value;
		this.LoadList();
	}

	private LoadButtons() {
		const buttonsArr = Object.entries(this.buttons);
		buttonsArr.forEach((btn) => {
			let button = btn[1];
			let text = btn[0];

			button.innerText = text;

			button.style.marginTop = '10px';
			button.style.width = '100px';
			button.style.height = '40px';
			button.style.borderRadius = '8px';
			button.style.fontFamily = 'inherit';
			button.style.background = 'black';
			button.style.outline = 'none';
			button.style.border = 'none';
			button.style.cursor = 'pointer';
			button.style.color = 'white';
			button.style.transition = '0.3s linear';

			// Add a hover effect
			button.addEventListener('mouseover', function () {
				button.style.background = 'lighten(#000000, 7%)';
			});

			button.addEventListener('mouseout', function () {
				button.style.background = 'black';
			});

			switch (text) {
				case 'Copy':
					button.onclick = () => this.CopyList();
					break;
				case 'Merge':
					button.onclick = () => this.MergeList();
					break;
			}

			this.btnsContainer.appendChild(button);
		});
	}

	private CopyList(): void {
		// @ts-ignore REASON: You've removed the copy function.
		const newList: RS1.vList = this.LOL.ListByName(
			this.select.value
		)?.Copy() as RS1.vList;
		this.LOL.Add(newList.Str);
		console.log(this.CL);
		this.Reload();
	}

	private MergeList(): void {
		const currentList = this.LOL.ListByName(this.selected) as RS1.vList;
		const mergeWith: string = prompt(
			'Which list would you like to merge with? *(enter name, case sensitive)'
		) as string;
		currentList.Merge(this.LOL.ListByName(mergeWith));
	}

	private LoadList(): void {
		const list: RS1.vList = this.LOL.ListByName(this.selected) as RS1.vList;

		if (list.Name === this.selected) {
			if (this.editorComponent) {
				console.log('existing destroyed');
				this.DestroyComponent('.editor');
			}

			this.LoadEditorComponent(list as RS1.vList);
		} else return;
	}

	private DestroyComponent(query: string) {
		const component = this.container.querySelector(query);
		if (component) {
			component.remove();
			return;
		} else return;
	}

	private LoadEditorComponent(list: RS1.vList) {
		this.editorComponent = new Editor_TC({
			target: this.container,
			props: {
				CLString: list.Str
			}
		});
	}
}
