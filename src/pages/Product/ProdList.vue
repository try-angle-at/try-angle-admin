<template>
    <v-container fluid>
        <v-row no-gutters class="search-row | align-item-center | justify-space-between">
            <v-col cols="auto" class="align-item-center | d-flex">
                <v-text-field
                    v-model="userEmail"
                    placeholder="상품명 검색" 
                    class="inputbox | mr-2"
                    variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                    hide-details
                />
                <v-select
                    v-model="userEmail"
                    placeholder="상품명 상태" 
                    class="inputbox"
                    variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                    hide-details
                />
            </v-col>
            <v-col cols="auto" class="align-item-center">
                <v-btn
                    @click="handleClickBtn('login')"
                    variant="outlined"
                    class="thin-btn | outline-grey | btn-width | mr-2"
                >초기화</v-btn>
                <v-btn
                    @click="handleClickBtn('login')"
                    variant="outlined"
                    class="thin-btn | fill-grey | btn-width"
                >검색</v-btn>
            </v-col>
        </v-row>
        <v-row no-gutters class="align-item-center | justify-space-between | mt-8 | mb-2 | ml-2">
            <v-col class="search-label">
                총 <span style="color: #2563EB; font-weight: 500;">0</span>개
            </v-col>
            <v-col cols="auto" class="justify-end">
                <v-btn
                    @click="handleClickBtn('login')"
                    variant="outlined"
                    class="active-thin-btn | btn-width"
                >상품 등록</v-btn>
            </v-col>
        </v-row>

        <data-table
            :headers="[]"
            :items="[]"
        > 
        </data-table>
    </v-container>
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
.align-item-center {
  align-items: center;
}

.search-row {
    padding: 16px;
    border-radius: 10px;
    border: 0.7px solid #E5E7EB;
    background: #FFF;
}
.search-label {
    color: #4A5565;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.15px;
}

.btn-width {    
    width: 80px;
}
.outline-grey {
    border: 0.7px solid #4A5565;
    color: #4A5565;
}
.fill-grey {
    color: #ffffff;
    background-color: #4A5565;
}

/* .inputbox :deep(.v-input__details) {
  padding-top: 4px !important;
} */
.inputbox :deep(.v-input__control) {
    width: 240px !important;
}

.inputbox :deep(.v-field__input) {
    color: #364153 !important;
    font-size: 14px !important;
}

.inputbox :deep(.v-field__input::placeholder) {
    color: #364153 !important;
    font-size: 14px !important;
    opacity: 1;
}

.inputbox :deep(.v-icon) {
    color: #4A5565 !important;
    opacity: 1;
}
</style>