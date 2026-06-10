<template>
  <div class="simulator-wrapper">
    <iframe 
      src="https://pub-a309ad8a0a6e4a629ad982d710e35276.r2.dev/simulator/index.html" 
      title="Camera Simulator"
      frameborder="0"
      allowfullscreen
    ></iframe>
  </div>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

const emit = defineEmits([
  'show-right-btn',
]);
const router = useRouter(); 


// ----- 라이프 사이클 ----- //
onMounted(() => {
  emit('show-right-btn');
});

onUnmounted(() => {

});

// ----- 함수 정의 ----- //


</script> 

<style scoped>
/* Vuetify의 v-main 내부는 기본적으로 flex 패딩이 계산됩니다. 
  따라서 100vh 대신 부모가 준 공간을 100% 채우도록 세팅합니다.
*/
.simulator-wrapper {
  width: 100%;
  /* 상단 탑바(64px) 및 여백을 제외한 가용한 전체 높이 채우기 */
  height: calc(100vh - 64px); 
  overflow: hidden;
  display: block;
}

iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>