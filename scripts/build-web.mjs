import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
const output = new URL('../www/', import.meta.url);
await mkdir(output, { recursive: true });
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
await build({
  entryPoints: [new URL('../mobile/android.js', import.meta.url).pathname],
  outfile: new URL('android.js', output).pathname,
  bundle: true, format: 'iife', target: 'chrome89', minify: true,
});
await writeFile(new URL('index.html', output), html.replace('</body>', '<script src="android.js"></script></body>'));
console.log('Aplicação offline e integração Android preparadas em www/');
