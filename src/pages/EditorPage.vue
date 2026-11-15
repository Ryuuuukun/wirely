<script setup>
import { PlayIcon } from '@solar-icons/vue/bold/play';
import { StopIcon } from '@solar-icons/vue/bold/stop';
import { HomeIcon } from '@solar-icons/vue/bold/home';
import { EraserIcon } from '@solar-icons/vue/bold/eraser';
import { DisketteIcon } from '@solar-icons/vue/bold/diskette';
import { MinimizeSquare2Icon } from '@solar-icons/vue/bold/minimize-square-2';
import { DownloadMinimalisticIcon } from '@solar-icons/vue/bold/download-minimalistic';

import AndIcon from '@/components/icons/AndIcon.vue';
import OrIcon from '@/components/icons/OrIcon.vue';
import NotIcon from '@/components/icons/NotIcon.vue';
import XorIcon from '@/components/icons/XorIcon.vue';
import NandIcon from '@/components/icons/NandIcon.vue';
import LampIcon from '@/components/icons/LampIcon.vue';
import SwitchIcon from '@/components/icons/SwitchIcon.vue';
import ButtonIcon from '@/components/icons/ButtonIcon.vue';

import { NButton, NButtonGroup, NFlex, NGi, NGrid, NInputGroup, NInputNumber, NPopover, NTooltip } from 'naive-ui';
import EditorToolPopover from '@/components/EditorToolPopover.vue';

import { watch } from 'vue';
import { Wirely } from '@/lib/wirelib';
import { EventSystem } from '@/lib/base/interactive';
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { Button, GateAnd, GateNand, GateNot, GateOr, GateXor, Lamp, Switch } from '@/lib/node/wirely';

const Elements = [
    [{
        icon: AndIcon,
        symbol: '&',
        value: 'gate-and',
        image: GateAnd,
        title: 'Элемент AND',
        description: 'Активен, когда активны все входные элементы',
        truths: [
            [false, false, false],
            [false, true,  false],
            [true,  false, false],
            [true,  true,  true]
        ]
    }, {
        icon: OrIcon,
        symbol: '|',
        value: 'gate-or',
        image: GateOr,
        title: 'Элемент OR',
        description: 'Активен, когда активен хотя бы один элемент',
        truths: [
            [false, false, false],
            [false, true,  true],
            [true,  false, true],
            [true,  true,  true]
        ]
    }, {
        icon: NotIcon,
        symbol: '~',
        value: 'gate-not',
        image: GateNot,
        title: 'Элемент NOR',
        description: 'Aктивен, когда не активны все элементы',
        truths: [
            [false, false, true ],
            [false, true , false],
            [true , false, false],
            [false, false, false]
        ]
    }, {
        icon: XorIcon,
        symbol: '+',
        value: 'gate-xor',
        image: GateXor,
        title: 'Элемент XOR',
        description: 'Сложение по модулю двух',
        truths: [
            [false, false, false],
            [false, true,  true],
            [true,  false, true],
            [true,  true,  false]
        ]
    }, {
        icon: NandIcon,
        symbol: '!',
        value: 'gate-nand',
        image: GateNand,
        title: 'Элемент NAND',
        description: 'Активен, когда не активен хотя бы один элемент',
        truths: [
            [false, false, true],
            [false, true,  true],
            [true,  false, true],
            [true,  true,  false]
        ]
    }],
    [{
        icon: LampIcon,
        symbol: 'l',
        value: 'lamp',
        title: 'Лампа',
        image: Lamp,
        description: 'Активен, когда активны все элементы'
    }, {
        icon: SwitchIcon,
        symbol: 's',
        value: 'switch',
        title: 'Переключатель',
        image: Switch,
        description: 'Меняет состояние при нажатии'
    }, {
        icon: ButtonIcon,
        symbol: 'b',
        value: 'button',
        title: 'Кнопка',
        image: Button,
        description: 'Активен, только при нажатии'
    }]
];

const element = ref(null);

const running = ref(true);
const tickrate = ref(20);
const scale = ref(100);
const schema = ref(null);

const MAX_SCALE = 300;
const MIN_SCALE = 75;

const MIN_TICKRATE = 20;
const MAX_TICKRATE = 100;

