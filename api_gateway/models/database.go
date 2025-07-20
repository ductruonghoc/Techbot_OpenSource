package models

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq" // PostgreSQL driver
);

// initDB initializes the database connection pool.
func InitDB(dataSourceName string) (*sql.DB, error) {
	var err error

	// lazily open a connection to the database.
	db, err := sql.Open("postgres", dataSourceName);
	if err != nil {
		return nil, fmt.Errorf("error opening database: %w", err)
	}

	// Set connection pool parameters.
	// SetMaxOpenConns sets the maximum number of open connections to the database.
	db.SetMaxOpenConns(25)

	// SetMaxIdleConns sets the maximum number of connections in the idle
	db.SetMaxIdleConns(25)

	// SetConnMaxLifetime sets the maximum amount of time a connection may be reused.
	db.SetConnMaxLifetime(5 * time.Minute)

	// Ping the database to verify the connection.
	// Ping actually opens a connection if there isn't one already open.
	err = db.Ping()
	if err != nil {
		// If ping fails, close the database connection to release resources.
		db.Close()
		return nil, fmt.Errorf("couldn't hold db connection pool: %w", err)
	}

	log.Println("Successfully connected to PostgreSQL database!")
	DB = db // Assign the db to the global variable for use in other parts of the application.
	return db, nil
}

var DB *sql.DB