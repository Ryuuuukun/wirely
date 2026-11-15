import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
    {
        path: '/',
        name: 'Editor',
        component: () => import('@/pages/EditorPage.vue')
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;
