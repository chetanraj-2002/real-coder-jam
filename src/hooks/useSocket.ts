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
    console.log('useSocket: Setting up socket connection for room:', roomId);
    
    try {
      // Replace with your Socket.IO server URL
      const socket = io(process.env.NODE_ENV === 'production' 
        ? 'wss://your-socket-server.com' 
        : 'ws://localhost:3001', {
        // Add connection options to handle failures gracefully
        timeout: 5000,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });
      
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('useSocket: Connected to server');
        setIsConnected(true);
        socket.emit('join-room', roomId);
      });

      socket.on('disconnect', () => {
        console.log('useSocket: Disconnected from server');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.log('useSocket: Connection error:', error.message);
        setIsConnected(false);
      });

      socket.on('code-change', onCodeChange);
      socket.on('user-joined', onUserJoin);
      socket.on('user-left', onUserLeave);

      return () => {
        console.log('useSocket: Cleaning up socket connection');
        socket.disconnect();
      };
    } catch (error) {
      console.error('useSocket: Error setting up socket:', error);
      setIsConnected(false);
    }
  }, [roomId, onCodeChange, onUserJoin, onUserLeave]);

  const sendCodeChange = (code: string) => {
    console.log('useSocket: Attempting to send code change, connected:', isConnected);
    if (socketRef.current?.connected) {
      socketRef.current.emit('code-change', { roomId, code });
      console.log('useSocket: Code change sent');
    } else {
      console.log('useSocket: Not connected, code change not sent');
    }
  };

  return {
    isConnected,
    sendCodeChange,
  };
};