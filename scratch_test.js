// scratch_test.js
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { join } from 'path';

const db = new sqlite3.Database('test_temp.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS collections (
    key TEXT,
    id TEXT,
    data TEXT,
    PRIMARY KEY (key, id)
  )`);
  
  db.run('BEGIN TRANSACTION');
  db.run('DELETE FROM collections');
  
  const stmt = db.prepare('INSERT INTO collections (key, id, data) VALUES (?, ?, ?)');
  let hasError = false;
  
  // Try inserting 20 mock items
  for (let i = 0; i < 20; i++) {
    stmt.run('test', `id_${i}`, JSON.stringify({ id: `id_${i}`, val: i }), (err) => {
      if (err) {
        hasError = true;
        console.error('Insert error:', err);
      }
    });
  }
  
  stmt.finalize((finalizeErr) => {
    if (finalizeErr || hasError) {
      db.run('ROLLBACK');
      console.log('Transaction Rollback due to finalizeErr/hasError');
      db.close();
    } else {
      db.run('COMMIT', (commitErr) => {
        if (commitErr) {
          console.error('Commit error:', commitErr);
        } else {
          console.log('Transaction COMMITTED successfully!');
          // Read data back
          db.all('SELECT COUNT(*) as count FROM collections', [], (readErr, rows) => {
            console.log('Number of rows saved:', rows[0].count);
            db.close();
            fs.unlinkSync('test_temp.sqlite');
          });
        }
      });
    }
  });
});
