const setupPassport = require('infrastructure/PassportFactory');
const User = require('domain/user');

describe('PassportFactory', () => {
    let mockPassport;
    let mockAuthService;
    let originalProcessEnv;

    beforeEach(() => {
        originalProcessEnv = process.env;
        process.env = {
            ...originalProcessEnv,
            GOOGLE_CLIENT_ID: 'google_client_id',
            GOOGLE_CLIENT_SECRET: 'google_client_secret',
            GITHUB_CLIENT_ID: 'github_client_id',
            GITHUB_CLIENT_SECRET: 'github_client_secret',
        };

        mockPassport = {
            serializeUser: jest.fn(),
            deserializeUser: jest.fn(),
            use: jest.fn(),
        };
        mockAuthService = {
            findOrCreateUser: jest.fn(),
        };

        setupPassport(mockPassport, mockAuthService);
    });

    afterEach(() => {
        process.env = originalProcessEnv;
        jest.clearAllMocks();
    });

    it('should configure serializeUser and deserializeUser', () => {
        expect(mockPassport.serializeUser).toHaveBeenCalledTimes(1);
        expect(mockPassport.deserializeUser).toHaveBeenCalledTimes(1);

        // Test serializeUser callback
        const serializedUser = { id: '1', name: 'Test' };
        const serializeDone = jest.fn();
        mockPassport.serializeUser.mock.calls[0][0](serializedUser, serializeDone);
        expect(serializeDone).toHaveBeenCalledWith(null, serializedUser);

        // Test deserializeUser callback
        const deserializedUser = { id: '1', name: 'Test' };
        const deserializeDone = jest.fn();
        mockPassport.deserializeUser.mock.calls[0][0](deserializedUser, deserializeDone);
        expect(deserializeDone).toHaveBeenCalledWith(null, deserializedUser);
    });

    it('should configure GoogleStrategy correctly', async () => {
        expect(mockPassport.use).toHaveBeenCalledTimes(2);
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        expect(googleStrategy.name).toBe('google');

        const profile = {
            id: 'google_oauth_id',
            displayName: 'Google User',
            emails: [{ value: 'google@example.com' }],
            _json: { name: 'Google User Json' }
        };
        const done = jest.fn();
        const expectedUser = new User('1', 'Google User', 'google', 'google@example.com');
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id',
            'Google User',
            'google',
            'google@example.com'
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should configure GitHubStrategy correctly', async () => {
        expect(mockPassport.use).toHaveBeenCalledTimes(2);
        const githubStrategy = mockPassport.use.mock.calls[1][0];
        expect(githubStrategy.name).toBe('github');

        const profile = {
            id: 'github_oauth_id',
            username: 'githubuser',
            _json: { email: 'github@example.com', name: 'GitHub User Json' }
        };
        const done = jest.fn();
        const expectedUser = new User('2', 'githubuser', 'github', 'github@example.com');
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await githubStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'github_oauth_id',
            'githubuser',
            'github',
            'github@example.com'
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should handle missing email for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_no_email',
            displayName: 'Google User No Email',
            emails: [],
            _json: { name: 'Google User No Email Json' }
        };
        const done = jest.fn();
        const expectedUser = new User('3', 'Google User No Email', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_no_email',
            'Google User No Email',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should handle missing email for GitHubStrategy', async () => {
        const githubStrategy = mockPassport.use.mock.calls[1][0];
        const profile = {
            id: 'github_oauth_id_no_email',
            username: 'githubuser_no_emails',
            _json: { }
        };
        const done = jest.fn();
        const expectedUser = new User('4', 'githubuser_no_emails', 'github', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await githubStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'github_oauth_id_no_email',
            'githubuser_no_emails',
            'github',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use _json.name when displayName and username are missing for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_json_name',
            displayName: '', // Explicitly empty
            username: '', // Explicitly empty
            _json: { name: 'Google Json Name' }
        };
        const done = jest.fn();
        const expectedUser = new User('5', 'Google Json Name', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_json_name',
            'Google Json Name',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use _json.name when displayName and username are missing for GitHubStrategy', async () => {
        const githubStrategy = mockPassport.use.mock.calls[1][0];
        const profile = {
            id: 'github_oauth_id_json_name',
            displayName: '', // Explicitly empty
            username: '', // Explicitly empty
            _json: { name: 'GitHub Json Name' }
        };
        const done = jest.fn();
        const expectedUser = new User('6', 'GitHub Json Name', 'github', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await githubStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'github_oauth_id_json_name',
            'GitHub Json Name',
            'github',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should handle missing emails and _json.email for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_no_emails_no_json_email',
            displayName: 'Google User No Emails',
            emails: [],
            _json: { }
        };
        const done = jest.fn();
        const expectedUser = new User('7', 'Google User No Emails', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_no_emails_no_json_email',
            'Google User No Emails',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should handle missing emails and _json.email for GitHubStrategy', async () => {
        const githubStrategy = mockPassport.use.mock.calls[1][0];
        const profile = {
            id: 'github_oauth_id_no_emails_no_json_email',
            username: 'githubuser_no_emails',
            emails: [],
            _json: { }
        };
        const done = jest.fn();
        const expectedUser = new User('8', 'githubuser_no_emails', 'github', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await githubStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'github_oauth_id_no_emails_no_json_email',
            'githubuser_no_emails',
            'github',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use username when displayName is missing for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_username',
            displayName: undefined,
            username: 'Google Username',
            _json: { name: 'Google Json Name' }
        };
        const done = jest.fn();
        const expectedUser = new User('9', 'Google Username', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_username',
            'Google Username',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use displayName when username is missing for GitHubStrategy', async () => {
        const githubStrategy = mockPassport.use.mock.calls[1][0];
        const profile = {
            id: 'github_oauth_id_displayname',
            displayName: 'GitHub DisplayName',
            username: undefined,
            _json: { name: 'GitHub Json Name' }
        };
        const done = jest.fn();
        const expectedUser = new User('10', 'GitHub DisplayName', 'github', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await githubStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'github_oauth_id_displayname',
            'GitHub DisplayName',
            'github',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use _json.name when displayName and username are null for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_null_names',
            displayName: null,
            username: null,
            _json: { name: 'Google Json Name Null' }
        };
        const done = jest.fn();
        const expectedUser = new User('11', 'Google Json Name Null', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_null_names',
            'Google Json Name Null',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use _json.name when displayName and username are null for GitHubStrategy', async () => {
        const githubStrategy = mockPassport.use.mock.calls[1][0];
        const profile = {
            id: 'github_oauth_id_null_names',
            displayName: null,
            username: null,
            _json: { name: 'GitHub Json Name Null' }
        };
        const done = jest.fn();
        const expectedUser = new User('12', 'GitHub Json Name Null', 'github', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await githubStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'github_oauth_id_null_names',
            'GitHub Json Name Null',
            'github',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use _json.name when displayName and username are undefined for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_undefined_names',
            displayName: undefined,
            username: undefined,
            _json: { name: 'Google Json Name Undefined' }
        };
        const done = jest.fn();
        const expectedUser = new User('13', 'Google Json Name Undefined', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_undefined_names',
            'Google Json Name Undefined',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use _json.name when displayName and username are undefined for GitHubStrategy', async () => {
        const githubStrategy = mockPassport.use.mock.calls[1][0];
        const profile = {
            id: 'github_oauth_id_undefined_names',
            displayName: undefined,
            username: undefined,
            _json: { name: 'GitHub Json Name Undefined' }
        };
        const done = jest.fn();
        const expectedUser = new User('14', 'GitHub Json Name Undefined', 'github', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await githubStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'github_oauth_id_undefined_names',
            'GitHub Json Name Undefined',
            'github',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use username when displayName is null for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_null_displayname',
            displayName: null,
            username: 'Google Username Null DisplayName',
            _json: { name: 'Google Json Name' }
        };
        const done = jest.fn();
        const expectedUser = new User('15', 'Google Username Null DisplayName', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_null_displayname',
            'Google Username Null DisplayName',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use displayName when username is null for GitHubStrategy', async () => {
        const githubStrategy = mockPassport.use.mock.calls[1][0];
        const profile = {
            id: 'github_oauth_id_null_username',
            displayName: 'GitHub DisplayName Null Username',
            username: null,
            _json: { name: 'GitHub Json Name' }
        };
        const done = jest.fn();
        const expectedUser = new User('16', 'GitHub DisplayName Null Username', 'github', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await githubStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'github_oauth_id_null_username',
            'GitHub DisplayName Null Username',
            'github',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use username when displayName is empty string for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_empty_displayname',
            displayName: '',
            username: 'Google Username Empty DisplayName',
            _json: { name: 'Google Json Name' }
        };
        const done = jest.fn();
        const expectedUser = new User('17', 'Google Username Empty DisplayName', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_empty_displayname',
            'Google Username Empty DisplayName',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use displayName when username is empty string for GitHubStrategy', async () => {
        const githubStrategy = mockPassport.use.mock.calls[1][0];
        const profile = {
            id: 'github_oauth_id_empty_username',
            displayName: 'GitHub DisplayName Empty Username',
            username: '',
            _json: { name: 'GitHub Json Name' }
        };
        const done = jest.fn();
        const expectedUser = new User('18', 'GitHub DisplayName Empty Username', 'github', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await githubStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'github_oauth_id_empty_username',
            'GitHub DisplayName Empty Username',
            'github',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use profile.id as name when displayName, username, and _json.name are missing for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_only_id',
            displayName: undefined,
            username: undefined,
            emails: [],
            _json: { }
        };
        const done = jest.fn();
        const expectedUser = new User('19', 'google_oauth_id_only_id', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_only_id',
            'google_oauth_id_only_id',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use profile.id as name when displayName, username, and _json.name are missing for GitHubStrategy', async () => {
        const githubStrategy = mockPassport.use.mock.calls[1][0];
        const profile = {
            id: 'github_oauth_id_only_id',
            displayName: undefined,
            username: undefined,
            emails: [],
            _json: { }
        };
        const done = jest.fn();
        const expectedUser = new User('20', 'github_oauth_id_only_id', 'github', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await githubStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'github_oauth_id_only_id',
            'github_oauth_id_only_id',
            'github',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use _json.name when displayName is null, username is undefined for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_null_displayname_undefined_username',
            displayName: null,
            username: undefined,
            _json: { name: 'Google Json Name Null DisplayName Undefined Username' }
        };
        const done = jest.fn();
        const expectedUser = new User('21', 'Google Json Name Null DisplayName Undefined Username', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_null_displayname_undefined_username',
            'Google Json Name Null DisplayName Undefined Username',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use _json.name when displayName is empty string, username is undefined for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_empty_displayname_undefined_username',
            displayName: '',
            username: undefined,
            _json: { name: 'Google Json Name Empty DisplayName Undefined Username' }
        };
        const done = jest.fn();
        const expectedUser = new User('22', 'Google Json Name Empty DisplayName Undefined Username', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_empty_displayname_undefined_username',
            'Google Json Name Empty DisplayName Undefined Username',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use profile.id as name when displayName, username, and _json.name are null for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_all_null_names',
            displayName: null,
            username: null,
            _json: { name: null }
        };
        const done = jest.fn();
        const expectedUser = new User('23', 'google_oauth_id_all_null_names', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_all_null_names',
            'google_oauth_id_all_null_names',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use profile.id as name when displayName, username, and _json.name are null for GitHubStrategy', async () => {
        const githubStrategy = mockPassport.use.mock.calls[1][0];
        const profile = {
            id: 'github_oauth_id_all_null_names',
            displayName: null,
            username: null,
            _json: { name: null }
        };
        const done = jest.fn();
        const expectedUser = new User('24', 'github_oauth_id_all_null_names', 'github', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await githubStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'github_oauth_id_all_null_names',
            'github_oauth_id_all_null_names',
            'github',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use profile.id as name when displayName, username, and _json.name are empty strings for GoogleStrategy', async () => {
        const googleStrategy = mockPassport.use.mock.calls[0][0];
        const profile = {
            id: 'google_oauth_id_all_empty_names',
            displayName: '',
            username: '',
            _json: { name: '' }
        };
        const done = jest.fn();
        const expectedUser = new User('25', 'google_oauth_id_all_empty_names', 'google', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await googleStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'google_oauth_id_all_empty_names',
            'google_oauth_id_all_empty_names',
            'google',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });

    it('should use profile.id as name when displayName, username, and _json.name are empty strings for GitHubStrategy', async () => {
        const githubStrategy = mockPassport.use.mock.calls[1][0];
        const profile = {
            id: 'github_oauth_id_all_empty_names',
            displayName: '',
            username: '',
            _json: { name: '' }
        };
        const done = jest.fn();
        const expectedUser = new User('26', 'github_oauth_id_all_empty_names', 'github', null);
        mockAuthService.findOrCreateUser.mockResolvedValue(expectedUser);

        await githubStrategy._verify(null, null, profile, done);

        expect(mockAuthService.findOrCreateUser).toHaveBeenCalledWith(
            'github_oauth_id_all_empty_names',
            'github_oauth_id_all_empty_names',
            'github',
            null
        );
        expect(done).toHaveBeenCalledWith(null, expectedUser);
    });
});
