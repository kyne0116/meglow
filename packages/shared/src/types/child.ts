export type Gender = "MALE" | "FEMALE";

export interface Child {
  id: string;
  familyId: string;
  name: string;
  gender: Gender;
  grade: number;
  k12Stage: "LOWER_PRIMARY" | "MIDDLE_PRIMARY" | "UPPER_PRIMARY" | "JUNIOR_HIGH";
}
