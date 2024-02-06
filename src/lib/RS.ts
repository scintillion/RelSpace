export namespace RS1 {

	/*
      vID is a class representing a named value, which also had an ID related to its
      index (position) within an ordered list of like items.  vIDs are stored in
      vLists which are defined by a string in the format

      ListName|Element1Name:Desc e1|Element2Name: Description or value|...|ElementN:asdf|

      The last character in the vList string defines its Element Delimiter, in the
      case above, '|'.  The colon character ':' terminates the name (and cannot appear
      within the name), and each ElementNames may NOT start with a numeric character
      (0..9,-,+) since these are illegal in variable names.

      An element in the vList is starts and terminates with the Element Delimiter
      taking the format |ElementName:ElementDesc|.  Therefore, it is easy to search a
      vList for a particular Element by its name, in the form "|Element:".  The
      end of the Element is the last character before |.

      vLists can be used to maintain lists of defined constants for programmers, but
      conveniently provide a way to display those values to the user through their
      element names and descriptions.  (In such a case, their position in the list is
      fixed and provides the ID (index) value of the defined constant.  (See the ToDC
      function in the vID class).

      vLists and their defining string can also be used to provide configuration
      parameters for an object such as a Tile: e.g. |TileCfg|AL=UL|Color=Blue|Height=23|

      Because vLists and their vIDs are defined by strings, they can be used to
      pass data between machines or foreign tiles.  They can efficiently represent the
      data of diverse objects, e.g. user record
      "User|Name:Doe1234|FullName:John Doe:Email:scintillion@gmail.com|Value:123.96|Phone:16055551414|"

      Once passed to an object, a vList can be left AS IS, without deliberately
      parsing and expanding its data, because the individual elements are quickly
      accessed, each time as needed, using highly efficient string search.

      The vID for a list element returns the Name and Desc fields (strings),
      along with the ID (the index within the vList, which is fixed), and the
      Value field which is a number (if Desc is a number, Value will be set).

      A special case of a vList is a RefList, which is a list of indexes referring
      to a fully defined vList, with the form "vListName|1|5|23|" where the
      RefList includes elements #1, #5, #23 from the vList named "vListName".
      Note that if a vID is selected from the RefList, in this case, #2, it would
      select the second element in the list, whose name is "5".  Since there is no
      name terminator ':', we know this is a reflist element with no description field,
      but for consistency, we set the description field to match the name "5".  And the
      Value field for the vID is set to the numeric value of its name/descriptor = 5.

      By using a complete vList along with a RefList defining a subset of its
      elements, we can create lists of elements to display to the user.  The ToLine
      function of the vID creates such a line, with the Description in the first
      part of the line (readable by the user), and (if delimiter is provided), a
      second portion of the string defining the index/ID and the Name.

    */

	
	const sleep=async (ms=1)=>await new Promise((r)=>setTimeout(r,ms));
	type StoreBuffer = string | ArrayBuffer | Function | undefined;

	export const NameDelim = ':',PrimeDelim = '|',TabDelim = '\t',LineDelim = '\n',FormDelim = '\f';
	export const FormatStart = '[',FormatEnd = ']';
	export const tNone='',tStr='$',tNum='#',tAB='[',tPack='&';

	export enum CLType {
		None,
		Std,
		Name,
		ID,
		Pack
	}

	interface PackFunc { (Pack : BufPack) : BufPack }
	function NullPackFunc (P : BufPack) { return P; }

	interface ABReq { (AB : ArrayBuffer) : Promise<ArrayBuffer> }
	interface StrReq { (Query : string) : Promise<RS1.BufPack> }
	interface PackReq { (Pack : BufPack) : Promise<BufPack> }
	
	export var _ReqAB : ABReq;
	var _ReqPack : PackReq;

	const InitStr = 'InitReq must be called before Request Operations!';

	export async function ReqAB (AB : ArrayBuffer): Promise<ArrayBuffer> {
		if (_ReqAB) {
			let response = await _ReqAB (AB);
			sleep (3);
			console.log ('ReqAB.response bytes = ' + response.byteLength.toString ());
			return response;
		}
		else {
			throw InitStr;
			return NILAB;
		}
	}
	
	export async function ReqPack (BP : RS1.BufPack) : Promise<RS1.BufPack>{
	  if (_ReqPack) {
		  let returnBP = await _ReqPack (BP);
		  sleep (3);
		  console.log ('ReqPack.BP = ' + BP.desc);
		  return returnBP;
	  }
	  else {
		  throw InitStr;
		  return NILPack;
	  }
	}
	
	export function InitReq (AB : ABReq, Pack : PackReq) {
		_ReqAB = AB;
		_ReqPack = Pack;
		console.log ('Functions Assigned!');
		return true;
	}
	
	export async function ReqStr (Query : string) : Promise<RS1.BufPack> {
		let DPos = Query.indexOf (PrimeDelim);
		let StrType;
		if (DPos >= 0) {
			StrType = '!' + Query.slice (0,DPos);
			Query = Query.slice (DPos + 1);
		}
		else StrType = '!Q';

		let BP = new BufPack ();
		BP.add ([StrType,Query]);
	
		// console.log ('strRequest BP on client:\n' + BP.Desc ());
		// console.log ('BP.BufOut length = ' + BP.BufOut ().byteLength.toString ());
	
		let BPReply = await ReqPack (BP);
	
		return BPReply;
	}

	export async function ReqTiles () : Promise<string[]> {
		let BP = await RS1.ReqStr ('SELECT name from sqlite_master;');
		sleep (1);
		console.log (BP.desc);
		
		let SQStr = "sqlite_";
		let SQLen = SQStr.length;

		let BPs = BP.unpack ();
		let Names : string[] = [];
		for (const P of BPs) {
			let Name = P.str ('name');
			if (Name.slice (0,SQLen) !== SQStr) {
				Names.push (Name);
				console.log ('  ' + Name);
			}
		}
		return Names;
	}
	
	export async function ReqNames (Tile = 'S', Type = '', Sub = '') : Promise<RSData[]> {
		let QStr = 'SELECT id,name,desc FROM ' + Tile + ' ';
		let TypeXP = Type ? ('type=\'' + Type + '\'') : '';
		let SubXP = Sub ? ('sub=\'' + Sub + '\'') : '';
		let WhereXP = ';';

		if (TypeXP && SubXP)
			WhereXP = 'WHERE ' + TypeXP + ' AND ' + SubXP + ';';
		else if (TypeXP)
			WhereXP = 'WHERE ' + TypeXP + ';'
		else if (SubXP)
			WhereXP = 'WHERE ' + SubXP + ';'

		QStr += WhereXP;
		
		let BP = await ReqStr  (QStr);
		sleep (3); 
		console.log ('BP Promised!' + BP.desc);
		
		if (!BP.multi)
			return [];
		sleep (3); 

		let BPs = BP.unpack ();

		sleep (3);

		// console.log ('ReqNames/BP=' + BP.expand ());

		let Data = new Array<RSData> (BPs.length);
		let i = 0;
		for (const P of BPs)
		{
			let D = new RSData ();

			console.log ('  P.name = ' + P.str ('name'));

			D.LoadPack (P);
			Data[i++] = D;
			// console.log ('  ReqName:' + D.ID.toString () + '  ' + D.Name + '  '					 + D.Desc);
		}

		console.log ('  ' + i.toString () + ' names.');

		return Data;
	}

	

	export function Download(filename: string, text: string) {
		var e = document.createElement('a');
		e.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		e.setAttribute('download', filename);
		e.style.display = 'none';
		e.click();
	}

	export function isDigit(ch: string): boolean {
		ch = ch[0];
		if ((ch <= '9')  &&  ch.length)
				return ((ch >= '0') || (ch === '-') || (ch === '.'));

		return false;
	}		

	export function ChkBuf (Buf : ArrayBuffer) {
		const UInt8View = new Uint8Array (Buf);

		let Sum = 0, i = 0;
		for (const B of UInt8View)
			Sum += B * ((++i & 31) + 1);

		return Sum;
	}

	function isDelim(ch: string): boolean {
		if (ch <= '|') {
			return ch === '|' || (ch >= TabDelim && ch <= FormDelim);
		} else return false;
	}

	export function FromString(Str: string) {
		let Strs = Str.split(LineDelim);

		let limit = Strs.length;
		for (let i = 0; i < limit; ++i) {
			let Pos = Strs[i].indexOf(TabDelim);
			if (Pos >= 0) Strs[i] = Strs[i].slice(0, Pos).trimEnd();
		}

		return Strs;
	}

	type SelectArgs = HTMLSelectElement | HTMLOListElement | HTMLUListElement | undefined;
	type OptionArgs = HTMLOptionElement | undefined;
	type IOArgs = BufPack | Function | undefined;

	// Convert DBclass to/from BufPack
	export interface DataVert {
		(In: IOArgs): IOArgs;
	}

	export class DataConvert {
		Name: string;
		Convert: DataVert;

		constructor(Name1: string, Conv1: DataVert) {
			this.Name = Name1;
			this.Convert = Conv1;
		}
	}

	export function FmtStrFromDesc(Desc: string) {
		if (Desc[0] === FormatStart) {
			let EndPos = Desc.indexOf(FormatEnd);
			if (EndPos >= 0) return Desc.slice(1, EndPos);
		}

		return '';
	}

	export class IValue {
		_Str: string = '';
		Nums: number[] = [];
		Strs: string[] = [];
		Error: string = '';

		get Num(): number | undefined {
			return this.Nums && this.Nums.length === 1 ? this.Nums[0] : undefined;
		}
		get Str(): string | undefined {
			return this.Strs && this.Strs.length === 1 ? this.Strs[0] : undefined;
		}
	}

	export class IFmt {
		Type: number = 0;
		Ch = ''; // first char denoting type of format
		Str: string;
		Value: IValue = new IValue();
		Num = 0;
		List: vList | undefined;
		Arr: number[] | undefined;

		/*  Input Formats, defined by ]FormatStr[

            FormatStr starts with first character which defines its nature,
            followed by additional characters in some cases

            # - number (including floating point)
            I - integer
            Onn - ordinal integers, 0 allowed to indicate none (nn is limit if present)
            R - StartNumber  COMMA  EndNumber
            P - integer pair
            Ann - number array (COMMA separated)  (nn specifies size limit for array)
            {} - set of allowed strings inside brackets, choose one (or NONE)
            @ListName - choose member from named list
            $ - dollar amount, allows two digit cents included $$$.cc
            %nn - string limited to nn characters
            Unn - uppercase string




        */

		ParseValue(ValStr: string = '') {
			if (ValStr) {
				this.Value._Str = ValStr;
			} else ValStr = this.Value._Str;

			this.Value.Nums = [];
			this.Value.Strs = [];
			this.Value.Error = '';

			switch (this.Type) {
				case FMNum:
				case FMInt:
				case FMDollar:
				case FMRange:
				case FMOrd:
					this.Value.Nums.push(Number(this.Value._Str));
					break; // single number

				case FMStrs:
					this.Value.Strs = this.Value._Str.split(',');
					break;

				case FMPair:
				case FMNums:
					let Strs = this.Value._Str.split(',');
					let limit = Strs.length;
					for (let i = 0; i < limit; ) this.Value.Nums.push(Number(Strs[i++]));
					break; // multiple numbers

				case FMStr:
				case FMUpper:
				case FMSet:
					this.Value.Strs.push(this.Value._Str);
					break; //  string

				default:
					this.Value.Error = 'Invalid Type';
					break;
			}
		}

		constructor(Str1: string) {
			let NoError = true;

			if (Str1[0] === FormatStart) {
				let EndPos = Str1.indexOf(FormatEnd);
				if (EndPos >= 0) {
					Str1 = Str1.slice(1, EndPos);
				}
			}

			let ValPos = Str1.indexOf('=');
			let V;
			if (ValPos >= 0) {
				V = new IValue();
				V._Str = Str1.slice(ValPos + 1);
				this.Value = V;
				Str1 = Str1.slice(0, ValPos);
			}

			/*
			let V;
			let limit = Str1.length;

			for (let i = 0; ++i < limit; )
				if (Str1[i] === '=') {
					V = new IValue();
					V._Str = Str1.slice(i + 1);
					this.Value = V;
					Str1 = Str1.slice(0, i);
					break;
				}
*/

			this.Str = Str1;

			this.Ch = Str1.slice (0,1).toUpperCase ();
			if (Str1.length > 1) {
				this.Str = Str1.slice(1);
				if (V) {
					if (isDigit(Str1[0])) this.Num = Number(Str1);
				}
			} else this.Str = Str1 = '';

			let TypeArray = [
				FMNum,
				FMInt,
				FMDollar,
				FMPair,
				FMOrd,
				FMNums,
				FMStr,
				FMUpper,
				FMMember,
				FMRange,
				FMSet
			];

			let index = '#I$POA%U@R{'.indexOf(this.Ch);
			if (index >= 0) this.Type = TypeArray[index];

			switch (this.Type) {
				case FMNum:
				case FMInt:
				case FMPair:
					break;
				case FMOrd:
				case FMNums:
				case FMStr:
				case FMUpper:
					break;

				case FMMember:
					if (!(this.List = CL.ListByName(Str1))) this.Str = Str1 + ' = Bad List Name';
					break;

				case FMRange:
					if (Str1.indexOf(',')) {
						this.Arr = new Array(2);
						this.Arr[0] = Number(Str1);
						this.Arr[1] = Number(Str1.slice(Str1.indexOf(',') + 1));
					} else this.Str = Str1 + ' = Bad Range';
					break;

				case FMSet:
					if (Str1[Str1.length - 1] === '}')
						Str1 = Str1.slice(1, Str1.length - 1); // clip it from ends
					else Str1 = Str1.slice(1);

					this.Str = Str1 = ',' + Str1 + ','; // every member starts/ends with ,
					break;

				default:
					this.Str = Str1 + ' = Bad String and Ch = ' + this.Ch;
					NoError = false;
			}

			if (NoError) this.ParseValue();
		}

		ToStr() {
			return (
				FormatStart +
				this.Ch +
				this.Str +
				(this.Value._Str ? '=' + this.Value._Str : '') +
				FormatEnd
			);
		}
	}

	export class NameData {
		Name: string;
		DataType: string;
		Buffer = NILAB;

		constructor(Name1: string, DType: string, Buf: ArrayBuffer = NILAB) {
			this.Name = Name1;
			this.DataType = DType;
			this.Buffer = Buf;
		}
	}
	export class NameBuffer {
		Name: string;
		Type: string;
		Buffer: IOArgs;
		Data: any | undefined;

		constructor(Name1: string, DType: string, Buf: IOArgs = undefined) {
			this.Name = Name1;
			this.Type = DType;
			this.Buffer = Buf;
		}
	}

	export const NullFmt = new IFmt ('');

	export class RSData {
		Name = '';
		Desc = '';
		Type = '';
		Tile = 'S';
		Sub = '';
		Str = '';
		ID = 0;
		Details = '';
		Data: any;

		NameBufs: NameBuffer[] | undefined;

		Fmt: IFmt | undefined;

		PostLoad (P : BufPack) {}

		LoadPack(P: BufPack) {
			if (P === NILPack)
				return;

			this.Name = P.str ('name');
			this.Desc = P.str ('desc');
			this.Type = P.str ('type');
			this.Tile = P.str ('!T');
			this.Str = P.str ('str');
			this.Sub = P.str ('sub');
			this.ID = P.num ('!ID');
			if (!this.ID)
				this.ID = P.num ('id');
			this.Details = P.str ('details');
			this.Data = P.data ('data');

			this.PostLoad (P);
		}

		constructor (P = NILPack) {
			this.LoadPack (P);
		}

		PostSave (P : BufPack) {}
		SavePack (P : BufPack = NILPack) {
			if (P === NILPack)
				P = new BufPack ();

			P.add([	'name',	this.Name,
				'desc',	this.Desc,
				'type',	this.Type,
				'!T',	this.Tile,
				'str',	this.Str,
				'sub', this.Sub,
				'details',	this.Details,
				'!ID',	this.ID,
				'data',	this.Data
			]);

			this.PostSave (P);
			return P;
		}

		ToValue() {
			let ValStr = '';
			if (this.Fmt) {
				if (this.Fmt.Value && this.Fmt.Value.Str) ValStr = '=' + this.Fmt.Value.Str;
			}
			return this.Name + ',' + this.Type + ',' + this.ID.toString() + ValStr;
		}

		FromOption(Item: SelectArgs) {
			let text, value;

			if (Item instanceof HTMLOptionElement) {
				let Option = Item as HTMLOptionElement;
				text = Option.text;
				value = Option.value;
			} else if (Item instanceof HTMLOListElement) {
				let OItem = Item as HTMLOListElement;
				text = OItem.innerText;
				value = OItem.attributes.getNamedItem('value');
			} else if (Item instanceof HTMLUListElement) {
				let UItem = Item as HTMLUListElement;
				text = UItem.innerText;
				value = UItem.attributes.getNamedItem('value');
			}
		}

		static ToFrom(In: IOArgs): IOArgs {
			// Should raise exception!
			return undefined;
		}

		ToSelect(Select: SelectArgs) {
			if (Select && Select instanceof HTMLSelectElement) {
				let Option: HTMLOptionElement = Select.ownerDocument.createElement(
					'option'
				) as HTMLOptionElement;

				let Desc = this.Desc ? this.Desc : this.Name;
				let Value = '';
				if (Desc[0] === FormatStart) {
					let Pos = Desc.indexOf('=');
					if (Pos >= 0) {
						Value = Desc.slice(Pos + 1);
						let EndPos = Value.indexOf(FormatEnd);
						if (EndPos >= 0) Value = Value.slice(0, EndPos);
					}
				}

				Option.text = Desc;
				Option.value = this.Name;
				Select.options.add(Option);
			}
		}

		Copy(): Function | undefined {
			return undefined;
		}

		async toDB () {
			let P = this.SavePack ();
			P.add (['!Q',this.ID ? 'U' : 'I']);
			P = await RS1.ReqPack (P);
			return P.num ('changes') > 0;
		}

		/*
		SetBuffer(Name: string, DType: string, Buf: IOArgs) {
			let Bufs = this.NameBufs;
			if (!Bufs) {
				Bufs = this.NameBufs = [];
			}

			for (let i = Bufs.length; --i >= 0; )
				if (Bufs[i].Name === Name) {
					Bufs[i].Buffer = Buf;
					Bufs[i].Type = DType;
					Bufs[i].Data = undefined;
					return;
				}

			Bufs.push(new NameBuffer(Name, DType, Buf));
		}

		GetBuffer(Name: string): IOArgs {
			let Bufs = this.NameBufs;
			if (Bufs) {
				for (let i = Bufs.length; --i >= 0; ) {
					if (Bufs[i].Name === Name) return Bufs[i].Buffer;
				}
			}
		}
		*/
	}

	export function PackToData (P : BufPack) : RSData {
		let Type = P.str ('type');

		switch (Type) {
			case 'List' : return new vList (P);
		}
		return new RSData (P);
	}

	export function DataToSelect(Data: RSData[], Select: SelectArgs) {}

	export function SelectToData(Select: SelectArgs): RSData[] {
		return [];
	}

	export function RSDataVert(In: IOArgs): IOArgs {
		if (In) {
			if (In.constructor.name === 'BufPack') {
				let Pack = In as BufPack;
				let Data = new RSData();
				Data.Name = Pack.str('name');
				Data.Type = Pack.str('type');
				Data.Str = Pack.str('str');
			} else {
				// must be class for conversion
			}
		} else return undefined;
	}

	const NewTileStrings: string[] = [
		'ABC:Tile Description',
		'T\ta|name:Full|\ts|display:flex|flex-direction:column|align:center|justify:center|background:black|min-width:750px|max-width:750px|min-height:500px|\t',
		' T\ta|name:Top|\ts|background:magenta|min-height:150px|\t',
		'  T\ta|name:Left|\ts|background:green|min-width:100px|\t',
		'   T\ta|name:Top|\ts|background:magenta|min-height:50px|\t',
		'   T\ta|name:Bottom|\ts|background:magenta|min-height:100px|\t',
		'  T\ta|name:Right|\ts|background:cyan|width:100%|display:flex|\t',
		' T\ta|name:Bottom|\ts|display:flex|flex-direction:row|background:white|min-height:350px|\t',
		'  T\ta|name:Left|\ts|background:green|min-width:100px|\t',
		'  T\ta|name:Middle|\ts|background:cyan|width:100%|display:flex|\t',
		'  T\ta|name:Right|\ts|background:yellow|min-width:200px|\t'
	];

	const TileStrings: string[] = [
		'T\ta|name:Full|\ts|display:flex|flex-direction:column|align:center|justify:center|background:black|min-width:750px|max-width:750px|min-height:500px|\t',
		' T\ta|name:Top|\ts|background:magenta|min-height:150px|\t',
		'  T\ta|name:Left|\ts|background:green|min-width:100px|\t',
		'   T\ta|name:Top|\ts|background:magenta|min-height:50px|\t',
		'   T\ta|name:Bottom|\ts|background:magenta|min-height:100px|\t',
		'  T\ta|name:Right|\ts|background:cyan|width:100%|display:flex|\t',
		' T\ta|name:Bottom|\ts|display:flex|flex-direction:row|background:white|min-height:350px|\t',
		'  T\ta|name:Left|\ts|background:green|min-width:100px|\t',
		'  T\ta|name:Middle|\ts|background:cyan|width:100%|display:flex|\t',
		'  T\ta|name:Right|\ts|background:yellow|min-width:200px|\t'
	];

	class TileID {
		tnum: number;
		vnum: number;
		tname: string;
		vname: string;
		_Str: string;

		constructor(Str: string) {
			Str = Str.trim();
			this._Str = Str;

			let NamEnd = Str.indexOf(NameDelim);
			if (NamEnd >= 0) {
				this.tname = Str.slice(0, NamEnd);
				this.vname = Str.slice(NamEnd + 1);
			} else {
				this.tname = Str;
				this.vname = '';
			}

			this.tnum = 0;
			this.vnum = 0;
		}

		Valid(): boolean {
			if (this.tnum) return true;
			else if (this.tname) return true;

			return false;
		}

		ToString(): string {
			if (this.vname) return this.tname + NameDelim + this.vname;
			return this.tname;
		}
	}

	export class TDE extends RSData {
		//  TileDefElement, for defining Tiles
		level = 0;
		tileID: TileID | undefined;
		List: vList | undefined;
		Childs: vList[] | undefined;
		aList: vList | undefined;
		sList: vList | undefined;
		vList: vList | undefined;
		jList: vList | undefined;

		nLists = 0;
		parent = 0;
		prev = 0;
		next = 0;
		first = 0;
		last = 0;

		constructor(Str: string, List1: vList | undefined = undefined) {
			super();

			if (Str) List1 = new vList(Str);

			if (List1) {
				this.List = List1;
				// console.log('TDE List[' + this.List.Name + ']=' + this.List.Str + '.');

				this.Childs = List1.Childs;

				if (this.Childs) {
					this.Childs.forEach((Child) => {
						if (Child.Name === 'a') {
							this.aList = Child;
							console.log('\taList =' + Child.Str);
						} else if (Child.Name === 's') {
							this.sList = Child;
							console.log('\tsList =' + Child.Str);
						} else if (Child.Name === 'v') this.vList = Child;
						else if (Child.Name === 'j') this.jList = Child;

						console.log('   TDE Child[' + Child.Name + ']=' + Child.Str + '.');
					});
				}

				this.level = List1.Indent;
				this.tileID = new TileID(List1.Name);
			}
		}
	}

	export class TileList extends RSData {
		tiles: TDE[] = [];

		constructor(Str: string[] | string, List: vList | undefined = undefined) {
			let limit, count = 0;

			super();

			if (List) {
				if (List.LType != CLType.Pack || !List.Childs) {
					this.tiles = [];
					return;
				}

				limit = List.Childs.length;
				this.tiles = Array(++limit);
				for (let i = 0; i < limit; ) {
					this.tiles[++count] = new TDE('', List.Childs[i++]);
					// console.log('Handling Child ' + count.toString());
				}
			} else {
				let Strs: string[] = Array.isArray(Str) ? Str : FromString(Str); // Str.split (LineDelim);

				this.tiles = Array((limit = Strs.length + 1));
				for (let i = 0; ++i < limit; ) {
					console.log(i.toString() + '=' + Strs[i - 1]);

					if (Strs[i - 1][0] !== '!') {
						//						let TabPos = Strs[i-1].indexOf (TabDelim);
						//						if (TabPos >= 0)
						//							Strs[i-1] = Strs[i-1].slice (0,TabPos).trimEnd ();

						// console.log('Line==' + Strs[i - 1] + '.');

						let newTDE = new TDE(Strs[i - 1]);
						if (newTDE) {
							this.tiles[++count] = newTDE;
						}
					}
				}
			}
			/*
} else {
	let Strs: string[] = Array.isArray(Str) ? Str : FromString(Str);

	limit = Strs.length + 1;

	this.tiles = Array(limit);
	for (let i = 0; ++i < limit; ) {
		console.log(i.toString() + '=' + Strs[i - 1]);

		if (Strs[i - 1][0] !== '!') {
			console.log ('Line==' + Strs[i-1] + '.');
			let newTDE = new TDE(Strs[i - 1]);
			if (newTDE) {
				this.tiles[++count] = newTDE;
			}
		}
	}
}
*/
			this.tiles.length = count + 1;
			this.Links();
		}

		Links() {
			// calculate relations   for the TDEs
			let Tiles: TDE[] = this.tiles;
			let limit = Tiles.length;

			for (let tnum = 0; ++tnum < limit; ) {
				// each TDE/tile
				let i;

				let me = Tiles[tnum];
				let mylev = me.level;
				let parentlev = mylev - 1;
				let childlev = mylev + 1;
				let lev;

				me.first = me.next = me.parent = me.prev = 0;

				for (i = tnum; --i > 0; )
					if ((lev = Tiles[i].level) >= parentlev) {
						if (lev == parentlev) {
							me.parent = i;
							break;
						} else if (lev == mylev && !me.prev) me.prev = i;
					}

				for (i = me.last = tnum; ++i < limit; )
					if ((lev = Tiles[i].level) >= mylev) {
						if (lev === mylev) {
							me.next = i;
							break;
						}
						me.last = i;
						if (i > 10) console.log('i = ' + i.toString() + ':' + i);
						if (lev == childlev && !me.first) me.first = i; // first child
					} else break;
			} // for each TDE/tile
		}

		ToString(): string {
			let Tiles = this.tiles;
			let limit = Tiles.length;
			let Str = '';

			for (let i = 0; ++i < limit; ) {
				let me = Tiles[i];

				let NewStr =
					(me.List ? me.List.Str : '@NOLIST@') +
					'\t' +
					i.toString() +
					'.level=' +
					me.level.toString() +
					' parent=' +
					me.parent.toString() +
					' prev=' +
					me.prev.toString() +
					' next=' +
					me.next.toString() +
					' first=' +
					me.first.toString() +
					' last=' +
					me.last.toString() +
					' #=' +
					(me.last - i + 1).toString() +
					' TileID=';

				if (me.tileID) NewStr += me.tileID.ToString();
				else NewStr += 'NONE';

				Str += NewStr + '\n';

				if (me.Childs) {
					for (let c = 0; c < me.Childs.length; ) {
						let List = me.Childs[c++];
						NewStr = '\t\t List.Name=' + List.Name + '=' + List.Str;
						Str += NewStr + '\n';
					}
				}
			}
			return Str;
		}

		ToSelect(Select1: HTMLSelectElement | HTMLOListElement | HTMLUListElement | undefined) {
			let Tiles = this.tiles;
			let limit = Tiles.length;

			let Select = Select1 as HTMLSelectElement;

			Select.options.length = 0;

			for (let i = 0; ++i < limit; ) {
				let Option: HTMLOptionElement = document.createElement('option') as HTMLOptionElement;

				let Tile = Tiles[i];
				let List = Tile.List;
				if (Tile && List && Tile.tileID) {
					let Str = '-----------------------------------------------------';
					Str = Str.slice(0, Tile.level * 3);
					Option.text = Str + i.toString() + '.' + Tile.tileID.ToString();
					//                  Option.value = this.ToExtraStr ();

					Option.setAttribute('name', 'N' + i.toString());
					let NameStr = Option.getAttribute('name');
					Option.style.color = 'pink';
					let ColorStr = Option.style.color;
					console.log('Option Name = ' + NameStr);
					console.log('Color = ', ColorStr);

					Select.options.add(Option);
				}
			}
		}
	}

	export class TileCache {
		First: vList | undefined;

		constructor(ListStrs: string[]) {
			// 'Name:Addr|TileName1|..|TileNameN|"  ("*" is ALL)
			let limit = ListStrs.length;

			for (let i = 0; i < limit; ) {
				let Str = ListStrs[i++].trim();

				let List = new vList(Str, this.First);
				if (!this.First) this.First = List;
			}
		}

		LoadTile(ID: TileID) {}

		GetID(TileName: string): TileID | undefined {
			return undefined;
		}
	}

	export class vID extends RSData {
		// often abbreviated as VID
		List: vList;
		Values: number[] = [];

		get IDByName () {
			return this.List ? this.List.IDByName(this.Name) : 0;
		}

		constructor(Str: string, List1: vList) {
			super();
			let Desc1, NameEnd = Str.indexOf(NameDelim);

			if (NameEnd >= 0) {
				this.Name = Str.slice(0, NameEnd);
				Desc1 = Str.slice(NameEnd + 1);
			} else {
				this.Name = Str;
				Desc1 = '';
			}

			if (Desc1) {
				let FmtStr = FmtStrFromDesc(Desc1);
				if (FmtStr) {
					Desc1 = Desc1.slice(FmtStr.length + 2);
					this.Fmt = new IFmt(FmtStr);
				}
			} else Desc1 = this.Name;

			this.Desc = Desc1;
			this.List = List1;

			if (isDigit(Desc1)) {
				if (Desc1.indexOf(',') < 0) {
					// single number
					this.Values.push(Number(Desc1));
				} else {
					// array of numbers, comma separated
					let Strs = Desc1.split(',');
					let limit = Strs.length;
					this.Values = [];

					for (let i = 0; i < limit; ) this.Values.push(Number(Strs[i++]));
				}
			}

			this.Desc = Desc1;
		}

		ToDC(Prefix: string): string {
			return Prefix + this.Name + '=' + this.ID.toString();
		}

		ToLine(Delim1: string = '') {
			if (Delim1) {
				return this.Desc + Delim1 + this.Name + NameDelim + this.ID.toString();
			} else return this.Desc;
		}

		ToStr(): string {
			if (!this.Desc || this.Name === this.Desc) return this.Name;

			let RetStr = this.Name + NameDelim;
			if (this.Fmt) RetStr += this.Fmt.ToStr();

			return RetStr + this.Desc;
		}

		/*		

		Copy(List1: vList): vID {
			if (!List1) {
				List1 = this.List;
			}

			if (this.Fmt) return new vID(this.Name, this.Fmt.ToStr() + this.Desc, List1);
			return new vID(this.Name, this.Desc, List1);
		}
*/

		ToValueStr(): string {
			if (this.Fmt) {
				let Val = this.Fmt.Value;
				if (Val) {
					if (Val.Num) return '=' + Val.Num.toString();
					if (Val.Nums) return '=' + Val.Nums.toString();
					if (Val.Str) return '=' + Val.Str;
					if (Val.Strs) return '=' + Val.Strs.toString();
				}
			}
			return '';
		}

		ToFmtStr(): string {
			let Fmt = this.Fmt;
			if (Fmt) {
				let VStr = FormatStart + Fmt.Ch;

				if (Fmt.Num) VStr += Fmt.Num.toString();

				return VStr + this.ToValueStr() + FormatEnd;
			}
			return '';
		}

		ToExtraStr(): string {
			return this.ToFmtStr() + this.Name + ':' + this.ID.toString();
		}

		ToList(Select: HTMLOListElement | HTMLUListElement | null) {
			if (!Select) {
				return;
			} else if (!(Select instanceof HTMLOListElement) && !(Select instanceof HTMLUListElement)) {
				return;
			}

			let item: HTMLLIElement = Select.ownerDocument.createElement('li') as HTMLLIElement;

			item.innerText = this.Desc;
			Select.appendChild(item);
		}

		static ToFrom(In: IOArgs): IOArgs {
			// Should raise exception!
			return undefined;
		}
	} // class vID

	export class vList extends RSData {
		Type = 'List';
		protected _Delim = PrimeDelim;
		private _FirstDelim = 0;
		protected _Count = 0;
		protected _Next: vList | undefined;
		protected _IDs: number[] | undefined;
		_NameIDs = '';
		LType: CLType = CLType.None;
		protected _Childs: vList[] | undefined;
		protected _Indent = 0;

		get Count() {
			return this._Count;
		}

		get Childs() {
			return this._Childs;
		}

		get getStr() {
			if (this.LType != CLType.Pack) return this.Str;

			if (!this.Childs) return '';

			let Strs = [this.Str.slice(0, this.Str.length - 1)];
			let limit = Strs.length;
			for (let i = 0; i < limit; ) {
				let Child = this.Childs[i++];
				if (Child) Strs.push(Child.Str);
			}

			return Strs.join(this._Delim) + this._Delim;
		}

		PostSave (P : BufPack) { P.add (['data', this.getStr]); console.log ('PostSave vList'); }
		PostLoad (P : BufPack) { this.Data = P.str ('data'); console.log ('PostLoad vList'); }


		get Indent() {
			return this._Indent;
		}

		get IDs(): vID[] | undefined {
			return this.IDs;
		} // only sensible for RefList, returns undefined if not
		get Next() {
			return this._Next;
		}
		get Delim() {
			return this._Delim;
		}
		get FirstChild(): vList | undefined {
			if (this._Childs) return this._Childs[0];
		}

		Merge(AddList: vList | undefined): boolean {
			let DestStrs = this.Str.split(this._Delim);
			DestStrs.length = DestStrs.length - 1;
			let Destlimit = DestStrs.length;
			let Appended = 0, Replaced = 0;
			
			console.log('Merging Dest:');

			for (let i = 0; i < Destlimit; ++i) console.log('Q1  ' + DestStrs[i]);

			if (!AddList) return false;

			let AddStrs = AddList.Str.split(AddList._Delim);

			let Addlimit = AddStrs.length - 1; // don't use last!
			console.log('Adding List');
			for (let i = 0; i < Addlimit; ++i) console.log('Q2  ' + AddStrs[i]);

			let NameD, Name;

			for (let i = 0; ++i < Addlimit; ) {
				let Pos = AddStrs[i].indexOf(NameDelim);
				let Replacer = Pos >= 0;
				Name = Replacer ? AddStrs[i].slice(0, Pos) : AddStrs[i];
				NameD = Name + NameDelim;

				for (let j = 0; ++j < Destlimit; ) {
					if (DestStrs[j].startsWith(Name)) {
						// at least partial match, is it full?
						if (DestStrs[j].startsWith(NameD) || DestStrs[j] == Name) {
							// TRUE match
							if (Replacer || DestStrs[j] == Name) {
								// need to replace
								// console.log('Replacing with ' + AddStrs[i]);
								DestStrs[j] = AddStrs[i];
								++Replaced;
								Name = ''; // done, no more processing
							} else {
								Name = '';
								break; // TRUE match, not replaced, we are done
							}
						}
					}
				}

				// not found, need to add at end...
				if (Name) {
					// still active
					// console.log('Appending ' + AddStrs[i]);
					++Appended;
					DestStrs.push(AddStrs[i]);
				}
			}

			if (Replaced || Appended) {
				let NewStr = DestStrs.join(this._Delim) + this._Delim;
				this.InitList(NewStr);
			}

			return false;
		}

		SetDelim(NewDelim: string): boolean {
			let OldDelim = this._Delim;

			if (!NewDelim || NewDelim.length != 1 || NewDelim == OldDelim || isDigit(NewDelim))
				return false;

			this.Str.replace(OldDelim, NewDelim);
			this._Delim = NewDelim;
			return true;
		}

		private VIDByPos(Pos1: number): vID | undefined {
			if (Pos1 < 0) return undefined;

			let EndPos = this.Str.indexOf(this._Delim, Pos1);
			if (EndPos < 0) return undefined;

			let FoundStr = this.Str.slice(Pos1, EndPos);
			return new vID(FoundStr, this);
		}

		SortVIDs(VIDs: vID[]) {
			let limit = VIDs.length;
			var Temp: vID;

			for (let i = 0; ++i < limit; ) {
				for (let j = i; --j >= 0; ) {
					if (VIDs[j].Desc > VIDs[j + 1].Desc) {
						Temp = VIDs[j];
						VIDs[j] = VIDs[j + 1];
						VIDs[j + 1] = Temp;
					} else break;
				}
			}
		}

		ByIDs(IDs: number[], Sort: boolean = false): vID[] {
			if (!IDs) {
				// copy all in list
				let i = this._Count;
				IDs = new Array(i);
				while (--i >= 0) IDs[i] = i + 1;
			}

			let VIDs: vID[] = [];
			for (let i = IDs.length; --i >= 0; ) {
				let VID = this.GetVID(IDs[i]);
				if (VID) VIDs.push(VID);
			}

			if (Sort) this.SortVIDs(VIDs);

			return VIDs;
		}

		NameList(UseList = 1): string {
			if (UseList && this._NameIDs) return this._NameIDs;

			let Str1 = this.Str;
			let Start = this._FirstDelim - 1;
			let Delim1 = this._Delim;
			let ID = 0;
			let NameStr = Delim1;

			while ((Start = Str1.indexOf(Delim1, Start)) >= 0) {
				let EndDelim = Str1.indexOf(Delim1, ++Start);
				if (EndDelim < 0) break;
				let NewStr = Str1.slice(Start, EndDelim);

				let EndName = NewStr.indexOf(NameDelim);
				if (EndName >= 0) NewStr = NewStr.slice(0, EndName);

				++ID;
				NameStr += NewStr + NameDelim + ID.toString() + Delim1;
			}

			this._NameIDs = NameStr;
			this._Count = ID;
			return NameStr;
		}

		IDByName(Name: string) {
			let Delim1 = this._Delim;
			let SearchStr = Delim1 + Name + NameDelim;
			let NameList = this.NameList();
			let Pos = NameList.indexOf(SearchStr);
			if (Pos >= 0) {
				let Start = Pos + SearchStr.length;
				let End = Start;
				let Str;

				while (NameList[++End] != Delim1);

				let Num = Number((Str = NameList.slice(Start, End)));
				if (isNaN(Num)) {
					// console.log('QQQNameList 999 Str=' + Str + ' Name=' + Name + ' NameList=' + NameList);
					Num = 999;
				}
				return Num;
			}
			return 0;
		}

		NameByID(ID: number) {
			if (ID <= 0 || ID > this._Count) return '';

			let Str = this.NameList();
			let Delim1 = this._Delim;
			let SearchStr = ':' + ID.toString() + Delim1;
			let Pos = Str.indexOf(SearchStr);
			if (Pos >= 0) {
				let Start = Pos;
				while (Str[--Start] != Delim1);
				return Str.slice(Start + 1, Pos);
			}

			return '';
		}

		Dump(DumpStr: string) {
			if (this.Name && this._Indent)
				console.log(
					DumpStr +
						'Dump:' +
						this.Name +
						' Indent = ' +
						this._Indent?.toString() +
						' #C =' +
						this.Childs
						? this.Childs?.length.toString()
						: '0' + ' Count = ' + this.Count.toString() + ' Str=' + this.Str
				);

			if (this._Childs) {
				let limit = this._Childs.length;

				for (let i = 0; i < limit; ++i) {
					this._Childs[i].Dump(DumpStr + '   ');
				}
			}
		}

		private InitList(Str1: string | string[]) {
			this._NameIDs = '';
			this._Indent = 0;

			if (Array.isArray(Str1)) Str1 = Str1.join('\n') + '\n';

			let StrLen = Str1.length;

			let NamePos = 0; // default start of Name
			let Ch = Str1[0];
			if (Ch <= '9') {
				if (Ch <= ' ') {
					while (Ch === ' ' || Ch === '\t') {
						this._Indent++;
						Ch = Str1[++NamePos];
					}
				} else if (Ch >= '0') {
					let Zero = '0'.charCodeAt(0);
					this._Indent = Ch.charCodeAt(0) - Zero;
					if ((Ch = Str1[++NamePos]) >= '0' && Ch <= '9') {
						// second digit (only two allowed)
						this._Indent = this._Indent * 10 + Ch.charCodeAt(0) - Zero;
						++NamePos;
					}
				}
			}

			let Delim1 = Str1[StrLen - 1];

			this._FirstDelim = -1;

			if (!isDelim(Delim1)) {
				let i = NamePos;
				while (i < StrLen)
					if (isDelim((Delim1 = Str1[i]))) {
						this._FirstDelim = i;
						Str1 += Delim1; // add (missing) delim to end of string
						++StrLen;
						break;
					} else ++i;

				if (i >= StrLen) return; // panic, no Delim
			}

			this._Delim = Delim1;
			// Note that delimiter is typically '|', placed at end of string, but \0 could
			// be used if one wished to allow '|' to appear within the const description

			this._Childs = undefined;
			this._IDs = undefined;

			if (this._FirstDelim < 0) this._FirstDelim = Str1.indexOf(Delim1, NamePos);

			if (Delim1 < ' ') {
				// special case, embedded vLists!
				this._Count = 0;
				this.LType = CLType.Pack;

				let Strs = Str1.split(Delim1);
				let limit = Strs.length;

				if (limit <= 0) return; // panic, no strings, should never happen

				Str1 = '';
				--limit;
				for (let i = 0; ++i < limit; ) {
					if (Strs[i][0] === '/' || !Strs[i].trim()) continue; //	ignore comment lines

					let Child: vList = new vList(Strs[i]);
					if (Child) {
						if (!this._Childs) this._Childs = [];
						this._Childs.push(Child);

						if (!Str1) Str1 = Strs[0] + Delim1; // we are just finding the first line (Name:Desc)
					}
				}
			}

			let NameStr = Str1.slice(NamePos, this._FirstDelim);

			let i = NameStr.indexOf(NameDelim);
			if (i >= 0) {
				this.Desc = NameStr.slice(i + 1);
				this.Name = NameStr.slice(0, i);
			} else {
				for (let lim = NameStr.length, i = 0; i < lim; ++i)
					if (NameStr[i] <= ' ') {
						NameStr = NameStr.slice(0, i);
						if ((NameStr = '')) NameStr = 'Q';
						break;
					}

				this.Desc = this.Name = NameStr;
			}

			console.log('InitList (' + this.Name + '), NameStr =' + NameStr + '.');

			this.Str = Str1;

			//			console.log ('InitList ' + this._Name + ' Indent = ' + this._Indent.toString () + ' #C =' +
			//				this.ChildCount.toString () + ' Count = ' + this.Count.toString () + ' Str=' + this._Str);

			if (Delim1 < ' ') return; // done processing, vList with kids...

			let FirstChar = Str1[this._FirstDelim + 1];

			let IDList = isDigit(FirstChar);
			this.LType = IDList ? CLType.ID : CLType.Std;

			if (IDList) {
				let N = 0, limit = StrLen - 1;
				let Pos: number[] = Array(99);
				Pos[0] = 0;

				for (let i = this._FirstDelim - 1; ++i < limit; ) {
					if (Str1[i] === Delim1) {
						Pos[++N] = Number(Str1.slice(i + 1, i + 25));
					}
				}
				this._Count = N;
				Pos.length = N + 1;
				this._IDs = Pos;
			}

			this.NameList();
		}

		constructor(Str1: string | string[] | BufPack, First: vList | undefined = undefined) {
			let Str, Strs, BP;
			
			if ((typeof Str1) === 'string') {
				super ();
				this.InitList (Str1 as string);
			}
			else if (Array.isArray (Str1)) {
				super ();
				this.InitList (Str1 as string[]);
			}
			else {
				let BP = Str1 as BufPack;
				super (BP);
				this.InitList (BP.str ('data'));
			}

			if (First) {
				let Last = First;

				this._Next = undefined;

				while (Last._Next && Last._Next.Name != this.Name) Last = Last._Next;

				this._Next = Last._Next;
				Last._Next = this; // add our vList to the list of vLists
			}
		}

		GetDesc(Name: string): string | undefined {
			let SearchStr = this._Delim + Name + NameDelim; // e.g. '|NameXYZ:''
			let Pos1 = this.Str.indexOf(SearchStr, this._FirstDelim);
			if (Pos1 >= 0) {
				let StartPos = Pos1 + SearchStr.length;
				let EndPos = this.Str.indexOf(this._Delim, StartPos);

				if (EndPos > 0) return this.Str.slice(StartPos, EndPos);
			}
			return undefined;
		}

		GetNum(Name: string): number | undefined {
			let Str = this.GetDesc(Name);
			return Str ? Number(Str) : undefined;
		}

		GetStr(Name: string): string | undefined {
			let Str = this.GetDesc(Name);
			console.log('GetStr (' + Name + ') GetDesc returns "' + Str + '"');

			if (Str) {
				if (Str[0] === FormatStart) {
					let EndPos = Str.indexOf(FormatEnd, 1);

					if (EndPos > 0) return Str.slice(EndPos + 1);
					else console.log(FormatEnd + ' not present!');
				} else return Str;
			}
			return undefined;
		}

		UpdateVID(VID: vID, Delete = false) {
			if (!VID) return;

			let Delim = this._Delim;
			let Str = this.Str;

			let SearchStr = Delim + VID.Name;
			let Pos = Str.indexOf(SearchStr + Delim, this._FirstDelim);
			if (Pos < 0) {
				Pos = Str.indexOf(SearchStr + NameDelim, this._FirstDelim);
			}

			if (Pos >= 0) {
				let EndPos = Pos;

				while (Str[++EndPos] !== Delim);

				//if (EndPos < Str.length - 1) {
				// not the last element in list!
				if (Delete) Str = Str.slice(0, Pos) + Str.slice(EndPos);
				else Str = Str.slice(0, Pos + 1) + VID.ToStr() + Str.slice(EndPos);

				/*
				} else {
					if (Delete) Str = Str.slice(0, Pos + 1);
					else Str = Str.slice(0, Pos + 1) + VID.ToStr() + Delim;
				}
				*/
			} else {
				if (Delete) return; //	ABORT, should not happen!

				// VID not found, we must add to the end!
				Str += VID.ToStr() + Delim;
			}

			this.InitList(Str);
		}

		GetNamePos(Name: string): number {
			let SearchStr = this._Delim + Name; // e.g. '|NameXYZ:''

			let Pos1 = this.Str.indexOf(SearchStr + NameDelim, this._FirstDelim);
			if (Pos1 >= 0) return Pos1;

			return this.Str.indexOf(SearchStr + this._Delim, this._FirstDelim);
		}

		Bubble(Name: string, dir: number) {
			// check for special easy case - list of Childs
			if (this.LType == CLType.Pack) {
				if (!this._Childs) return;

				for (let i = this._Childs.length; --i >= 0; )
					if (this._Childs[i].Name === Name) {
						let First, Second;

						if (dir <= 0) {
							Second = i;
							First = i - 1;
							if (First < 0) return;
						} else {
							First = i;
							Second = i + 1;
							if (Second >= this._Childs.length) return;
						}

						let TempList = this._Childs[First];
						this._Childs[First] = this._Childs[Second];
						this._Childs[Second] = TempList;
						return;
					}

				return; // no match found
			}

			let Pos = this.GetNamePos(Name);
			if (Pos < 0) return -1; // cannot find, we are done

			let StartPos, EndPos;

			let First = '', Second = '';

			if (dir <= 0) {
				// bubble up
				for (StartPos = Pos; --StartPos >= 0; ) if (this.Str[StartPos] == this._Delim) break;

				if (StartPos < 0) return -1; // cannot find previous

				EndPos = this.Str.indexOf(this._Delim, Pos + 1);
				if (EndPos < 0) return -1;

				Second = this.Str.slice(Pos, EndPos);
				First = this.Str.slice(StartPos, Pos);
			} else {
				// bubble down
				StartPos = Pos;
				EndPos = this.Str.indexOf(this._Delim, Pos + 1);
				let NextEnd;

				if (EndPos >= 0) {
					// found end of first
					First = this.Str.slice(Pos, EndPos);
					NextEnd = this.Str.indexOf(this._Delim, EndPos + 1);

					if (NextEnd < 0) return; // cannot find next

					Second = this.Str.slice(EndPos, NextEnd);
					EndPos = NextEnd;
				} else return;
			}

			if (!First || !Second) return -1;

			let NewStr = this.Str.slice(0, StartPos) + Second + First + this.Str.slice(EndPos);
			this.InitList(NewStr);
		}

		GetVID(IDorName: string | number): vID | undefined {
			let SearchStr;

			let Name: string = typeof IDorName !== 'number' ? IDorName : this.NameByID(IDorName);
			let Pos1 = this.GetNamePos(Name);

			if (Pos1 >= 0) {
				// we found it
				return this.VIDByPos(Pos1 + 1);
			} else return undefined;
		}

		ByDesc(Desc: string) {
			let SearchStr = NameDelim + Desc + this._Delim;

			let Pos1 = this.Str.indexOf(SearchStr, this._FirstDelim);
			if (Pos1 >= 0) {
				for (let i = Pos1; --i > 0; ) {
					if (this.Str[i] === this._Delim) return this.VIDByPos(i + 1);
				}

				return undefined;
			}
		}

		NameByDesc(Desc: string) {
			let SearchStr = NameDelim + Desc + this._Delim;

			let Pos1 = this.Str.indexOf(SearchStr, this._FirstDelim);
			if (Pos1 >= 0) {
				for (let i = Pos1; --i > 0; ) {
					if (this.Str[i] === this._Delim) return this.Str.slice(i + 1, Pos1);
				}

				return '';
			}
		}

		ChildByName(Name1: string) {
			if (!this.Childs) return undefined;

			let limit = this.Childs.length;

			for (let i = 0; i < limit; ++i) {
				if (this.Childs[i].Name == Name1) return this.Childs[i];
			}

			return undefined;
		}

		GetLine(ID: any, Delim1: string = ''): string {
			let VID: vID | undefined = this.GetVID(ID);
			return VID ? VID.ToLine(Delim1) : '';
		}

		IDsToRefList(IDs: number[]): vList | undefined {
			if (IDs) {
				let Delim = this._Delim;
				let Ret = this.Name + Delim;
				for (let i = IDs.length; --i >= 0; ) {
					Ret += IDs[i].toString() + Delim;
				}

				return new vList(Ret);
			}
			return undefined;
		}

		VIDsToRefList(VIDs: vID[] | undefined): vList | undefined {
			if (VIDs) {
				let IDs: number[] = new Array(VIDs.length);

				for (let i = VIDs.length; --i >= 0; ) {
					IDs[i] = VIDs[i].ID;
				}

				return this.IDsToRefList(IDs);
			} else return undefined;
		}

		IDsToVIDs(IDs: number[] | undefined): vID[] {
			if (!IDs) {
				// if undefined, use every element (IDs 1..N)
				let limit = this._Count;
				IDs = new Array(limit);
				for (let i = limit; --i >= 0; IDs[i] = i + 1);
			}

			let VIDs: vID[] = new Array(IDs.length);
			let VID: vID | undefined;

			for (let i = IDs.length; --i >= 0; ) {
				VID = this.GetVID(IDs[i]);
				if (VID) VIDs[i] = VID;
			}

			return VIDs;
		}

		ToSortedVIDs(): vID[] {
			let VIDs = this.IDsToVIDs(undefined);
			this.SortVIDs(VIDs);
			return VIDs;
		}

		RefListToVIDs(Ref: vList): vID[] | undefined {
			if (Ref._IDs) return this.IDsToVIDs(Ref._IDs);
			return undefined;
		}

		IDsToLines(IDs: number[], Delim: string): string[] {
			let i = IDs.length;
			let Lines: string[] = new Array(i);
			let VID: vID | undefined;

			while (--i >= 0) {
				VID = this.GetVID(IDs[i]);
				Lines[i] = VID ? VID.ToLine(Delim) : '';
			}

			return Lines;
		}

		VIDsToLines(VIDs: vID[], Delim: string): string[] {
			let i = VIDs.length;
			let Lines: string[] = new Array(i);

			while (--i >= 0) Lines[i] = VIDs[i].ToLine(Delim);

			return Lines;
		}

		ToDC(): string {
			let VIDs = this.ToSortedVIDs();
			let limit = VIDs.length, FmtStr = '';

			let LineStr = '// ' + this.Name + NameDelim + this.Desc + '="' + this.Str + '"\n';
			let Line = 'export const ';
			for (let i = 0; i < limit; ++i) {
				Line += VIDs[i].ToDC(this.Name) + ',';

				let VID = VIDs[i];
				if (VID.Fmt) {
					// print out format
					FmtStr += '//\t' + VID.Name + ' ~' + VID.Fmt.Ch;

					if (VID.Fmt.Str) FmtStr += ' Str="' + VID.Fmt.Str + '"';

					if (VID.Fmt.Num) FmtStr += ' Num=' + VID.Fmt.Num.toString();

					if (VID.Fmt.Type) FmtStr += ' Type=' + VID.Fmt.Type.toString();

					FmtStr += '\n';
				}
			}

			Line = Line.slice(0, Line.length - 1) + ';';
			while (Line.length > 70) {
				let i = 70;
				while (--i && Line[i] !== ',');

				LineStr += Line.slice(0, ++i) + '\n\t';
				Line = Line.slice(i);
			}
			LineStr += Line + '\n';

			LineStr += FmtStr;

			return LineStr;
		}

		ToSelect(Select: HTMLSelectElement | HTMLOListElement | HTMLUListElement) {
			let VIDs = this.IDsToVIDs(undefined);
			let VIDLen = VIDs.length;

			if (Select instanceof HTMLSelectElement) {
				Select.options.length = 0;
				for (let i = 0; i < VIDLen; ) VIDs[i++].ToSelect(Select);
			} else if (Select instanceof HTMLOListElement || Select instanceof HTMLUListElement) {
				for (let i = 0; i < VIDLen; ) VIDs[i++].ToList(Select);
			}
		}
	} // vList

	export class IOType {
		type: number = 0;
		subTypes: number[] | undefined;
	}

	export class JxnDef {
		name: string = '';
		process: number = 0;
		Input: IOType | undefined;
		Output: IOType | undefined;
	}

	export class ListOfLists {
		Lists: vList[] = [];

		ListByName(Name: string): vList | undefined {
			for (const L of this.Lists)
				if (L.Name === Name) return L;
		}

		Add(ListStr: string | string[]): vList | undefined {
			let ListStrs: string[] = (typeof ListStr === 'string') ? [ListStr] : ListStr;
			let List;

			for (const L of ListStrs) {
				this.Lists.push (List = new vList(L));
			}

			if (ListStrs.length <= 1)
				return List;
		}

		Merge(AOL: vList[]) {
			let ListLimit = this.Lists.length;
			if (!ListLimit) {
				//	empty list
				this.Lists = AOL;
				return;
			}

			for (let limit = AOL.length, i = 0; i < limit; ++i) {
				let Name = AOL[i].Name;
				let j = ListLimit;

				while (--j >= 0) {
					if (this.Lists[j].Name === Name) break;
				}

				if (j < 0) {
					this.Lists.push(AOL[i]);
					++ListLimit;
				}
			}
		}

		async Defines(FileName: string = 'Consts.ts') {
			let DocStr = '\n\n\n/*  Documentation Names/Desc\t___________________\n\n';

			let DefineStr = '/*\tDefines for vLists\t*/\n\n';

			let CList = vList;
			DefineStr += 'CList = ' + typeof CList + '\n';

			let limit = this.Lists.length;
			for (let q = 0; q < limit; ++q) {
				let List = this.Lists[q];

				DefineStr += List.ToDC();
				DocStr += '\n\nList ' + List.Name + '(' + List.Desc + ')\t' + List.Str + '\n';
				let VIDs = List.ToSortedVIDs();
				for (let i = 0; i < VIDs.length; ++i) {
					let VID = VIDs[i];
					DocStr += VID.Name + '\t';
					if (VID.Fmt)
						DocStr +=
							'[' +
							VID.Fmt.Ch +
							(VID.Fmt.Num ? VID.Fmt.Num.toString() : '') +
							VID.Fmt.Str +
							']' +
							'\t';
					let ID = VID.List.IDByName(VID.Name); // VID.ID;
					// if (isNaN (ID))
					//   ID = 999;

					DocStr += VID.Desc + '\tID[' + VID.Name + ']==' + ID.toString() + '\n';
				}

				DocStr += 'NameList=' + List.NameList() + '\t' + List.Count + '\n';
			}

			console.log('Reading NewTileStrings!');
			let NewTileList = new vList(NewTileStrings);
			if (NewTileList) NewTileList.Dump('');
			console.log('Finished reading NewTileStrings');

			//			TL = new TileList(TileStrings);
			console.log('Testing NewTileList');
			TL = new TileList('', NewTileList);
			console.log('TileList is read from NewTileList');

			if (RS1.LstEdit.TileSelect) TL.ToSelect(RS1.LstEdit.TileSelect);

			let TString = TL.Str;

			if (RS1.CL.LT && RS1.CL.AC) RS1.CL.LT.Merge(RS1.CL.AC);

			let LongList = new vList(TileStrings.join('\n') + '\n');

			DocStr += '\n Dump of LongList...\n' + LongList.Str + '\n End of LongList Dump.  \n';
			DocStr += 'LongList Name=' + LongList.Name + ' Desc=' + LongList.Desc + '\n\n';

			if (LongList) LongList.Dump('');

			DocStr += '\n' + TString + '\n*/\n';

			DefineStr += DocStr;

			if (this.Lists[0]) RS1.Download (FileName, DefineStr);

			for (let i = 0; i < CL.Lists.length; ++i) {
				let List = CL.Lists[i];
				let Pack = List.SavePack ();
				Pack.add (['!Q','I']);
				RS1.sql.bInsUpd (Pack);
			}


			let List = CL.LT;

			if (List) {
				let Pack = List.SavePack();
				// Add code here to save List to the database
				// using "Pack"

				console.log ('LT SavePack List:' + '\n' + Pack.desc);

				Pack.add (['!Q','S']);
				RS1.sql.buildQ (Pack);
				Pack.add (['!Q','I']);
				RS1.sql.buildQ (Pack);
				Pack.add (['!Q','U','!I',123]);
				RS1.sql.buildQ (Pack);
				Pack.add (['!Q','D','!I',456]);
				RS1.sql.buildQ (Pack);
			}


			let BP = new BufPack('TEST', 'Details...asdfasdfas');
			BP.add([
				'Num1',
				123,
				'Num2',
				-789.123,
				'ShortStr',
				'ABC',
				'LongStr',
				'0123456789',
			]);

			console.log('Incoming Buf:' + '\n' + BP.desc);
			let NewBuf = BP.bufOut ();
			let Check1 = ChkBuf (NewBuf);

			BP.bufIn (NewBuf);
			console.log('Resultant Buf:' + '\n' + BP.desc);

			NewBuf = BP.bufOut ();
			let Check2 = ChkBuf (NewBuf);

			console.log ('Check1/2 = ' + Check1.toString () + ' ' + Check2.toString ());
		}

		TovList(): vList | undefined {
			let limit = this.Lists.length;

			let LStrs: string[] = ['LL:ListOfLists'];
			let NewStr: string;

			for (let i = 0; i < limit; ++i) {
				let List = this.Lists[i];

				if (List.Desc && List.Desc !== List.Name) NewStr = List.Name + NameDelim + List.Desc;
				else NewStr = List.Name;

				LStrs.push(NewStr);
			}

			LStrs = LStrs.sort();

			return new vList(LStrs.join(PrimeDelim) + PrimeDelim);
		}

		ToSelect(Select: HTMLSelectElement) {
			let List = this.TovList();

			if (List) List.ToSelect(Select);
		}
	}

	//  ________________________________________________

	export class RsLOL extends ListOfLists {
		FM = this.Add('FM|Num|Int|Dollar|Ord|Range|Pair|Nums|Member|Set|Str|Strs|Upper|');

		/*  Input Formats, defined by~FormatStr~

            FormatStr starts with first character which defines its nature,
            followed by additional characters in some cases

            # - number (including floating point)
            I - integer
            Onn - ordinal (+) integers, 0 allowed to indicate none (nn is limit if present)
            R - StartNumber  COMMA  EndNumber
            P - integer pair
            Ann - number array (COMMA separated)  (nn specifies size limit for array)
            {} - set of allowed strings inside brackets, choose one (or NONE)
            @ListName - choose member from named list
            $ - dollar amount, allows two digit cents included $$$.cc
            %nn - string limited to nn characters
            Unn - uppercase string
        */

		PL = this.Add('|Number:#|String:$|ArrayBuffer:[|');

		FT = this.Add(
			'Ft|#:Num|I:Int|$:Dollar|P:Pair|O:Ord|A:Nums|%:Str|U:Upper|@:Member|R:Range|{:Set|'); // Added & tested full support for Num, Int, Str, Dollar, Nums, Range, Upper, Ord, Pair; Member Rough Support Added
		//
		CT = this.Add('Ct:ConnectType|Data|Event|Action|Queue|DB|SQL:SQLite|Remote|Retail|');

		LT = this.Add(
			'Lt:ListType|Dt:DataType|Ev:Event|Ac:Action|Rt:Return|Td:TileDef|Ts:TileSize|Pr:Process|Mt:MessageType|Lg:Language|'
		);

		DT = this.Add(
			'Dt:DataType|String:Free format string|Integer:Whole Number|Number:Whole or Real Number|'
		);
		EV = this.Add('Ev:Event|Click|Enter|Exit|DblClick|Swipe|Drop|Drag|');
		RT = this.Add('Rt:Return|Ok|Fail|Equal|Unequal|Queue|');
		TD = this.Add('Td:TileDef|Tile|LnEdit|TxtEdit|Btn|Img|Video|');
		TS = this.Add(
			'Ts:TileSize|Fixed|T:Top|TL:Top Left|TR:Top Right|B:Bottom|BL:Bottom Left|BR:Bottom Right|L:Left|R:Right|SH:Shared|'
		);
		// Note that Tile Alignment is probably same as Tile Size, at least for now!
		Pr = this.Add('Pr:Process|Init|Read|Set|Clear|Default|');
		MT = this.Add('Mt:MessageType|Input|Output|Event|Trigger|Action|');
		AC = this.Add('Ac:Action|Init|Timer|Login|Logout|');
		LG = this.Add('Lg:Language|En:English|Es:Espanol|Cn:Chinese|');
		CY = this.Add('Cy:Country|US:United States|UK:United Kingdom|CA:Canada|RU:Russia|IN:India|');
		Test = this.Add('Test|NameF:~%12~First Name|XY:~P~XY Dim|Cost:~$~Dollar Price|');
	}

	export const CL = new RsLOL();
	const PL = CL.PL;

	export class LID {
		ListType: number;
		ID: number;
		Str: string = '';

		constructor(LT: number, ID1: number, Check = true) {
			this.ListType = LT;
			this.ID = ID1;

			if (Check) this.AsStr();
		}

		AsStr() {
			if (this.Str) return this.Str;
			if (!CL.Lists.length) return 'No Lists!';

			let RetStr = '';
			let Invalid = true;

			let ListVID: vID | undefined = CL.FM ? CL.FM.GetVID(this.ListType) : undefined;
			if (ListVID) {
				let List: vList | undefined = CL.ListByName(ListVID.Name);

				if (List) {
					let VID: vID | undefined = List.GetVID(this.ID);

					RetStr = ListVID.Name + NameDelim + ListVID.Desc;

					if (VID) {
						RetStr += ' = ' + VID.Name + NameDelim + VID.Desc;
						Invalid = false;
					} else RetStr += ' = Bad ID #' + this.ID.toString();
				} else RetStr = 'Cannot find Listname ' + ListVID.Name + ' # ' + ListVID.ID.toString;
			} else RetStr = 'Bad List #' + this.ListType.toString();

			if (Invalid) {
				RetStr = '@' + RetStr;
				this.ListType = 0 - this.ListType;
				this.ID = 0 - this.ID;
				// consider breakpoint or error here!
			}

			return (this.Str = RetStr);
		}
	} // LID

	//  _____________________________________

	export class ListEdit {
		MainList: HTMLSelectElement | null | undefined;
		DropList: HTMLSelectElement | null | undefined;
		ListSelect: HTMLSelectElement | null | undefined;
		TileSelect: HTMLSelectElement | null | undefined;

		MainSelectedID: number = 0;
		ListSelectedID: number = 0;

		NameEdit: HTMLInputElement | null | undefined;
		FormatEdit: HTMLInputElement | null | undefined;
		ValueEdit: HTMLInputElement | null | undefined;
		DescEdit: HTMLInputElement | null | undefined;
	}

	export const LstEdit = new ListEdit();
	let TL: TileList;

	export function BadTF(In: IOArgs): IOArgs {
		// Should raise exception!
		return undefined;
	}

	export class TFList {
		Names: string[] = [];
		Verts: DataVert[] = [];

		Bad = this.Add('Bad', BadTF);

		Add(Name: string, Vert: DataVert): DataVert | undefined {
			if (!Name || !Vert) return;

			let Pos = this.Names.indexOf(Name);
			if (Pos < 0) {
				this.Names.push(Name);
				this.Verts.push(Vert);
			} else this.Verts[Pos] = Vert;

			return Vert;
		}

		Del(Name: string) {
			let Pos = this.Names.indexOf(Name);
			if (Pos >= 0) {
				this.Names.splice(Pos, 1);
				this.Verts.splice(Pos, 1);
			}
		}
	}

	export const ToFroms = new TFList();

	export const NILAB = new ArrayBuffer (0);
	export const NILArray = new Uint8Array (NILAB);

	export function ABfromArray (Source : Int8Array) : ArrayBuffer {
		let AB = new ArrayBuffer (Source.length);
		let Dest = new Int8Array (AB);
		Dest.set (Source);

		return AB;
	}

	export function ab2str(AB : ArrayBuffer) {
		return new TextDecoder().decode(AB);
	  }

	export function str2ab(Str : string) {
		return new TextEncoder().encode(Str);
	}

	export function num2ab (N : number) : ArrayBuffer {
		if (N !== N)	//	NaN
			return NILAB;		

		let NewBuf = NILAB;		// default is NIL
		if (N % 1) {	// floating point
			NewBuf = new ArrayBuffer (8);
			let floats = new Float64Array (NewBuf);
			floats[0] = N;
			if (floats[0] !== N)
				console.log ('Float mismatch!');
			}
		else {
			let M = (N >= 0) ? N : -N;
			if (M < 128) {		// 1 byte
				NewBuf = new ArrayBuffer (1);
				let bytes = new Int8Array (NewBuf);
				bytes[0] = N;
				if (bytes[0] !== N)
					console.log ('Value mismatch!');

			}
			else if (M < 32000) {	// 2 byte
				NewBuf = new ArrayBuffer (2);
				let words = new Int16Array (NewBuf);
				words[0] = N;
				if (words[0] !== N)
					console.log ('Value mismatch!');
			}
			else if (M < 2000000000) { // 4 byte
				NewBuf = new ArrayBuffer (4);
				let longs = new Int32Array (NewBuf);
				longs[0] = N;
				if (longs[0] !== N)
					console.log ('Value mismatch!');
			}
			else { // need full float number size}
				NewBuf = new ArrayBuffer (8);
				let floats = new Float64Array (NewBuf);
				floats[0] = N;
				if (floats[0] !== N)
					console.log ('Value mismatch!');
			}
		}

//		console.log ('num2ab (' + N.toString () + ') = ' + NewBuf.byteLength.toString () + ' bytes');
//		let bytes = new Uint8Array (NewBuf);
//		console.log ('  ByteArray ' + NewBuf.byteLength.toString () + ' bytes = ' + bytes);

		return NewBuf;
	}

	export function ab2num (AB : ArrayBuffer) : number {
		let NBytes = AB.byteLength;
		let Num : number;

//		console.log ('  ab2num, ByteArray ' + NBytes.toString () + ' bytes = ' + bytes);

		switch (NBytes) {
			case 1 :
				let Bytes = new Int8Array (AB);
				Num = Bytes[0];
				break;
			case 2 :
				let Words = new Int16Array (AB);
				Num = Words[0];
				break;
			case 4 :
				let Longs = new Int32Array (AB);
				Num = Longs[0];
				break;
			case 8 :
				let Floats = new Float64Array (AB);
				Num = Floats[0];
				break;

			default : Num = NaN;
		}
		return Num;
	}

	export type PFData=string|number|ArrayBuffer|BufPack;

	export class PackField {
		private _name = '';
		private _type = ' ';
		private _data : PFData = NILAB;
		private _error = '';
		private _AB = NILAB;

		get Type () { return this._type; }
		get Name () { return this._name; }
		get Str () { return (this._type === tStr) ? this._data as string : ''; }
		get Num () { return (this._type === tNum) ? this._data as number : NaN; }

		get AB () { return this._AB; }
		get Pack () { return (this._type == tPack) ? this._data as BufPack : NILPack; }
		get Error () { return this._error; }
		get Data () { return this._data; }

		get toAB () {
			let AB : ArrayBuffer;
			switch (this._type) {
				case tNum : AB = num2ab (this.Num); break;
				case tStr : AB = str2ab (this.Str); break;
				case tAB : return this._AB;
				case tPack : AB = (this._data as BufPack).bufOut (); break;
				default : AB = NILAB; this._error = 'toArray Error, Type =' + this.Type + '.';
			}

			return this._AB = AB;
		}

		setData (D : PFData) {
			let Type;
			this._data = D;
			switch (typeof (D)) {
				case 'string' : Type = tStr; break;
				case 'number' : Type = tNum; break;
				default :
					if (!D) {
						this._data = NILAB;
						Type = tAB;
					} else
					{
						let CName = D.constructor.name;
						if (CName === 'BufPack')
							Type = tPack;
						else {
							Type = tAB;
							this._AB = (CName === 'ArrayBuffer') ? (D as ArrayBuffer) : NILAB;
							this._data = NILAB;
						}
					}
			}
			this._type = Type;
		}

		private setByAB (AB : ArrayBuffer,Type1 : string) {
			let D;
			switch (Type1) {
				case tStr : D = ab2str (AB); break;
				case tNum : D = ab2num (AB); break;
				case tPack : let Pack = new BufPack (); Pack.bufIn (AB); D = Pack; break;
				case tAB : D = AB; break;
				default : this._error = 'constructor error Type =' + Type1 + ', converted to NILAB.';
					Type1 = tAB;
					D = NILAB;
					AB = NILAB;
					break;
			}

			this._data = D;
			this._type = Type1;
		}

		private _setByBuf (Type : string, InBuffer : Int8Array | ArrayBuffer, Start = -1, nBytes = -1) {
			let ABuf : ArrayBuffer;
			let IBuf,TBuf : Int8Array;

			if (Start < 0) {
				Start = 0; nBytes = 999999999;
			}
			else if (nBytes < 0)
				nBytes = 999999999;


			if (InBuffer.constructor.name === 'ArrayBuffer') {
				ABuf = (InBuffer as ArrayBuffer).slice (Start, Start + nBytes);
				IBuf = new Int8Array (ABuf);
			}
			else {	// Int8Array
				TBuf = (InBuffer as Int8Array).slice (Start, Start+nBytes);
				ABuf = ABfromArray (TBuf);
			}

			this.setByAB (ABuf, Type);
		}

		constructor (N : string, D : PFData,Type1='') {
			this._name = N;

			if (Type1)		// AB coming in with type
				this.setByAB (D as ArrayBuffer, Type1);
			else this.setData (D);
		}

		get NameVal () {
			let Str = this._type + this._name + '=';

			switch (this._type) {
				case tNum : Str += this.Num.toString (); break;
				case tStr : Str += this.Str; break;
				case tPack : case tAB :
					 Str += '(' ;
					 if (this._type === tPack) {
						let Pack = this.Pack;

						Str += 'C:'+Pack.Cs.length.toString() + ' D:' + Pack.Ds.length.toString () + ')';
					 }
					 else	Str += this._AB.byteLength.toString () + ')';

					 break;
				default : Str += 'BADTYPE=' + this._type + ' ' + this.AB.byteLength.toString () + ' bytes';
			}

			return Str;
		}


		Equal (Ref : PackField) : boolean {
			if (this._type === Ref._type) {
				switch (this._type) {
					case tNum : return this.Num === Ref.Num;
					case tStr : return this.Str === Ref.Str;
					case tAB :
						let limit = this._AB.byteLength;
						if (Ref._AB.byteLength != limit)
							return false;

						let B = new Uint8Array (this._AB);
						let R = new Uint8Array (Ref._AB);

						for (let i = limit; --i >= 0;) {
							if (B[i] !== R[i])
								return false;
						}
						return true;	// no mismatch, equal.
					default : return false;
				}
			}
			return false;
		}

		get desc() {
			let Str = this.NameVal + ' ';

			switch (this._type) {
				case tNum : break; // Str += '= ' + this._num.toString (); break;
				case tStr : break; // Str += '= ' + this._str; break;
				case tPack : 
					let Pack = this.Pack;
					for (const F of Pack.Ds)
						Str += ' ' + F.NameVal;
					break;
				case tAB : break;

				default : Str += ' DEFAULT AB, Type =' + this._type + ' ' + this._AB.byteLength.toString () + ' bytes'; break;
			}

			if (this._error)
				Str += ' ***ERROR*** ' + this._error;

			return Str;
		}
	}

	export class BufPack {
		Cs : PackField[] = [];
		Ds : PackField[] = [];
		Type1 = '';
		Details = '';

		add(Args: any[]) {
			let limit = Args.length;
			let NotNull = this.Cs.length || this.Ds.length;

			let TypeCh,Size,Bytes;
			let NewBuf : ArrayBuffer;
			let PList = PL;

			if (!PList) return;

			if (Args.length & 1)
				return;		// must always be matching pairs (Name/Data), odd params not allowed


			// console.log ('BufPack.Add Incoming:');
			if (NotNull)
				console.log (this.desc);

			for (let i = 0; i < limit; )
			{
				let FldName = Args[i++] as string;
				let DF = !FldName  || (FldName[0] >= '0');
				let Fs = DF ? this.Ds : this.Cs;
				let Data = Args[i++];

				let NewField = new PackField(FldName,Data);

				// console.log ('   ...Adding ' + (DF ? 'D:' : 'C:') +  FldName + ' DESC:' + NewField.Desc () + '\n');

				if (NotNull)
				{
					let Found = false;

					/*
					for (var F of Fs) {
						if (F.Name === FldName) {
							F = NewField;
							Found = true;
							break;
						}
					*/

					for (let j = Fs.length; --j >= 0;)
						if (Fs[j].Name === FldName) {
							Fs[j] = NewField;
							if (DF)
								this.Ds[j] = NewField;
							else this.Cs[j] = NewField;
							Found = true;
							break;
						}

					if (Found)
						continue;

				}


				if (DF)
					this.Ds.push (NewField);
				else this.Cs.push (NewField);

//				console.log ('Adding ' + FldName + '=' + NewField.Str + '\n' + NewField.Desc());
			}

//			console.log ('BufPack.Add Outgoing:\n' + this.Desc ());
		}



		constructor(_Type = '', _Details = '', Args : any[]=[]) {
			this.Type1 = _Type;
			//	console.log ('constructor SetType =' + _Type);

			let BPos = _Details.indexOf(']');
			if (BPos > 0) _Details = _Details.slice(0, BPos);
			// trim ] and trailing text to avoid errors

			this.Details = _Details;

			if (Args.length)
				this.add (Args);
		}

		toABs ()
		{
			for (const F of this.Cs)
				F.toAB;

			for (const F of this.Ds)
				F.toAB;
		}

		update (N : string, V : any) {
			let i;
			let Fs = ((N[0] < '0') || !N) ? this.Ds : this.Cs;
			for (i = Fs.length; --i >= 0;) {
					if (Fs[i].Name === N) {
						Fs[i] = new PackField (N,V);
						return;
					}
				}
		}

		field(Name: string): PackField | undefined {
			if (!Name)
				return undefined;

			let Fs = (Name[0] >= '0') ? this.Ds : this.Cs;

			for (const F of Fs) {
				if (F.Name === Name)
					return F;
			}
		}

		data(Name: string): PFData {
			let F = this.field(Name);
			return F ? F.Data : NILAB;
		}

		str(Name: string) {
			let F = this.field(Name);
			return F ? F.Str : '';
		}

		num(Name: string) {
			let F = this.field(Name);
			return F ? F.Num : NaN;
		}

		get desc() {
			let Lines = [];
			let Pref = this.getPrefix ();
			let Fields = this.Cs.concat (this.Ds);
			let nFields = Fields.length;

			let Str = 'DESC ' + nFields.toString () + ' Fields, Buf Type:' + this.Type1 + ' Details:' + this.Details + '.';
			Lines.push(Str);
			Lines.push ('Prefix = ' + Pref);


			for (const F of this.Cs) {
				Lines.push ('  C::' + F.desc);
				}
			for (const F of this.Ds) {
					Lines.push ('  D::' + F.desc);
			}
	
			return Lines.join('\n');
		}

		expand () {
			if (!this.multi)
				return this.desc + '\n';

			let Lines = [];
			Lines.push (this.desc + '\n\n ** Expanded views of each record **' + this.Ds.length.toString () + 'n');

			let count = 0;
			for (const D of this.Ds) {
				let BP = new BufPack ();
				BP.bufIn (D.AB);
				Lines.push ('----- Record ' + (++count).toString () + '\n' + BP.desc);
			}

			return Lines.join ('\n');
		}

		private getPrefix(): string {
			this.toABs ();

			let PFs = this.Cs.concat (this.Ds);

			let Prefix = '    ';
			if (this.Type1) {
				Prefix += ':' + this.Type1;
				if (this.Details) Prefix += '[' + this.Details + ']';
			}
			//	console.log ('Building Prefix, Type = ' + this.Type1 + ', starting as:' + Prefix);

			for (let PF of PFs) {
				//	console.log ('  Prefix add Name ' + PF.Name + ' Type ' + PF.Type + ' Size ' + PF.Size.toString ());
				Prefix += ',' + PF.Type + PF.Name + ':' + PF.AB.byteLength.toString();
			}
			return Prefix;
		}

		bufOut (): ArrayBuffer {
			let Prefix = this.getPrefix();
			let PAB = str2ab (Prefix);
			let Bytes = PAB.byteLength;
			let ByteStr = Bytes.toString ();
			// console.log ('FirstPAB ' + PAB.byteLength.toString ());

			Prefix = ByteStr + Prefix.slice (ByteStr.length);
			PAB = str2ab (Prefix);
			// console.log ('SecondPAB ' + PAB.byteLength.toString ());

			let Fields = this.Cs.concat (this.Ds);
			let limit = Fields.length;

			for (let F of Fields)
				Bytes += F.AB.byteLength;

			let AB = new ArrayBuffer (Bytes);

			// console.log ('AB = ' + AB + ' bytes = ' + AB.byteLength.toString ());

			let BA = new Uint8Array (AB);
			BA.set (PAB);
			let Pos = PAB.byteLength;

			for (let F of Fields) {
				BA.set (new Uint8Array (F.AB), Pos);
				// console.log ('  BufOut Name:' + F.Name + ' Size ' + F.Size.toString () + ' ' + F.Type);
				Pos += F.AB.byteLength;
			}

			if (Bytes < PAB.byteLength)
				throw 'BufOUT';

			// console.log ('BufOut Prefix:' + Prefix);
			let TestBP = new BufPack ('?');
			TestBP.bufIn (AB);
			let TestPrefix = TestBP.getPrefix ();
			// console.log (' BufIn Prefix:' + TestPrefix);
			if (Prefix.slice (4) !== TestPrefix.slice (4))
				throw "Prefix Mismatch!";

			return AB;
		}

		copy () : BufPack {
			let AB = this.bufOut ();
			let NewBP = new BufPack ();
			NewBP.bufIn (AB);
			return NewBP;
		}

		static ByteArray (nBytes : number) {
			let Bytes = new Uint8Array (nBytes);

			let i = 0;
			for (var B of Bytes)
				B = i++  &  255;

			return Bytes;
		}

		bufIn (AB: ArrayBuffer) {
			this.clear ();

			let BA = new Uint8Array (AB);

			let NumBuf = AB.slice (0, 8);
			let PStr = ab2str (NumBuf).slice (0,4);
			let PBytes = Number (PStr);
			let Num;

			let PBuf = BA.slice (0,PBytes);
			let Prefix = ab2str (PBuf);

			let NPos = 4;
			let Type = '';
			let Details = '';

			//	console.log ('BufIn, Prefix =' + Prefix + '.');
			if (Prefix[4] === ':') {
				Type = Prefix.slice(5);
				let C0 = Type.indexOf(',');
				if (C0 < 0) {
					console.log ('No fields present, we are done.\n');	
					return; // no fields present, done
				}

				let B0 = Type.indexOf('[');
				if (B0 >= 0 && B0 < C0) {
					// found details
					let B1 = Type.indexOf(']');
					if (B1 < 0) {
						console.log ('Tragic error, no terminating ]\n');
						return; // tragic error
					}
					Details = Type.slice(B0 + 1, B1);
					Type = Type.slice(0, B0).trimEnd();
					NPos = B1 + 4;
				}
				Type = Type.slice (0,C0);
			}
			this.Type1 = Type;
			// console.log ('1.Type1 set to ' + Type)
			this.Details = Details;

			let Offset = PBytes;

			// console.log ('BufIn: pBytes = ' + PBytes.toString () + '/' + AB.byteLength.toString () + 
			//	' Prefix:' + Prefix + '! PStr=' + PStr + '.');


			let TPos;
			let SPos;
			let EndPos;
			let Name;
			let DBuf;
			let nBytes;

			while ((NPos = Prefix.indexOf(',', NPos)) > 0) {
				if ((SPos = Prefix.indexOf(':', ++NPos)) > 0) {
//					let NewFld = new PackField(Prefix.slice (Name,DBuf,Type);

					Type = Prefix[NPos];
					Name = Prefix.slice(NPos + 1, SPos);

					let NumStr = Prefix.slice(++SPos, SPos + 12);
					if ((EndPos = NumStr.indexOf(',')) >= 0)
						NumStr = NumStr.slice(0, EndPos);

					nBytes = Number(NumStr);

					// console.log (Type + Name +':Offset = ' + Offset.toString () + 
					// ' NumStr =' + NumStr + '. nBytes =' + nBytes.toString () );


					DBuf = AB.slice(Offset, Offset + nBytes);

					if (DBuf.byteLength !== nBytes) {
						console.log ('  !! DBuf bytes = ' + DBuf.byteLength.toString ());
						throw "LimitError!";
					}

					let NewFld = new PackField (Name,DBuf,Type);

					if ((NewFld.Name[0] >= '0') || !NewFld.Name) {
						this.Ds.push (NewFld);
					}
					else {
						this.Cs.push (NewFld);
					}

					//console.log('  BufIn C/D = ' + this.Cs.length.toString () + '/' +
					//	this.Ds.length.toString () + ' ' + NewFld.Desc());

					Offset += nBytes;	//	NewFld.Size, should be same!
					NPos = SPos;
				}
			}
		}

		clear() {
			this.Cs = [];
			this.Ds = [];
			this.Type1 = '';
			this.Details = '';
		}

		get multi () {
			if (this.Type1[0] === '*')
				return this.Ds.length;
			else return 0;
		}

/*		Unpack creates an array of BufPacks corresponding to the BufPacks
		that are packed in this single BufPack. Also strips out the */

		unpack () : BufPack[] {
			if (!this.multi)
				return [];

			let BPs = Array<BufPack> ();
			BPs.length = this.Ds.length;
			let count = 0;

			for (const F of this.Ds) {
					let NewBP = new BufPack ();
					NewBP.bufIn (F.AB);
					BPs[count++] = NewBP;
			}

			BPs.length = count;
			this.Type1 = this.Type1.slice (1);	// result is NOT a multipack...
			this.Ds.length = 0;

			return BPs;
		}

		/* Pack allows multiple BufPacks to be packed into a single BufPack,
		often to send to another client or server.  The array of BufPacks to
		pack is passed in	*/

		pack (BPs : BufPack[]) {
			let NewFields : PackField[] = [];
			NewFields.length = BPs.length;
			let count = 0;
			let newF : PackField;

			let limit = BPs.length;
			for (let i = 0; i < limit; ++i) {
				NewFields[count++] = new PackField ('',BPs[i]);
			}
			this.Ds = NewFields;

			if (this.Type1[0] !== '*')
				this.Type1 = '*' + this.Type1;

			//	console.log ('2.Type1 set to ' + this.Type1);
		}

		objectIn (O : Object) {
			this.clear ();
			
			// console.log ('ObjectIn:Adding entries!');

			let entries = Object.entries (O);
			let AddArray = Array(entries.length << 1);
			let count = 0;

			for (let entry of entries) {
				AddArray[count++] = entry[0];
				AddArray[count++] = entry[1];

				// console.log ('   AddArray[' + count.toString () + '] entry = ' + entry);
			}

			this.add (AddArray);
			// console.log ('ObjectIn Resultant BP:' + '\n' + this.Desc ());
		}

		objectOut () : Object {
			let o = new Object ();
			let Fields = this.Cs.concat (this.Ds);

			for (let F of Fields) {
				let N = F.Name;
				switch (F.Type) {
					case tNum : Object.assign (o,{ N : F.Num }); break;
					case tStr : Object.assign (o,{ N : F.Str }); break;
					case tPack : Object.assign (o, {N : F.Pack }); break;
					default : Object.assign (o,{ N : F.AB }); break;
				}
			}

			console.log ('New Object = ' + o);
			return o;
		}
	}

	export const NILPack = new BufPack ();

	export class SQL {
		buildQ (QBuf : BufPack) : any[] {
			// select, insert, update, delete
			console.log ('SQL buildQ QBuf=\n' + QBuf.desc);

			let Tile, qType = '', ID, QF;

			for (const C of QBuf.Cs) {
				switch (C.Name.toUpperCase ()) {
					case '!I' : case '!ID' : ID = C.Num; break;
					case '!Q' : QF = C; qType = C.Str; break;
					case '!T' : case 'TILE' : case 'TABLE' : Tile = C.Str; break;
				}
			}

			if (!QF) {
				QBuf.add (['!E','No Query!']);
				return [];
			}

			let qStr = '', vStr = '', Name;
			let Values = new Array (QBuf.Ds.length);	// long enough
			let nValues = 0;

			for (const F of QBuf.Ds)
			{
				Name = F.Name;
				if (qType === 'I') {
					qStr += Name + ',';
					vStr += '?,';
				}
				else {
					qStr += Name + '=?,';
				}

				switch (F.Type) {
					case tNum : Values[nValues++] = F.Num; break;
					case tStr : Values[nValues++] = F.Str; break;
					default : Values[nValues++] = new Int8Array (F.AB);
				}								
			}
			Values = Values.slice (0,nValues);

			console.log ('buildQ nValues = ' + nValues.toString ());


			switch (qType) {
				case 'S' : case 'D' :
					if (qType[0] === 'S')
						qStr = 'SELECT * FROM ' + Tile;
					else qStr = 'DELETE FROM ' + Tile;
					if (ID)
						qStr += ' WHERE id=' + ID.toString () + ';';
					else qStr += ';';
					break;

				case 'I' : case 'U' :
					if (qType === 'I') {
						qStr = 'INSERT INTO ' + Tile + ' (';
						vStr = ') VALUES(';		
						}
					else {
						qStr = 'UPDATE ' + Tile + ' SET '; vStr = '';
					}

					for (const F of QBuf.Ds)
					{
						Name = F.Name;
						if (qType === 'I') {
							qStr += Name + ',';
							vStr += '?,';
						}
						else {
							qStr += Name + '=?,';
						}
					}

					if (qType === 'I') {
						qStr = qStr.slice (0,qStr.length-1) + vStr.slice (0,vStr.length-1) + ');';
					}
					else {	// 'U'
						if (ID && nValues) {
							qStr = qStr.slice (0,qStr.length - 1) + 
									' WHERE id=' + ID.toString () + ';';
						}
						else {
							QBuf.add (['!E','ERROR:' + qType]);
							return [];
						}
					}
					break;

				default : return Values;	// leave QF.Str as IS, return Values
			}	// switch

			console.log ('buildQ, adding qStr = ' + qStr);
			QBuf.add (['!Q',qStr]);

			console.log ('BuildQ = ' + qStr + ' ' + Values.length.toString () + ' Values');
			vStr = '    QueryVals=';
			for (let i = Values.length; --i >= 0;) {
				let ValStr;
				switch (typeof (Values[i])) {
					case 'number' : ValStr = (Values[i] as number).toString (); break;
					case 'string' : ValStr = (Values[i] as string); break;
					default : ValStr = 'AB Bytes=' + (Values[i] as ArrayBuffer).toString ();
				}

				vStr += ValStr + '  '
			}

			console.log ('VSTR=' + vStr + '=');
			console.log ('Resulting BuildQ:\n' + QBuf.desc);

			return	Values;
		}	// BuildQ

		bSelDel (Tile : string, ID : number, Query : string) : BufPack {
			let Pack = new BufPack ();
			Pack.add (['!T', Tile, '!I', ID,'!Q',Query]);

			return Pack;
		}

		bInsUpd (Pack : BufPack) : BufPack {
			let ID = Pack.num ('!I');

			Pack.add (['!Q',ID ? 'U' : 'I']);
			return Pack;
		}

	}	// RS1

	export const sql = new SQL ();

	/*	Defines for vLists	*/

	// FM:FM="FM|Num|Int|Dollar|Ord|Range|Pair|Nums|Member|Set|Str|Strs|Upper|"
	export const FMDollar = 3,
		FMInt = 2,
		FMMember = 8,
		FMNum = 1,
		FMNums = 7,
		FMOrd = 4,
		FMPair = 6,
		FMRange = 5,
		FMSet = 9,
		FMStr = 10,
		FMStrs = 11,
		FMUpper = 12;
	// Ct:Country="Ct:Country|US:United States|UK:United Kingdom|Ca:Canada|Ru:Russia|In:India|"
	export const CtCa = 3,
		CtIn = 5,
		CtRu = 4,
		CtUK = 2,
		CtUS = 1;
	// Ct:ConnectType="Ct:ConnectType|Data|Event|Action|Queue|DB|SQL:SQLite|Remote|Retail|"
	export const CtAction = 3,
		CtDB = 5,
		CtData = 1,
		CtEvent = 2,
		CtQueue = 4,
		CtRemote = 7,
		CtRetail = 8,
		CtSQL = 6;
	// Lt:ListType="Lt:ListType|Dt:DataType|Ev:Event|Ac:Action|Rt:Return|Td:TileDef|Ts:TileSize|Pr:Process|Mt:MessageType|Lg:Language|"
	export const LtAc = 3,
		LtDt = 1,
		LtEv = 2,
		LtLg = 9,
		LtMt = 8,
		LtPr = 7,
		LtRt = 4,
		LtTd = 5,
		LtTs = 6;
	// Dt:DataType="Dt:DataType|String:Free format string|Integer:Whole Number|Number:Whole or Real Number|"
	export const DtString = 1,
		DtInteger = 2,
		DtNumber = 3;
	// Ev:Event="Ev:Event|Click|Enter|Exit|DblClick|Swipe|Drop|Drag|"
	export const EvClick = 1,
		EvDblClick = 4,
		EvDrag = 7,
		EvDrop = 6,
		EvEnter = 2,
		EvExit = 3,
		EvSwipe = 5;
	// Rt:Return="Rt:Return|Ok|Fail|Equal|Unequal|Queue|"
	export const RtEqual = 3,
		RtFail = 2,
		RtOk = 1,
		RtQueue = 5,
		RtUnequal = 4;
	// Td:TileDef="Td:TileDef|Tile|LnEdit|TxtEdit|Btn|Img|Video|"
	export const TdBtn = 4,
		TdImg = 5,
		TdLnEdit = 2,
		TdTile = 1,
		TdTxtEdit = 3,
		TdVideo = 6;
	// Ts:TileSize="Ts:TileSize|Fixed|T:Top|TL:Top Left|TR:Top Right|B:Bottom|BL:Bottom Left|BR:Bottom Right|L:Left|R:Right|SH:Shared|"
	export const TsB = 5,
		TsBL = 6,
		TsBR = 7,
		TsFixed = 1,
		TsL = 8,
		TsR = 9,
		TsSH = 10,
		TsT = 2,
		TsTL = 3,
		TsTR = 4;
	// Pr:Process="Pr:Process|Init|Read|Set|Clear|Default||"
	export const Pr = 6,
		PrClear = 4,
		PrDefault = 5,
		PrInit = 1,
		PrRead = 2,
		PrSet = 3;
	// Mt:MessageType="Mt:MessageType|Input|Output|Event|Trigger|Action|"
	export const MtAction = 5,
		MtEvent = 3,
		MtInput = 1,
		MtOutput = 2,
		MtTrigger = 4;
	// Ac:Action="Ac:Action|Init|Timer|Login|Logout|"
	export const AcInit = 1,
		AcLogin = 3,
		AcLogout = 4,
		AcTimer = 2;
	// Lg:Language="Lg:Language|En:English|Es:Espanol|Cn:Chinese|"
	export const LgCn = 3,
		LgEn = 1,
		LgEs = 2;
	// Test:Test="Test|NameF:~%12~First Name|XY:~P~XY Dim|Cost:~$~Dollar Price|"
	export const TestCost = 3,
		TestNameF = 1,
		TestXY = 2;
} // namespace RS1

