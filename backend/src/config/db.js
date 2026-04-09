import { createClient } from '@libsql/client';

let dbInstance = null;
let client = null;

export const getDb = async () => {
    if (dbInstance) return dbInstance;

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment variables");
    }

    client = createClient({
        url,
        authToken,
    });

    dbInstance = {
        get: async (sql, params = []) => {
            const result = await client.execute({ sql, args: params });
            if (result.rows.length > 0) {
                return result.rows[0];
            }
            return undefined;
        },
        all: async (sql, params = []) => {
            const result = await client.execute({ sql, args: params });
            return result.rows;
        },
        run: async (sql, params = []) => {
            const result = await client.execute({ sql, args: params });
            return {
                lastID: result.lastInsertRowid !== undefined ? Number(result.lastInsertRowid) : undefined,
                changes: result.rowsAffected 
            };
        },
        exec: async (sql) => {
            try {
                await client.executeMultiple(sql);
            } catch (err) {
                // executeMultiple might fail on some ALTER TABLE commands in old libsql versions, fallback to execute
                await client.execute(sql);
            }
            return true;
        }
    };

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

    // ---------- Telegram conversation state (persisted for serverless) ----------
    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS telegram_conversations (
            chat_id TEXT PRIMARY KEY,
            step TEXT NOT NULL,
            data TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // ---------- Telegram link tokens (persisted for serverless) ----------
    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS telegram_link_tokens (
            token TEXT PRIMARY KEY,
            chat_id TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            username TEXT,
            linked_at INTEGER NOT NULL
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
