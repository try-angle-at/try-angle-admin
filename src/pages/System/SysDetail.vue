<template>
  <v-container fluid>
    <v-row no-gutters class="align-item-center | justify-space-between | mt-8 | mb-2 | ml-2">
      <v-col class="title-font">세션 상세</v-col>
    </v-row>

    <v-row no-gutters justify="start" class="mt-1">
      <v-label class="ml-1">세션 ID</v-label>
    </v-row>
    <v-row no-gutters justify="center" class="mt-1">
      <v-text-field
        :model-value="sessionIdDisplay"
        class="inputbox"
        readonly
        variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
      />
    </v-row>

    <v-row no-gutters justify="start" class="mt-2">
      <v-label class="ml-1">Snapshot JSON String</v-label>
    </v-row>
    <v-row no-gutters justify="center" class="mt-1">
      <v-textarea
        :model-value="snapshotsJsonString"
        class="inputbox"
        auto-grow rows="10" row-height="18"
        readonly
        variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
      />
    </v-row>
  </v-container>
</template>

<script setup>
// ----- 선언부 ----- //
import { computed, onMounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import * as HttpHandler from '@/common/HttpHandler.js';
import Util from '@/common/Util.js';

const emit = defineEmits([
  'show-right-btn',
  'set-page-cfg',
  'show-left-btn'
]);

const router = useRouter(); 
const route = useRoute();
const util = Util.getInstance();
const imageBaseUrl = (import.meta.env.VITE_IMAGE_BASE_URL || '').replace(/\/$/, '');

const sessionId = ref('');
const snapshotsJsonString = ref('[]');

const sessionIdDisplay = computed(() => sessionId.value || '-');


// ----- 라이프 사이클 ----- //
onMounted(() => {
  emit('show-right-btn');
  emit('show-left-btn');
  emit('set-page-cfg', {
    name: '세션 상세',
    activePath: '/system',
    backPath: '/system',
  });

  fetchSessionDetail();
});

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchSessionDetail();
    }
  }
);

// ----- 함수 정의 ----- //
async function fetchSessionDetail() {
  const id = String(route.params.id || '').trim();
  sessionId.value = id;

  if (!id) {
    snapshotsJsonString.value = '[]';
    return;
  }

  try {
    const response = await HttpHandler.getSessionDetail({ id });
    const responseSession = response?.data?.session || {};
    const snapshots = response?.data?.snapshots || [];

    sessionId.value = responseSession.id || id;
    snapshotsJsonString.value = JSON.stringify(snapshots, null, 2);
  } catch (error) {
    console.error('세션 상세 조회 실패:', error);
    snapshotsJsonString.value = '[]';
  }
}

watch(
  () => route.params.id,
  (newId) => {
    if (!newId) {
      route.replace('/system');
    }
  },
  { immediate: true }
);


</script> 

<style scoped>

</style>