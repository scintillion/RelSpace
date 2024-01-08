import { RS1 } from '$lib/RS';

var Serial : number = 0;

async function ABRequest (AB : ArrayBuffer): Promise<ArrayBuffer> {
    
    // console.log ('AB sent by Client, bytes = ' + AB.byteLength.toString ());
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

    return response;
}

async function packRequest (BP : RS1.BufPack) : Promise<RS1.BufPack>{
  // console.log ('PackRequest Incoming = \n' + BP.Desc ());
  BP.add (['#',++Serial]);

  let AB = BP.bufOut ();
  console.log ('Sending Client Request #' + Serial.toString ());

  let recvAB = await RS1.ReqAB (AB);

  BP.bufIn (recvAB);

  console.log (' Received Server reply #' + BP.num ('#').toString ());

  return BP;
}

export function InitClient () {
    if (!RS1.ReqAB)
        RS1.InitReq (ABRequest,packRequest);
}

