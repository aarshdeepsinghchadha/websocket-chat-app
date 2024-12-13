import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const App = () => {
  const [roomCode, setRoomCode] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<{ userId: string; content: string }[]>([]);
  const [message, setMessage] = useState<string>("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    if (ws) {
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "message") {
                setChatMessages((prev) => [...prev, { userId: data.userId, content: data.content }]);
            } else if (data.type === "system") {
                console.log(data.message);
                if (data.userId) {
                    setUserId(data.userId);
                }
            } else if (data.type === "history") {
                setChatMessages(data.messages);
            } else if (data.type === "roomCreated") {
                // Update room code once room is created
                setRoomCode(data.roomCode);
                console.log(`New room created with code: ${data.roomCode}`);
            }
        };

        ws.onclose = () => {
            console.log("Disconnected from WebSocket server.");
            setConnected(false);
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    }
}, [ws]);


  // Connect to the room
  const connectToRoom = (code: string) => {
    const socket = new WebSocket("ws://localhost:8080");
    setWs(socket);

    socket.onopen = () => {
      console.log(`Connected to WebSocket server. Joining room: ${code}`);
      setConnected(true);
      socket.send(JSON.stringify({ type: "joinRoom", room: code }));
    };
  };

  // Send a message to the current room
  const sendMessage = () => {
    if (ws && connected && message.trim() !== "") {
      ws.send(
        JSON.stringify({
          type: "message",
          room: roomCode,
          content: message,
        })
      );
      setMessage("");
    }
  };

  const createRoom = () => {
    // Generate a new room code
    const code = uuidv4().slice(0, 6).toUpperCase();
    setRoomCode(code);
    setUserId("");  // Reset userId when creating a new room
    setChatMessages([]);  // Clear chat messages when creating a new room

    // Send message to the backend that the user wants to join the new room
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log("Creating room...");
        
        // Send message to create the new room
        ws.send(JSON.stringify({ type: "createRoom" }));
        
        // Set connected state to true once the room is created
        setConnected(true);
        console.log(`Created and joined room with code: ${code}`);
    }
};

  

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        {!connected ? (
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-2xl font-bold">Chat App</h1>
            <button
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              onClick={createRoom}
            >
              Create Room
            </button>
            <div className="flex items-center w-full">
              <input
                type="text"
                placeholder="Enter Room Code"
                className="flex-1 border rounded-l px-4 py-2"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              />
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-r hover:bg-green-600"
                onClick={() => connectToRoom(roomCode)}
              >
                Join Room
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <h2 className="text-xl font-bold">Room: {roomCode}</h2>
            <h3 className="text-sm text-gray-600">You are: {userId}</h3>
            <div className="h-64 border rounded overflow-y-scroll p-4 bg-gray-50">
              {chatMessages.length > 0 ? (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className="text-sm mb-2">
                    <strong>{msg.userId}:</strong> {msg.content}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No messages yet.</p>
              )}
            </div>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 border rounded-l px-4 py-2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
