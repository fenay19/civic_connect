import { getDb } from '../config/db.js';

export const registerUser = async (req, res) => {
    try {
        const { name, identifier, password } = req.body;
        
        if (!name || !identifier || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const db = await getDb();
        
        // Simple distinct identifier check
        const existing = await db.get('SELECT id FROM users WHERE identifier = ?', [identifier]);
        if (existing) {
            return res.status(400).json({ error: 'User already exists with this identifier' });
        }

        const result = await db.run(
            'INSERT INTO users (name, identifier, password) VALUES (?, ?, ?)',
            [name, identifier, password] // Skipping hashing for prototype simplicity
        );

        res.status(201).json({ success: true, userId: result.lastID });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        
        if (!identifier || !password) {
            return res.status(400).json({ error: 'Identifier and password are required' });
        }

        const db = await getDb();
        
        const user = await db.get(
            'SELECT id, name, identifier FROM users WHERE identifier = ? AND password = ?',
            [identifier, password]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};
