import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getSupabaseAdmin } from "@/lib/supabase-server";

export async function DELETE(req: NextRequest) {
  // Auth check
  const { user } = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const admin = getSupabaseAdmin();

  try {
    const errors: string[] = [];

    // 1. Delete messages where user is sender or in user's conversations
    const { error: msgErr1 } = await admin.from("messages").delete().eq("sender_id", userId);
    if (msgErr1) { console.error("Failed to delete sent messages:", msgErr1.message); errors.push(`messages(sender): ${msgErr1.message}`); }

    // Get user's conversation IDs for related message cleanup
    const { data: userConvs } = await admin
      .from("conversations")
      .select("id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    
    if (userConvs && userConvs.length > 0) {
      const convIds = userConvs.map((c: Record<string, unknown>) => c.id as string);
      await admin.from("messages").delete().in("conversation_id", convIds);
    }

    // 2. Delete conversations (uses user1_id/user2_id, not user_id)
    const { error: convErr } = await admin.from("conversations").delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    if (convErr) { console.error("Failed to delete conversations:", convErr.message); errors.push(`conversations: ${convErr.message}`); }

    // 3. Delete from tables that use user_id column
    const tables = [
      "interactions",
      "listings",
      "profiles",
      "quiz_answers",
      "boosts",
      "user_subscriptions",
      "push_subscriptions",
    ];

    for (const table of tables) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      if (error) {
        console.error(`Failed to delete from ${table}:`, error.message);
        errors.push(`${table}: ${error.message}`);
      }
    }

    // 4. Also delete interactions where user is target
    await admin.from("interactions").delete().eq("target_id", userId);

    // 5. Delete the auth user (requires admin)
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("Failed to delete auth user:", authError.message);
      errors.push(`auth: ${authError.message}`);
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Some data could not be deleted",
        errors 
      }, { status: 207 });
    }

    return NextResponse.json({ success: true, message: "Account and all data deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Account deletion error:", message);
    return NextResponse.json({ error: "Failed to delete account", details: message }, { status: 500 });
  }
}
