import crypto from 'crypto';
import { getDb } from '../config/db.js';
import { linkTokens } from '../services/telegram.service.js';

export const registerUser = async (req, res) => {
    try {
        const { name, identifier, password, telegramChatId, telegramUsername } = req.body;
        
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
            'INSERT INTO users (name, identifier, password, telegram_chat_id, telegram_username) VALUES (?, ?, ?, ?, ?)',
            [name, identifier, password, telegramChatId || null, telegramUsername || null]
        );

        res.status(201).json({ success: true, userId: result.lastID, telegramLinked: !!telegramChatId });
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
            'SELECT id, name, identifier, telegram_chat_id, telegram_username FROM users WHERE identifier = ? AND password = ?',
            [identifier, password]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.status(200).json({ 
            success: true, 
            user: {
                ...user,
                telegramLinked: !!user.telegram_chat_id,
                telegramUsername: user.telegram_username,
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};

// Link Telegram account via deep link callback
export const linkTelegram = async (req, res) => {
    try {
        const { userId, telegramChatId, telegramUsername } = req.body;

        if (!userId || !telegramChatId) {
            return res.status(400).json({ error: 'userId and telegramChatId are required' });
        }

        const db = await getDb();

        const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if chat_id already linked to another user
        const existing = await db.get(
            'SELECT id FROM users WHERE telegram_chat_id = ? AND id != ?',
            [telegramChatId, userId]
        );
        if (existing) {
            return res.status(409).json({ error: 'This Telegram account is already linked to another user' });
        }

        await db.run(
            'UPDATE users SET telegram_chat_id = ?, telegram_username = ? WHERE id = ?',
            [telegramChatId, telegramUsername || null, userId]
        );

        res.json({ success: true, message: 'Telegram account linked successfully' });
    } catch (error) {
        console.error('Link Telegram error:', error);
        res.status(500).json({ error: 'Failed to link Telegram account' });
    }
};

// Check if a user has linked their Telegram account
export const getTelegramStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const db = await getDb();
        const user = await db.get(
            'SELECT telegram_chat_id, telegram_username FROM users WHERE id = ?',
            [id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            linked: !!user.telegram_chat_id,
            username: user.telegram_username || null,
        });
    } catch (error) {
        console.error('Telegram status error:', error);
        res.status(500).json({ error: 'Failed to check Telegram status' });
    }
};

// Update user location (lat/lng)
export const updateUserLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude } = req.body;

        if (latitude == null || longitude == null) {
            return res.status(400).json({ error: 'latitude and longitude are required' });
        }

        const db = await getDb();
        await db.run(
            'UPDATE users SET latitude = ?, longitude = ? WHERE id = ?',
            [latitude, longitude, id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
};

// Generate a unique token for pre-registration Telegram linking
export const generateLinkToken = async (req, res) => {
    try {
        const token = crypto.randomBytes(16).toString('hex');
        // Token will be stored by the bot when user clicks /start register_<token>
        res.json({ token });
    } catch (error) {
        console.error('Generate token error:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
};

// Check if a link token has been claimed by a Telegram user
export const checkLinkToken = async (req, res) => {
    try {
        const { token } = req.params;

        const data = linkTokens.get(token);
        if (!data) {
            return res.json({ linked: false });
        }

        res.json({
            linked: true,
            chatId: data.chatId,
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
        });
    } catch (error) {
        console.error('Check token error:', error);
        res.status(500).json({ error: 'Failed to check token' });
    }
};
