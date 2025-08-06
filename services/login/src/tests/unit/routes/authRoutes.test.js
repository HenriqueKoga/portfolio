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
        expect(response.headers.location).toBe(`${process.env.AUTH_CALLBACK_URL}/auth/callback?token=mock_jwt_token&refreshToken=mock_jwt_token`);
        expect(passport.authenticate).toHaveBeenCalledWith('google', { session: false });
        expect(mockUser.toJSON).toHaveBeenCalledTimes(2);
        expect(jwt.sign).toHaveBeenNthCalledWith(1, expect.objectContaining({
            id: '123',
            name: 'Test User',
            provider: 'google',
            email: 'test@example.com',
            type: 'access',
        }), 'test_jwt_secret', { expiresIn: '1h' });
        expect(jwt.sign).toHaveBeenNthCalledWith(2, expect.objectContaining({
            id: '123',
            name: 'Test User',
            provider: 'google',
            email: 'test@example.com',
            type: 'refresh',
        }), 'test_jwt_secret', { expiresIn: '7d' });
    });

    it('should redirect with JWT token for GitHub callback', async () => {
        const response = await request(app).get('/auth/github/callback');

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe(`${process.env.AUTH_CALLBACK_URL}/auth/callback?token=mock_jwt_token&refreshToken=mock_jwt_token`);
        expect(passport.authenticate).toHaveBeenCalledWith('github', { session: false });
        expect(mockUser.toJSON).toHaveBeenCalledTimes(2);
        expect(jwt.sign).toHaveBeenNthCalledWith(1, expect.objectContaining({
            id: '123',
            name: 'Test User',
            provider: 'google',
            email: 'test@example.com',
            type: 'access',
        }), 'test_jwt_secret', { expiresIn: '1h' });
        expect(jwt.sign).toHaveBeenNthCalledWith(2, expect.objectContaining({
            id: '123',
            name: 'Test User',
            provider: 'google',
            email: 'test@example.com',
            type: 'refresh',
        }), 'test_jwt_secret', { expiresIn: '7d' });
    });

    it('should use default JWT_EXPIRATION if not set in env', async () => {
        delete process.env.JWT_EXPIRATION;
        const response = await request(app).get('/auth/google/callback');

        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe(`${process.env.AUTH_CALLBACK_URL}/auth/callback?token=mock_jwt_token&refreshToken=mock_jwt_token`);
        expect(jwt.sign).toHaveBeenNthCalledWith(1, expect.objectContaining({
            id: '123',
            name: 'Test User',
            provider: 'google',
            email: 'test@example.com',
            type: 'access',
        }), 'test_jwt_secret', { expiresIn: '1h' });
        expect(jwt.sign).toHaveBeenNthCalledWith(2, expect.objectContaining({
            id: '123',
            name: 'Test User',
            provider: 'google',
            email: 'test@example.com',
            type: 'refresh',
        }), 'test_jwt_secret', { expiresIn: '7d' });
    });

    // Testes para a rota /me
    describe('GET /auth/me', () => {
        it('should return user info with valid token', async () => {
            const mockUserData = {
                id: '123',
                name: 'Test User',
                email: 'test@example.com',
                oauthId: 'oauth123',
                provider: 'google',
                type: 'access'
            };

            jwt.verify.mockReturnValue(mockUserData);

            const response = await request(app)
                .get('/auth/me')
                .set('Authorization', 'Bearer valid_token')
                .expect(200);

            expect(response.body).toEqual({
                id: '123',
                name: 'Test User',
                email: 'test@example.com',
                oauthId: 'oauth123',
                provider: 'google'
            });
        });

        it('should return 401 if no token provided', async () => {
            const response = await request(app)
                .get('/auth/me')
                .expect(401);

            expect(response.body).toEqual({
                error: 'Token não fornecido'
            });
        });

        it('should return 401 if token is invalid', async () => {
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const response = await request(app)
                .get('/auth/me')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);

            expect(response.body).toEqual({
                error: 'Token inválido ou expirado'
            });
        });

        it('should return 401 if token is not access type', async () => {
            jwt.verify.mockReturnValue({
                id: '123',
                name: 'Test User',
                type: 'refresh' // Token de refresh, não access
            });

            const response = await request(app)
                .get('/auth/me')
                .set('Authorization', 'Bearer refresh_token')
                .expect(401);

            expect(response.body).toEqual({
                error: 'Token inválido'
            });
        });

        it('should return 401 if authorization header format is invalid', async () => {
            const response = await request(app)
                .get('/auth/me')
                .set('Authorization', 'InvalidFormat token')
                .expect(401);

            expect(response.body).toEqual({
                error: 'Token não fornecido'
            });
        });
    });
});
