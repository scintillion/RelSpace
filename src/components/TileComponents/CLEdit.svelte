<script lang='ts'>

/* from https://svelte.dev/repl/16b375da9b39417dae837b5006799cb4?version=3.25.0
  "Dynamically importing a component"  
import { onMount } from 'svelte';

let Thing;
  
  const sleep = ms => new Promise(f => setTimeout(f, ms));
  
  onMount(async () => {
      await sleep(1000); // simulate network delay
      Thing = (await import('./Thing.svelte')).default;

      
  });

<svelte:component this={Thing} answer={42}>
	<p>some slotted content</p>
</svelte:component>  
  
*/	
  

  import Button from './Span.svelte';

  import { RS1 } from "../../lib/vList"

  // import { DBKit }  from "../../lib/DBKit/Main"

  function DBTest () {
//    if (!kit)
  //      console.log ('KIT is NIL!');

    // kit.TestLine ();

    console.log ('DBTest!');
  }

function DumpLists () {
  console.log ('DumpLists...');

  RS1.LstEdit.MainList = document.querySelector ('#MainList') as HTMLSelectElement;
  RS1.LstEdit.DropList = document.querySelector ('#DropList') as HTMLSelectElement;
  RS1.LstEdit.ListSelect = document.querySelector ('#ListOfLists') as HTMLSelectElement;
  RS1.LstEdit.TileSelect = document.querySelector ('#ListOfTiles') as HTMLSelectElement;

  if (RS1.CL.LT  && RS1.LstEdit.MainList)
      RS1.CL.LT.ToSelect (RS1.LstEdit.MainList);
  if (RS1.CL.TD  &&  RS1.LstEdit.DropList)
      RS1.CL.TD.ToSelect (RS1.LstEdit.DropList);
  if (RS1.CL  &&  RS1.LstEdit.ListSelect)
      RS1.CL.ToSelect (RS1.LstEdit.ListSelect);



/*        LstEdit.NameEdit = document.querySelector ('#NameEdit');
        LstEdit.FormatEdit = document.querySelector ('#FormatEdit');
        LstEdit.ValueEdit = document.querySelector ('#ValueEdit');
        LstEdit.DescEdit = document.querySelector ('#DescEdit');
        LstEdit.ListSelect = document.querySelector ('#ListOfLists');
*/

  console.log ('Calling Defines!'); 
  RS1.CL.Defines ('Consts.ts');
  console.log ('DumpList!');
}
</script>

<div style="background-color: pink;" >
  <div class="topbox" style="background-color: yellow">
  <p> TopBox!</p>
  
  <p>MainList</p>
  <select id="MainList" name="list-box" style="width: 400px;">
      <option value="Value 1">Option 1</option>
      <option value="Value 2">Option 2</option>
      <option value="Value 3">Option 3</option>
      <option value="Value 4">Option 4</option>
  </select>

  <ul>
      <li>Coffee</li>
      <li>Tea</li>
      <li>Milk</li>
  </ul>
  <p>CLEdit: Hello, world!</p>
  <button>Back</button>

  <button on:click={() => DBTest ()}> DBTest</button>

  <button on:click={() => DumpLists ()}> DumpLists ()</button>

  <button on:click= {() => RS1.CL.Defines ('Constants.ts')}>Direct Defines (Constants.ts) call</button>

  </div>

  <div class="midbox" style="display: block-inline; max-width: 400px; max-height: 200px; background-color:lightblue">
      <p>Middle Box!</p>
      <div>
        <input type="submit" value="Submit">
      <input type="submit" value="Submit">
      <input type="submit" value="Submit">
      <input type="submit" value="Submit">
      </div>
      
      <div>
        <input type="submit" value="Submit">
        <input type="submit" value="Submit">
        <input type="submit" value="Submit">
        <input type="submit" value="Submit">
      </div>
  </div>
  <div class="lowbox" style='background-color: cyan; width:100%;'>
      <p> Lowbox</p>
    <form style="width: 100%;">
        <select id="DropList" name="cars" size=10 multiple style="width: 30%;"  >
          <option value="volvo">Volvo</option>
          <option value="saab">Saab</option>
          <option value="opel">Opel</option>
          <option value="audi">Audi</option>
        </select>

        <select id="ListOfLists" name="ListOfLists" size=10 style="width: 30%;">
          <option value="volvo">Volvo</option>
          <option value="saab">Saab</option>
          <option value="opel">Opel</option>
          <option value="audi">Audi</option>
        </select>

        <select id="ListOfTiles" name="ListOfTiles" size=10 style="width: 30%;">
          <option value="volvo">Volvo</option>
          <option value="saab">Saab</option>
          <option value="opel">Opel</option>
          <option value="audi">Audi</option>
        </select>

        
        <br><br>
        <input type="submit" value="Submit">
      </form>
      
  </div>
  </div>



<style lang="css">
div{
    display: flex;
    flex: 1;
    
    flex-direction: column;
    width: 100%;
    height: 100%;
}
button{
  width: 10px;
  max-width: 180px;
  min-width: 180px;
}
input{ width: 150px;}
form{
  flex: 1; flex-direction: column;
  width: 100%;
}

select{
  width: 400;
  flex: 1;
}

</style>