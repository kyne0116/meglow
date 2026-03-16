<template>
  <view class="container">
    <view class="title">创建孩子档案</view>
    <view class="desc">先完成孩子基础信息创建，再进入学习设置。</view>

    <view class="field">
      <text class="label">孩子姓名</text>
      <input v-model="form.name" class="input" placeholder="例如：小明" />
    </view>

    <view class="field">
      <text class="label">性别</text>
      <picker :range="genderLabels" :value="selectedGenderIndex" @change="onGenderChange">
        <view class="picker-value">{{ genderLabels[selectedGenderIndex] }}</view>
      </picker>
    </view>

    <view class="field">
      <text class="label">年级（1-9）</text>
      <input v-model="form.grade" class="input" type="number" placeholder="例如：3" />
    </view>

    <view class="field">
      <text class="label">出生日期（可选）</text>
      <picker mode="date" :value="form.birthDate" @change="onBirthDateChange">
        <view class="picker-value">{{ form.birthDate || "请选择出生日期" }}</view>
      </picker>
      <button v-if="form.birthDate" class="clear-btn" size="mini" @tap="clearBirthDate">清空出生日期</button>
    </view>

    <button class="submit-btn" type="primary" :loading="submitting" @tap="submit">创建并进入学习设置</button>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { reactive, ref } from "vue";
import { postCreateChild } from "../../../../services/api";
import { useSessionStore } from "../../../../stores/session";
import {
  buildCreateChildPayload,
  type CreateChildFormInput,
  validateCreateChildForm
} from "./form";

interface PickerChangeEvent {
  detail: {
    value: string;
  };
}

const sessionStore = useSessionStore();
const submitting = ref(false);
const genderLabels = ["男孩", "女孩"];
const genderValues: Array<"MALE" | "FEMALE"> = ["MALE", "FEMALE"];
const selectedGenderIndex = ref(0);
const form = reactive<CreateChildFormInput>({
  name: "",
  gender: "MALE",
  grade: "",
  birthDate: ""
});

onLoad(() => {
  sessionStore.loadFromStorage();
  if (!sessionStore.accessToken) {
    uni.showToast({ title: "请先登录", icon: "none" });
    uni.reLaunch({
      url: "/pages/auth/login/index"
    });
  }
});

function onGenderChange(event: PickerChangeEvent): void {
  const nextIndex = Number(event.detail.value);
  if (Number.isNaN(nextIndex) || nextIndex < 0 || nextIndex >= genderValues.length) {
    return;
  }

  selectedGenderIndex.value = nextIndex;
  form.gender = genderValues[nextIndex];
}

function onBirthDateChange(event: PickerChangeEvent): void {
  form.birthDate = event.detail.value;
}

function clearBirthDate(): void {
  form.birthDate = "";
}

async function submit(): Promise<void> {
  const token = sessionStore.accessToken;
  if (!token) {
    uni.showToast({ title: "请先登录", icon: "none" });
    return;
  }

  const validation = validateCreateChildForm(form);
  if (!validation.ok) {
    uni.showToast({ title: validation.message, icon: "none" });
    return;
  }

  submitting.value = true;
  try {
    const child = await postCreateChild(token, buildCreateChildPayload(form));
    uni.showToast({ title: "创建成功", icon: "success" });
    setTimeout(() => {
      uni.redirectTo({
        url: `/pages/parent/settings/learning/index?childId=${encodeURIComponent(child.id)}`
      });
    }, 300);
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建孩子失败";
    uni.showToast({ title: message, icon: "none" });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.container {
  padding: 24rpx;
}

.title {
  font-size: 40rpx;
  font-weight: 600;
}

.desc {
  margin-top: 16rpx;
  color: #666;
  font-size: 28rpx;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 24rpx;
}

.label {
  font-size: 28rpx;
  color: #222;
}

.picker-value,
.input {
  min-height: 72rpx;
  border: 1rpx solid #d5d9e2;
  border-radius: 10rpx;
  padding: 16rpx 18rpx;
  background: #fff;
  font-size: 26rpx;
  box-sizing: border-box;
}

.clear-btn {
  margin-left: 0;
}

.submit-btn {
  margin-top: 36rpx;
}
</style>
