package vault_test

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"net/http"
	"notifications/internal/infrastructure/vault"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockHTTPClient is a mock implementation of the vault.HTTPClient interface.
type MockHTTPClient struct {
	mock.Mock
}

// Do mocks the Do method of the HTTPClient interface.
func (m *MockHTTPClient) Do(req *http.Request) (*http.Response, error) {
	args := m.Called(req)
	return args.Get(0).(*http.Response), args.Error(1)
}

func TestLoadSecrets_Success(t *testing.T) {
	// Save original environment variables and restore them after the test
	originalVaultAddr := os.Getenv("VAULT_ADDR")
	originalVaultToken := os.Getenv("VAULT_TOKEN")
	originalSecretPath := os.Getenv("VAULT_SECRET_PATH")

	defer func() {
		os.Setenv("VAULT_ADDR", originalVaultAddr)
		os.Setenv("VAULT_TOKEN", originalVaultToken)
		os.Setenv("VAULT_SECRET_PATH", originalSecretPath)
	}()

	// Set up mock environment variables
	os.Setenv("VAULT_ADDR", "http://mock-vault:8200")
	os.Setenv("VAULT_TOKEN", "mock_token")
	os.Setenv("VAULT_SECRET_PATH", "secret/data/my-app")

	mockHTTPClient := new(MockHTTPClient)
	jsonResponse := `{"data":{"KEY1":"VALUE1","KEY2":"VALUE2"}}`
	resp := &http.Response{
		StatusCode: 200,
		Body:       ioutil.NopCloser(bytes.NewBufferString(jsonResponse)),
		Header:     make(http.Header),
	}
	mockHTTPClient.On("Do", mock.AnythingOfType("*http.Request")).Return(resp, nil).Once()

	err := vault.LoadSecrets(mockHTTPClient)
	assert.NoError(t, err)
	assert.Equal(t, "VALUE1", os.Getenv("KEY1"))
	assert.Equal(t, "VALUE2", os.Getenv("KEY2"))
	mockHTTPClient.AssertExpectations(t)
}

func TestLoadSecrets_RequestError(t *testing.T) {
	// Save original environment variables and restore them after the test
	originalVaultAddr := os.Getenv("VAULT_ADDR")
	originalVaultToken := os.Getenv("VAULT_TOKEN")
	originalSecretPath := os.Getenv("VAULT_SECRET_PATH")

	defer func() {
		os.Setenv("VAULT_ADDR", originalVaultAddr)
		os.Setenv("VAULT_TOKEN", originalVaultToken)
		os.Setenv("VAULT_SECRET_PATH", originalSecretPath)
	}()

	os.Setenv("VAULT_ADDR", "http://mock-vault:8200")
	os.Setenv("VAULT_TOKEN", "mock_token")
	os.Setenv("VAULT_SECRET_PATH", "secret/data/my-app")

	mockHTTPClient := new(MockHTTPClient)
	mockHTTPClient.On("Do", mock.AnythingOfType("*http.Request")).Return((*http.Response)(nil), fmt.Errorf("network error")).Once()

	err := vault.LoadSecrets(mockHTTPClient)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "erro na requisição para Vault: network error")
	mockHTTPClient.AssertExpectations(t)
}

func TestLoadSecrets_Non200Status(t *testing.T) {
	originalVaultAddr := os.Getenv("VAULT_ADDR")
	originalVaultToken := os.Getenv("VAULT_TOKEN")
	originalSecretPath := os.Getenv("VAULT_SECRET_PATH")

	defer func() {
		os.Setenv("VAULT_ADDR", originalVaultAddr)
		os.Setenv("VAULT_TOKEN", originalVaultToken)
		os.Setenv("VAULT_SECRET_PATH", originalSecretPath)
	}()

	os.Setenv("VAULT_ADDR", "http://mock-vault:8200")
	os.Setenv("VAULT_TOKEN", "mock_token")
	os.Setenv("VAULT_SECRET_PATH", "secret/data/my-app")

	mockHTTPClient := new(MockHTTPClient)
	resp := &http.Response{
		StatusCode: 404,
		Status:     "404 Not Found",
		Body:       ioutil.NopCloser(bytes.NewBufferString("Not Found")),
		Header:     make(http.Header),
	}
	mockHTTPClient.On("Do", mock.AnythingOfType("*http.Request")).Return(resp, nil).Once()

	err := vault.LoadSecrets(mockHTTPClient)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "Vault error: 404 Not Found")
	mockHTTPClient.AssertExpectations(t)
}

