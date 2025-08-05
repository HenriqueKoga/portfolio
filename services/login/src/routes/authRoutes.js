const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

function authRoutes() {
    const router = express.Router();


    router.get('/google', passport.authenticate('google', { scope: ['profile'] }));
    router.get('/google/callback',
        passport.authenticate('google', { session: false }),
        (req, res) => {
            const accessToken = jwt.sign({
                ...req.user.toJSON(),
                type: 'access',
            }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRATION || '1h',
            });
            const refreshToken = jwt.sign({
                ...req.user.toJSON(),
                type: 'refresh',
            }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
            });
            res.redirect(`${process.env.AUTH_CALLBACK_URL}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}`);
        });


    router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
    router.get('/github/callback',
        passport.authenticate('github', { session: false }),
        (req, res) => {
            const accessToken = jwt.sign({
                ...req.user.toJSON(),
                type: 'access',
            }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRATION || '1h',
            });
            const refreshToken = jwt.sign({
                ...req.user.toJSON(),
                type: 'refresh',
            }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
            });
            res.redirect(`${process.env.AUTH_CALLBACK_URL}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}`);
        });
    // Rota para refresh token
    router.post('/refresh', async (req, res) => {
        const refreshToken = req.body.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token não informado.' });
        }
        try {
            // Validar o refresh token
            const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
            if (payload.type !== 'refresh') {
                return res.status(401).json({ error: 'Token não é um refresh token.' });
            }
            // Gerar novo access token
            const newAccessToken = jwt.sign({
                ...payload,
                type: 'access',
            }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRATION || '1h',
            });
            return res.json({ accessToken: newAccessToken });
        } catch (err) {
            return res.status(401).json({ error: 'Refresh token inválido ou expirado.' });
        }
    });

    return router;
}

module.exports = authRoutes;