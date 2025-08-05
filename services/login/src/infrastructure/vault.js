const axios = require('axios');

async function loadSecrets() {
    const VAULT_ADDR = process.env.VAULT_ADDR || 'http://vault:8200';
    const VAULT_TOKEN = process.env.VAULT_TOKEN || 'root';
    const VAULT_PATH = process.env.VAULT_SECRET_PATH || 'secret/login-service';

    let retries = 5;
    let delay = 2000; // 2 seconds

    while (retries > 0) {
        try {
            console.log('[VAULT] Attempting to load secrets from:', VAULT_ADDR);
            console.log('[VAULT] Using VAULT_TOKEN:', VAULT_TOKEN);
            const { data } = await axios.get(`${VAULT_ADDR}/v1/${VAULT_PATH}`, {
                headers: { 'X-Vault-Token': VAULT_TOKEN }
            });

            const secrets = data.data;

            for (const [key, value] of Object.entries(secrets)) {
                process.env[key] = value;
            }

            console.log('[VAULT] Secrets loaded');
            return; // Success, exit loop
        } catch (err) {
            console.error(`[VAULT] Failed to load secrets (retries left: ${retries}):`, err.message);
            retries--;
            if (retries === 0) {
                process.exit(1); // No more retries, exit app
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        }
    }
}

module.exports = { loadSecrets };
