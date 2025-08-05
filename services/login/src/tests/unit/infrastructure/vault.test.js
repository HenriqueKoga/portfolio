const axios = require('axios');
const { loadSecrets } = require('infrastructure/vault');

jest.mock('axios');

describe('vault', () => {
    let originalProcessEnv;
    let originalProcessExit;
    let exitSpy;

    beforeEach(() => {
        jest.useFakeTimers();
        originalProcessEnv = process.env;
        originalProcessExit = process.exit;
        process.env = { ...originalProcessEnv };
        exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => { throw new Error(`process.exit called with code: ${code}`); });
        axios.get.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
        process.env = originalProcessEnv;
        process.exit = originalProcessExit;
        exitSpy.mockRestore();
        jest.clearAllMocks();
    });

    it('should load secrets from Vault and set them as environment variables', async () => {
        axios.get.mockResolvedValue({
            data: {
                data: {
                    TEST_SECRET: 'test_value',
                    ANOTHER_SECRET: 'another_value',
                },
            },
        });

        process.env.VAULT_ADDR = 'http://mock-vault:8200';
        process.env.VAULT_TOKEN = 'mock_token';
        process.env.VAULT_SECRET_PATH = 'secret/test-service';

        await loadSecrets();

        expect(axios.get).toHaveBeenCalledWith(
            'http://mock-vault:8200/v1/secret/test-service',
            {
                headers: { 'X-Vault-Token': 'mock_token' },
            }
        );
        expect(process.env.TEST_SECRET).toBe('test_value');
        expect(process.env.ANOTHER_SECRET).toBe('another_value');
        expect(exitSpy).not.toHaveBeenCalled();
    });

    it('should use default VAULT_ADDR and VAULT_TOKEN if not set', async () => {
        axios.get.mockResolvedValue({
            data: { data: { TEST_SECRET: 'default_value' } },
        });

        delete process.env.VAULT_ADDR;
        delete process.env.VAULT_TOKEN;
        delete process.env.VAULT_SECRET_PATH;

        await loadSecrets();

        expect(axios.get).toHaveBeenCalledWith(
            'http://vault:8200/v1/secret/login-service',
            {
                headers: { 'X-Vault-Token': 'root' },
            }
        );
        expect(process.env.TEST_SECRET).toBe('default_value');
        expect(exitSpy).not.toHaveBeenCalled();
    });

    
});