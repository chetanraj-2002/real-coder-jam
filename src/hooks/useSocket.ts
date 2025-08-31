import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketProps {
  roomId: string;
  onCodeChange: (code: string) => void;
  onUserJoin: (user: any) => void;
  onUserLeave: (userId: string) => void;
  onCursorChange?: (data: { userId: string; cursor: { line: number; column: number } }) => void;
  onParticipantsUpdate?: (participants: any[]) => void;
}

export const useSocket = ({ roomId, onCodeChange, onUserJoin, onUserLeave, onCursorChange, onParticipantsUpdate }: UseSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log('useSocket: Setting up socket connection for room:', roomId);
    
    try {
      // LineCraft Socket.IO server URL
      const getSocketUrl = () => {
        // First try environment variable
        const envUrl = import.meta.env.VITE_SOCKET_SERVER_URL;
        if (envUrl) return envUrl;
        
        // Fallback based on current domain
        const currentHost = window.location.hostname;
        if (currentHost.includes('lovable.dev') || currentHost.includes('localhost')) {
          return 'https://linecraft-server-production.up.railway.app';
        }
        
        // Default production URL
        return 'https://linecraft-server-production.up.railway.app';
      };

      const socketUrl = getSocketUrl();
      console.log('useSocket: Connecting to:', socketUrl);
      
      const socket = io(socketUrl, {
        // Add connection options to handle failures gracefully
        timeout: 10000,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        forceNew: true,
        transports: ['websocket', 'polling'],
      });
      
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('useSocket: Connected to LineCraft server');
        setIsConnected(true);
        setConnectionStatus('connected');
        socket.emit('join-room', roomId);
      });

      socket.on('disconnect', () => {
        console.log('useSocket: Disconnected from LineCraft server');
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      socket.on('connect_error', (error) => {
        console.log('useSocket: Connection error:', error.message);
        setIsConnected(false);
        setConnectionStatus('error');
      });

      socket.io.on('reconnect_attempt', () => {
        console.log('useSocket: Reconnecting to LineCraft server...');
        setConnectionStatus('connecting');
      });

      socket.on('code-change', onCodeChange);
      socket.on('user-joined', onUserJoin);
      socket.on('user-left', onUserLeave);
      
      if (onCursorChange) {
        socket.on('cursor-change', onCursorChange);
      }
      
      if (onParticipantsUpdate) {
        socket.on('participants-update', onParticipantsUpdate);
      }

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

  const sendCursorChange = (cursor: { line: number; column: number }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('cursor-change', { roomId, cursor });
    }
  };

  return {
    isConnected,
    connectionStatus,
    sendCodeChange,
    sendCursorChange,
  };
};