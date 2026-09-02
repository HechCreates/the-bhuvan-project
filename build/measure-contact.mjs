import sharp from 'sharp';
const W=649, H=898;
const { data, info } = await sharp('Contact Us.svg',{density:200}).raw().toBuffer({resolveWithObject:true});
const sc = info.width/W;
const px=(x,y)=>{const i=(y*info.width+x)*info.channels;return [data[i],data[i+1],data[i+2]];};
const hex=c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
console.log('raster',info.width+'x'+info.height,'scale',sc.toFixed(3));
console.log('ground', hex(px(5,5)), ' field', hex(px(Math.round(300*sc),Math.round(300*sc))), ' button', hex(px(Math.round(324*sc),Math.round(768*sc))));
const g=px(5,5); const isG=c=>Math.abs(c[0]-g[0])<8&&Math.abs(c[1]-g[1])<8&&Math.abs(c[2]-g[2])<8;
// only look at text zones (exclude the field/button rects)
const zones=[[80,260],[680,740],[800,898]];
for(const [a,b] of zones){
  const y0=Math.round(a*sc), y1=Math.round(b*sc);
  const rowHas=new Array(info.height).fill(0);
  let minX=1e9,maxX=0;
  for(let y=y0;y<y1;y++) for(let x=0;x<info.width;x++){ if(!isG(px(x,y))){rowHas[y]++; if(x<minX)minX=x; if(x>maxX)maxX=x;} }
  const bands=[];let run=null;
  for(let y=y0;y<y1;y++){const on=rowHas[y]>0; if(on&&!run)run={a:y}; else if(!on&&run){run.b=y-1;bands.push(run);run=null;}}
  if(run){run.b=y1-1;bands.push(run);}
  console.log(`\nzone ${a}-${b}  inkX ${(minX/sc).toFixed(1)} -> ${(maxX/sc).toFixed(1)}`);
  bands.forEach((z,i)=>console.log(`   band ${(z.a/sc).toFixed(1)} - ${(z.b/sc).toFixed(1)}  h ${((z.b-z.a+1)/sc).toFixed(1)}  gapPrev ${i?((z.a-bands[i-1].b)/sc).toFixed(1):'-'}`));
}
// placeholder text inside the fields
for(const [name,ry,rh] of [['Name',275,59],['Email',395,59],['Message',515,164]]){
  const y0=Math.round((ry+2)*sc), y1=Math.round((ry+rh-2)*sc);
  const f=px(Math.round(500*sc), Math.round((ry+rh/2)*sc));
  const isF=c=>Math.abs(c[0]-f[0])<10&&Math.abs(c[1]-f[1])<10&&Math.abs(c[2]-f[2])<10;
  let top=1e9,bot=0,minX=1e9,maxX=0;
  for(let y=y0;y<y1;y++) for(let x=Math.round(50*sc);x<Math.round(580*sc);x++){const c=px(x,y); if(!isF(c)&&!isG(c)){ if(y<top)top=y; if(y>bot)bot=y; if(x<minX)minX=x; if(x>maxX)maxX=x; }}
  console.log(`${name.padEnd(8)} field ${ry}..${ry+rh}  ink y ${(top/sc).toFixed(1)}-${(bot/sc).toFixed(1)} h ${((bot-top+1)/sc).toFixed(1)}  x ${(minX/sc).toFixed(1)}  insetLeft ${((minX/sc)-46).toFixed(1)}  insetTop ${((top/sc)-ry).toFixed(1)}`);
}
// button label
{
  const y0=Math.round(739*sc),y1=Math.round(797*sc);
  const b=px(Math.round(180*sc),Math.round(768*sc));
  const isB=c=>Math.abs(c[0]-b[0])<10&&Math.abs(c[1]-b[1])<10&&Math.abs(c[2]-b[2])<10;
  let top=1e9,bot=0,minX=1e9,maxX=0;
  for(let y=y0;y<y1;y++) for(let x=Math.round(166*sc);x<Math.round(483*sc);x++){const c=px(x,y); if(!isB(c)){ if(y<top)top=y; if(y>bot)bot=y; if(x<minX)minX=x; if(x>maxX)maxX=x; }}
  console.log(`button label ink y ${(top/sc).toFixed(1)}-${(bot/sc).toFixed(1)} h ${((bot-top+1)/sc).toFixed(1)}  x ${(minX/sc).toFixed(1)}-${(maxX/sc).toFixed(1)}  color ${hex(px(Math.round((minX+maxX)/2),Math.round((top+bot)/2)))}`);
}
