const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { MongoClient } = require('mongodb');

const { loadSecrets } = require('./infrastructure/vault');
const AuthService = require('./application/authService');
const MongoUserRepository = require('./infrastructure/MongoUserRepository');
const setupPassport = require('./infrastructure/PassportFactory');
const authRoutes = require('./routes/authRoutes');

const app = express();

(async () => {
    await loadSecrets();
    console.log("Login Service JWT_SECRET:", process.env.JWT_SECRET);
    const client = await MongoClient.connect(process.env.MONGO_URI);
    const db = client.db();

    const userRepository = new MongoUserRepository(db);
    const authService = new AuthService(userRepository);

    setupPassport(passport, authService);

    app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
    app.use(passport.initialize());

    app.use('/auth', authRoutes());

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Login service running on port ${PORT}`));
})();