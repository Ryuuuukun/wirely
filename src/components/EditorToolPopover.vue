<script setup>
import { NFlex, NP } from 'naive-ui';

import { LightbulbMinimalisticIcon } from '@solar-icons/vue/bold-duotone/lightbulb-minimalistic'
import { CircleDotIcon } from '@solar-icons/vue/bold/circle-dot'

const props = defineProps({
    element: {
        type: Object
    }
});
</script>

<template>
    <n-flex vertical>
        <n-flex v-if="element.truths">
            <n-flex v-for="row in element.truths" style="gap: 0px">
                <n-flex align="center" justify="center" vertical>
                    <CircleDotIcon :color="row[0] ? '#81E245' : '#6C6C6C'" size="12"/>
                    <CircleDotIcon :color="row[1] ? '#81E245' : '#6C6C6C'" size="12"/>
                </n-flex>
                <LightbulbMinimalisticIcon
                    size="48"
                    color="#6C6C6C"
                    :secondary-color="row[2] ? '#F0BC5B' : '#9D9D9D'"
                    :secondary-opacity="1"
                    :class="{ 'is-glowing': row[2] }"
                />
            </n-flex>
        </n-flex>
        <n-p class="n-element-description">{{ element.description }}</n-p>
        <n-p class="n-element-title">{{ element.title }}</n-p>
    </n-flex>
</template>

<style lang="scss" scoped>
.is-glowing {
    filter: drop-shadow(0 0 6px rgba(240, 188, 91, 0.25))
                drop-shadow(0 0 14px rgba(240, 188, 91, 0.1));
}

.n-element {
    &-title {
        padding: 0px;
        font-size: 14px;
        font-weight: 600;
        text-align: center;
        margin: 0px !important;
    }

    &-description {
        font-size: 12px;
        font-weight: 500;
        opacity: 0.75;
        text-align: center;
        margin: 0px !important;
    }
}
</style>
