const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

function authRoutes() {
    const router = express.Router();

    router.get('/google', passport.authenticate('google', { scope: ['profile'] }));
    router.get('/google/callback',
        passport.authenticate('google', { session: false }),
        (req, res) => {
            const token = jwt.sign(req.user.toJSON(), process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRATION || '1h',
            });
            res.json({ token });
        });

    router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
    router.get('/github/callback',
        passport.authenticate('github', { session: false }),
        (req, res) => {
            const token = jwt.sign(req.user.toJSON(), process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRATION || '1h',
            });
            res.json({ token });
        });

    return router;
}

module.exports = authRoutes;
