#!/bin/bash
set -e

VAULT_CONTAINER="vault"
VAULT_ADDR="http://127.0.0.1:8200"
INIT_FILE="vault-init.txt"
ENV_DIR="./envs"
SECRET_PATHS=("login-service" "comment-service")

echo "🔐 Iniciando setup do Vault..."

# Define comando base
VAULT_EXEC="docker exec -e VAULT_ADDR=$VAULT_ADDR $VAULT_CONTAINER vault"

# Verifica se está em modo dev (in-memory)
DEV_MODE=$($VAULT_EXEC status -format=json | grep '"storage_type": "inmem"' || true)

if [[ -n "$DEV_MODE" ]]; then
  echo "⚙️  Vault está em modo DEV (in-memory). Segredos não serão persistidos!"
  echo "✅ Logando com token root padrão: root"
  $VAULT_EXEC login root >/dev/null
else
  echo "🔒 Vault em modo produção (storage=file). Verificando inicialização..."

  if [[ ! -s $INIT_FILE ]]; then
    echo "🚀 Executando init..."
    $VAULT_EXEC operator init -key-shares=3 -key-threshold=3 > "$INIT_FILE"
    echo "✅ $INIT_FILE salvo com unseal keys e root token"
  else
    echo "✅ Vault já inicializado (detectado $INIT_FILE)"
  fi

  UNSEAL_KEYS=($(grep 'Unseal Key' "$INIT_FILE" | awk '{print $NF}'))
  ROOT_TOKEN=$(grep 'Initial Root Token' "$INIT_FILE" | awk '{print $NF}')

  echo "🔓 Deslacrando Vault..."
  for KEY in "${UNSEAL_KEYS[@]}"; do
    $VAULT_EXEC operator unseal "$KEY" >/dev/null || true
  done
  echo "🔑 Fazendo login com root token..."
  $VAULT_EXEC login "$ROOT_TOKEN" >/dev/null
fi

# Habilita KV se necessário
$VAULT_EXEC secrets enable -path=secret kv || true

# Carrega segredos
for ENV_FILE in "$ENV_DIR"/*.env; do
  SERVICE_NAME=$(basename "$ENV_FILE" .env)
  SECRET_PATH="secret/${SERVICE_NAME}"

  echo "🔄 Processando: $SERVICE_NAME ($ENV_FILE)"
  
  # Converte em lista key=value (ignora comentários)
  ENV_VARS=$(grep -v '^#' "$ENV_FILE" | xargs)

  if [ -z "$ENV_VARS" ]; then
    echo "⚠️  $ENV_FILE está vazio ou inválido. Pulando..."
    continue
  fi

  # Carrega os dados no Vault
  docker exec -e VAULT_ADDR=$VAULT_ADDR -e VAULT_TOKEN=$VAULT_TOKEN vault \
    vault kv put "$SECRET_PATH" $ENV_VARS

  echo "✅ Secrets enviados para: $SECRET_PATH"
done

echo "🎉 Setup completo!"
