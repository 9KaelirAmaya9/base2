import { supabase } from "@/integrations/supabase/client";

/**
 * Verify that the order_notes table exists and is accessible
 */
export async function verifyOrderNotesTable() {
  try {
    // Try to query the order_notes table
    const { data, error } = await supabase
      .from("order_notes")
      .select("id")
      .limit(1);

    if (error) {
      // Check if it's a "relation does not exist" error
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        return {
          success: false,
          message: "❌ order_notes table does not exist. Migration not applied yet.",
          error: error.message,
        };
      }

      // Some other error (might be RLS blocking, which is actually good)
      if (error.message.includes("permission denied") || error.message.includes("policy")) {
        return {
          success: true,
          message: "✅ order_notes table exists (RLS is active, which is correct)",
          note: "RLS policies are protecting the table as expected",
        };
      }

      return {
        success: false,
        message: "⚠️ Unexpected error accessing order_notes table",
        error: error.message,
      };
    }

    return {
      success: true,
      message: "✅ order_notes table exists and is accessible",
      recordCount: data?.length || 0,
    };
  } catch (error) {
    return {
      success: false,
      message: "❌ Error verifying database",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Verify all enhanced admin features are ready
 */
export async function verifyAdminEnhancements() {
  const results = {
    orderNotesTable: await verifyOrderNotesTable(),
    timestamp: new Date().toISOString(),
  };

  console.log("=== Admin Enhancement Verification ===");
  console.log("Timestamp:", results.timestamp);
  console.log("\n1. Order Notes Table:", results.orderNotesTable.message);
  if (results.orderNotesTable.note) {
    console.log("   Note:", results.orderNotesTable.note);
  }
  if (results.orderNotesTable.error) {
    console.log("   Error:", results.orderNotesTable.error);
  }
  console.log("\n=======================================");

  return results;
}
