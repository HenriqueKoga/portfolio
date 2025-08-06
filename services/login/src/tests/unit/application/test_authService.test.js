const AuthService = require('../../../application/authService');

describe('AuthService', () => {
    let authService;
    let mockUserRepository;

    beforeEach(() => {
        // Setup mock repository
        mockUserRepository = {
            findByOauthId: jest.fn(),
            create: jest.fn()
        };

        authService = new AuthService(mockUserRepository);
    });

    describe('findOrCreateUser', () => {
        const oauthId = 'oauth123';
        const name = 'Test User';
        const provider = 'google';
        const email = 'test@example.com';

        test('should return existing user when found', async () => {
            // Arrange
            const existingUser = {
                id: 'user123',
                name: 'Test User',
                provider: 'google',
                email: 'test@example.com'
            };
            mockUserRepository.findByOauthId.mockResolvedValue(existingUser);

            // Act
            const result = await authService.findOrCreateUser(oauthId, name, provider, email);

            // Assert
            expect(result).toBe(existingUser);
            expect(mockUserRepository.findByOauthId).toHaveBeenCalledWith(oauthId, provider);
            expect(mockUserRepository.create).not.toHaveBeenCalled();
        });

        test('should create new user when not found', async () => {
            // Arrange
            const newUser = {
                id: 'user456',
                name: 'Test User',
                provider: 'google',
                email: 'test@example.com'
            };
            mockUserRepository.findByOauthId.mockResolvedValue(null);
            mockUserRepository.create.mockResolvedValue(newUser);

            // Act
            const result = await authService.findOrCreateUser(oauthId, name, provider, email);

            // Assert
            expect(result).toBe(newUser);
            expect(mockUserRepository.findByOauthId).toHaveBeenCalledWith(oauthId, provider);
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                oauthId,
                name,
                provider,
                email
            });
        });

        test('should handle different providers correctly', async () => {
            // Arrange
            const githubUser = {
                id: 'user789',
                name: 'GitHub User',
                provider: 'github',
                email: 'github@example.com'
            };
            mockUserRepository.findByOauthId.mockResolvedValue(null);
            mockUserRepository.create.mockResolvedValue(githubUser);

            // Act
            const result = await authService.findOrCreateUser('github123', 'GitHub User', 'github', 'github@example.com');

            // Assert
            expect(result).toBe(githubUser);
            expect(mockUserRepository.findByOauthId).toHaveBeenCalledWith('github123', 'github');
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                oauthId: 'github123',
                name: 'GitHub User',
                provider: 'github',
                email: 'github@example.com'
            });
        });

        test('should handle repository errors gracefully', async () => {
            // Arrange
            const error = new Error('Database connection failed');
            mockUserRepository.findByOauthId.mockRejectedValue(error);

            // Act & Assert
            await expect(authService.findOrCreateUser(oauthId, name, provider, email))
                .rejects.toThrow('Database connection failed');

            expect(mockUserRepository.findByOauthId).toHaveBeenCalledWith(oauthId, provider);
            expect(mockUserRepository.create).not.toHaveBeenCalled();
        });

        test('should handle create user errors gracefully', async () => {
            // Arrange
            const error = new Error('Failed to create user');
            mockUserRepository.findByOauthId.mockResolvedValue(null);
            mockUserRepository.create.mockRejectedValue(error);

            // Act & Assert
            await expect(authService.findOrCreateUser(oauthId, name, provider, email))
                .rejects.toThrow('Failed to create user');

            expect(mockUserRepository.findByOauthId).toHaveBeenCalledWith(oauthId, provider);
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                oauthId,
                name,
                provider,
                email
            });
        });

        test('should work with minimal user data', async () => {
            // Arrange
            const minimalUser = {
                id: 'user999',
                name: '',
                provider: 'google',
                email: ''
            };
            mockUserRepository.findByOauthId.mockResolvedValue(null);
            mockUserRepository.create.mockResolvedValue(minimalUser);

            // Act
            const result = await authService.findOrCreateUser('oauth999', '', 'google', '');

            // Assert
            expect(result).toBe(minimalUser);
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                oauthId: 'oauth999',
                name: '',
                provider: 'google',
                email: ''
            });
        });
    });

    describe('Constructor', () => {
        test('should initialize with user repository', () => {
            // Arrange & Act
            const service = new AuthService(mockUserRepository);

            // Assert
            expect(service.userRepository).toBe(mockUserRepository);
        });

        test('should initialize even without repository', () => {
            // Arrange & Act
            const service = new AuthService();

            // Assert
            expect(service).toBeDefined();
        });
    });
});
