import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

// DBファイルのパス（ユーザーデータディレクトリを使用）
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'clipboard.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// データベース接続（なければ作成）
const db = new Database(dbPath);

// テーブル初期化
db.prepare(`
  CREATE TABLE IF NOT EXISTS clips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_favorite INTEGER DEFAULT 0,
    is_snippet INTEGER DEFAULT 0,
    shortcut_key TEXT,
    is_enabled INTEGER DEFAULT 1
  )
`).run();

// 既存のテーブルに新しいカラムを追加（マイグレーション）
try {
  db.prepare(`ALTER TABLE clips ADD COLUMN is_favorite INTEGER DEFAULT 0`).run();
} catch (e) {
  // カラムが既に存在する場合はエラーを無視
}

try {
  db.prepare(`ALTER TABLE clips ADD COLUMN is_snippet INTEGER DEFAULT 0`).run();
} catch (e) {
  // カラムが既に存在する場合はエラーを無視
}

try {
  db.prepare(`ALTER TABLE clips ADD COLUMN shortcut_key TEXT`).run();
} catch (e) {
  // カラムが既に存在する場合はエラーを無視
}

try {
  db.prepare(`ALTER TABLE clips ADD COLUMN is_enabled INTEGER DEFAULT 1`).run();
} catch (e) {
  // カラムが既に存在する場合はエラーを無視
}

try {
  db.prepare(`ALTER TABLE clips ADD COLUMN snippet_name TEXT`).run();
} catch (e) {
  // カラムが既に存在する場合はエラーを無視
}

try {
  db.prepare(`ALTER TABLE clips ADD COLUMN is_history_hidden INTEGER DEFAULT 0`).run();
} catch (e) {
  // カラムが既に存在する場合はエラーを無視
}

// 最大保存件数（動的に変更可能）
let MAX_HISTORY_CLIPS = 50; // 履歴の上限
let MAX_FAVORITE_CLIPS = 100; // お気に入りの上限
const MAX_SNIPPET_CLIPS = 10; // スニペットの上限

/**
 * クリップボード履歴に追加（最大件数を超えたら古いデータを削除）
 */
