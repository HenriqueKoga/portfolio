const { MongoClient, ObjectId } = require('mongodb');
const MongoUserRepository = require('infrastructure/MongoUserRepository');
const User = require('domain/user');

describe('MongoUserRepository', () => {
    let connection;
    let db;
    let userRepository;

    beforeAll(async () => {
        // Use a test database or mock the MongoClient
        // For simplicity, we'll mock the collection interactions
        connection = {
            db: jest.fn(() => db)
        };
        db = {
            collection: jest.fn(() => ({
                findOne: jest.fn(),
                insertOne: jest.fn(),
            }))
        };
        userRepository = new MongoUserRepository(db);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should find a user by oauthId and provider', async () => {
        const mockDoc = {
            _id: new ObjectId(),
            oauthId: 'oauth123',
            name: 'Test User',
            provider: 'google',
            email: 'test@example.com',
            createdAt: new Date()
        };
        userRepository.collection.findOne.mockResolvedValue(mockDoc);

        const user = await userRepository.findByOauthId('oauth123', 'google');

        expect(userRepository.collection.findOne).toHaveBeenCalledWith({ oauthId: 'oauth123', provider: 'google' });
        expect(user).toBeInstanceOf(User);
        expect(user.id).toBe(mockDoc._id.toString());
        expect(user.name).toBe(mockDoc.name);
    });

    it('should return null if user not found by oauthId and provider', async () => {
        userRepository.collection.findOne.mockResolvedValue(null);

        const user = await userRepository.findByOauthId('nonexistent', 'google');

        expect(userRepository.collection.findOne).toHaveBeenCalledWith({ oauthId: 'nonexistent', provider: 'google' });
        expect(user).toBeNull();
    });

    it('should create a new user', async () => {
        const newUserId = new ObjectId();
        userRepository.collection.insertOne.mockResolvedValue({
            insertedId: newUserId
        });

        const userData = {
            oauthId: 'new_oauth',
            name: 'New User',
            provider: 'github',
            email: 'new@example.com'
        };
        const user = await userRepository.create(userData);

        expect(userRepository.collection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
            oauthId: userData.oauthId,
            name: userData.name,
            provider: userData.provider,
            email: userData.email,
            createdAt: expect.any(Date)
        }));
        expect(user).toBeInstanceOf(User);
        expect(user.id).toBe(newUserId.toString());
        expect(user.name).toBe(userData.name);
    });
});
