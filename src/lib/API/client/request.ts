import { RSLst } from '$lib/ConstList';

async function ABRequest (AB : ArrayBuffer): Promise<ArrayBuffer> {
    
    console.log ('AB sent by Client, bytes = ' + AB.byteLength.toString ());
    const req = await fetch(
        `/api/query`,
        {
            method: 'POST',
            body: AB,
            headers: {
                "Content-Type": "application/octet-stream",
            },
        }
    );
    const response = await req.arrayBuffer();

    console.log ('AB received by Client, bytes = ' + response.byteLength.toString ());
    return response;
}

async function packRequest (BP : RSLst.BufPack) : Promise<RSLst.BufPack>{
  console.log ('PackRequest Incoming = \n' + BP.Desc ());

  let AB = BP.BufOut ();
  console.log ('  CheckBuf Outgoing = ' + RSLst.ChkBuf (AB).toString ());

  AB = await RSLst.ReqAB (AB);

  console.log ('   CheckBuf Incoming = ' + RSLst.ChkBuf (AB).toString ());
  
  BP.BufIn (AB);

  return BP;
}

export function InitClient () {
    if (!RSLst.ReqAB)
        RSLst.InitReq (ABRequest,packRequest);
}

