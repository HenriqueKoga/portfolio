const AuthService = require('application/authService');
const User = require('domain/user');

describe('AuthService', () => {
    let mockUserRepository;
    let authService;

    beforeEach(() => {
        mockUserRepository = {
            findByOauthId: jest.fn(),
            create: jest.fn(),
        };
        authService = new AuthService(mockUserRepository);
    });

    it('should find an existing user', async () => {
        const existingUser = new User('1', 'Test User', 'google', 'test@example.com');
        mockUserRepository.findByOauthId.mockResolvedValue(existingUser);

        const user = await authService.findOrCreateUser('oauth123', 'Test User', 'google', 'test@example.com');

        expect(mockUserRepository.findByOauthId).toHaveBeenCalledWith('oauth123', 'google');
        expect(mockUserRepository.create).not.toHaveBeenCalled();
        expect(user).toBe(existingUser);
    });

    it('should create a new user if not found', async () => {
        mockUserRepository.findByOauthId.mockResolvedValue(null);
        const newUser = new User('2', 'New User', 'github', 'new@example.com');
        mockUserRepository.create.mockResolvedValue(newUser);

        const user = await authService.findOrCreateUser('oauth456', 'New User', 'github', 'new@example.com');

        expect(mockUserRepository.findByOauthId).toHaveBeenCalledWith('oauth456', 'github');
        expect(mockUserRepository.create).toHaveBeenCalledWith({
            oauthId: 'oauth456',
            name: 'New User',
            provider: 'github',
            email: 'new@example.com',
        });
        expect(user).toBe(newUser);
    });
});
