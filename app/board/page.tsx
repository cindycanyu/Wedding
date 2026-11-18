import { createClient } from "@/lib/supabase/server";
import BoardApp from "@/components/board/BoardApp";

export default async function BoardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  let me = null;
  if (userData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();
    me = profile ?? null;
  }

  return <BoardApp me={me} />;
}
