import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketProps {
  roomId: string;
  onCodeChange: (code: string) => void;
  onUserJoin: (user: any) => void;
  onUserLeave: (userId: string) => void;
}

export const useSocket = ({ roomId, onCodeChange, onUserJoin, onUserLeave }: UseSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Replace with your Socket.IO server URL
    const socket = io(process.env.NODE_ENV === 'production' 
      ? 'wss://your-socket-server.com' 
      : 'ws://localhost:3001'
    );
    
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', roomId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('code-change', onCodeChange);
    socket.on('user-joined', onUserJoin);
    socket.on('user-left', onUserLeave);

    return () => {
      socket.disconnect();
    };
  }, [roomId, onCodeChange, onUserJoin, onUserLeave]);

  const sendCodeChange = (code: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('code-change', { roomId, code });
    }
  };

  return {
    isConnected,
    sendCodeChange,
  };
};