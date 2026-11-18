import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BoardApp from "@/components/board/BoardApp";

export default async function BoardPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (!userData.user) {
    const debug = encodeURIComponent(userError?.message || "no session");
    redirect(`/login?error=not_invited&debug=${debug}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (!profile) {
    const debug = encodeURIComponent(
      `${profileError?.message || "no profile row"} | user=${userData.user.email} | id=${userData.user.id}`
    );
    redirect(`/login?error=not_invited&debug=${debug}`);
  }

  return <BoardApp me={profile} />;
}
