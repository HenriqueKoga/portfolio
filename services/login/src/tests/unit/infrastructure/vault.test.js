const { loadSecrets } = require('infrastructure/vault');
const axios = require('axios');

jest.mock('axios');

describe('vault', () => {
    let originalProcessEnv;
    let originalConsoleError;
    let originalProcessExit;

    beforeEach(() => {
        originalProcessEnv = process.env;
        process.env = { ...originalProcessEnv }; // Copy process.env
        // Explicitly delete VAULT_ADDR and VAULT_TOKEN to ensure clean state for tests expecting default
        delete process.env.VAULT_ADDR;
        delete process.env.VAULT_TOKEN;
        originalConsoleError = console.error;
        console.error = jest.fn();
        originalProcessExit = process.exit;
        process.exit = jest.fn();
    });

    afterEach(() => {
        process.env = originalProcessEnv;
        console.error = originalConsoleError;
        process.exit = originalProcessExit;
        jest.clearAllMocks();
    });

    it('should load secrets from Vault and set them in process.env', async () => {
        process.env.VAULT_ADDR = 'http://mock-vault:8200';
        process.env.VAULT_TOKEN = 'mock_token';
        process.env.VAULT_SECRET_PATH = 'secret/test-service';

        const mockSecrets = {
            SECRET_KEY_1: 'value1',
            SECRET_KEY_2: 'value2',
        };

        axios.get.mockResolvedValue({
            data: { data: mockSecrets }
        });

        await loadSecrets();

        expect(axios.get).toHaveBeenCalledWith(
            'http://mock-vault:8200/v1/secret/test-service',
            { headers: { 'X-Vault-Token': 'mock_token' } }
        );
        expect(process.env.SECRET_KEY_1).toBe('value1');
        expect(process.env.SECRET_KEY_2).toBe('value2');
        expect(console.error).not.toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
    });

    it('should use default Vault values if environment variables are not set', async () => {
        // VAULT_ADDR and VAULT_TOKEN are already deleted in beforeEach
        const mockSecrets = {
            DEFAULT_SECRET: 'default_value',
        };

        axios.get.mockResolvedValue({
            data: { data: mockSecrets }
        });

        await loadSecrets();

        expect(axios.get).toHaveBeenCalledWith(
            'http://vault:8200/v1/secret/login-service',
            { headers: { 'X-Vault-Token': 'root' } }
        );
        expect(process.env.DEFAULT_SECRET).toBe('default_value');
    });

    it('should log an error and exit if Vault request fails', async () => {
        const errorMessage = 'Network Error';
        axios.get.mockRejectedValue(new Error(errorMessage));

        await loadSecrets();

        expect(console.error).toHaveBeenCalledWith('[VAULT] Failed to load secrets:', errorMessage);
        expect(process.exit).toHaveBeenCalledWith(1);
        expect(process.env.SECRET_KEY_1).toBeUndefined(); // Ensure secrets are not set
    });
});