watch(running, value => {
    if (value !== undefined) wirely.setRunning(value);
});
watch(tickrate, value => {
    if (value !== undefined) wirely.setTickrate(value);
});
const { pause, resume } = watch(scale, value => {
    if (value !== undefined) wirely.setWindowScale(value / 100);
});


const canvas = ref(null);
const context = ref(null);

const wirely = new Wirely();

const radar = ref({
    left:   false,
    top:    false,
    right:  false,
    bottom: false
});

let isWindowMove = ref(false);
let windowMoveStartX = ref(0);
let windowMoveStartY = ref(0);

const controller = new AbortController();

function resizeCanvas() {
    if (!canvas.value) return;

    canvas.value.width = window.innerWidth;
    canvas.value.height = window.innerHeight;
    handleUpdateRadar();
}

function handleUpdateRadar() {
    if (!canvas.value) return;

    const rect = wirely.getRectSchema();

    if (!rect || !Number.isFinite(rect.min.x) || !Number.isFinite(rect.min.y)) {
        radar.value.top = false;
        radar.value.left = false;
        radar.value.right = false;
        radar.value.bottom = false;

        return;
    }

    rect.min = EventSystem.revertCoordinates(rect.min, canvas.value, wirely.context);
    rect.max = EventSystem.revertCoordinates(rect.max, canvas.value, wirely.context);

    const width  = canvas.value.width;
    const height = canvas.value.height;

    radar.value.top = rect.min.y < 0 && rect.max.y < height;
    radar.value.left = rect.min.x < 0 && rect.max.x < width;
    radar.value.right = rect.max.x > width && rect.min.x > 0;
    radar.value.bottom = rect.max.y > height && rect.min.y > 0;
}

function handleAddElement(event) {
    if (element.value) {
        const { x, y } = EventSystem.convertCoordinates(event, canvas.value, wirely.context);

        wirely.addElement(element.value.image({ x, y }));
        element.value = null;

        handleUpdateRadar();
    }
}

function handleSaveSchema() {
    const json = JSON.stringify(wirely.serialize());

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = 'schema.json';
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function handleLoadSchema(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (e) => {
        try {
            wirely.deserialize(JSON.parse(e.target.result));
        } catch (err) {
            console.log(err);
        }
    }

    reader.readAsText(file);
    handleUpdateRadar();
}

function handleTriggerSchema() {
    schema.value.click()
}

function handleClearAll() {
    wirely.deleteAll();
    handleUpdateRadar();
}

let centerAnimation = null;

function cancelCenterAnimation() {
    if (centerAnimation) {
        cancelAnimationFrame(centerAnimation);
        centerAnimation = null;
    }
}

function handleCenterSchema() {
    const count = wirely.getCountElements();
    const center = wirely.getCenterSchema();
    if (count === 0 || !center) return;

    cancelCenterAnimation();

    const { scale } = wirely.context;

    const rect = canvas.value.getBoundingClientRect();
    const viewport = EventSystem.convertCoordinates(
        {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
        },
        canvas.value,
        wirely.context
    );

    const fromX = wirely.context.dx;
    const fromY = wirely.context.dy;
    const toX = fromX + (viewport.x - center.x) * scale;
    const toY = fromY + (viewport.y - center.y) * scale;

    if (Math.abs(toX - fromX) < 0.5 && Math.abs(toY - fromY) < 0.5) return;

    const duration = 400;
    const start = performance.now();

    const ease = t => 1 - Math.pow(1 - t, 3);

    const step = now => {
        const t = Math.min(1, (now - start) / duration);
        const k = ease(t);

        wirely.setWindowPosition(
            fromX + (toX - fromX) * k,
            fromY + (toY - fromY) * k
        );
        handleUpdateRadar();

        if (t < 1) {
            centerAnimation = requestAnimationFrame(step);
        } else {
            centerAnimation = null;
        }
    };

    centerAnimation = requestAnimationFrame(step);
}

onMounted(() => {
    context.value = canvas.value.getContext('2d');

    wirely.context = {
        ctx: context.value,
        cnv: canvas.value,

        running: true,
        tickrate: 10,

        MAX_SCALE: MAX_SCALE / 100,
        MIN_SCALE: MIN_SCALE / 100,

        scale: 1,
        dx: 0,
        dy: 0
    };

    wirely.init(canvas.value, context.value);
    wirely.launch();

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { signal: controller.signal });
    canvas.value.addEventListener('mousedown', handleAddElement, { signal: controller.signal });
});

