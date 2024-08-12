const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const cors = require('cors');
const indexRouter = require('./routes/index');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Use the router for handling routes
app.use('/', indexRouter);

// Handle Socket.io connections
const rooms = {}; // Map to store rooms and their messages

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

  // Event handler for sending messages
  socket.on('sendMessage', ({ roomId, username, message }) => {
    // Push message to the room
    if (rooms[roomId]) {
      rooms[roomId].push({ username, message });
      console.log(`Message to room ${roomId}: ${username} says ${message}`);
      // Broadcast the message to all users in the room
      io.to(roomId).emit('message', { roomId, username, message });
    }
  });

  // Event handler for generic message events (if needed)
  socket.on('message', ({ roomId, username, message }) => {
    if (rooms[roomId]) {
      rooms[roomId].push({ username, message });
      console.log(`Message in room ${roomId}: ${username} says ${message}`);
      io.to(roomId).emit('message', { roomId, username, message });
    }
  });

  // Event handler for disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Catch-all route for handling 404 errors
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Port and Host configuration
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Save messages to JSON file when the server shuts down
const saveMessages = () => {
  try {
    fs.writeFileSync('./messages.json', JSON.stringify(rooms, null, 2));
  } catch (err) {
    console.error('Error saving messages:', err);
  }
};

// Handle graceful shutdown
process.on('SIGINT', saveMessages);
process.on('SIGTERM', saveMessages);
