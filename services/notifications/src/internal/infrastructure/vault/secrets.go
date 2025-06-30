package vault

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
)

func LoadSecrets() error {
	vaultAddr := os.Getenv("VAULT_ADDR")
	vaultToken := os.Getenv("VAULT_TOKEN")
	secretPath := os.Getenv("VAULT_SECRET_PATH")

	fmt.Println("[VAULT] Carregando segredos do Vault!")

	url := fmt.Sprintf("%s/v1/%s", vaultAddr, secretPath)

	// Faz a requisição HTTP ao Vault
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return fmt.Errorf("erro ao criar request: %w", err)
	}
	req.Header.Add("X-Vault-Token", vaultToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("erro na requisição para Vault: %w", err)
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println("Vault raw response:", string(body))

	if resp.StatusCode != 200 {
		return fmt.Errorf("Vault error: %s", resp.Status)
	}

	var vaultResp map[string]interface{}
	err = json.Unmarshal(body, &vaultResp)
	if err != nil {
		return fmt.Errorf("erro ao fazer unmarshal: %w", err)
	}

	data, ok := vaultResp["data"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("campo 'data' não encontrado na resposta do Vault")
	}

	for key, value := range data {
		valStr, isString := value.(string)
		if isString {
			os.Setenv(key, valStr)
			fmt.Printf("[VAULT] %s carregado.\n", key)
		} else {
			fmt.Printf("[VAULT] Ignorado %s, não é string.\n", key)
		}
	}

	fmt.Println("[VAULT] Todos os segredos carregados com sucesso!")
	return nil
}