/*  Documentation Names/Desc	___________________



List FM(FM)	FM|Num|Int|Dollar|Ord|Range|Pair|Nums|Member|Set|Str|Strs|Upper|
Dollar	Dollar	ID[Dollar]==3
Int	Int	ID[Int]==2
Member	Member	ID[Member]==8
Num	Num	ID[Num]==1
Nums	Nums	ID[Nums]==7
Ord	Ord	ID[Ord]==4
Pair	Pair	ID[Pair]==6
Range	Range	ID[Range]==5
Set	Set	ID[Set]==9
Str	Str	ID[Str]==10
Strs	Strs	ID[Strs]==11
Upper	Upper	ID[Upper]==12
NameList=|Num:1|Int:2|Dollar:3|Ord:4|Range:5|Pair:6|Nums:7|Member:8|Set:9|Str:10|Strs:11|Upper:12|	12


List Ft(Ft)	Ft|#:Num|I:Int|$:Dollar|P:Pair|O:Ord|A:Nums|%:Str|U:Upper|@:Member|R:Range|{:Set|
$	Dollar	ID[$]==3
I	Int	ID[I]==2
@	Member	ID[@]==9
#	Num	ID[#]==1
A	Nums	ID[A]==6
O	Ord	ID[O]==5
P	Pair	ID[P]==4
R	Range	ID[R]==10
{	Set	ID[{]==11
%	Str	ID[%]==7
U	Upper	ID[U]==8
NameList=|#:1|I:2|$:3|P:4|O:5|A:6|%:7|U:8|@:9|R:10|{:11|	11


List Ct(ConnectType)	Ct:ConnectType|Data|Event|Action|Queue|DB|SQL:SQLite|Remote|Retail|
Action	Action	ID[Action]==3
DB	DB	ID[DB]==5
Data	Data	ID[Data]==1
Event	Event	ID[Event]==2
Queue	Queue	ID[Queue]==4
Remote	Remote	ID[Remote]==7
Retail	Retail	ID[Retail]==8
SQL	SQLite	ID[SQL]==6
NameList=|Data:1|Event:2|Action:3|Queue:4|DB:5|SQL:6|Remote:7|Retail:8|	8


List Lt(ListType)	Lt:ListType|Dt:DataType|Ev:Event|Ac:Action|Rt:Return|Td:TileDef|Ts:TileSize|Pr:Process|Mt:MessageType|Lg:Language|
Ac	Action	ID[Ac]==3
Dt	DataType	ID[Dt]==1
Ev	Event	ID[Ev]==2
Lg	Language	ID[Lg]==9
Mt	MessageType	ID[Mt]==8
Pr	Process	ID[Pr]==7
Rt	Return	ID[Rt]==4
Td	TileDef	ID[Td]==5
Ts	TileSize	ID[Ts]==6
NameList=|Dt:1|Ev:2|Ac:3|Rt:4|Td:5|Ts:6|Pr:7|Mt:8|Lg:9|	9


List Dt(DataType)	Dt:DataType|String:Free format string|Integer:Whole Number|Number:Whole or Real Number|
String	Free format string	ID[String]==1
Integer	Whole Number	ID[Integer]==2
Number	Whole or Real Number	ID[Number]==3
NameList=|String:1|Integer:2|Number:3|	3


List Ev(Event)	Ev:Event|Click|Enter|Exit|DblClick|Swipe|Drop|Drag|
Click	Click	ID[Click]==1
DblClick	DblClick	ID[DblClick]==4
Drag	Drag	ID[Drag]==7
Drop	Drop	ID[Drop]==6
Enter	Enter	ID[Enter]==2
Exit	Exit	ID[Exit]==3
Swipe	Swipe	ID[Swipe]==5
NameList=|Click:1|Enter:2|Exit:3|DblClick:4|Swipe:5|Drop:6|Drag:7|	7


List Rt(Return)	Rt:Return|Ok|Fail|Equal|Unequal|Queue|
Equal	Equal	ID[Equal]==3
Fail	Fail	ID[Fail]==2
Ok	Ok	ID[Ok]==1
Queue	Queue	ID[Queue]==5
Unequal	Unequal	ID[Unequal]==4
NameList=|Ok:1|Fail:2|Equal:3|Unequal:4|Queue:5|	5


List Td(TileDef)	Td:TileDef|Tile|LnEdit|TxtEdit|Btn|Img|Video|
Btn	Btn	ID[Btn]==4
Img	Img	ID[Img]==5
LnEdit	LnEdit	ID[LnEdit]==2
Tile	Tile	ID[Tile]==1
TxtEdit	TxtEdit	ID[TxtEdit]==3
Video	Video	ID[Video]==6
NameList=|Tile:1|LnEdit:2|TxtEdit:3|Btn:4|Img:5|Video:6|	6


List Ts(TileSize)	Ts:TileSize|Fixed|T:Top|TL:Top Left|TR:Top Right|B:Bottom|BL:Bottom Left|BR:Bottom Right|L:Left|R:Right|SH:Shared|
B	Bottom	ID[B]==5
BL	Bottom Left	ID[BL]==6
BR	Bottom Right	ID[BR]==7
Fixed	Fixed	ID[Fixed]==1
L	Left	ID[L]==8
R	Right	ID[R]==9
SH	Shared	ID[SH]==10
T	Top	ID[T]==2
TL	Top Left	ID[TL]==3
TR	Top Right	ID[TR]==4
NameList=|Fixed:1|T:2|TL:3|TR:4|B:5|BL:6|BR:7|L:8|R:9|SH:10|	10


List Pr(Process)	Pr:Process|Init|Read|Set|Clear|Default|
Clear	Clear	ID[Clear]==4
Default	Default	ID[Default]==5
Init	Init	ID[Init]==1
Read	Read	ID[Read]==2
Set	Set	ID[Set]==3
NameList=|Init:1|Read:2|Set:3|Clear:4|Default:5|	5


List Mt(MessageType)	Mt:MessageType|Input|Output|Event|Trigger|Action|
Action	Action	ID[Action]==5
Event	Event	ID[Event]==3
Input	Input	ID[Input]==1
Output	Output	ID[Output]==2
Trigger	Trigger	ID[Trigger]==4
NameList=|Input:1|Output:2|Event:3|Trigger:4|Action:5|	5


List Ac(Action)	Ac:Action|Init|Timer|Login|Logout|
Init	Init	ID[Init]==1
Login	Login	ID[Login]==3
Logout	Logout	ID[Logout]==4
Timer	Timer	ID[Timer]==2
NameList=|Init:1|Timer:2|Login:3|Logout:4|	4


List Lg(Language)	Lg:Language|En:English|Es:Espanol|Cn:Chinese|
Cn	Chinese	ID[Cn]==3
En	English	ID[En]==1
Es	Espanol	ID[Es]==2
NameList=|En:1|Es:2|Cn:3|	3


List Cy(Country)	Cy:Country|US:United States|UK:United Kingdom|CA:Canada|RU:Russia|IN:India|
CA	Canada	ID[CA]==3
IN	India	ID[IN]==5
RU	Russia	ID[RU]==4
UK	United Kingdom	ID[UK]==2
US	United States	ID[US]==1
NameList=|US:1|UK:2|CA:3|RU:4|IN:5|	5


List Test(Test)	Test|NameF:~%12~First Name|XY:~P~XY Dim|Cost:~$~Dollar Price|
Cost	~$~Dollar Price	ID[Cost]==3
NameF	~%12~First Name	ID[NameF]==1
XY	~P~XY Dim	ID[XY]==2
NameList=|NameF:1|XY:2|Cost:3|	3

 Dump of LongList...
T	a|name:Full|	s|display:flex|flex-direction:column|align:center|justify:center|background:black|min-width:750px|max-width:750px|min-height:500px|	
 T	a|name:Top|	

 End of LongList Dump.  
LongList Name=T	a|name Desc=Full|	s|display:flex|flex-direction:column|align:center|justify:center|background:black|min-width:750px|max-width:750px|min-height:500px|	


T		1.level=0 parent=0 prev=0 next=11 first=2 last=10 #=10 TileID=T
		 List.Name=a=a|name:Full|
		 List.Name=s=s|display:flex|flex-direction:column|align:center|justify:center|background:black|min-width:750px|max-width:750px|min-height:500px|
 T		2.level=1 parent=1 prev=0 next=7 first=3 last=6 #=5 TileID=T
		 List.Name=a=a|name:Top|
		 List.Name=s=s|background:magenta|min-height:150px|
  T		3.level=2 parent=2 prev=0 next=6 first=4 last=5 #=3 TileID=T
		 List.Name=a=a|name:Left|
		 List.Name=s=s|background:green|min-width:100px|
   T		4.level=3 parent=3 prev=0 next=5 first=0 last=4 #=1 TileID=T
		 List.Name=a=a|name:Top|
		 List.Name=s=s|background:magenta|min-height:50px|
   T		5.level=3 parent=3 prev=4 next=0 first=0 last=5 #=1 TileID=T
		 List.Name=a=a|name:Bottom|
		 List.Name=s=s|background:magenta|min-height:100px|
  T		6.level=2 parent=2 prev=3 next=0 first=0 last=6 #=1 TileID=T
		 List.Name=a=a|name:Right|
		 List.Name=s=s|background:cyan|width:100%|display:flex|
 T		7.level=1 parent=1 prev=2 next=0 first=8 last=10 #=4 TileID=T
		 List.Name=a=a|name:Bottom|
		 List.Name=s=s|display:flex|flex-direction:row|background:white|min-height:350px|
  T		8.level=2 parent=7 prev=0 next=9 first=0 last=8 #=1 TileID=T
		 List.Name=a=a|name:Left|
		 List.Name=s=s|background:green|min-width:100px|
  T		9.level=2 parent=7 prev=8 next=10 first=0 last=9 #=1 TileID=T
		 List.Name=a=a|name:Middle|
		 List.Name=s=s|background:cyan|width:100%|display:flex|
  T		10.level=2 parent=7 prev=9 next=0 first=0 last=10 #=1 TileID=T
		 List.Name=a=a|name:Right|
		 List.Name=s=s|background:yellow|min-width:200px|
@NOLIST@	11.level=0 parent=0 prev=1 next=0 first=0 last=11 #=1 TileID=NONE

*/
