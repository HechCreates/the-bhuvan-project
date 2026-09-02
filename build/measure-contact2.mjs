import sharp from 'sharp';
const W=649;
const { data, info } = await sharp('Contact Us.svg',{density:200}).raw().toBuffer({resolveWithObject:true});
const sc=info.width/W;
const px=(x,y)=>{const i=(y*info.width+x)*info.channels;return [data[i],data[i+1],data[i+2]];};
const near=(c,d,t=14)=>Math.abs(c[0]-d[0])<t&&Math.abs(c[1]-d[1])<t&&Math.abs(c[2]-d[2])<t;
const FIELD=[0x58,0x4c,0x39], BTN=[0xb4,0x6f,0x3a];
for(const [name,rx,ry,rw,rh] of [['Name',46,275,538,59],['Email',46,395,538,59],['Message',46,515,538,164]]){
  const x0=Math.round((rx+8)*sc), x1=Math.round((rx+rw-8)*sc), y0=Math.round((ry+6)*sc), y1=Math.round((ry+rh-6)*sc);
  let top=1e9,bot=0,minX=1e9,maxX=0;
  for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){ if(!near(px(x,y),FIELD)){ if(y<top)top=y; if(y>bot)bot=y; if(x<minX)minX=x; if(x>maxX)maxX=x; } }
  console.log(name.padEnd(8),'ink y', (top/sc).toFixed(1),'-',(bot/sc).toFixed(1),' h',((bot-top+1)/sc).toFixed(1),
    ' x',(minX/sc).toFixed(1),'-',(maxX/sc).toFixed(1),
    ' padL',((minX/sc)-rx).toFixed(1), ' capTopFromFieldTop',((top/sc)-ry).toFixed(1),
    ' baselineToFieldBottom',(ry+rh-(bot/sc)).toFixed(1));
}
{
  const x0=Math.round(175*sc),x1=Math.round(475*sc),y0=Math.round(745*sc),y1=Math.round(792*sc);
  let top=1e9,bot=0,minX=1e9,maxX=0;
  for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){ if(!near(px(x,y),BTN)){ if(y<top)top=y; if(y>bot)bot=y; if(x<minX)minX=x; if(x>maxX)maxX=x; } }
  console.log('SendMsg  ink y',(top/sc).toFixed(1),'-',(bot/sc).toFixed(1),' h',((bot-top+1)/sc).toFixed(1),
    ' x',(minX/sc).toFixed(1),'-',(maxX/sc).toFixed(1),' width',((maxX-minX)/sc).toFixed(1));
}
{ // footnote
  const g=px(5,5);
  const y0=Math.round(815*sc),y1=Math.round(855*sc);
  let top=1e9,bot=0,minX=1e9,maxX=0;
  for(let y=y0;y<y1;y++) for(let x=0;x<info.width;x++){ if(!near(px(x,y),g,8)){ if(y<top)top=y; if(y>bot)bot=y; if(x<minX)minX=x; if(x>maxX)maxX=x; } }
  console.log('footnote ink y',(top/sc).toFixed(1),'-',(bot/sc).toFixed(1),' h',((bot-top+1)/sc).toFixed(1),
    ' x',(minX/sc).toFixed(1),'-',(maxX/sc).toFixed(1),' width',((maxX-minX)/sc).toFixed(1),
    ' centre',(((minX+maxX)/2)/sc).toFixed(1));
}
{ // title + para ink widths per line
  const g=px(5,5);
  for(const [label,a,b] of [['title',81,104],['p1',137,157],['p2',163,182],['p3',187,207],['p4',213,232]]){
    let minX=1e9,maxX=0;
    for(let y=Math.round(a*sc);y<=Math.round(b*sc);y++) for(let x=0;x<info.width;x++){ if(!near(px(x,y),g,8)){ if(x<minX)minX=x; if(x>maxX)maxX=x; } }
    console.log(label.padEnd(6),'x',(minX/sc).toFixed(1),'-',(maxX/sc).toFixed(1),' width',((maxX-minX)/sc).toFixed(1));
  }
}
