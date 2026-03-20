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
    // Delete all user data in a safe order (dependencies first)
    const tables = [
      "messages",
      "interactions",
      "conversations",
      "listings",
      "profiles",
      "quiz_answers",
      "boosts",
      "user_subscriptions",
      "push_subscriptions",
    ];

    const errors: string[] = [];

    for (const table of tables) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      if (error) {
        console.error(`Failed to delete from ${table}:`, error.message);
        errors.push(`${table}: ${error.message}`);
      }
    }

    // Also delete messages where user is receiver
    await admin.from("messages").delete().eq("receiver_id", userId);

    // Delete conversations where user is either party
    await admin.from("conversations").delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    // Delete the auth user (requires admin)
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
