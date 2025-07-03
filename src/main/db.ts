import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

// DBファイルのパス
const dbPath = path.join(__dirname, '../../data/clipboard.db'); //
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// データベース接続（なければ作成）
const db = new Database(dbPath);

// テーブル初期化
db.prepare(`
  CREATE TABLE IF NOT EXISTS clips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// 最大保存件数
const MAX_CLIPS = 50;

/**
 * クリップボード履歴に追加（最大件数を超えたら古いデータを削除）
 */
export function addClip(content: string) {
  // 追加
  db.prepare(`INSERT INTO clips (content) VALUES (?)`).run(content);

  // 件数チェック → 古いもの削除
  const count = db.prepare(`SELECT COUNT(*) AS cnt FROM clips`).get() as { cnt: number };

  if (count.cnt > MAX_CLIPS) {
    const over = count.cnt - MAX_CLIPS;
    db.prepare(`
      DELETE FROM clips WHERE id IN (
        SELECT id FROM clips ORDER BY created_at ASC LIMIT ?
      )
    `).run(over);
  }
}

/**
 * 最新のクリップ履歴を取得（新しい順）
 */
export function getRecentClips(limit = 50): { id: number, content: string, created_at: string }[] {
  return db.prepare(`SELECT * FROM clips ORDER BY created_at DESC LIMIT ?`).all(limit) as { id: number, content: string, created_at: string }[];
}
