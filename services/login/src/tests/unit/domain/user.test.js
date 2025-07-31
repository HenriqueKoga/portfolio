const User = require('domain/user');

describe('User', () => {
    it('should create a user with all provided properties', () => {
        const now = new Date();
        const user = new User('123', 'Test User', 'google', 'test@example.com', now);
        expect(user.id).toBe('123');
        expect(user.name).toBe('Test User');
        expect(user.provider).toBe('google');
        expect(user.email).toBe('test@example.com');
        expect(user.createdAt).toBe(now);
    });

    it('should create a user with a default createdAt date if not provided', () => {
        const user = new User('456', 'Another User', 'github', 'another@example.com');
        expect(user.id).toBe('456');
        expect(user.name).toBe('Another User');
        expect(user.provider).toBe('github');
        expect(user.email).toBe('another@example.com');
        expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should return a JSON representation without createdAt', () => {
        const now = new Date();
        const user = new User('789', 'JSON User', 'google', 'json@example.com', now);
        const json = user.toJSON();
        expect(json).toEqual({
            id: '789',
            name: 'JSON User',
            provider: 'google',
            email: 'json@example.com',
        });
        expect(json.createdAt).toBeUndefined();
    });
});
