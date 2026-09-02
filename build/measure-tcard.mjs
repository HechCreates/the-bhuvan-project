import sharp from 'sharp';
const f = 'testimonials/Testimonial Card Example.png';
const img = sharp(f);
const m = await img.metadata();
console.log('size', m.width, 'x', m.height, ' ratio', (m.width/m.height).toFixed(3));

const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const px = (x,y) => { const i=(y*info.width+x)*info.channels; return [data[i],data[i+1],data[i+2]]; };
const hex = c => '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();

console.log('ground (5,5)        ', hex(px(5,5)));
console.log('ground (mid-right)  ', hex(px(info.width-30, Math.round(info.height/2))));

// column profile: find left inset of content (first non-ground column)
const g = px(5,5);
const isG = c => Math.abs(c[0]-g[0])<10 && Math.abs(c[1]-g[1])<10 && Math.abs(c[2]-g[2])<10;
let colHas = new Array(info.width).fill(0), rowHas = new Array(info.height).fill(0);
for (let y=0;y<info.height;y+=2) for (let x=0;x<info.width;x+=2){ if(!isG(px(x,y))){colHas[x]++;rowHas[y]++;} }
const firstCol = colHas.findIndex(v=>v>0);
let lastCol=0; for(let x=0;x<info.width;x++) if(colHas[x]>0) lastCol=x;
const firstRow = rowHas.findIndex(v=>v>0);
let lastRow=0; for(let y=0;y<info.height;y++) if(rowHas[y]>0) lastRow=y;
console.log('content box  x:',firstCol,'->',lastCol,'  y:',firstRow,'->',lastRow);
console.log('pad left %', (firstCol/info.width*100).toFixed(2), ' right %', ((info.width-lastCol)/info.width*100).toFixed(2));
console.log('pad top %',  (firstRow/info.height*100).toFixed(2), ' bottom %', ((info.height-lastRow)/info.height*100).toFixed(2));

// vertical bands of text (gaps)
let bands=[], run=null;
for(let y=0;y<info.height;y++){ const on=rowHas[y]>0; if(on&&!run) run={a:y}; else if(!on&&run){run.b=y-1;bands.push(run);run=null;} }
if(run){run.b=info.height-1;bands.push(run);}
const merged=[]; for(const b of bands){ const l=merged[merged.length-1]; if(l && b.a-l.b < 30) l.b=b.b; else merged.push({...b}); }
console.log('\ntext bands (y0,y1,height, gap-from-prev):');
merged.forEach((b,i)=>console.log('  ',b.a, b.b, b.b-b.a+1, i?b.a-merged[i-1].b:'-'));

// sample colours inside each band
for (const b of merged){
  let best=null;
  for(let y=b.a;y<=b.b;y++) for(let x=firstCol;x<lastCol;x+=3){ const c=px(x,y); if(!isG(c)){ const lum=c[0]+c[1]+c[2]; if(!best||lum>best.l) best={l:lum,c}; } }
  console.log('band',b.a,'-',b.b,' brightest', hex(best.c));
}
