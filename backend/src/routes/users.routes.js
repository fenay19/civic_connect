import express from 'express';
import { registerUser, loginUser, linkTelegram, getTelegramStatus, updateUserLocation, generateLinkToken, checkLinkToken } from '../controllers/users.controller.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/link-telegram', linkTelegram);
router.get('/:id/telegram-status', getTelegramStatus);
router.patch('/:id/location', updateUserLocation);

// Pre-registration Telegram linking
router.post('/telegram-token', generateLinkToken);
router.get('/telegram-token/:token', checkLinkToken);

export default router;
