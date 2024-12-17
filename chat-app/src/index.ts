import { WebSocket, WebSocketServer } from "ws";

interface User {
  id: string;
  name: string;
  socket: WebSocket;
  room: string;
}

interface Room {
  code: string;
  messages: { userName: string; content: string }[];
  users: User[];
}

const wss = new WebSocketServer({ port: 8080 });

const users: Map<WebSocket, User> = new Map();
const rooms: Map<string, Room> = new Map();

const generateRoomCode = () =>
  Math.random().toString(36).substr(2, 6).toUpperCase();

wss.on("connection", (socket) => {
  console.log("New connection.");

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case "createRoom": {
          if (!data.name || typeof data.name !== "string") {
            return socket.send(
              JSON.stringify({
                type: "error",
                message: "Invalid name provided.",
              })
            );
          }

          const userId = `user-${Math.random().toString(36).substr(2, 5)}`;
          const roomCode = generateRoomCode();
          const room: Room = { code: roomCode, messages: [], users: [] };

          rooms.set(roomCode, room);

          const user: User = {
            id: userId,
            name: data.name,
            socket,
            room: roomCode,
          };
          room.users.push(user);
          users.set(socket, user);

          console.log(`Room created: ${roomCode} by ${user.name}`);
          socket.send(
            JSON.stringify({
              type: "roomCreated",
              roomCode,
              userId,
              message: `Room ${roomCode} created. Share this code to invite others.`,
              usersCount: room.users.length,
            })
          );
          break;
        }

        case "joinRoom": {
          const roomToJoin = rooms.get(data.roomCode.toUpperCase());

          if (!roomToJoin) {
            return socket.send(
              JSON.stringify({ type: "error", message: "Room does not exist." })
            );
          }
          if (!data.name || typeof data.name !== "string") {
            return socket.send(
              JSON.stringify({
                type: "error",
                message: "Invalid name provided.",
              })
            );
          }

          const userId = `user-${Math.random().toString(36).substr(2, 5)}`;
          const user: User = {
            id: userId,
            name: data.name,
            socket,
            room: roomToJoin.code,
          };
          roomToJoin.users.push(user);
          users.set(socket, user);

          console.log(`${user.name} joined room: ${roomToJoin.code}`);
          socket.send(
            JSON.stringify({
              type: "joinedRoom",
              roomCode: roomToJoin.code,
              userId,
              message: `Welcome to the room ${roomToJoin.code}.`,
              history: roomToJoin.messages,
              usersCount: roomToJoin.users.length,
            })
          );

          roomToJoin.users.forEach((u) => {
            u.socket.send(
              JSON.stringify({
                type: "userCountUpdate",
                usersCount: roomToJoin.users.length,
              })
            );
          });
          break;
        }

        case "message": {
          const user = users.get(socket);
          if (!user) return;

          const room = rooms.get(user.room);
          if (!room) return;

          const newMessage = {
            userName: user.name,
            content: data.content,
          };
          room.messages.push(newMessage);

          room.users.forEach((u) => {
            u.socket.send(
              JSON.stringify({
                type: "message",
                userName: user.name,
                content: data.content,
              })
            );
          });
          break;
        }

        case "leaveRoom": {
          const user = users.get(socket);
          if (user) {
            const room = rooms.get(user.room);
            if (room) {
              room.users = room.users.filter((u) => u.socket !== socket);
              if (room.users.length === 0) {
                rooms.delete(room.code);
                console.log(`Room ${room.code} deleted.`);
                room.users.forEach((u) => {
                  u.socket.send(
                    JSON.stringify({
                      type: "system",
                      message: `Room ${room.code} has been deleted because you're the last user.`,
                    })
                  );
                });
              } else {
                room.users.forEach((u) =>
                  u.socket.send(
                    JSON.stringify({
                      type: "system",
                      message: `${user.name} has left the room.`,
                    })
                  )
                );
              }
            }
            users.delete(socket);
            socket.send(
              JSON.stringify({
                type: "system",
                message: "You have left the room.",
              })
            );
          }
          break;
        }

        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (err) {
      console.error("Error processing message:", err);
      socket.send(
        JSON.stringify({
          type: "error",
          message: "An error occurred while processing your request.",
        })
      );
    }
  });

  socket.on("close", () => {
    const user = users.get(socket);
    if (user) {
      const room = rooms.get(user.room);
      if (room) {
        room.users = room.users.filter((u) => u.socket !== socket);
        if (room.users.length === 0) {
          rooms.delete(room.code);
          console.log(`Room ${room.code} deleted.`);
        } else {
          room.users.forEach((u) => {
            u.socket.send(
              JSON.stringify({
                type: "userCountUpdate",
                usersCount: room.users.length,
              })
            );
          });
        }
      }
      users.delete(socket);
    }
    console.log("Connection closed.");
  });

  socket.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
