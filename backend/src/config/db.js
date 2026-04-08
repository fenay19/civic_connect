import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../../citizen_connect.db');

let dbInstance = null;

export const getDb = async () => {
    if (dbInstance) return dbInstance;

    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await initDb();
    return dbInstance;
};

const initDb = async () => {
    if (!dbInstance) return;

    // ---------- Core tables ----------
    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            identifier TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            telegram_chat_id TEXT UNIQUE,
            telegram_username TEXT,
            latitude REAL,
            longitude REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS complaints (
            id TEXT PRIMARY KEY,
            user_id INTEGER,
            text TEXT NOT NULL,
            language TEXT DEFAULT 'en',
            location TEXT,
            latitude REAL,
            longitude REAL,
            analysis TEXT,
            status TEXT DEFAULT 'pending',
            assigned_department TEXT,
            image TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    // ---------- Telegram polling tables ----------
    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS polls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            complaint_id TEXT NOT NULL,
            question TEXT NOT NULL,
            yes_count INTEGER DEFAULT 0,
            no_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (complaint_id) REFERENCES complaints(id)
        );
    `);

    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS poll_votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            poll_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            vote TEXT CHECK(vote IN ('yes','no')) NOT NULL,
            telegram_poll_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (poll_id) REFERENCES polls(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(poll_id, user_id)
        );
    `);

    // ---------- Safe migrations for existing databases ----------
    // Add new columns to existing tables if they don't exist yet
    const safeAddColumn = async (table, column, type) => {
        try {
            await dbInstance.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
            console.log(`  ✅ Added column ${table}.${column}`);
        } catch (e) {
            // Column already exists — ignore
        }
    };

    await safeAddColumn('users', 'telegram_chat_id', 'TEXT');
    await safeAddColumn('users', 'telegram_username', 'TEXT');
    await safeAddColumn('users', 'latitude', 'REAL');
    await safeAddColumn('users', 'longitude', 'REAL');
    await safeAddColumn('complaints', 'latitude', 'REAL');
    await safeAddColumn('complaints', 'longitude', 'REAL');
};
