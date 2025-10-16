import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAccessRequests = (projectId: string) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const loadRequests = async () => {
      try {
        // Load access requests for files in this project
        const { data: files } = await supabase
          .from("project_files")
          .select("id")
          .eq("project_id", projectId);

        if (!files || files.length === 0) {
          setLoading(false);
          return;
        }

        const fileIds = files.map(f => f.id);
        
        const { data, error } = await supabase
          .from("file_access_requests")
          .select("*, project_files!inner(filename, project_id)")
          .in("file_id", fileIds)
          .eq("status", "pending")
          .order("requested_at", { ascending: false });

        if (error) throw error;
        setRequests(data || []);

        // Subscribe to new requests
        const channel = supabase
          .channel(`access_requests_${projectId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "file_access_requests",
            },
            async (payload) => {
              // Check if this request belongs to current project
              const fileId = (payload.new as any)?.file_id || (payload.old as any)?.file_id;
              if (!fileId) return;

              const { data: file } = await supabase
                .from("project_files")
                .select("project_id")
                .eq("id", fileId)
                .single();

              if (file?.project_id === projectId) {
                if (payload.eventType === "INSERT") {
                  setRequests((prev) => [payload.new as any, ...prev]);
                } else if (payload.eventType === "UPDATE") {
                  setRequests((prev) =>
                    prev.map((r) => (r.id === (payload.new as any).id ? payload.new : r))
                  );
                } else if (payload.eventType === "DELETE") {
                  setRequests((prev) =>
                    prev.filter((r) => r.id !== (payload.old as any).id)
                  );
                }
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error loading access requests:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [projectId]);

  const createRequest = async (fileId: string, message?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-access-request", {
        body: {
          action: "create",
          fileId,
          message,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error creating request:", error);
      return { data: null, error };
    }
  };

  const respondToRequest = async (requestId: string, response: "approved" | "denied") => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-access-request", {
        body: {
          action: "respond",
          requestId,
          response,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error responding to request:", error);
      return { data: null, error };
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-access-request", {
        body: {
          action: "cancel",
          requestId,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error canceling request:", error);
      return { data: null, error };
    }
  };

  return { requests, loading, createRequest, respondToRequest, cancelRequest };
};
