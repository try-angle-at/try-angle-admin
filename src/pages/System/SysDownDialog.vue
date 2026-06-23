<template>
    <v-dialog :model-value="modelValue" width="420px" @update:model-value="onModelUpdate">
        <v-card style="padding: 16px; border-radius: 24px;">
            <v-btn
                icon="mdi-close"
                variant="text"
                size="small"
                style="position: absolute; top: 12px; right: 12px; color: #6B7280; z-index: 10;"
                @click="close"
            />

            <v-card-title>
                <v-row
                    no-gutters
                    class="align-center justify-center mt-3"
                    style="color: #364153; font-size: 18px; font-weight: 700; letter-spacing: -0.2px;"
                >
                    스냅샷 내보내기
                </v-row>
            </v-card-title>

            <v-card-text style="padding: 0; margin-bottom: 12px;">
                <div
                    style="text-align: center; color: #6A7282; font-size: 14px; font-weight: 400; letter-spacing: -0.15px;"
                    class="mb-3"
                >
                    다운로드 형식을 선택해 주세요.
                </div>

                <v-radio-group v-model="selectedFormat" color="#4A5565" hide-details>
                    <v-radio value="jsonl" label="JSONL (행 단위 JSON)" />
                    <v-radio value="csv" label="CSV (항목별 테이블)" />
                </v-radio-group>
            </v-card-text>

            <template #actions>
                <div style="display: flex; width: 100%; gap: 8px;">
                    <v-btn
                        class="thin-btn"
                        style="border-radius: 16px; flex: 1;"
                        variant="outlined"
                        :disabled="isLoading"
                        @click="close"
                    >취소</v-btn>
                    <v-btn
                        class="active-thin-btn"
                        style="border-radius: 16px; flex: 1;"
                        variant="outlined"
                        :loading="isLoading"
                        @click="confirm"
                    >확인</v-btn>
                </div>
            </template>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
    isLoading: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const selectedFormat = ref('jsonl');

watch(
    () => props.modelValue,
    (open) => {
        if (open) {
            selectedFormat.value = 'jsonl';
        }
    },
);

function onModelUpdate(value) {
    emit('update:modelValue', value);
}

function close() {
    emit('update:modelValue', false);
}

function confirm() {
    emit('confirm', selectedFormat.value);
}
</script>

<style scoped>
.thin-btn {
    border-radius: 8px;
    font-family: Pretendard;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: -0.15px;
}

.active-thin-btn {
    border-radius: 8px;
    font-family: Pretendard;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: -0.15px;
    color: #ffffff !important;
}
</style>
