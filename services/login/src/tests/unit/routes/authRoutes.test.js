const request = require('supertest');
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authRoutes = require('routes/authRoutes');

jest.mock('passport', () => ({
    initialize: jest.fn(() => (req, res, next) => next()),
    session: jest.fn(() => (req, res, next) => next()),
    authenticate: jest.fn((strategy, options, callback) => {
        return (req, res, next) => {
            if (options && options.session === false) {
                req.user = {}; 
                next(); // Proceed to the next middleware/route handler
            } else {
                next();
            }
        };
    }),
}));
jest.mock('jsonwebtoken');

describe('authRoutes', () => {
    let app;
    let mockUser;
    let originalProcessEnv;

    beforeEach(() => {
        originalProcessEnv = process.env;
        process.env = { 
            ...originalProcessEnv, 
            JWT_SECRET: 'test_jwt_secret', 
            JWT_EXPIRATION: '1h',
            AUTH_CALLBACK_URL: 'http://localhost'
        };

        app = express();
        
        passport.initialize.mockClear();
        passport.session.mockClear();
        passport.authenticate.mockClear();

        passport.initialize.mockReturnValue((req, res, next) => next());
        passport.session.mockReturnValue((req, res, next) => next());

        app.use(passport.initialize());
        app.use(passport.session()); 
        
        process.env.AUTH_CALLBACK_URL = 'http://localhost';
        app.use('/auth', authRoutes());

        mockUser = {
            id: '123',
            name: 'Test User',
            provider: 'google',
            email: 'test@example.com',
            toJSON: jest.fn().mockReturnValue({
                id: '123',
                name: 'Test User',
                provider: 'google',
                email: 'test@example.com',
            }),
        };

        passport.authenticate.mockImplementation((strategy, options, callback) => {
            return (req, res, next) => {
                if (options && options.session === false) {
                    req.user = mockUser;
                }
                next();
            };
        });

        jwt.sign.mockReturnValue('mock_jwt_token');
    });

    afterEach(() => {
        process.env = originalProcessEnv;
        jest.clearAllMocks();
    });

    it('should call passport.authenticate for Google authentication', async () => {
        await request(app).get('/auth/google');
        expect(passport.authenticate).toHaveBeenCalledWith('google', { scope: ['profile'] });
    });

    it('should redirect with JWT token for Google callback', async () => {
        const response = await request(app).get('/auth/google/callback');

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe(`${process.env.AUTH_CALLBACK_URL}/auth/callback?token=mock_jwt_token`);
        expect(passport.authenticate).toHaveBeenCalledWith('google', { session: false });
        expect(mockUser.toJSON).toHaveBeenCalledTimes(1);
        expect(jwt.sign).toHaveBeenCalledWith(mockUser.toJSON(), 'test_jwt_secret', {
            expiresIn: '1h',
        });
    });

    it('should redirect with JWT token for GitHub callback', async () => {
        const response = await request(app).get('/auth/github/callback');

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe(`${process.env.AUTH_CALLBACK_URL}/auth/callback?token=mock_jwt_token`);
        expect(passport.authenticate).toHaveBeenCalledWith('github', { session: false });
        expect(mockUser.toJSON).toHaveBeenCalledTimes(1);
        expect(jwt.sign).toHaveBeenCalledWith(mockUser.toJSON(), 'test_jwt_secret', {
            expiresIn: '1h',
        });
    });

    it('should use default JWT_EXPIRATION if not set in env', async () => {
        delete process.env.JWT_EXPIRATION;
        const response = await request(app).get('/auth/google/callback');

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe(`${process.env.AUTH_CALLBACK_URL}/auth/callback?token=mock_jwt_token`);
        expect(jwt.sign).toHaveBeenCalledWith(mockUser.toJSON(), 'test_jwt_secret', {
            expiresIn: '1h',
        });
    });
});
