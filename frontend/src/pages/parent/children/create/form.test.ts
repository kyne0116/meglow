import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCreateChildPayload,
  validateCreateChildForm
} from "./form.ts";

test("validateCreateChildForm accepts a valid payload", () => {
  const result = validateCreateChildForm({
    name: "小明",
    gender: "MALE",
    grade: "3",
    birthDate: "2018-01-01"
  });

  assert.equal(result.ok, true);
});

test("validateCreateChildForm rejects an empty name", () => {
  const result = validateCreateChildForm({
    name: "   ",
    gender: "MALE",
    grade: "3",
    birthDate: "2018-01-01"
  });

  assert.equal(result.ok, false);
  assert.equal(result.message, "请输入孩子姓名");
});

test("validateCreateChildForm rejects an invalid grade", () => {
  const result = validateCreateChildForm({
    name: "小明",
    gender: "MALE",
    grade: "0",
    birthDate: "2018-01-01"
  });

  assert.equal(result.ok, false);
  assert.equal(result.message, "年级必须在 1-9 之间");
});

test("validateCreateChildForm rejects an invalid birth date", () => {
  const result = validateCreateChildForm({
    name: "小明",
    gender: "MALE",
    grade: "3",
    birthDate: "2018-13-01"
  });

  assert.equal(result.ok, false);
  assert.equal(result.message, "出生日期格式不正确");
});

test("buildCreateChildPayload trims name and removes blank birth date", () => {
  const payload = buildCreateChildPayload({
    name: "  小明  ",
    gender: "MALE",
    grade: "3",
    birthDate: "   "
  });

  assert.deepEqual(payload, {
    name: "小明",
    gender: "MALE",
    grade: 3
  });
});
