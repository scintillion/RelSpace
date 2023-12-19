import { RSLst } from '$lib/ConstList';
import { Editor_TC } from '../components/tiles';
import * as Plotter from './Plotter';

export class Editor {
	private container: HTMLDivElement;
	private constList: RSLst.constList;
	private selectbox: HTMLSelectElement;
	private i: {
		name: HTMLInputElement;
		description: HTMLInputElement;
		fmt: HTMLSelectElement;
		value: HTMLInputElement;
		fmtstr: HTMLInputElement;
		list: HTMLSelectElement;
		constID: HTMLSelectElement;
		save: HTMLButtonElement;
		del: HTMLButtonElement;
		clear: HTMLButtonElement;
		copy: HTMLButtonElement;
		up: HTMLButtonElement;
		down: HTMLButtonElement;
	}; // HTMLElement(s)
	private selectContainer: HTMLDivElement;
	private lol: RSLst.ListOfLists;
	private formats: RSLst.constList = RSLst.CL.FT as RSLst.constList;

	/** Public Functions (External Calls) */

	constructor(
		container: HTMLDivElement | null,
		constList: RSLst.constList,
		ListOfLists: RSLst.ListOfLists = RSLst.CL,
		linkedConstList?: RSLst.constList
	) {
		// Constructor
		this.container = container as HTMLDivElement;
		this.constList = constList as RSLst.constList;

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
			constID: firstLine.appendChild(this.container.ownerDocument.createElement('select'))
		};

		this.i.constID.multiple = false;

		this.i.list.style.cssText =
			'display: none; width: 100px; height: 40px; border-radius: 10px; font-family: inherit; outline: none; border: none; padding-left: 10px; transition: 0.3s linear;';
		this.i.constID.style.cssText =
			'display: none; width: 100px; height: 40px; border-radius: 10px; font-family: inherit; outline: none; border: none; padding-left: 10px; transition: 0.3s linear;';

