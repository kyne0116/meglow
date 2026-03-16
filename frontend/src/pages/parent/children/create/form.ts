export type CreateChildFormInput = {
  name: string;
  gender: "MALE" | "FEMALE";
  grade: string;
  birthDate: string;
};

export type CreateChildPayload = {
  name: string;
  gender: "MALE" | "FEMALE";
  grade: number;
  birthDate?: string;
};

export function validateCreateChildForm(
  input: CreateChildFormInput
): { ok: true } | { ok: false; message: string } {
  if (!input.name.trim()) {
    return { ok: false, message: "请输入孩子姓名" };
  }

  const grade = Number(input.grade.trim());
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) {
    return { ok: false, message: "年级必须在 1-9 之间" };
  }

  const birthDate = input.birthDate.trim();
  if (birthDate && !isValidDateString(birthDate)) {
    return { ok: false, message: "出生日期格式不正确" };
  }

  return { ok: true };
}

export function buildCreateChildPayload(input: CreateChildFormInput): CreateChildPayload {
  const payload: CreateChildPayload = {
    name: input.name.trim(),
    gender: input.gender,
    grade: Number(input.grade.trim())
  };

  const birthDate = input.birthDate.trim();
  if (birthDate) {
    payload.birthDate = birthDate;
  }

  return payload;
}

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === value;
}
