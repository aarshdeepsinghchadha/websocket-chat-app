# Chat Application - README

## Overview
This chat application backend is built using Node.js and WebSocket. It facilitates real-time communication between users by enabling them to join rooms, send messages, and receive updates instantly. Each user interacts with the server over a WebSocket connection, which ensures low-latency, bidirectional communication.

## Key Features
- **Real-time messaging**: Users can send and receive messages in real-time.
- **Room management**: Users can create, join, and communicate in specific chat rooms.
- **Message history**: Each room maintains a history of messages, which is sent to users when they join.
- **Dynamic user and room tracking**: Tracks active users and rooms with efficient management.

## Architecture
The backend uses the `ws` library for WebSocket support. The server manages a list of users and rooms to handle messaging and room-specific interactions efficiently.

### Main Components
- **WebSocket Server**: Listens for incoming WebSocket connections on port `8080`.
- **Users**: Each user is identified by a unique ID and associated with a specific room.
- **Rooms**: A logical grouping where users can send and receive messages. Each room has a message history and tracks the number of active users.

---

## Code Explanation
### Initialization
The WebSocket server is initialized with the `ws` library:
```javascript
const wss = new WebSocketServer({ port: 8080 });
```

### Data Structures
1. **Users**: An array of user objects, each containing:
   - `socket`: The WebSocket connection object.
   - `room`: The room the user has joined.
   - `id`: A unique identifier for the user.

2. **Rooms**: An array of room objects, each containing:
   - `name`: The unique name of the room.
   - `messages`: An array of message objects with `userId` and `content`.
   - `userCount`: The number of users currently in the room.

### WebSocket Connection Handling
#### New Connection
When a client connects, the server logs the connection:
```javascript
wss.on("connection", (socket) => {
    console.log("New connection.");
    // Connection-specific logic follows...
});
```

#### Message Handling
The server listens for incoming messages, parses them, and performs actions based on the message type:

##### Join Room
- A user can join a room by sending a message with type `joinRoom`.
- The server:
  1. Finds or creates the room.
  2. Assigns the user a unique ID.
  3. Updates the room's user count and adds the user to the `users` list.
  4. Sends the room's message history and a system notification to the user.

Example code:
```javascript
if (parsedMessage.type === "joinRoom") {
    const { room } = parsedMessage;
    let roomData = rooms.find((r) => r.name === room) || { name: room, messages: [], userCount: 0 };
    roomData.userCount++;
    userId = `user-${roomData.userCount}`;
    users.push({ socket, room, id: userId });
    socket.send(JSON.stringify({ type: "history", messages: roomData.messages }));
}
```

##### Send Message
- A user sends a message with type `message`.
- The server:
  1. Validates the user and room.
  2. Adds the message to the room's history.
  3. Broadcasts the message to all users in the room.

Example code:
```javascript
if (parsedMessage.type === "message") {
    const { room, content } = parsedMessage;
    const sender = users.find((user) => user.socket === socket);
    const roomData = rooms.find((r) => r.name === room);
    const newMessage = { userId: sender.id, content };
    roomData.messages.push(newMessage);
    users.forEach((user) => {
        if (user.room === room) {
            user.socket.send(JSON.stringify({ type: "message", room, content, userId: sender.id }));
        }
    });
}
```

##### Create Room
- A user can create a new room by sending a message with type `createRoom`.
- The server generates a unique room name, adds it to the `rooms` list, and broadcasts the new room to all clients.

Example code:
```javascript
if (parsedMessage.type === "createRoom") {
    const roomCode = `room-${Math.floor(Math.random() * 10000)}`;
    rooms.push({ name: roomCode, messages: [], userCount: 0 });
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({ type: "roomCreated", roomCode }));
    });
}
```

#### Connection Closure
When a user disconnects, the server:
1. Identifies the user.
2. Decrements the room's user count.
3. Removes the user from the `users` list.

Example code:
```javascript
socket.on("close", () => {
    const user = users.find((u) => u.socket === socket);
    if (user) {
        const roomData = rooms.find((r) => r.name === user.room);
        roomData.userCount--;
        users = users.filter((u) => u.socket !== socket);
    }
});
```

---

## How to Run the Server
1. Install dependencies:
   ```bash
   npm install ws
   ```
2. Start the server:
   ```bash
   node server.js
   ```
3. The WebSocket server will run on `ws://localhost:8080`.

