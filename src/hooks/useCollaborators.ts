import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCollaborators = (projectId: string) => {
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const loadCollaborators = async () => {
      try {
        const { data, error } = await supabase
          .from("project_collaborators")
          .select("*")
          .eq("project_id", projectId)
          .eq("is_active", true)
          .order("invited_at", { ascending: false });

        if (error) throw error;
        setCollaborators(data || []);

        // Subscribe to collaborator changes
        const channel = supabase
          .channel(`collaborators_${projectId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "project_collaborators",
              filter: `project_id=eq.${projectId}`,
            },
            (payload) => {
              if (payload.eventType === "INSERT") {
                setCollaborators((prev) => [...prev, payload.new]);
              } else if (payload.eventType === "UPDATE") {
                setCollaborators((prev) =>
                  prev.map((c) => (c.id === payload.new.id ? payload.new : c))
                );
              } else if (payload.eventType === "DELETE") {
                setCollaborators((prev) =>
                  prev.filter((c) => c.id !== payload.old.id)
                );
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error loading collaborators:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCollaborators();
  }, [projectId]);

  const addCollaborator = async (userId: string, userEmail: string, userName?: string, permissionLevel: string = "read_only") => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-collaborator", {
        body: {
          action: "add",
          projectId,
          userId,
          userEmail,
          userName,
          permissionLevel,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error adding collaborator:", error);
      return { data: null, error };
    }
  };

  const updatePermission = async (collaboratorId: string, permissionLevel: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-collaborator", {
        body: {
          action: "update",
          projectId,
          collaboratorId,
          permissionLevel,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error updating permission:", error);
      return { data: null, error };
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-collaborator", {
        body: {
          action: "remove",
          projectId,
          collaboratorId,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error removing collaborator:", error);
      return { data: null, error };
    }
  };

  return { collaborators, loading, addCollaborator, updatePermission, removeCollaborator };
};
