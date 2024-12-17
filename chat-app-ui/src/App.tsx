import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "react-modal";

Modal.setAppElement("#root");

const App = () => {
  const [name, setName] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<
    { userName: string; content: string }[]
  >([]);
  const [message, setMessage] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldDestroyRoom, setShouldDestroyRoom] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080");

    ws.current.onopen = () => {
      toast.success("Connected to the server successfully!");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "roomCreated":
          setRoomCode(data.roomCode);
          setConnected(true);
          setUsersCount(data.usersCount || 1);
          setLoading(false);
          toast.success("Room created successfully!");
          break;

        case "joinedRoom":
          setRoomCode(data.roomCode);
          setChatMessages(data.history);
          setUsersCount(data.usersCount || 1);
          setConnected(true);
          setLoading(false);
          toast.success("Joined the room successfully!");
          break;

        case "message":
          setChatMessages((prev) => [
            ...prev,
            { userName: data.userName, content: data.content },
          ]);
          break;

        case "userCountUpdate":
          setUsersCount(data.usersCount);
          break;

        case "error":
          toast.error(data.message);
          setLoading(false);
          break;

        case "system":
          toast.info(data.message);
          break;

        default:
          console.log("Unknown message type:", data.type);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected.");
      setConnected(false);
      toast.info("Disconnected from the server.");
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const createRoom = () => {
    if (ws.current && name.trim()) {
      setLoading(true);
      ws.current.send(JSON.stringify({ type: "createRoom", name }));
    } else {
      toast.error("Please enter a valid name to create a room.");
    }
  };

  const joinRoom = () => {
    if (ws.current && name.trim() && roomCode.trim()) {
      setLoading(true);
      ws.current.send(JSON.stringify({ type: "joinRoom", name, roomCode }));
    } else {
      toast.error("Please enter both a valid name and room code.");
    }
  };

  const leaveRoom = () => {
    if (usersCount === 1) {
      setShouldDestroyRoom(true);
      setIsModalOpen(true);
    } else {
      if (ws.current) {
        ws.current.send(JSON.stringify({ type: "leaveRoom" }));
        setConnected(false);
        setRoomCode("");
        setChatMessages([]);
        toast.success("You left the room.");
      }
    }
  };

  const confirmLeaveRoom = () => {
    if (shouldDestroyRoom) {
      if (ws.current) {
        ws.current.send(JSON.stringify({ type: "leaveRoom" }));
        setConnected(false);
        setRoomCode("");
        setChatMessages([]);
        toast.success("You left the room. The room has been destroyed.");
      }
    } else {
      setIsModalOpen(false);
    }

    setShouldDestroyRoom(false);
  };

  return (
    <div className="min-h-screen bg-external flex items-center justify-center p-4">
      <div
        className={`w-full max-w-2xl bg-chatbox p-6 rounded-lg shadow-md ${
          connected ? "h-[52rem]" : ""
        }`}
      >
        <ToastContainer position="bottom-right" autoClose={2000} />
        <div className="heading-section flex flex-col sm:flex-row justify-between items-center">
          <div className="text-left">
            <h1 className="text-2xl font-bold flex items-center">
              <FontAwesomeIcon icon={faWhatsapp} className="mr-2" />
              PingRoom
            </h1>
            <h3 className="text-base mt-1">Temporary Mini Real-Time Chat</h3>
          </div>

          {connected && (
            <button
              onClick={leaveRoom}
              className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 mt-4 sm:mt-0"
            >
              Leave Room
            </button>
          )}
        </div>

        {/* Chat Section */}
        {!connected ? (
          <div>
            <input
              type="text"
              placeholder="Your Name"
              className="w-full border px-4 py-2 rounded mt-5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter Room Code"
              className="w-full border px-4 py-2 rounded mt-2"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />
            <div className="flex items-center space-x-2 mt-5">
              <button
                onClick={createRoom}
                disabled={loading}
                className={`w-full py-2 rounded ${
                  loading
                    ? "bg-buttonSecondaryColor cursor-not-allowed"
                    : "bg-buttonColor text-white hover:bg-buttonSecondaryColor"
                }`}
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
              <button
                onClick={joinRoom}
                disabled={loading}
                className={`w-full py-2 rounded ${
                  loading
                    ? "bg-buttonSecondaryColor cursor-not-allowed"
                    : "bg-buttonColor text-white hover:bg-buttonSecondaryColor"
                }`}
              >
                {loading ? "Joining..." : "Join Room"}
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-section">
            <div className="flex justify-between items-center mt-4 bg-innerchat opacity-50 rounded-xl p-2 shadow-md">
              <div className="subtitle">
                <div className="flex items-center space-x-2">
                  <h2 className="text-l font-bold">Room Code : {roomCode}</h2>
                  <FontAwesomeIcon
                    icon={faCopy}
                    className="cursor-pointer text-gray-600 hover:text-gray-800"
                    onClick={() => {
                      navigator.clipboard.writeText(roomCode);
                      toast.success("Room code copied to clipboard!");
                    }}
                  />
                </div>
              </div>
              <span className="text-md font-bold text-black">
                Users: {usersCount}
              </span>
            </div>

            <div className="h-[30rem] sm:h-[25rem] md:h-[30rem] overflow-y-auto p-4 bg-white rounded-2xl mt-6">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="mb-2">
                  <span className="font-semibold">{msg.userName}: </span>
                  <div className="content bg-innerchat rounded p-2 w-[50%] break-words">
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-4 mt-6">
              <input
                type="text"
                placeholder="Type a message"
                className="flex-1 border px-4 py-2 rounded-xl bg-white text-sm sm:text-base"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                onClick={() => {
                  if (ws.current && message.trim()) {
                    ws.current.send(
                      JSON.stringify({
                        type: "message",
                        roomCode,
                        content: message,
                      })
                    );
                    setMessage("");
                  }
                }}
                className="bg-buttonColor text-white px-4 py-2 w-32 rounded-md hover:bg-buttonSecondaryColor sm:w-36 md:w-40"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="bg-white p-6 rounded-lg shadow-lg w-full sm:w-3/4 md:w-1/3 mx-auto mt-0 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        overlayClassName="fixed inset-0 bg-transparent" // Remove default overlay background
      >
        <h2 className="text-xl font-bold mb-4">
          Are you sure you want to leave the room?
        </h2>
        <p className="mb-4">
          If you leave and you are the only user in the room, the room will be
          destroyed.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setShouldDestroyRoom(true);
              confirmLeaveRoom();
              setIsModalOpen(false);
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-md w-full hover:bg-red-600"
          >
            Yes
          </button>
          <button
            onClick={() => {
              setIsModalOpen(false);
              setShouldDestroyRoom(false);
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded-md w-full hover:bg-gray-600"
          >
            No
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default App;
