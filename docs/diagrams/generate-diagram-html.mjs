import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function encodePlantUml(text) {
  const deflated = zlib.deflateRawSync(Buffer.from(text, 'utf8'));
  return deflated
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function buildHtml(title, subtitle, pumlPath, outPath) {
  const puml = fs.readFileSync(pumlPath, 'utf8');
  const encoded = encodePlantUml(puml);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; background: #f8fafc; font-family: "Segoe UI", sans-serif; }
    header { background: linear-gradient(135deg, #1e40af, #2563eb); color: #fff; padding: 18px 24px; }
    header h1 { margin: 0; font-size: 1.35rem; }
    header p { margin: 6px 0 0; opacity: 0.9; font-size: 0.95rem; }
    main { padding: 20px; text-align: center; }
    .note { max-width: 920px; margin: 0 auto 16px; padding: 12px 16px; background: #fffbeb;
      border-left: 4px solid #f59e0b; font-size: 0.9rem; text-align: left; line-height: 1.5; }
    img { max-width: 100%; height: auto; background: #fff; border: 1px solid #e2e8f0;
      border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    @media print { body { background: #fff; } .note { display: none; } }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <p>${subtitle}</p>
  </header>
  <main>
    <p class="note"><strong>Requires internet</strong> to render via Kroki. If the image does not appear, open the <code>.puml</code> file in VS Code with the PlantUML extension (Alt+D), or paste it into <a href="https://www.plantuml.com/plantuml/uml">plantuml.com</a>. Export with <strong>Ctrl+P</strong> → Save as PDF.</p>
    <img src="https://kroki.io/plantuml/svg/${encoded}" alt="${title}" />
  </main>
</body>
</html>`;
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('Wrote', outPath);
}

const diagrams = [
  ['IAMS Object Diagram', 'Tawanda Kamhamba R223985C | Sample runtime instances', 'IAMS_Object_Diagram.puml', 'IAMS_Object_Diagram.html'],
  ['IAMS Class Diagram', 'Tawanda Kamhamba R223985C | Updated class diagram', 'IAMS_Class_Diagram.puml', 'IAMS_Class_Diagram.html'],
];

for (const [title, subtitle, pumlFile, htmlFile] of diagrams) {
  buildHtml(title, subtitle, path.join(__dirname, pumlFile), path.join(__dirname, htmlFile));
}

const desktop = path.join(process.env.USERPROFILE || '', 'Desktop');
for (const [, , , htmlFile] of diagrams) {
  const src = path.join(__dirname, htmlFile);
  const dest = path.join(desktop, htmlFile);
  if (fs.existsSync(path.dirname(dest))) {
    fs.copyFileSync(src, dest);
    fs.copyFileSync(path.join(__dirname, htmlFile.replace('.html', '.puml')), path.join(desktop, htmlFile.replace('.html', '.puml')));
    console.log('Copied to Desktop:', htmlFile);
  }
}
