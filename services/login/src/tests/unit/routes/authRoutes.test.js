const request = require('supertest');
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authRoutes = require('routes/authRoutes');

// Mock passport and jwt
jest.mock('passport', () => ({
    initialize: jest.fn(() => (req, res, next) => next()),
    session: jest.fn(() => (req, res, next) => next()),
    authenticate: jest.fn((strategy, options, callback) => {
        // This is the middleware function that Express expects directly
        return (req, res, next) => {
            if (options && options.session === false) {
                // For callback routes, simulate authentication
                // Use a placeholder for req.user here, it will be replaced by the actual mockUser in beforeEach
                req.user = {}; 
                next(); // Proceed to the next middleware/route handler
            } else {
                // For initial auth routes, just call next
                // In a real app, this would trigger a redirect by Passport
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
        process.env = { ...originalProcessEnv, JWT_SECRET: 'test_jwt_secret', JWT_EXPIRATION: '1h' };

        app = express();
        
        passport.initialize.mockClear(); // Clear mocks before each test
        passport.session.mockClear();
        passport.authenticate.mockClear();

        passport.initialize.mockReturnValue((req, res, next) => next());
        passport.session.mockReturnValue((req, res, next) => next());

        app.use(passport.initialize());
        app.use(passport.session()); 
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

        // Re-implement passport.authenticate mock to use the mockUser from beforeEach
        passport.authenticate.mockImplementation((strategy, options, callback) => {
            return (req, res, next) => {
                if (options && options.session === false) {
                    req.user = mockUser; // Assign the mockUser from beforeEach
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

    it('should return a JWT token for Google callback', async () => {
        const response = await request(app).get('/auth/google/callback');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ token: 'mock_jwt_token' });
        expect(passport.authenticate).toHaveBeenCalledWith('google', { session: false });
        expect(mockUser.toJSON).toHaveBeenCalledTimes(1);
        expect(jwt.sign).toHaveBeenCalledWith(mockUser.toJSON(), 'test_jwt_secret', {
            expiresIn: '1h',
        });
    });

    it('should call passport.authenticate for GitHub authentication', async () => {
        await request(app).get('/auth/github');
        expect(passport.authenticate).toHaveBeenCalledWith('github', { scope: ['user:email'] });
    });

    it('should return a JWT token for GitHub callback', async () => {
        const response = await request(app).get('/auth/github/callback');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ token: 'mock_jwt_token' });
        expect(passport.authenticate).toHaveBeenCalledWith('github', { session: false });
        expect(mockUser.toJSON).toHaveBeenCalledTimes(1);
        expect(jwt.sign).toHaveBeenCalledWith(mockUser.toJSON(), 'test_jwt_secret', {
            expiresIn: '1h',
        });
    });

    it('should use default JWT_EXPIRATION if not set in env', async () => {
        delete process.env.JWT_EXPIRATION;
        const response = await request(app).get('/auth/google/callback');

        expect(response.statusCode).toBe(200);
        expect(jwt.sign).toHaveBeenCalledWith(mockUser.toJSON(), 'test_jwt_secret', {
            expiresIn: '1h',
        });
    });
});