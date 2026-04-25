import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const dir = join(fileURLToPath(import.meta.url), '..', 'data');

const workouts = JSON.parse(readFileSync(join(dir, 'workouts.json'), 'utf-8'));
const exercises = JSON.parse(readFileSync(join(dir, 'exercises.json'), 'utf-8'));
const muscleGroups = JSON.parse(readFileSync(join(dir, 'muscleGroups.json'), 'utf-8'));

const body = JSON.stringify({ workouts, exercises, muscleGroups });

const { request } = await import('http');
const req = request(
  { host: 'localhost', port: 3778, path: '/api/import', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
  (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      console.log(`✅ Импорт завершён: ${workouts.length} тренировок, ${exercises.length} упражнений, ${muscleGroups.length} групп мышц`);
      console.log('Ответ сервера:', data);
    });
  }
);
req.on('error', (e) => console.error('❌ Ошибка:', e.message));
req.write(body);
req.end();