		/** Preset Event Handlers  */
		this.i.save.onclick = () => {
			if (this.selectbox.value) {
				this.UpdateCID(this.i.name.value);
				this.Reload();
			} else {
				this.CreateCID();
				this.Reload();
			}
		};
		this.i.fmt.onselectionchange = () => this.FormatChangeHandler();
	}

	public Populate(): void {
		// public/Populate
		this.CLToSelect();

		const FirstCID: RSLst.constID = this.constList.ToSortedCIDs()[0] as RSLst.constID;

		const constIDs = this.constList.ToSortedCIDs();
		this.selectbox.onchange = () => {
			console.log(this.constList.Str);
			const selected = this.selectbox.value;
			const cid: RSLst.constID = constIDs.find((cid) => cid.Name === selected) as RSLst.constID;
			this.DefineFields(cid);
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

		this.constList.ToSelect(this.selectbox);
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

	private DefineFields(constID: RSLst.constID): void {
		if (constID) {
			this.i.name.value = constID.Name ? constID.Name : '';
			this.i.description.value = constID.Desc ? constID.Desc : '';

			console.log(constID.Fmt?.Ch !== '');

			const rawFMT = constID.Fmt as RSLst.IFmt;
			const format = this.formats.GetDesc(rawFMT.Ch) as string;

			if (format === 'Member') {
				this.LoadMemberAndSetFields();
			} else if (format === 'Set') {
				this.LoadMemberAndSetFields('Set');
			} else this.UnloadMemberAndSetFields();

			this.i.fmtstr.value = rawFMT.Str.slice(rawFMT.Ch.length);
			this.i.fmt.value = format;
			this.i.value.value = rawFMT.Value._Str as string;

			this.i.del.onclick = () => this.DeleteCID(constID.Name);
			this.i.clear.onclick = () => this.ClearRef();
			this.i.copy.onclick = () => this.CopyCID(constID);
			this.i.up.onclick = () => this.MoveElement('up', constID);
			this.i.down.onclick = () => this.MoveElement('down', constID);
		} else return;
	}

	private LoadMemberAndSetFields(field?: string) {
		console.log('LoadMemberAndSetFields');
		this.i.value.style.display = 'none';
		this.i.list.style.cssText =
			'display: block; width: 100px; height: 40px; border-radius: 10px; font-family: inherit; outline: none; border: none; padding-left: 10px; transition: 0.3s linear;';
		const CL = this.lol.ToConstList() as RSLst.constList;
		CL.ToSelect(this.i.list);
		this.i.constID.style.cssText =
			'display: block; width: 100px; height: 40px; border-radius: 10px; font-family: inherit; outline: none; border: none; padding-left: 10px; transition: 0.3s linear;';
		this.i.list.onchange = () => {
			const List = this.lol.ListByName(this.i.list.value) as RSLst.constList;
			List.ToSelect(this.i.constID);
		};

		if (field === 'Set') {
			this.i.constID.multiple = true;
		}
	}

	private UnloadMemberAndSetFields() {
		this.i.list.style.cssText =
			'display: none; width: 100px; height: 40px; border-radius: 10px; font-family: inherit; outline: none; border: none; padding-left: 10px; transition: 0.3s linear;';
		this.i.constID.style.cssText =
			'display: none; width: 100px; height: 40px; border-radius: 10px; font-family: inherit; outline: none; border: none; padding-left: 10px; transition: 0.3s linear;';
		this.i.value.style.display = 'block';
		this.i.constID.multiple = false;
	}

	private CreateCID(): void {
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
				this.i.constID.value
			)}]${description}` as string;
		}

		if (format === 'Set') {
			const selected = this.GetSelected(this.i.constID).join(',');
			validDesc = `[{${this.RemoveWhitespace(this.i.list.value)}=${selected}]`;
		}

		let constID: RSLst.constID = new RSLst.constID(this.i.name.value, validDesc, this.constList);
		// Update ConstList
		this.constList.UpdateCID(constID);
		this.CLToSelect();
		constID = constID.Copy(this.constList);
		this.ClearRef();
		console.log('Create', constID);
		console.log('Create', this.constList.Str);
	}

	private GetSelected(Select: HTMLSelectElement): string[] {
		const response: string[] = [];
		for (let i = 0; i < Select.selectedOptions.length; i++) {
			response.push(Select.selectedOptions[i].value);
		}
		return response;
	}

	private UpdateCID(name: string): void {
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
			console.log(this.i.constID.value, 'this is the constID selected');
			validDesc = `[@${this.RemoveWhitespace(this.i.list.value)}=${this.RemoveWhitespace(
				this.i.constID.value
			)}]${description}` as string;
		}

		if (format === 'Set') {
			const selected = this.GetSelected(this.i.constID).join(',');
			validDesc = `[{${this.RemoveWhitespace(this.i.list.value)}=${selected}]`;
		}

		let constID = new RSLst.constID(`${name}:${validDesc}`, this.constList);

		if (updatedName) {
			this.constList.UpdateCID(constID, true);
			constID.SetName(updatedName);
		}

		this.constList.UpdateCID(constID, false);
		this.CLToSelect();
		constID = constID.Copy(this.constList);
		console.log(this.constList.Str);
	}

	private RemoveWhitespace(str: string): string {
		return str.replace(/(\s+Bad\s+List\s+Name\s+|\s+)/g, '');
	}

	private DeleteCID(name: string): void {
		const constID: RSLst.constID = this.constList.GetCID(name) as RSLst.constID;
		this.constList.UpdateCID(constID, true);
		this.CLToSelect();
		console.log(this.constList.Str);
	}

	private CopyCID(constID: RSLst.constID) {
		const newConstID = constID.Copy(this.constList);
		newConstID.SetName(`${newConstID.Name} Copy`);
		this.constList.UpdateCID(newConstID, false);
		this.ClearRef();
		this.Populate();
		console.log(this.constList.Str);
	}

	private MoveElement(direction: string, constID: RSLst.constID): void {
		if (direction === 'up') {
			this.constList.Bubble(constID.Name, -1);
			this.CLToSelect(true);
			return;
		} else if (direction === 'down') {
			this.constList.Bubble(constID.Name, 1);
			this.CLToSelect(true);
			return;
		} else return;
	}

	private checkFormat(value: string, format: string): boolean {
		const validFormat = this.formats.GetCID(format);

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
	private LOL: RSLst.ListOfLists;
	private container: HTMLDivElement;
	private select: HTMLSelectElement;
	private selected: string;
	private btnsContainer: HTMLDivElement;
	private editorComponent: any | null; // New property to store the editor component instance
	private buttons: { Copy: HTMLButtonElement; Merge: HTMLButtonElement };

	get CL(): RSLst.constList | undefined {
		return this.ListOfLists.ToConstList();
	}

	constructor(ListOfLists: RSLst.ListOfLists, container: HTMLDivElement) {
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

	get ListOfLists(): RSLst.ListOfLists {
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
		const newList: RSLst.constList = this.LOL.ListByName(
			this.select.value
		)?.Copy() as RSLst.constList;
		this.LOL.Add(newList.Str);
		console.log(this.CL);
		this.Reload();
	}

	private MergeList(): void {
		const currentList = this.LOL.ListByName(this.selected) as RSLst.constList;
		const mergeWith: string = prompt(
			'Which list would you like to merge with? *(enter name, case sensitive)'
		) as string;
		currentList.Merge(this.LOL.ListByName(mergeWith));
	}

	private LoadList(): void {
		const list: RSLst.constList = this.LOL.ListByName(this.selected) as RSLst.constList;

		if (list.Name === this.selected) {
			if (this.editorComponent) {
				console.log('existing destroyed');
				this.DestroyComponent('.editor');
			}

			this.LoadEditorComponent(list as RSLst.constList);
		} else return;
	}

	private DestroyComponent(query: string) {
		const component = this.container.querySelector(query);
		if (component) {
			component.remove();
			return;
		} else return;
	}

	private LoadEditorComponent(list: RSLst.constList) {
		this.editorComponent = new Editor_TC({
			target: this.container,
			props: {
				CLString: list.Str
			}
		});
	}
}
