import sharp from 'sharp';
const { data, info } = await sharp('testimonials/Testimonial Card Example.png').raw().toBuffer({ resolveWithObject: true });
const px=(x,y)=>{const i=(y*info.width+x)*info.channels;return [data[i],data[i+1],data[i+2]];};
const hex=c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
const bands=[[570,910,'mark'],[1346,1594,'body l1'],[2918,3126,'name'],[3294,3464,'role']];
for(const [a,b,label] of bands){
  const h={};
  for(let y=a;y<=b;y++) for(let x=800;x<15800;x++){ const c=px(x,y); const k=hex(c); h[k]=(h[k]||0)+1; }
  const top=Object.entries(h).sort((p,q)=>q[1]-p[1]).slice(0,4);
  console.log(label.padEnd(9), top.map(([k,v])=>k+' x'+v).join('   '));
}
// x-height of body: measure a lowercase-only column run. Use word "was" region.
// find leftmost ink of line1 and its top/bottom for 'w' (no ascender/descender)
const g=[0x37,0x28,0x07]; const isG=c=>Math.abs(c[0]-g[0])<12&&Math.abs(c[1]-g[1])<12&&Math.abs(c[2]-g[2])<12;
let cols=[];
for(let x=800;x<16000;x++){ let top=-1,bot=-1; for(let y=1300;y<=1620;y++){ if(!isG(px(x,y))){ if(top<0)top=y; bot=y; } } cols.push([x,top,bot]); }
const ink=cols.filter(c=>c[1]>=0);
console.log('line1 ink x range', ink[0][0], ink[ink.length-1][0]);
const tops=ink.map(c=>c[1]), bots=ink.map(c=>c[2]);
console.log('line1 min top', Math.min(...tops), 'max bot', Math.max(...bots), '=> ink height', Math.max(...bots)-Math.min(...tops)+1);
