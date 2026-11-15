<script setup>
import { NConfigProvider, NGlobalStyle, commonDark, darkTheme } from 'naive-ui'

const darkThemeOverrides = {
    common: {
        primaryColor: '#427af5',
        primaryColorHover: '#427af5',
        primaryColorPressed: '#427af5',
        bodyColor: '#000000'
    }
};

</script>

<template>
    <n-config-provider :theme="darkTheme" :theme-overrides="darkThemeOverrides">
        <n-global-style/>
        <RouterView/>
    </n-config-provider>
</template>
