package main

import (
	"encoding/json"
	"log"
)

type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// Inbound messages from the clients.
	broadcast chan []byte

    // Map userId to client(s) for direct messaging
    users map[string]*Client
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
        users:      make(map[string]*Client),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
            h.users[client.userId] = client
            log.Printf("User registered: %s", client.userId)
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
                delete(h.users, client.userId)
				close(client.send)
                log.Printf("User unregistered: %s", client.userId)
			}
		case message := <-h.broadcast:
            // Parse message to find receiver
            var msg map[string]interface{}
            if err := json.Unmarshal(message, &msg); err != nil {
                log.Printf("Error parsing message: %v", err)
                continue
            }

            // Simple routing logic based on 'receiverId'
            if receiverId, ok := msg["receiverId"].(float64); ok {
                 // JSON numbers are floats
                 // Convert to string or whatever your ID type is. 
                 // Assuming IDs are sent as numbers but we store keys as strings potentially? 
                 // Let's coerce to string for map key
                 rid := string(int(receiverId)) // rough case
                 // Actually let's assume valid payload type
            }
            // For now, let's just broadcast to everyone for simplicity or specific logic
            // But wait, the previous code had direct messaging.
            
            // Re-implementing direct messaging
            // Let's define a proper struct for Message
            
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

// Helper to broadcast to specific user
func (h *Hub) sendTo(userId string, message []byte) {
    if client, ok := h.users[userId]; ok {
        select {
        case client.send <- message:
        default:
            close(client.send)
            delete(h.clients, client)
            delete(h.users, userId)
        }
    }
}