onBeforeUnmount(() => {
    wirely.dispose();
    controller.abort();
});

function onPointerDown(e) {
    isWindowMove.value = true;
    e.target.setPointerCapture(e.pointerId);

    windowMoveStartX.value = e.clientX - wirely.context.dx;
    windowMoveStartY.value = e.clientY - wirely.context.dy;
}

function onPointerMove(e) {
    if (!isWindowMove.value) return;

    wirely.setWindowPosition(
        e.clientX - windowMoveStartX.value,
        e.clientY - windowMoveStartY.value
    );
    handleUpdateRadar();
}

function onPointerUp(e) {
    isWindowMove.value = false;
    e.target.releasePointerCapture(e.pointerId);
}

function onWheel(e) {
    pause();

    scale.value = e.deltaY < 0 ? scale.value + 10 : scale.value - 10;
    scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value));
    wirely.setWindowScale(scale.value / 100, e.clientX, e.clientY);

    resume();

    handleUpdateRadar();
}
</script>

<template>
    <input
        ref="schema"
        type="file"
        accept=".json,application/json"
        style="display: none;"
        @change="handleLoadSchema"
    />
    <canvas
        ref="canvas"
        width="800px"
        height="800px"
        class="canvas"
        @pointerdown.middle.prevent="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup.middle="onPointerUp"
        @pointercancel="onPointerUp"
        @wheel.prevent="onWheel"
    />

    <div class="n-radar-top" :class="{ 'n-radar-active': radar.top }"></div>
    <div class="n-radar-left" :class="{ 'n-radar-active': radar.left }"></div>
    <div class="n-radar-right" :class="{ 'n-radar-active': radar.right }"></div>
    <div class="n-radar-bottom" :class="{ 'n-radar-active': radar.bottom }"></div>

    <n-grid :cols="3" class="header">
        <n-gi>
            <n-flex
                align="center"
                :wrap="false"
            >
                <n-button-group>
                    <n-tooltip :show-arrow="false">
                        <template #trigger>
                            <n-button size="large" secondary circle @click="handleSaveSchema">
                                <template #icon>
                                    <DisketteIcon/>
                                </template>
                            </n-button>
                        </template>
                        <span>Сохранить схему</span>
                    </n-tooltip>
                    <n-tooltip :show-arrow="false">
                        <template #trigger>
                            <n-button size="large" secondary circle @click="handleTriggerSchema">
                                <DownloadMinimalisticIcon/>
                            </n-button>
                        </template>
                        <span>Загрузить схему</span>
                    </n-tooltip>
                    <n-tooltip :show-arrow="false">
                        <template #trigger>
                            <n-button size="large" secondary circle @click="handleClearAll">
                                <EraserIcon/>
                            </n-button>
                        </template>
                        <span>Очистить экран</span>
                    </n-tooltip>
                </n-button-group>
                <n-tooltip :show-arrow="false">
                   <template #trigger>
                       <n-button size="large" class="blur" secondary circle @click="handleCenterSchema">
                           <template #icon>
                                <MinimizeSquare2Icon/>
                           </template>
                       </n-button>
                   </template>
                   <span>Оцентровать схему</span>
               </n-tooltip>
            </n-flex>
        </n-gi>
        <n-gi>
            <n-flex align="center" justify="center">
                <n-input-number
                    v-model:value="scale"
                    :min="MIN_SCALE"
                    :max="MAX_SCALE"
                    :format="val => val + '%'"
                    :parse="val => Number.parseInt(val)"
                    :step="10"
                    style="text-align: center; width: 10rem;"
                    button-placement="both"
                    size="large"
                    round
                />
            </n-flex>
        </n-gi>
        <n-gi>
            <n-flex align="center" justify="end">
                <n-input-group style="width: fit-content;">
                    <n-input-number
                        v-model:value="tickrate"
                        :min="MIN_TICKRATE"
                        :max="MAX_TICKRATE"
                        :format="val => val + ' ms'"
                        :parse="val => Number.parseInt(val)"
                        :show-button="true"
                        button-placement="both"
                        style="width: 8rem; text-align: center;"
                        size="large"
                        round
                    />
                    <n-tooltip :show-arrow="false">
                        <template #trigger>
                            <n-button type="primary" round size="large" @click="running = !running">
                                <template #icon>
                                    <PlayIcon v-if="!running"/>
                                    <StopIcon v-else/>
                                </template>
                            </n-button>
                        </template>
                        <span>{{ running ? 'Остановить' : 'Запустить' }} симуляцию</span>
                    </n-tooltip>
                </n-input-group>
            </n-flex>
        </n-gi>
    </n-grid>
    <n-flex class="toolbar" align="center" justify="center" >
        <n-flex
            v-for="row in Elements"
            class="toolbar--row"
        >
            <n-button-group>
                <n-popover v-for="item in row" :show-arrow="false" trigger="hover" style="max-width: 18rem;" :delay="400">
                    <template #trigger>
                        <n-button
                            round
                            size="large"
                            :type="element?.value === item.value ? 'primary' : 'default'"
                            secondary
                            circle
                            @click="element = item"
                        >
                            <template #icon>
                                <component :is="item.icon"/>
                            </template>
                        </n-button>
                    </template>
                    <EditorToolPopover :element="item"/>
                </n-popover>
            </n-button-group>
        </n-flex>
    </n-flex>
