import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'web', 'src');
const DIST_HTML = path.join(ROOT, 'web', 'dist', 'index.html');
const PORT = Number(process.env.PORT || 5173);

build();

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  if (urlPath === '/' || urlPath === '/index.html') {
    try {
      const html = fs.readFileSync(DIST_HTML, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Derleme dosyası okunamadı: ' + err.message);
    }
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Bulunamadı');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Bloom geliştirme sunucusu hazır: http://127.0.0.1:${PORT}`);
  console.log('web/src/ içindeki değişiklikler otomatik olarak yeniden derlenir. Çıkmak için Ctrl+C.');
});

let timer = null;
const scheduleRebuild = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      build();
    } catch (err) {
      console.error('Yeniden derleme hatası:', err.message);
    }
  }, 120);
};

try {
  fs.watch(SRC_DIR, { recursive: true }, scheduleRebuild);
} catch {
  for (const sub of [SRC_DIR, path.join(SRC_DIR, 'styles'), path.join(SRC_DIR, 'js')]) {
    if (fs.existsSync(sub)) fs.watch(sub, scheduleRebuild);
  }
}
