import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET_NAME = "pdf-exports";
const MAX_AGE_DAYS = 60;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // List all files in the pdf-exports bucket
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list();

    if (listError) {
      console.error("Error listing files:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to list files", details: listError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ message: "No files found in bucket", deleted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    const filesToDelete: string[] = [];

    for (const file of files) {
      if (file.created_at) {
        const fileDate = new Date(file.created_at);
        const ageMs = now.getTime() - fileDate.getTime();
        
        if (ageMs > maxAgeMs) {
          filesToDelete.push(file.name);
        }
      }
    }

    if (filesToDelete.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No files older than 60 days found", 
          totalFiles: files.length,
          deleted: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete old files
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filesToDelete);

    if (deleteError) {
      console.error("Error deleting files:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete files", details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted ${filesToDelete.length} old PDF files`);

    return new Response(
      JSON.stringify({ 
        message: `Successfully deleted ${filesToDelete.length} files older than ${MAX_AGE_DAYS} days`,
        deleted: filesToDelete.length,
        deletedFiles: filesToDelete
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
