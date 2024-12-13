import { WebSocket, WebSocketServer } from "ws";

interface User {
    socket: WebSocket;
    room: string;
    id: string;
}

interface Room {
    name: string;
    messages: { userId: string; content: string }[];
    userCount: number; // Track the number of users in the room
}

const wss = new WebSocketServer({ port: 8080 });

let users: User[] = [];
let rooms: Room[] = [];

wss.on("connection", (socket) => {
    let userId: string = '';
    console.log("New connection.");

    socket.on("message", (message) => {
        try {
            const parsedMessage = JSON.parse(message.toString());

            if (parsedMessage.type === "joinRoom") {
                const { room } = parsedMessage;

                // Find or create the room
                let roomData = rooms.find((r) => r.name === room);
                if (!roomData) {
                    roomData = { name: room, messages: [], userCount: 0 }; // Initialize userCount
                    rooms.push(roomData);
                }

                // Increment user count for the room
                roomData.userCount++;
                userId = `user-${roomData.userCount}`; // Assign user ID as user-1, user-2, etc.

                // Add the user to the users list
                let user = users.find((u) => u.socket === socket);
                if (user) {
                    user.room = room; // Update room if the user is already connected
                } else {
                    users.push({ socket, room, id: userId });
                }

                console.log(`${userId} joined room: ${room}, total users: ${roomData.userCount}`);

                // Send the room's message history to the user
                socket.send(
                    JSON.stringify({
                        type: "history",
                        messages: roomData.messages,
                    })
                );

                // Notify the user they have joined
                socket.send(
                    JSON.stringify({
                        type: "system",
                        message: `You joined room ${room} as ${userId}`,
                        userId,
                    })
                );
            } else if (parsedMessage.type === "message") {
                const { room, content } = parsedMessage;

                // Find the sender
                const sender = users.find((user) => user.socket === socket);

                if (!sender) {
                    console.error("Message received from an unknown user.");
                    return;
                }

                // Find the room
                const roomData = rooms.find((r) => r.name === room);
                if (!roomData) {
                    console.error(`Room ${room} does not exist.`);
                    return;
                }

                // Save the message in the room's history
                const newMessage = { userId: sender.id, content };
                roomData.messages.push(newMessage);

                // Broadcast the message to all users in the room
                users.forEach((user) => {
                    if (user.room === room) {
                        user.socket.send(
                            JSON.stringify({
                                type: "message",
                                room,
                                content,
                                userId: sender.id,
                            })
                        );
                    }
                });

                console.log(`Message in room ${room} from ${sender.id}: ${content}`);
            } else if (parsedMessage.type === "createRoom") {
                console.log("A new room is being created.");

                // Create a new unique room code
                const roomCode = `room-${Math.floor(Math.random() * 10000)}`;

                // Create the new room in the backend with initial user count as 0
                const newRoom = { name: roomCode, messages: [], userCount: 0 };
                rooms.push(newRoom);

                // Notify all connected clients about the new room creation
                wss.clients.forEach((client) => {
                    client.send(
                        JSON.stringify({
                            type: "system",
                            message: `Room ${roomCode} has been created.`,
                        })
                    );
                });

                // Optionally, send this new room data to all connected users
                wss.clients.forEach((client) => {
                    client.send(
                        JSON.stringify({
                            type: "roomCreated",
                            roomCode: roomCode,
                        })
                    );
                });
            }
        } catch (err) {
            console.error("Error processing message:", err);
        }
    });

    socket.on("close", () => {
        console.log(`User ${userId} disconnected.`);

        // Find the user who disconnected
        const user = users.find((u) => u.socket === socket);
        if (user) {
            const roomData = rooms.find((r) => r.name === user.room);
            if (roomData) {
                // Decrease the user count for the room
                roomData.userCount--;
                console.log(`User left room: ${user.room}, remaining users: ${roomData.userCount}`);
            }

            // Remove the user from the users list
            users = users.filter((u) => u.socket !== socket);
        }
    });
});

console.log("WebSocket server is running on ws://localhost:8080");
