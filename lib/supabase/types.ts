export type MemberKey = "hs" | "ch";

export type Profile = {
  id: string;
  member_key: MemberKey;
  name: string;
  bg_color: string;
  text_color: string;
};
