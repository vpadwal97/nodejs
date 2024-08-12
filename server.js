const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const HOST = '192.168.58.42';
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});

// Map to store rooms and their messages
const rooms = { roomId: "r", username: "u", message: [] };

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected');

  // Event handler for joining a room
  socket.on('joinRoom', (roomId, username) => {
    // Create room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    // Join the room
    socket.join(roomId);
    console.log(`${username} joined room ${roomId}`);
  });

  // Event handler for leaving a room
  socket.on('leaveRoom', (roomId, username) => {
    // Leave the room
    socket.leave(roomId);
    console.log(`${username} left room ${roomId}`);
  });

  // Event handler for receiving messages
  socket.on('sendMessage', ({ roomId, username, message }) => {
    // Push message to the room
    if (rooms[roomId]) {
      rooms[roomId].push({ username, message });
      console.log(`message to :- ${roomId}, ${username}, ${message}`);
      // Broadcast the message to all users in the room
      io.to(roomId).emit('message', { roomId, username, message });
      console.log(`rooms :- ${rooms}`);
    }
  });

  socket.on('message', ({ roomId, username, message }) => {
    // Push message to the room
    if (rooms[roomId]) {
      rooms[roomId].push({ username, message });
      console.log(`message wala to :- ${roomId}, ${username}, ${message}`);
      // Broadcast the message wala to all users in the room
      io.to(roomId).emit('message', { roomId,username, message });
      console.log(`message wala to :- ${roomId}, ${username}, ${message}`);
    }
  });


  // Event handler for disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

