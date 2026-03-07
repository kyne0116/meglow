export interface ParentMember {
  id: string;
  phone: string;
  nickname: string;
  role: "PRIMARY" | "SECONDARY";
}

export interface Family {
  id: string;
  name: string;
  parents: ParentMember[];
}
