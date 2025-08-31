const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'LineCraft Socket.IO Server is running',
    rooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "https://loving-bear-20.lovable.app",
      "https://linecraft.lovable.app",
      /https:\/\/.*\.lovable\.dev$/,
      /https:\/\/.*\.sandbox\.lovable\.dev$/
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store active rooms and their participants
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected to LineCraft:', socket.id);

  socket.on('join-room', (roomId) => {
    console.log(`User ${socket.id} joining room ${roomId}`);
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: new Map(),
        code: '',
        language: 'javascript',
        createdAt: new Date().toISOString()
      });
      console.log(`Created new room: ${roomId}`);
    }
    
    const room = rooms.get(roomId);
    room.participants.set(socket.id, {
      id: socket.id,
      name: `User-${socket.id.slice(0, 6)}`,
      email: `user-${socket.id.slice(0, 6)}@linecraft.dev`,
      joinedAt: new Date().toISOString(),
      cursor: { line: 1, column: 1 }
    });
    
    // Send current room state to the new participant
    socket.emit('room-state', {
      code: room.code,
      language: room.language,
      participants: Array.from(room.participants.values())
    });
    
    // Notify others about new participant and send updated participants list
    const participantsList = Array.from(room.participants.values());
    socket.to(roomId).emit('user-joined', {
      id: socket.id,
      name: `User-${socket.id.slice(0, 6)}`,
      email: `user-${socket.id.slice(0, 6)}@linecraft.dev`,
      joinedAt: new Date().toISOString()
    });
    
    // Send updated participants list to all users in room
    io.to(roomId).emit('participants-update', participantsList);
    
    console.log(`Room ${roomId} now has ${room.participants.size} participants`);
  });

  socket.on('code-change', ({ roomId, code }) => {
    console.log(`Code change in room ${roomId} from ${socket.id}`);
    
    // Update room code
    if (rooms.has(roomId)) {
      rooms.get(roomId).code = code;
      rooms.get(roomId).lastUpdated = new Date().toISOString();
    }
    
    // Broadcast to all other users in the room
    socket.to(roomId).emit('code-change', code);
  });

  socket.on('cursor-change', ({ roomId, cursor }) => {
    console.log(`Cursor change in room ${roomId} from ${socket.id}:`, cursor);
    
    // Update participant cursor position
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      if (room.participants.has(socket.id)) {
        room.participants.get(socket.id).cursor = cursor;
      }
    }
    
    // Broadcast cursor position to all other users in the room
    socket.to(roomId).emit('cursor-change', {
      userId: socket.id,
      cursor
    });
  });

  socket.on('language-change', ({ roomId, language }) => {
    console.log(`Language change in room ${roomId} to ${language} from ${socket.id}`);
    
    // Update room language
    if (rooms.has(roomId)) {
      rooms.get(roomId).language = language;
      rooms.get(roomId).lastUpdated = new Date().toISOString();
    }
    
    // Broadcast to all other users in the room
    socket.to(roomId).emit('language-change', language);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from LineCraft:', socket.id);
    
    // Remove user from all rooms
    rooms.forEach((room, roomId) => {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id);
        socket.to(roomId).emit('user-left', socket.id);
        
        // Send updated participants list to remaining users
        const participantsList = Array.from(room.participants.values());
        socket.to(roomId).emit('participants-update', participantsList);
        
        console.log(`User ${socket.id} left room ${roomId}`);
        
        // Clean up empty rooms after 5 minutes
        if (room.participants.size === 0) {
          setTimeout(() => {
            if (rooms.has(roomId) && rooms.get(roomId).participants.size === 0) {
              rooms.delete(roomId);
              console.log(`Cleaned up empty room: ${roomId}`);
            }
          }, 5 * 60 * 1000); // 5 minutes
        }
      }
    });
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Periodic cleanup of old empty rooms
setInterval(() => {
  const now = new Date();
  rooms.forEach((room, roomId) => {
    if (room.participants.size === 0) {
      const roomAge = now - new Date(room.createdAt);
      if (roomAge > 30 * 60 * 1000) { // 30 minutes
        rooms.delete(roomId);
        console.log(`Cleaned up old empty room: ${roomId}`);
      }
    }
  });
}, 10 * 60 * 1000); // Check every 10 minutes

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`LineCraft Socket.IO server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down LineCraft server gracefully...');
  server.close(() => {
    console.log('LineCraft server closed');
    process.exit(0);
  });
});