package main

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var db *sql.DB

func initDB() {
	var err error
    connStr := os.Getenv("DATABASE_URL")
    if connStr == "" {
        // Fallback or error
        log.Fatal("DATABASE_URL environment variable is required")
    }

    // Force disable SSL for internal docker connection
    if os.Getenv("DATABASE_SSL_MODE") != "require" {
        connStr += "?sslmode=disable"
    }

	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Connected to the database")
}

func saveMessage(senderId int, receiverId int, content string) (int, string, error) {
    var id int
    var createdAt string
    // "Message" table name must match Prisma's generated table name. 
    // Prisma usually capitalizes models but PostgreSQL tables are often lowercase if mapped that way.
    // However, Prisma default for 'model Message' is 'Message' (case sensitive if quoted) or 'Message' in public schema.
    // The previous error said `public.Message` does not exist (until we synced).
    // Let's assume table name "Message" with columns "senderId", "receiverId", "content", "createdAt"
    
    query := `
        INSERT INTO "Message" ("senderId", "receiverId", "content", "createdAt")
        VALUES ($1, $2, $3, NOW())
        RETURNING "id", "createdAt"
    `
    // We need to verify if column names are camelCase or snake_case.
    // Prisma default maps fields as is. So "senderId" is likely "senderId".
    
    log.Printf("Saving message from %d to %d: %s", senderId, receiverId, content)
    err := db.QueryRow(query, senderId, receiverId, content).Scan(&id, &createdAt)
    if err != nil {
        log.Printf("DB Insert Error: %v", err)
        return 0, "", err
    }
    log.Printf("Message saved with ID: %d", id)
    return id, createdAt, nil
}
