const { ObjectId } = require('mongodb');
const MongoUserRepository = require('../../../infrastructure/MongoUserRepository');
const User = require('../../../domain/user');

describe('MongoUserRepository', () => {
    let repository;
    let mockCollection;
    let mockDb;

    beforeEach(() => {
        // Setup mock collection
        mockCollection = {
            findOne: jest.fn(),
            insertOne: jest.fn()
        };

        // Setup mock db
        mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection)
        };

        repository = new MongoUserRepository(mockDb);
    });

    describe('Constructor', () => {
        test('should initialize with users collection', () => {
            // Arrange & Act
            const repo = new MongoUserRepository(mockDb);

            // Assert
            expect(mockDb.collection).toHaveBeenCalledWith('users');
            expect(repo.collection).toBe(mockCollection);
        });
    });

    describe('findByOauthId', () => {
        test('should return user when found', async () => {
            // Arrange
            const oauthId = 'oauth123';
            const provider = 'google';
            const mockDoc = {
                _id: new ObjectId(),
                oauthId: 'oauth123',
                name: 'Test User',
                provider: 'google',
                email: 'test@example.com',
                createdAt: new Date()
            };
            mockCollection.findOne.mockResolvedValue(mockDoc);

            // Act
            const result = await repository.findByOauthId(oauthId, provider);

            // Assert
            expect(result).toBeInstanceOf(User);
            expect(result.id).toBe(mockDoc._id.toString());
            expect(result.name).toBe(mockDoc.name);
            expect(result.provider).toBe(mockDoc.provider);
            expect(result.email).toBe(mockDoc.email);
            expect(result.createdAt).toBe(mockDoc.createdAt);
            expect(mockCollection.findOne).toHaveBeenCalledWith({ oauthId, provider });
        });

        test('should return null when user not found', async () => {
            // Arrange
            const oauthId = 'oauth123';
            const provider = 'google';
            mockCollection.findOne.mockResolvedValue(null);

            // Act
            const result = await repository.findByOauthId(oauthId, provider);

            // Assert
            expect(result).toBeNull();
            expect(mockCollection.findOne).toHaveBeenCalledWith({ oauthId, provider });
        });

        test('should handle different providers', async () => {
            // Arrange
            const oauthId = 'github123';
            const provider = 'github';
            const mockDoc = {
                _id: new ObjectId(),
                oauthId: 'github123',
                name: 'GitHub User',
                provider: 'github',
                email: 'github@example.com',
                createdAt: new Date()
            };
            mockCollection.findOne.mockResolvedValue(mockDoc);

            // Act
            const result = await repository.findByOauthId(oauthId, provider);

            // Assert
            expect(result.provider).toBe('github');
            expect(mockCollection.findOne).toHaveBeenCalledWith({ oauthId: 'github123', provider: 'github' });
        });

        test('should handle database errors', async () => {
            // Arrange
            const oauthId = 'oauth123';
            const provider = 'google';
            const error = new Error('Database connection failed');
            mockCollection.findOne.mockRejectedValue(error);

            // Act & Assert
            await expect(repository.findByOauthId(oauthId, provider))
                .rejects.toThrow('Database connection failed');
        });
    });

    describe('create', () => {
        test('should create and return new user', async () => {
            // Arrange
            const userData = {
                oauthId: 'oauth456',
                name: 'New User',
                provider: 'google',
                email: 'new@example.com'
            };
            const insertedId = new ObjectId();
            const mockResult = {
                insertedId: insertedId
            };
            mockCollection.insertOne.mockResolvedValue(mockResult);

            // Act
            const result = await repository.create(userData);

            // Assert
            expect(result).toBeInstanceOf(User);
            expect(result.id).toBe(insertedId.toString());
            expect(result.name).toBe(userData.name);
            expect(result.provider).toBe(userData.provider);
            expect(result.email).toBe(userData.email);
            expect(result.createdAt).toBeInstanceOf(Date);

            // Verify the document inserted includes createdAt
            expect(mockCollection.insertOne).toHaveBeenCalledWith({
                ...userData,
                createdAt: expect.any(Date)
            });
        });

        test('should handle minimal user data', async () => {
            // Arrange
            const userData = {
                oauthId: 'oauth789',
                name: '',
                provider: 'github',
                email: ''
            };
            const insertedId = new ObjectId();
            const mockResult = { insertedId };
            mockCollection.insertOne.mockResolvedValue(mockResult);

            // Act
            const result = await repository.create(userData);

            // Assert
            expect(result).toBeInstanceOf(User);
            expect(result.name).toBe('');
            expect(result.email).toBe('');
            expect(result.provider).toBe('github');
        });

        test('should handle database insertion errors', async () => {
            // Arrange
            const userData = {
                oauthId: 'oauth456',
                name: 'New User',
                provider: 'google',
                email: 'new@example.com'
            };
            const error = new Error('Failed to insert document');
            mockCollection.insertOne.mockRejectedValue(error);

            // Act & Assert
            await expect(repository.create(userData))
                .rejects.toThrow('Failed to insert document');
        });

        test('should add createdAt timestamp automatically', async () => {
            // Arrange
            const userData = {
                oauthId: 'oauth999',
                name: 'Time Test User',
                provider: 'google',
                email: 'time@example.com'
            };
            const insertedId = new ObjectId();
            const mockResult = { insertedId };
            mockCollection.insertOne.mockResolvedValue(mockResult);

            const beforeCreate = new Date();

            // Act
            const result = await repository.create(userData);

            // Assert
            const afterCreate = new Date();
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
            expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
        });
    });

    describe('Integration scenarios', () => {
        test('should handle consecutive operations', async () => {
            // Arrange
            const oauthId = 'oauth123';
            const provider = 'google';
            const userData = {
                oauthId,
                name: 'Test User',
                provider,
                email: 'test@example.com'
            };

            // First call - user not found
            mockCollection.findOne.mockResolvedValueOnce(null);

            // Create user
            const insertedId = new ObjectId();
            mockCollection.insertOne.mockResolvedValue({ insertedId });

            // Second call - user found
            mockCollection.findOne.mockResolvedValueOnce({
                _id: insertedId,
                ...userData,
                createdAt: new Date()
            });

            // Act
            const notFound = await repository.findByOauthId(oauthId, provider);
            const created = await repository.create(userData);
            const found = await repository.findByOauthId(oauthId, provider);

            // Assert
            expect(notFound).toBeNull();
            expect(created).toBeInstanceOf(User);
            expect(found).toBeInstanceOf(User);
            expect(created.id).toBe(found.id);
        });
    });
});
