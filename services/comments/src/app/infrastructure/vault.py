import logging
import os

import requests

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def load_secrets():
    VAULT_ADDR = os.getenv("VAULT_ADDR", "http://vault:8200")
    VAULT_TOKEN = os.getenv("VAULT_TOKEN", "root")
    VAULT_PATH = os.getenv("VAULT_SECRET_PATH", "secret/comment-service")

    url = f"{VAULT_ADDR}/v1/{VAULT_PATH}"
    headers = {"X-Vault-Token": VAULT_TOKEN}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        secrets = response.json()["data"]

        for key, value in secrets.items():
            os.environ[key] = value

        logger.info("[VAULT] Segredos carregados com sucesso.")
    except Exception as e:
        logger.error(f"[VAULT] Erro ao carregar segredos: {e}")
        exit(1)
