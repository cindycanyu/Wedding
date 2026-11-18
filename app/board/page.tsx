import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BoardApp from "@/components/board/BoardApp";

export default async function BoardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (!profile) redirect("/login?error=not_invited");

  return <BoardApp me={profile} />;
}
