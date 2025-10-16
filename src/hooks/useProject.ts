import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useProject = (projectId: string) => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (error) throw error;

        setProject(data);
        setIsOwner(data.owner_id === user.id);

        // Subscribe to project updates
        const channel = supabase
          .channel(`project_${projectId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "projects",
              filter: `id=eq.${projectId}`,
            },
            (payload) => {
              setProject(payload.new);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  return { project, loading, isOwner };
};
