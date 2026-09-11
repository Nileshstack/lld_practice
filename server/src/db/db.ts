import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export const databasePath = path.resolve(process.env.DB_PATH || path.join(__dirname, '../../data.sqlite'));
const database = new Database(databasePath);
console.log(`[db] initialized database at ${databasePath}`);
const schemaPath = [
  path.join(__dirname, 'schema.sql'),
  path.join(__dirname, '../../src', 'db', 'schema.sql'),
  path.join(process.cwd(), 'src', 'db', 'schema.sql')
].find(fs.existsSync);

if (!schemaPath) {
  throw new Error('Database schema file was not found');
}

database.pragma('foreign_keys = ON');
database.pragma('journal_mode = WAL');
database.exec(fs.readFileSync(schemaPath, 'utf8'));
const attemptColumns = database.prepare('PRAGMA table_info(attempts)').all() as Array<{ name: string }>;
if (!attemptColumns.some((column) => column.name === 'error_message')) {
  database.exec('ALTER TABLE attempts ADD COLUMN error_message TEXT');
}
console.log('[db] schema initialized; startup seed can now run');

export default database;
