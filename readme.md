# WebSocket Chat Application

### Try it here : [pingroom.com](https://pingroom.netlify.app/)

## Overview

This is a real-time chat application that leverages WebSockets for communication between users. It has two main components:

1. **Backend**: Built using Node.js and WebSocket for handling real-time messaging and room management.
2. **Frontend**: A React app using TypeScript and Tailwind CSS to provide a sleek and responsive UI for users to interact with.

### Key Features:

- Users can create or join chat rooms.
- Real-time message exchange between users.
- User count in each room updates live.
- Room creation with a unique code for sharing.
- Option to leave a room, with automatic room deletion if no users remain.

## Requirements

- Node.js (backend)
- React, TypeScript (frontend)
- Tailwind CSS for styling
- WebSocket protocol for real-time communication

---

## Backend (Node.js)

The backend is a WebSocket server that facilitates communication between clients. It handles multiple rooms, message broadcasting, and user management.

### How it works:

- **Rooms**: When a user creates a room, a unique room code is generated. Other users can join the room using this code.
- **Messages**: Messages sent by users are broadcasted to all users in the room.
- **User Count**: The server tracks the number of users in each room and updates all connected users in real-time.
- **Room Deletion**: If the last user leaves a room, the server deletes the room.

### Starting the Backend:

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the WebSocket server:
   ```bash
   npm run dev
   ```
   The server will start on `ws://localhost:8080`.

---

## Frontend (React)

The frontend is a React app with TypeScript that provides the user interface. It allows users to input their name, create or join a room, send messages, and view the real-time chat history.

### Key Components:

- **Room Creation**: Users can create a room by entering their name. A unique room code is generated.
- **Joining Room**: Users can join an existing room using a room code.
- **Messaging**: Users can send messages to the chat room, which are broadcasted to all members of the room.
- **Leave Room**: Users can leave the room, and if they are the last user, the room will be destroyed.

### Starting the Frontend:

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React app:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

---

## Running Both Backend and Frontend

1. Start the backend server using `npm start` inside the backend folder.
2. Start the frontend app using `npm start` inside the frontend folder.
3. Open `http://localhost:3000` in a web browser to interact with the chat.

---

## Code Walkthrough

### Backend Code:

- The backend uses the `ws` library to create a WebSocket server.
- **Room Creation**: When a user sends a "createRoom" message, a new room is generated with a unique code. The user is assigned to this room.
- **Room Joining**: Users can join a room by sending a "joinRoom" message with a room code. If the room exists, the user joins and the chat history is sent to the user.
- **Message Broadcasting**: When a user sends a message, it is broadcasted to all other users in the same room.
- **User Count Management**: Each time a user joins or leaves a room, the user count is updated and sent to all other users in the room.
- **Room Deletion**: If the last user leaves, the room is deleted.

### Frontend Code:

- **WebSocket Connection**: The frontend connects to the backend WebSocket server on `ws://localhost:8080`.
- **UI**: The user interface is styled with Tailwind CSS and displays real-time messages, room code, and user count.
- **State Management**: React's `useState` and `useEffect` hooks are used to manage the UI state, such as name input, room code, messages, and user count.
- **Toast Notifications**: Real-time feedback is provided to users with toast notifications for actions like room creation, message sending, errors, etc.
- **Modal**: A confirmation modal prompts users to confirm if they want to leave the room, especially when the room is about to be destroyed.

---

## Technology Stack

- **Backend**: Node.js, WebSocket
- **Frontend**: React, TypeScript, Tailwind CSS
- **Styling**: Tailwind CSS for responsive design and modern UI elements.
- **State Management**: React's built-in hooks for managing state and side-effects.
- **Real-Time Communication**: WebSocket protocol for low-latency, bi-directional communication.

---

## License

This project is licensed under the MIT License.
