package main

import (
	"encoding/json"
    "fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true // Allow all for now, dev/prod mix
    },
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub *Hub

	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send chan []byte

    userId string
}

// readPump pumps messages from the websocket connection to the hub.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		// In a real app, we would process/save message here before broadcasting
        // For this demo, we just echo/broadcast to Hub
        
        // We can parse here to handle routing logic in Hub better
        // But for now, just forward to Hub to broadcast (or route)
        
        // Let's implement basic routing here:
        var msgObj map[string]interface{}
        if err := json.Unmarshal(message, &msgObj); err == nil {
             if receiverIdFloat, ok := msgObj["receiverId"].(float64); ok {
                 receiverId := int(receiverIdFloat)
                 senderIdStr := c.userId
                 // Convert senderId to int
                 var senderId int
                 fmt.Sscanf(senderIdStr, "%d", &senderId)

                 content, _ := msgObj["content"].(string)

                 // Save to DB
                 id, createdAt, err := saveMessage(senderId, receiverId, content)
                 if err != nil {
                     log.Printf("Error saving message: %v", err)
                     continue 
                 }

                 // Augment message with ID and timestamp for the frontend
                 msgObj["id"] = id
                 msgObj["createdAt"] = createdAt
                 msgObj["senderId"] = senderId
                 
                 // Re-marshal to send proper JSON with ID
                 finalMsg, _ := json.Marshal(msgObj)

                 c.hub.broadcast <- finalMsg
             }
        }
	}
}

// writePump pumps messages from the hub to the websocket connection.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// serveWs handles websocket requests from the peer.
func serveWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
    userId := r.URL.Query().Get("userId")
    if userId == "" {
        http.Error(w, "UserId required", http.StatusBadRequest)
        return
    }

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{hub: hub, conn: conn, send: make(chan []byte, 256), userId: userId}
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
}
