// Copia al portapapeles el fragmento listo para GHL: npm run copiar -- home
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
const name = (process.argv[2] || 'home').replace(/.html$/, '');
const file = `dist/pages/${name}.html`;
if (!existsSync(file)) { console.error(`No existe ${file}. Ejecuta antes: npm run build`); process.exit(1); }
execFileSync('powershell', ['-NoProfile', '-Command', `Get-Content -Raw -Encoding UTF8 '${file}' | Set-Clipboard`]);
console.log(`✓ Copiado ${file} al portapapeles. Pégalo completo en el elemento Código de GHL.`);