func TestLoadSecrets_UnmarshalError(t *testing.T) {
	originalVaultAddr := os.Getenv("VAULT_ADDR")
	originalVaultToken := os.Getenv("VAULT_TOKEN")
	originalSecretPath := os.Getenv("VAULT_SECRET_PATH")

	defer func() {
		os.Setenv("VAULT_ADDR", originalVaultAddr)
		os.Setenv("VAULT_TOKEN", originalVaultToken)
		os.Setenv("VAULT_SECRET_PATH", originalSecretPath)
	}()

	os.Setenv("VAULT_ADDR", "http://mock-vault:8200")
	os.Setenv("VAULT_TOKEN", "mock_token")
	os.Setenv("VAULT_SECRET_PATH", "secret/data/my-app")

	mockHTTPClient := new(MockHTTPClient)
	jsonResponse := `invalid json`
	resp := &http.Response{
		StatusCode: 200,
		Body:       ioutil.NopCloser(bytes.NewBufferString(jsonResponse)),
		Header:     make(http.Header),
	}
	mockHTTPClient.On("Do", mock.AnythingOfType("*http.Request")).Return(resp, nil).Once()

	err := vault.LoadSecrets(mockHTTPClient)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "erro ao fazer unmarshal")
	mockHTTPClient.AssertExpectations(t)
}

func TestLoadSecrets_MissingDataField(t *testing.T) {
	originalVaultAddr := os.Getenv("VAULT_ADDR")
	originalVaultToken := os.Getenv("VAULT_TOKEN")
	originalSecretPath := os.Getenv("VAULT_SECRET_PATH")

	defer func() {
		os.Setenv("VAULT_ADDR", originalVaultAddr)
		os.Setenv("VAULT_TOKEN", originalVaultToken)
		os.Setenv("VAULT_SECRET_PATH", originalSecretPath)
	}()

	os.Setenv("VAULT_ADDR", "http://mock-vault:8200")
	os.Setenv("VAULT_TOKEN", "mock_token")
	os.Setenv("VAULT_SECRET_PATH", "secret/data/my-app")

	mockHTTPClient := new(MockHTTPClient)
	jsonResponse := `{"other_field":"value"}`
	resp := &http.Response{
		StatusCode: 200,
		Body:       ioutil.NopCloser(bytes.NewBufferString(jsonResponse)),
		Header:     make(http.Header),
	}
	mockHTTPClient.On("Do", mock.AnythingOfType("*http.Request")).Return(resp, nil).Once()

	err := vault.LoadSecrets(mockHTTPClient)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "campo 'data' não encontrado na resposta do Vault")
	mockHTTPClient.AssertExpectations(t)
}

func TestLoadSecrets_NonStringValue(t *testing.T) {
	// Save original environment variables and restore them after the test
	originalVaultAddr := os.Getenv("VAULT_ADDR")
	originalVaultToken := os.Getenv("VAULT_TOKEN")
	originalSecretPath := os.Getenv("VAULT_SECRET_PATH")
	originalKey1 := os.Getenv("KEY1") // Save original KEY1

	defer func() {
		os.Setenv("VAULT_ADDR", originalVaultAddr)
		os.Setenv("VAULT_TOKEN", originalVaultToken)
		os.Setenv("VAULT_SECRET_PATH", originalSecretPath)
		os.Setenv("KEY1", originalKey1) // Restore original KEY1
	}()

	// Set up mock environment variables
	os.Setenv("VAULT_ADDR", "http://mock-vault:8200")
	os.Setenv("VAULT_TOKEN", "mock_token")
	os.Setenv("VAULT_SECRET_PATH", "secret/data/my-app")
	os.Unsetenv("KEY1") // Ensure KEY1 is unset before the test

	mockHTTPClient := new(MockHTTPClient)
	jsonResponse := `{"data":{"KEY1":123}}`
	resp := &http.Response{
		StatusCode: 200,
		Body:       ioutil.NopCloser(bytes.NewBufferString(jsonResponse)),
		Header:     make(http.Header),
	}
	mockHTTPClient.On("Do", mock.AnythingOfType("*http.Request")).Return(resp, nil).Once()

	err := vault.LoadSecrets(mockHTTPClient)
	assert.NoError(t, err)
	assert.Equal(t, "", os.Getenv("KEY1")) // Should not set non-string values
	mockHTTPClient.AssertExpectations(t)
}