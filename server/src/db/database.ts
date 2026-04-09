import Database from 'better-sqlite3';

export function initDatabase(dbPath: string) {
  if (!dbPath) {
    throw new Error('DB_PATH is required but was not provided');
  }

  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      text       TEXT    NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const statements = {
    selectAll: db.prepare('SELECT * FROM todos ORDER BY created_at DESC, id DESC'),
    insertOne: db.prepare('INSERT INTO todos (text) VALUES (?) RETURNING *'),
    updateCompleted: db.prepare('UPDATE todos SET completed = ? WHERE id = ? RETURNING *'),
    deleteOne: db.prepare('DELETE FROM todos WHERE id = ?'),
  };

  return { db, statements };
}
