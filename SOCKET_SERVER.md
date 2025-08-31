# Line Craft Socket.IO Server

This document explains how to set up a Socket.IO server for Line Craft's real-time collaboration features.

## Simple Node.js Server

Create a new directory for your server and initialize it:

```bash
mkdir line-craft-server
cd line-craft-server
npm init -y
npm install socket.io express cors
```

Create `server.js`:

```javascript
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://yourdomain.com"],
    methods: ["GET", "POST"]
  }
});

// Store active rooms and their participants
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: new Set(),
        code: ''
      });
    }
    
    const room = rooms.get(roomId);
    room.participants.add(socket.id);
    
    // Send current code to the new participant
    if (room.code) {
      socket.emit('code-change', room.code);
    }
    
    // Notify others about new participant
    socket.to(roomId).emit('user-joined', {
      id: socket.id,
      name: `User ${socket.id.slice(0, 6)}`
    });
    
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('code-change', ({ roomId, code }) => {
    // Update room code
    if (rooms.has(roomId)) {
      rooms.get(roomId).code = code;
    }
    
    // Broadcast to all other users in the room
    socket.to(roomId).emit('code-change', code);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all rooms
    rooms.forEach((room, roomId) => {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id);
        socket.to(roomId).emit('user-left', socket.id);
        
        // Clean up empty rooms
        if (room.participants.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
```

## Deploy Options

### 1. Railway (Recommended - Free tier available)

1. Push your server code to GitHub
2. Go to [Railway](https://railway.app)
3. Connect your GitHub repository
4. Deploy automatically
5. Update the Socket.IO URL in `src/hooks/useSocket.ts`

### 2. Render

1. Push your server code to GitHub
2. Go to [Render](https://render.com)
3. Create a new Web Service
4. Connect your repository
5. Set build command: `npm install`
6. Set start command: `node server.js`

### 3. Local Development

```bash
node server.js
```

The server will run on `http://localhost:3001`

## Update Frontend Configuration

After deploying your server, update the URL in `src/hooks/useSocket.ts`:

```typescript
const socket = io('wss://your-deployed-server-url.com');
```

## Environment Variables

For production, set these environment variables on your server:

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Set to 'production' for production builds

## Features Included

- ✅ Real-time code synchronization
- ✅ Room-based collaboration
- ✅ User join/leave notifications
- ✅ Automatic room cleanup
- ✅ CORS configuration
- ✅ Connection state management

## Next Steps

1. Deploy the server using one of the options above
2. Update the Socket.IO URL in your frontend
3. Test real-time collaboration by opening multiple tabs
4. Share room URLs with collaborators

Your Line Craft MVP is now ready for real-time collaboration!