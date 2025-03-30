<script lang="ts" setup>
import { getFullPath } from '@/util';
import { useSettingStore } from '@/util/pinia';

const settingStore = useSettingStore();
const props = defineProps<{
    selectedItems: string[];
    closePanel: () => void;
}>();

const deleteItems = () => {
    const length = props.selectedItems.length;
    const basePath = window.location.pathname;
    for (let index = 0; index < length; index++) {
        const element = props.selectedItems[index];
        const fullPath = getFullPath(basePath, element);
        settingStore.delContentItem(fullPath);
    }
    props.closePanel();
}

</script>

<template>
    <div class="delete-dialog">
        <h3>确认删除</h3>
        <p>即将删除 {{ selectedItems.length }} 个项目：</p>
        <ul class="delete-list">
            <li v-for="item in selectedItems" :key="item">{{ item }}</li>
        </ul>
        <div class="action-buttons">
            <button @click="closePanel()">取消</button>
            <button class="danger" @click="deleteItems">永久删除</button>
        </div>
    </div>
</template>

<style scoped>
.delete-dialog {
    padding: 2rem;
    min-width: 400px;
    background: #2d3748;
    border-radius: 8px;
}

.delete-list {
    max-height: 200px;
    overflow-y: auto;
    margin: 1rem 0;
    padding: 0;
    list-style: none;
}

.delete-list li {
    padding: 0.5rem;
    margin: 0.25rem 0;
    background: #3c4555;
    border-radius: 4px;
}

.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
}

button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

button.danger {
    background: #f56565;
    color: white;
}

button.danger:hover {
    background: #c53030;
}
</style>