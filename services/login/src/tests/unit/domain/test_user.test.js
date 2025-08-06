const User = require('../../../domain/user');

describe('User Domain Model', () => {
    describe('Constructor', () => {
        test('should create a user with all required fields', () => {
            // Arrange
            const id = 'user123';
            const name = 'Test User';
            const provider = 'google';
            const email = 'test@example.com';
            const createdAt = new Date();

            // Act
            const user = new User(id, name, provider, email, createdAt);

            // Assert
            expect(user.id).toBe(id);
            expect(user.name).toBe(name);
            expect(user.provider).toBe(provider);
            expect(user.email).toBe(email);
            expect(user.createdAt).toBe(createdAt);
        });

        test('should create a user with default createdAt when not provided', () => {
            // Arrange
            const id = 'user123';
            const name = 'Test User';
            const provider = 'github';
            const email = 'test@github.com';

            // Act
            const user = new User(id, name, provider, email);

            // Assert
            expect(user.id).toBe(id);
            expect(user.name).toBe(name);
            expect(user.provider).toBe(provider);
            expect(user.email).toBe(email);
            expect(user.createdAt).toBeInstanceOf(Date);
        });
    });

    describe('toJSON', () => {
        test('should return user data without sensitive information', () => {
            // Arrange
            const user = new User('user123', 'Test User', 'google', 'test@example.com');

            // Act
            const json = user.toJSON();

            // Assert
            expect(json).toEqual({
                id: 'user123',
                name: 'Test User',
                provider: 'google',
                email: 'test@example.com'
            });
        });

        test('should not include createdAt in JSON output', () => {
            // Arrange
            const user = new User('user123', 'Test User', 'google', 'test@example.com');

            // Act
            const json = user.toJSON();

            // Assert
            expect(json).not.toHaveProperty('createdAt');
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty strings', () => {
            // Arrange & Act
            const user = new User('', '', '', '');

            // Assert
            expect(user.id).toBe('');
            expect(user.name).toBe('');
            expect(user.provider).toBe('');
            expect(user.email).toBe('');
        });

        test('should handle null values gracefully', () => {
            // Arrange & Act
            const user = new User(null, null, null, null);

            // Assert
            expect(user.id).toBeNull();
            expect(user.name).toBeNull();
            expect(user.provider).toBeNull();
            expect(user.email).toBeNull();
        });
    });
});
