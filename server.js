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

// Store active projects and their file locks
const projects = new Map();
const fileLocks = new Map();

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

  // Project-level events
  socket.on('join-project', ({ projectId, userId }) => {
    socket.join(`project_${projectId}`);
    
    if (!projects.has(projectId)) {
      projects.set(projectId, {
        participants: new Set(),
        files: new Map()
      });
    }
    
    const project = projects.get(projectId);
    project.participants.add(userId);
    
    socket.to(`project_${projectId}`).emit('user-joined-project', { userId });
    console.log(`User ${userId} joined project ${projectId}`);
  });

  socket.on('leave-project', ({ projectId, userId }) => {
    socket.leave(`project_${projectId}`);
    
    if (projects.has(projectId)) {
      const project = projects.get(projectId);
      project.participants.delete(userId);
      
      if (project.participants.size === 0) {
        projects.delete(projectId);
      }
    }
    
    socket.to(`project_${projectId}`).emit('user-left-project', { userId });
    console.log(`User ${userId} left project ${projectId}`);
  });

  // File-level events
  socket.on('join-file', ({ projectId, fileId, userId }) => {
    const fileRoom = `file_${projectId}_${fileId}`;
    socket.join(fileRoom);
    console.log(`User ${userId} joined file ${fileId} in project ${projectId}`);
  });

  socket.on('file-lock-acquired', ({ projectId, fileId, userId }) => {
    const lockKey = `${projectId}_${fileId}`;
    fileLocks.set(lockKey, { userId, timestamp: Date.now() });
    
    socket.to(`project_${projectId}`).emit('file-locked', { fileId, userId });
    console.log(`File ${fileId} locked by ${userId}`);
  });

  socket.on('file-lock-released', ({ projectId, fileId }) => {
    const lockKey = `${projectId}_${fileId}`;
    fileLocks.delete(lockKey);
    
    socket.to(`project_${projectId}`).emit('file-unlocked', { fileId });
    console.log(`File ${fileId} unlocked`);
  });

  socket.on('file-content-change', ({ projectId, fileId, content, userId }) => {
    const fileRoom = `file_${projectId}_${fileId}`;
    socket.to(fileRoom).emit('file-content-update', { fileId, content, userId });
  });

  socket.on('access-request-sent', ({ projectId, fileId, requestId, requesterId }) => {
    socket.to(`project_${projectId}`).emit('access-request-received', {
      fileId,
      requestId,
      requesterId
    });
  });

  socket.on('access-request-approved', ({ projectId, fileId, newEditorId }) => {
    socket.to(`project_${projectId}`).emit('access-transferred', { fileId, newEditorId });
  });

  socket.on('collaborator-added', ({ projectId, collaborator }) => {
    socket.to(`project_${projectId}`).emit('collaborator-joined', { collaborator });
  });

  socket.on('permission-updated', ({ projectId, userId, newPermission }) => {
    socket.to(`project_${projectId}`).emit('permission-changed', { userId, newPermission });
  });

  socket.on('file-cursor-change', ({ projectId, fileId, cursor, userId }) => {
    const fileRoom = `file_${projectId}_${fileId}`;
    socket.to(fileRoom).emit('cursor-update', { userId, cursor });
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