export function addClip(content: string) {
  // 空のコンテンツやスペースのみの場合はスキップ
  if (!content || content.trim().length === 0) {
    console.log('Skipping empty content');
    return;
  }
  
  // 重複チェック：最新の履歴と同じ内容なら追加しない
  const lastClip = db.prepare(`
    SELECT content FROM clips 
    WHERE (is_snippet IS NULL OR is_snippet = 0) 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get() as { content: string } | undefined;
  
  if (lastClip && lastClip.content === content) {
    console.log('Skipping duplicate content:', content.substring(0, 50) + '...');
    return;
  }
  
  console.log('Adding new clip to database:', content.substring(0, 50) + '...');
  
  // 追加
  db.prepare(`INSERT INTO clips (content) VALUES (?)`).run(content);

  // 履歴アイテムのみの件数チェック（スニペットを除外）
  const count = db.prepare(`SELECT COUNT(*) AS cnt FROM clips WHERE (is_snippet IS NULL OR is_snippet = 0)`).get() as { cnt: number };
  // 件数が最大件数を超えたら古い履歴アイテムを削除する
  if (count.cnt > MAX_HISTORY_CLIPS) {
    const over = count.cnt - MAX_HISTORY_CLIPS;
    db.prepare(`
      DELETE FROM clips WHERE id IN (
        SELECT id FROM clips WHERE (is_snippet IS NULL OR is_snippet = 0) ORDER BY created_at ASC LIMIT ?
      )
    `).run(over); 
  }
}

/**
 * 新しいスニペットを作成（created_atを過去の日時に設定して履歴に混在させない）
 */
export function addSnippet(content: string, shortcutKey: string, snippetName?: string): boolean {
  console.log('addSnippet called with:', { content, shortcutKey, snippetName });
  
  // スニペット数の上限チェック
  const count = db.prepare(`SELECT COUNT(*) AS cnt FROM clips WHERE is_snippet = 1`).get() as { cnt: number };
  console.log('Current snippet count in DB:', count.cnt);
  
  if (count.cnt >= MAX_SNIPPET_CLIPS) {
    console.log('Snippet limit reached, cannot create');
    return false; // 上限に達している場合は作成しない
  }
  
  try {
    // スニペットは履歴に混在しないよう、作成日時を1970年に設定
    const stmt = db.prepare(`INSERT INTO clips (content, is_snippet, shortcut_key, snippet_name, is_enabled, created_at) VALUES (?, 1, ?, ?, 1, '1970-01-01 00:00:00')`);
    const result = stmt.run(content, shortcutKey, snippetName || null);
    console.log('Insert result:', result);
    console.log('Snippet created successfully');
    return true;
  } catch (error) {
    console.error('Error inserting snippet:', error);
    return false;
  }
}

/**
 * クリップを更新（お気に入り、スニペット状態など）
 */
export function updateClip(id: number, updates: { 
  content?: string,
  is_favorite?: boolean,
  is_snippet?: boolean,
  shortcut_key?: string,
  snippet_name?: string,
  is_enabled?: boolean
}): boolean {
  const fields = [];
  const values = [];
  
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.is_favorite !== undefined) {
    fields.push('is_favorite = ?');
    values.push(updates.is_favorite ? 1 : 0);
    
    // お気に入りに追加する場合、上限チェック
    if (updates.is_favorite) {
      cleanupOldFavorites();
    }
  }
  if (updates.is_snippet !== undefined) {
    // スニペット化する場合、上限チェック
    if (updates.is_snippet) {
      const count = db.prepare(`SELECT COUNT(*) AS cnt FROM clips WHERE is_snippet = 1 AND id != ?`).get(id) as { cnt: number };
      if (count.cnt >= MAX_SNIPPET_CLIPS) {
        return false; // 上限に達している場合は更新しない
      }
    }
    
    fields.push('is_snippet = ?');
    values.push(updates.is_snippet ? 1 : 0);
    
    // スニペット化する場合、created_atを過去の日時に変更して履歴から除外
    if (updates.is_snippet) {
      fields.push('created_at = ?');
      values.push('1970-01-01 00:00:00');
    }
  }
  if (updates.shortcut_key !== undefined) {
    fields.push('shortcut_key = ?');
    values.push(updates.shortcut_key);
  }
  if (updates.snippet_name !== undefined) {
    fields.push('snippet_name = ?');
    values.push(updates.snippet_name);
  }
  if (updates.is_enabled !== undefined) {
    fields.push('is_enabled = ?');
    values.push(updates.is_enabled ? 1 : 0);
  }
  
  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE clips SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
  return true;
}

/**
 * お気に入りが上限を超えた場合、古いお気に入りを解除（削除ではなく、is_favoriteをfalseに）
 */
function cleanupOldFavorites() {
  const count = db.prepare(`SELECT COUNT(*) AS cnt FROM clips WHERE is_favorite = 1`).get() as { cnt: number };
  if (count.cnt >= MAX_FAVORITE_CLIPS) {
    const over = count.cnt - MAX_FAVORITE_CLIPS + 1; // 新しいものを追加する分も考慮
    db.prepare(`
      UPDATE clips SET is_favorite = 0 
      WHERE id IN (
        SELECT id FROM clips WHERE is_favorite = 1 ORDER BY created_at ASC LIMIT ?
      )
    `).run(over);
  }
}

/**
 * 最新のクリップ履歴を取得（新しい順）- すべてのアイテム（履歴、お気に入り、スニペット）
 */
export function getRecentClips(limit = 50): { 
  id: number, 
  content: string, 
  created_at: string,
  is_favorite: number,
  is_snippet: number,
  shortcut_key: string | null,
  snippet_name: string | null,
  is_enabled: number
}[] {
  // スニペットを優先して取得し、その後履歴を取得
  const snippets = db.prepare(`SELECT * FROM clips WHERE is_snippet = 1 ORDER BY id DESC`).all();
  const historyLimit = Math.max(0, limit - snippets.length);
  const history = db.prepare(`
    SELECT * FROM clips 
    WHERE (is_snippet IS NULL OR is_snippet = 0) 
    ORDER BY created_at DESC LIMIT ?
  `).all(historyLimit);
  
  const result = [...snippets, ...history] as { 
    id: number, 
    content: string, 
    created_at: string,
    is_favorite: number,
    is_snippet: number,
    shortcut_key: string | null,
    snippet_name: string | null,
    is_enabled: number,
    is_history_hidden: number
  }[];
  
  console.log('getRecentClips result:', result.length, 'items');
  console.log('Snippets in result:', result.filter(r => r.is_snippet === 1).length);
  
  return result;
}

/**
 * クリップボード履歴のみを取得（スニペットを除外）
 */
export function getClipboardHistory(limit = 50): { 
  id: number, 
  content: string, 
  created_at: string,
  is_favorite: number,
  is_snippet: number,
  shortcut_key: string | null,
  snippet_name: string | null,
  is_enabled: number
}[] {
  return db.prepare(`SELECT * FROM clips WHERE (is_snippet IS NULL OR is_snippet = 0) ORDER BY created_at DESC LIMIT ?`).all(limit) as { 
    id: number, 
    content: string, 
    created_at: string,
    is_favorite: number,
    is_snippet: number,
    shortcut_key: string | null,
    snippet_name: string | null,
    is_enabled: number
  }[];
}

/**
 * スニペットのみを取得
 */
export function getSnippets(): { 
  id: number, 
  content: string, 
  created_at: string,
  is_favorite: number,
  is_snippet: number,
  shortcut_key: string | null,
  snippet_name: string | null,
  is_enabled: number
}[] {
  return db.prepare(`SELECT * FROM clips WHERE is_snippet = 1 ORDER BY created_at DESC`).all() as { 
    id: number, 
    content: string, 
    created_at: string,
    is_favorite: number,
    is_snippet: number,
    shortcut_key: string | null,
    snippet_name: string | null,
    is_enabled: number
  }[];
}

/**
 * 履歴タブに表示される全データを削除（スニペットのみ保持、お気に入りも削除）
 */
/**
 * 特定のアイテムを完全削除
 */
export function deleteClip(id: number): boolean {
  console.log('deleteClip called for id:', id);
  
  const result = db.prepare(`DELETE FROM clips WHERE id = ?`).run(id);
  
  console.log('Deleted', result.changes, 'clip(s)');
  return result.changes > 0;
}

/**
 * 履歴から隠す（お気に入りは保持）
 */
export function hideFromHistory(id: number): boolean {
  console.log('hideFromHistory called for id:', id);
  
  const result = db.prepare(`UPDATE clips SET is_history_hidden = 1 WHERE id = ?`).run(id);
  
  console.log('Hidden from history:', result.changes, 'clip(s)');
  return result.changes > 0;
}

export function clearAllHistory() {
  console.log('clearAllHistory called - clearing history tab');
  
  // お気に入りの場合は履歴から隠すだけ、通常のアイテムは完全削除
  const hideResult = db.prepare(`
    UPDATE clips SET is_history_hidden = 1 
    WHERE (is_snippet IS NULL OR is_snippet = 0) AND is_favorite = 1
  `).run();
  
  const deleteResult = db.prepare(`
    DELETE FROM clips 
    WHERE (is_snippet IS NULL OR is_snippet = 0) AND (is_favorite IS NULL OR is_favorite = 0)
  `).run();
  
  console.log('Hidden', hideResult.changes, 'favorite items from history');
  console.log('Deleted', deleteResult.changes, 'non-favorite history items');
  return hideResult.changes + deleteResult.changes;
}

/**
 * 履歴保存件数の上限を設定
 */
export function setHistoryLimit(limit: number) {
  MAX_HISTORY_CLIPS = limit;
  
  // 既存のデータが上限を超えている場合は削除
  const count = db.prepare(`SELECT COUNT(*) AS cnt FROM clips WHERE (is_snippet IS NULL OR is_snippet = 0)`).get() as { cnt: number };
  if (count.cnt > MAX_HISTORY_CLIPS) {
    const over = count.cnt - MAX_HISTORY_CLIPS;
    db.prepare(`
      DELETE FROM clips WHERE id IN (
        SELECT id FROM clips WHERE (is_snippet IS NULL OR is_snippet = 0) ORDER BY created_at ASC LIMIT ?
      )
    `).run(over);
  }
}

/**
 * お気に入り保存件数の上限を設定
 */
export function setFavoriteLimit(limit: number) {
  MAX_FAVORITE_CLIPS = limit;
  
  // 既存のデータが上限を超えている場合は解除
  const count = db.prepare(`SELECT COUNT(*) AS cnt FROM clips WHERE is_favorite = 1`).get() as { cnt: number };
  if (count.cnt > MAX_FAVORITE_CLIPS) {
    const over = count.cnt - MAX_FAVORITE_CLIPS;
    db.prepare(`
      UPDATE clips SET is_favorite = 0 
      WHERE id IN (
        SELECT id FROM clips WHERE is_favorite = 1 ORDER BY created_at ASC LIMIT ?
      )
    `).run(over);
  }
}
