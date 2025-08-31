import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';

interface UseRealtimeProps {
  roomId: string;
  onCodeChange: (code: string) => void;
  onUserJoin: (user: any) => void;
  onUserLeave: (userId: string) => void;
  onCursorChange?: (data: { userId: string; cursor: { line: number; column: number } }) => void;
  onParticipantsUpdate?: (participants: any[]) => void;
}

export const useRealtime = ({ 
  roomId, 
  onCodeChange, 
  onUserJoin, 
  onUserLeave, 
  onCursorChange, 
  onParticipantsUpdate 
}: UseRealtimeProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const channelRef = useRef<any>(null);
  const { user } = useUser();

  const onCodeChangeRef = useRef(onCodeChange);
  const onUserJoinRef = useRef(onUserJoin);
  const onUserLeaveRef = useRef(onUserLeave);
  const onCursorChangeRef = useRef(onCursorChange);
  const onParticipantsUpdateRef = useRef(onParticipantsUpdate);

  // Update refs when props change
  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
    onUserJoinRef.current = onUserJoin;
    onUserLeaveRef.current = onUserLeave;
    onCursorChangeRef.current = onCursorChange;
    onParticipantsUpdateRef.current = onParticipantsUpdate;
  }, [onCodeChange, onUserJoin, onUserLeave, onCursorChange, onParticipantsUpdate]);

  useEffect(() => {
    if (!user || !roomId) return;

    console.log('useRealtime: Setting up Supabase Realtime for room:', roomId);
    
    const channel = supabase.channel(`room:${roomId}`);
    channelRef.current = channel;

    // Track user presence
    const userPresence = {
      user_id: user.id,
      user_name: user.fullName || user.emailAddresses[0]?.emailAddress || 'Anonymous',
      user_email: user.emailAddresses[0]?.emailAddress,
      joined_at: new Date().toISOString(),
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('useRealtime: Presence sync');
        const presenceState = channel.presenceState();
        const participants = Object.values(presenceState).flat();
        onParticipantsUpdateRef.current?.(participants);
        setIsConnected(true);
        setConnectionStatus('connected');
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('useRealtime: User joined', newPresences);
        newPresences.forEach((presence: any) => {
          onUserJoinRef.current(presence);
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('useRealtime: User left', leftPresences);
        leftPresences.forEach((presence: any) => {
          onUserLeaveRef.current(presence.user_id);
        });
      })
      .on('broadcast', { event: 'code-change' }, ({ payload }) => {
        console.log('useRealtime: Code change received');
        onCodeChangeRef.current(payload.code);
      })
      .on('broadcast', { event: 'cursor-change' }, ({ payload }) => {
        console.log('useRealtime: Cursor change received');
        onCursorChangeRef.current?.(payload);
      })
      .subscribe(async (status) => {
        console.log('useRealtime: Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          await channel.track(userPresence);
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setIsConnected(false);
        }
      });

    return () => {
      console.log('useRealtime: Cleaning up channel');
      supabase.removeChannel(channel);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [roomId, user]);

  const sendCodeChange = useCallback((code: string) => {
    console.log('useRealtime: Sending code change, connected:', isConnected);
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'code-change',
        payload: { code, roomId }
      });
      console.log('useRealtime: Code change sent');
    } else {
      console.log('useRealtime: Not connected, code change not sent');
    }
  }, [isConnected, roomId]);

  const sendCursorChange = useCallback((cursor: { line: number; column: number }) => {
    if (channelRef.current && isConnected && user) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor-change',
        payload: { userId: user.id, cursor, roomId }
      });
    }
  }, [isConnected, roomId, user]);

  return {
    isConnected,
    connectionStatus,
    sendCodeChange,
    sendCursorChange,
  };
};