package main

import (
	"fmt"
	"log"
	"notifications/internal/infrastructure/vault"
	"notifications/internal/infrastructure/rabbitmq"
	"os"
)

func main() {
	fmt.Println("[NOTIFICATION] Iniciando serviço de notificações...")

	err := vault.LoadSecrets()
	if err != nil {
		log.Fatalf("[VAULT] Falha ao carregar segredos: %s", err)
		os.Exit(1)
	}

	rabbitmq.StartConsumer()
}