</template>

<style lang="scss" scoped>
$color-primary: #427af5;
$color-blur: rgba(50, 50, 50, 0.7);

$blur-factor: 5rem;

.n-button {
    border: none;

    transition:
        color 100ms ease-in-out,
        background-color 100ms ease-in-out,
        opacity 100ms ease-in-out,
        filter 150ms ease-in-out;

    &--default-type {
        &:hover {
            background: $color-primary;
            color: white;
        }

        &:active {
            filter: brightness(0.75);
        }
    }
}

.n-button-group {
    background: $color-blur;
    backdrop-filter: blur($blur-factor);
    border-radius: 1rem;

    .n-button {
        border-radius: 1rem;

        &:first-child {
            width: 45px;
        }

        &:last-child {
            width: 45px;
        }

        &--default-type {
            background: none;

            &:hover {
                background: $color-primary;
            }
        }
    }
}

:global(.n-input) {
    background: $color-blur;
    backdrop-filter: blur($blur-factor);
}

:global(.n-popover) {
    background: $color-blur !important;
    backdrop-filter: blur($blur-factor);
    border-radius: 15px !important;
}

@mixin n-radar {
    position: fixed;
    pointer-events: none;
    user-select: none;
    z-index: 5;
    opacity: 0;
    filter: blur(3.5rem);
    will-change: transform;

    transition: opacity 200ms ease-in-out;
}

.n-radar-active {
    opacity: 0.5 !important;
}

.n-radar-top {
    @include n-radar;

    top: -2.5rem;
    left: 0;
    width: 100%;
    height: 5rem;
    background: linear-gradient(180deg, $color-primary 0%, transparent 100%);
}

.n-radar-bottom {
    @include n-radar;

    bottom: -2.5rem;
    left: 0;
    width: 100%;
    height: 5rem;
    background: linear-gradient(0deg, $color-primary 0%, transparent 100%);
}

.n-radar-left {
    @include n-radar;

    top: 0;
    left: -2.5rem;
    width: 5rem;
    height: 100%;
    background: linear-gradient(90deg, $color-primary 0%, transparent 100%);
}

.n-radar-right {
  @include n-radar;

    top: 0;
    right: -2.5rem;
    width: 5rem;
    height: 100%;
    background: linear-gradient(270deg, $color-primary 0%, transparent 100%);
}

.blur {
    background: $color-blur;
    backdrop-filter: blur(20px);
}

.canvas {
    position: absolute;
}

.header {
    position: absolute;
    box-sizing: border-box;
    padding: 2rem;
    z-index: 10;
}

.toolbar {
    width: 100% !important;
    box-sizing: border-box;
    padding: 3rem 0rem;

    position: absolute;
    user-select: none;
    bottom: 0px;
    z-index: 10;

    gap: 1rem !important;

    &--row {
        gap: 0.5rem !important;
    }
}
</style>
