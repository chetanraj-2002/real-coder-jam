import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useActivityLog = (projectId: string) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const loadActivities = async () => {
      try {
        const { data, error } = await supabase
          .from("project_activity_logs")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setActivities(data || []);

        // Subscribe to new activities
        const channel = supabase
          .channel(`activities_${projectId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "project_activity_logs",
              filter: `project_id=eq.${projectId}`,
            },
            (payload) => {
              setActivities((prev) => [payload.new, ...prev.slice(0, 49)]);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [projectId]);

  return { activities, loading };
};
