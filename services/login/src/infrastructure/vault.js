const axios = require('axios');

async function loadSecrets() {
    const VAULT_ADDR = process.env.VAULT_ADDR || 'http://vault:8200';
    const VAULT_TOKEN = process.env.VAULT_TOKEN || 'root';
    const VAULT_PATH = process.env.VAULT_SECRET_PATH || 'secret/login-service';

    try {
        const { data } = await axios.get(`${VAULT_ADDR}/v1/${VAULT_PATH}`, {
            headers: { 'X-Vault-Token': VAULT_TOKEN }
        });

        const secrets = data.data;

        for (const [key, value] of Object.entries(secrets)) {
            process.env[key] = value;
        }

        console.log('[VAULT] Secrets loaded');
    } catch (err) {
        console.error('[VAULT] Failed to load secrets:', err.message);
        process.exit(1); // impede app de subir sem segredos
    }
}

module.exports = { loadSecrets };
