import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useProjectFiles = (projectId: string) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const loadFiles = async () => {
      try {
        const { data, error } = await supabase
          .from("project_files")
          .select("*")
          .eq("project_id", projectId)
          .order("file_path", { ascending: true });

        if (error) throw error;
        setFiles(data || []);

        // Subscribe to file changes
        const channel = supabase
          .channel(`project_files_${projectId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "project_files",
              filter: `project_id=eq.${projectId}`,
            },
            (payload) => {
              if (payload.eventType === "INSERT") {
                setFiles((prev) => [...prev, payload.new]);
              } else if (payload.eventType === "UPDATE") {
                setFiles((prev) =>
                  prev.map((f) => (f.id === payload.new.id ? payload.new : f))
                );
              } else if (payload.eventType === "DELETE") {
                setFiles((prev) => prev.filter((f) => f.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error loading files:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [projectId]);

  const createFile = async (filename: string, filePath: string, content: string = "", language: string = "javascript") => {
    try {
      const { data, error } = await supabase
        .from("project_files")
        .insert({
          project_id: projectId,
          filename,
          file_path: filePath,
          content,
          language,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error creating file:", error);
      return { data: null, error };
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from("project_files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error deleting file:", error);
      return { error };
    }
  };

  return { files, loading, createFile, deleteFile };
};
