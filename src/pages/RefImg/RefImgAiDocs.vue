<template>
  <v-card style="padding: 24px 16px; border-radius: 24px;">
    <v-btn
      icon="mdi-close"
      variant="text"
      size="small"
      @click="emit('close')"
      style="position: absolute; top: 12px; right: 12px; color: #6B7280; z-index: 10;"
    />

    <v-card-title>
      <v-row no-gutters class="align-center | justify-center | mt-3" style="color: #364153; font-size: 18px; font-weight: 700;">
        {{ props.title || 'AI 데이터 뷰어' }}
      </v-row>
    </v-card-title>

    <v-card-text style="padding: 0 8px;">
      <v-row no-gutters class="mt-1">
        <v-col>
          <div class="meta-label">제목</div>
          <div class="meta-value">{{ props.title || '-' }}</div>
        </v-col>
      </v-row>

      <v-row no-gutters class="mt-3">
        <v-col>
          <div class="meta-label">이미지 경로</div>
          <div class="meta-value">{{ props.imagePath || '-' }}</div>
        </v-col>
      </v-row>

      <v-row no-gutters class="mt-3">
        <v-col>
          <div class="meta-label">AI Docs</div>
          <v-textarea
            :model-value="props.aiDocs"
            readonly
            auto-grow
            rows="10"
            max-rows="14"
            class="inputbox"
            variant="outlined"
            density="compact"
            rounded="lg"
            bg-color="#ffffff"
            base-color="#4A5565"
            color="#E5E8EB"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  aiDocs: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  imagePath: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close']);
</script>

<style scoped>
.meta-label {
  color: #4A5565;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.meta-value {
  color: #364153;
  font-size: 14px;
  word-break: break-all;
}

.inputbox :deep(.v-field__input) {
  color: #364153 !important;
  font-size: 14px !important;
}
</style>