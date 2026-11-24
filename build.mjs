import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const normLF = s => s.replace(/\r\n/g, '\n');

export function generateHtml(rootDir = ROOT) {
  const srcDir = path.join(rootDir, 'web', 'src');
  const templatePath = path.join(srcDir, 'template.html');
  const cssPath = path.join(srcDir, 'styles', 'main.css');
  const jsDir = path.join(srcDir, 'js');

  const template = normLF(fs.readFileSync(templatePath, 'utf8'));
  const css = normLF(fs.readFileSync(cssPath, 'utf8')).trimEnd();

  const jsFiles = fs
    .readdirSync(jsDir)
    .filter(f => f.endsWith('.js'))
    .sort((a, b) => a.localeCompare(b, 'en'));

  if (!jsFiles.length) {
    throw new Error('web/src/js/ içinde hiç .js modülü bulunamadı.');
  }

  const styleBlock = `<style>\n${css}\n</style>`;
  const scriptBlocks = jsFiles
    .map(f => {
      const code = normLF(fs.readFileSync(path.join(jsDir, f), 'utf8')).trimEnd();
      return `<script>\n${code}\n</script>`;
    })
    .join('\n');

  if (!template.includes('<!-- {{STYLES}} -->') || !template.includes('<!-- {{SCRIPTS}} -->')) {
    throw new Error('web/src/template.html içinde {{STYLES}} veya {{SCRIPTS}} yer tutucusu eksik.');
  }

  // Fonksiyon replacement kullanarak JS içindeki $& / $$ dizilerinin bozulmasını önle
  const out = template
    .replace('<!-- {{STYLES}} -->', () => styleBlock)
    .replace('<!-- {{SCRIPTS}} -->', () => scriptBlocks)
    .replace(/\n*$/, '\n');

  return { html: out, jsFiles };
}

export function build({ check = false, rootDir = ROOT } = {}) {
  const { html, jsFiles } = generateHtml(rootDir);
  const androidAsset = path.join(rootDir, 'app', 'src', 'main', 'assets', 'index.html');
  const distHtml = path.join(rootDir, 'web', 'dist', 'index.html');

  if (check) {
    if (!fs.existsSync(androidAsset)) {
      console.error('Hata: app/src/main/assets/index.html bulunamadı. Lütfen `npm run build` çalıştırın.');
      return { ok: false, stale: true };
    }
    const current = normLF(fs.readFileSync(androidAsset, 'utf8'));
    if (current !== html) {
      console.error('Hata: app/src/main/assets/index.html güncel değil!');
      console.error('web/src dosyalarında değişiklik yaptıktan sonra `npm run build` çalıştırıp sonucu commit edin.');
      return { ok: false, stale: true };
    }
    console.log(`Build kontrolü OK (${jsFiles.length} JS modülü, ${Buffer.byteLength(html, 'utf8')} bayt).`);
    return { ok: true, stale: false };
  }

  fs.mkdirSync(path.dirname(androidAsset), { recursive: true });
  fs.mkdirSync(path.dirname(distHtml), { recursive: true });
  fs.writeFileSync(androidAsset, html, 'utf8');
  fs.writeFileSync(distHtml, html, 'utf8');
  console.log(`Derlendi (${jsFiles.length} modül): app/src/main/assets/index.html & web/dist/index.html`);
  return { ok: true, stale: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const check = process.argv.includes('--check');
  const res = build({ check });
  if (!res.ok) process.exit(1);
}
