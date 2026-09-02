import sharp from 'sharp';
const { data, info } = await sharp('Logo.webp').raw().toBuffer({ resolveWithObject: true });
const C = info.channels;
const px = (x, y) => { const i = (y * info.width + x) * C; return [data[i], data[i+1], data[i+2]]; };
const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();

// colour census, ignoring near-white
const tally = {};
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
  const c = px(x, y);
  if (c[0] > 235 && c[1] > 235 && c[2] > 235) continue;
  tally[hex(c)] = (tally[hex(c)] || 0) + 1;
}
console.log('dominant non-white colours:');
Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 8)
  .forEach(([k, v]) => console.log('   ' + k + '  x' + v));

// bounding box of pixels close to a target colour
const box = (target, tol) => {
  const t = [parseInt(target.slice(1,3),16), parseInt(target.slice(3,5),16), parseInt(target.slice(5,7),16)];
  let x0=1e9,y0=1e9,x1=-1,y1=-1,n=0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const c = px(x, y);
    if (Math.abs(c[0]-t[0])<tol && Math.abs(c[1]-t[1])<tol && Math.abs(c[2]-t[2])<tol) {
      n++; if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;
    }
  }
  return n ? { x0, y0, x1, y1, w: x1-x0+1, h: y1-y0+1, n } : null;
};
for (const [label, col] of [['gold "Bhu"', '#A08341'], ['blue dot', '#1A6590'], ['green "Van"', '#4F7A3A']]) {
  const b = box(col, 46);
  console.log(label.padEnd(13), b ? `x ${b.x0}-${b.x1}  y ${b.y0}-${b.y1}  (${b.w}x${b.h})  ${b.n}px` : 'not found');
}
// all ink (non-white) bbox, and ink excluding the sketch circle
let X0=1e9,Y0=1e9,X1=-1,Y1=-1;
for (let y=0;y<info.height;y++) for (let x=0;x<info.width;x++){
  const c=px(x,y); if(c[0]>235&&c[1]>235&&c[2]>235) continue;
  if(x<X0)X0=x; if(x>X1)X1=x; if(y<Y0)Y0=y; if(y>Y1)Y1=y;
}
console.log('all ink bbox :', `x ${X0}-${X1}  y ${Y0}-${Y1}`);
