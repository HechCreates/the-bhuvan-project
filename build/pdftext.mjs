import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const ROOT = path.join(process.cwd(), 'Projects');
const OUT = path.join(process.cwd(), 'build', 'pdftext');
fs.mkdirSync(OUT, { recursive: true });

for (const dir of fs.readdirSync(ROOT, { withFileTypes: true }).filter(d => d.isDirectory())) {
  const folder = path.join(ROOT, dir.name);
  const pdfFile = fs.readdirSync(folder).find(f => f.toLowerCase().endsWith('.pdf'));
  console.log('#'.repeat(72));
  console.log('## ' + dir.name + '   [' + pdfFile + ']');
  if (!pdfFile) { console.log('   (no pdf)'); continue; }
  try {
    const parser = new PDFParse({ data: new Uint8Array(fs.readFileSync(path.join(folder, pdfFile))) });
    const res = await parser.getText();
    await parser.destroy?.();
    const text = (res.text || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
    fs.writeFileSync(path.join(OUT, dir.name.replace(/[^\w]/g, '_') + '.txt'), text);
    console.log(`## pages: ${res.total ?? res.numpages ?? '?'}   chars: ${text.length}`);
    console.log('');
    console.log(text.length ? text : '(NO TEXT LAYER - image-only PDF, needs OCR)');
  } catch (e) {
    console.log('   ERROR: ' + e.message);
  }
  console.log('');
}
