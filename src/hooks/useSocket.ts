import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketProps {
  roomId: string;
  onCodeChange: (code: string) => void;
  onUserJoin: (user: any) => void;
  onUserLeave: (userId: string) => void;
  onCursorChange?: (data: { userId: string; cursor: { line: number; column: number } }) => void;
  onParticipantsUpdate?: (participants: any[]) => void;
  onLanguageChange?: (language: string) => void;
  onKick?: (targetUserId: string) => void;
  onHostChange?: (newOwner: string, isYou: boolean) => void;
}

export const useSocket = ({ roomId, onCodeChange, onUserJoin, onUserLeave, onCursorChange, onParticipantsUpdate, onLanguageChange, onKick, onHostChange }: UseSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastError, setLastError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        timeout: 8000,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        forceNew: true,
        transports: ['websocket', 'polling'],
        upgrade: true,
        path: '/socket.io/'
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
        setLastError(error.message);
        
        // Don't immediately set to error, wait a bit to see if connection recovers
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
        errorTimeoutRef.current = setTimeout(() => {
          setConnectionStatus('error');
        }, 2000);
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

      if (onLanguageChange) {
        socket.on('language-change', onLanguageChange);
      }

      if (onKick) {
        socket.on('kick', onKick);
      }

      if (onHostChange) {
        socket.on('host-change', (data) => {
          const isYou = data.newOwner === data.currentUserId;
          onHostChange(data.newOwner, isYou);
        });
      }

      return () => {
        console.log('useSocket: Cleaning up socket connection');
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
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

  const sendLanguageChange = (language: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('language-change', { roomId, language });
    }
  };

  const kickParticipant = (targetUserId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('kick', { roomId, targetUserId });
    }
  };

  const broadcastHostChange = (newOwner: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('host-change', { roomId, newOwner });
    }
  };

  return {
    isConnected,
    connectionStatus,
    lastError,
    sendCodeChange,
    sendCursorChange,
    sendLanguageChange,
    kickParticipant,
    broadcastHostChange
  };
};