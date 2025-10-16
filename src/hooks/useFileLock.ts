import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useFileLock = (fileId: string) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState<string | null>(null);
  const [hasLock, setHasLock] = useState(false);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!fileId) return;

    const checkLockStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: file } = await supabase
          .from("project_files")
          .select("locked_by")
          .eq("id", fileId)
          .single();

        if (file) {
          setIsLocked(!!file.locked_by);
          setLockedBy(file.locked_by);
          setHasLock(file.locked_by === user.id);
        }
      } catch (error) {
        console.error("Error checking lock status:", error);
      }
    };

    checkLockStatus();

    // Subscribe to lock changes
    const channel = supabase
      .channel(`file_lock_${fileId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "project_files",
          filter: `id=eq.${fileId}`,
        },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser();
          setIsLocked(!!payload.new.locked_by);
          setLockedBy(payload.new.locked_by);
          setHasLock(payload.new.locked_by === user?.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [fileId]);

  const acquireLock = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-file-lock", {
        body: { action: "acquire", fileId },
      });

      if (error) throw error;

      // Start heartbeat
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(async () => {
        await supabase.functions.invoke("manage-file-lock", {
          body: { action: "heartbeat", fileId },
        });
      }, 60000); // Every 60 seconds

      return { success: true, error: null };
    } catch (error) {
      console.error("Error acquiring lock:", error);
      return { success: false, error };
    }
  };

  const releaseLock = async (content?: string) => {
    try {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }

      const { data, error } = await supabase.functions.invoke("manage-file-lock", {
        body: { action: "release", fileId, content },
      });

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error("Error releasing lock:", error);
      return { success: false, error };
    }
  };

  return { isLocked, lockedBy, hasLock, acquireLock, releaseLock };
};
