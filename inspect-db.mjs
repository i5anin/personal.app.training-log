import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';

const db = new Database(join(fileURLToPath(import.meta.url), '..', 'data', 'gym.db'));

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
for (const t of tables) {
  const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
  console.log(`\n[${t.name}]`, cols.map(c => `${c.name}:${c.type}`).join(', '));
}

const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all();
console.log('\nIndexes:', indexes.length ? indexes.map(i => i.name).join(', ') : 'none');
console.log('Journal mode:', db.pragma('journal_mode', { simple: true }));
console.log('Synchronous:', db.pragma('synchronous', { simple: true }));
console.log('Cache size:', db.pragma('cache_size', { simple: true }));
const pages = db.pragma('page_count', { simple: true });
const pageSize = db.pragma('page_size', { simple: true });
console.log('DB size:', Math.round(pages * pageSize / 1024) + ' KB');
db.close();
