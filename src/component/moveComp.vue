<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useSettingStore } from '@/util/pinia';
import { getFullPath } from '@/util';
import { AiOutlineFolder, AiOutlineArrowRight } from 'vue-icons-plus/ai';
import type { StorageItem } from '@/type/storage';

const settingStore = useSettingStore();
const props = defineProps<{
    selectedItems: string[];
    closePanel: () => void;
}>();

// 当前路径和选中的项目
const currentPath = ref(window.location.pathname);
const selectedItemsFullPath = computed(() =>
    props.selectedItems.map(filename => getFullPath(currentPath.value, filename))
);

// 目标路径
const targetPath = ref('');
const navigationHistory = ref<string[]>([]);

// 获取当前目录内容
const currentContent = computed(() => {
    const content = settingStore.getContentItem(currentPath.value);
    return content?.type === 'folder' ? content.children : [];
});

// 只显示文件夹（用于移动目标选择）
const foldersOnly = computed(() =>
    (currentContent.value as StorageItem[]).filter(item => item.type === 'folder')
);

// 导航到指定路径
const navigateTo = (path: string) => {
    navigationHistory.value.push(currentPath.value);
    currentPath.value = path;
};

// 返回上一级
const goBack = () => {
    if (navigationHistory.value.length > 0) {
        currentPath.value = navigationHistory.value.pop() || '/';
    } else if (currentPath.value !== '/') {
        // 如果没有历史记录但不在根目录，则返回上一级
        const segments = currentPath.value.split('/').filter(Boolean);
        segments.pop();
        currentPath.value = segments.length ? `/${segments.join('/')}` : '/';
    }
};

// 选择目标文件夹
const selectFolder = (folderName: string) => {
    const newPath = currentPath.value === '/'
        ? `/${folderName}`
        : `${currentPath.value}/${folderName}`;
    targetPath.value = newPath;
};

// 确认移动操作
const confirmMove = () => {
    if (!targetPath.value) return;

    selectedItemsFullPath.value.forEach(fullPath => {
        const newPath = `${targetPath.value}/${fullPath.split('/').pop()}`;

        settingStore.moveContentItem(fullPath, newPath);
    });

    props.closePanel();
};

// 初始化当前路径
onMounted(() => {
    if (currentPath.value === '') currentPath.value = '/';
});
</script>

<template>
    <div class="move-component-container">
        <div class="move-header">
            <h3>移动项目</h3>
            <p>将 {{ selectedItems.length }} 个项目移动到: {{ targetPath || '/' }}</p>
        </div>

        <div class="move-content">
            <!-- 当前路径显示 -->
            <div class="path-display">
                <button @click="goBack" :disabled="currentPath === '/'">← 返回</button>
                <span class="current-path">{{ currentPath || '/' }}</span>
            </div>

            <!-- 文件夹列表 -->
            <div class="folder-list">
                <div v-for="item in foldersOnly" :key="item.name" class="folder-item" @click="selectFolder(item.name)"
                    :class="{ selected: targetPath === getFullPath(currentPath, item.name) }">
                    <AiOutlineFolder class="folder-icon" />
                    <span class="folder-name">{{ item.name }}</span>
                    <button class="navigate-btn" @click.stop="navigateTo(getFullPath(currentPath, item.name))">
                        <AiOutlineArrowRight />
                    </button>
                </div>

                <div v-if="foldersOnly.length === 0" class="empty-folder">
                    当前目录没有子文件夹
                </div>
            </div>

            <!-- 目标路径显示 -->
            <div class="target-path">
                <span>选中路径:</span>
                <strong>{{ targetPath || '未选择' }}</strong>
            </div>
        </div>

        <div class="move-actions">
            <button class="cancel-btn" @click="closePanel">取消</button>
            <button class="confirm-btn" @click="confirmMove" :disabled="!targetPath">
                确认移动
            </button>
        </div>
    </div>
</template>

<style scoped>
.move-component-container {
    display: flex;
    flex-direction: column;
    background: #2d3748;
    border-radius: 8px;
    padding: 20px;
    color: #e5e7eb;
    font-family: 'Segoe UI', system-ui, sans-serif;
}

.move-header {
    margin-bottom: 20px;
}

.move-header h3 {
    margin: 0 0 8px;
    font-size: 18px;
    color: #e5e7eb;
}

.move-header p {
    margin: 0;
    font-size: 14px;
    color: #a0aec0;
}

.move-content {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 20px;
}

.path-display {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    padding: 8px 12px;
    background: #3c4555;
    border-radius: 6px;
}

.path-display button {
    background: #4a5568;
    border: none;
    color: #e5e7eb;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
}

.path-display button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.path-display button:hover:not(:disabled) {
    background: #5a677d;
}

.current-path {
    font-family: monospace;
    font-size: 14px;
    word-break: break-all;
}

.folder-list {
    border: 1px solid #4a5568;
    border-radius: 6px;
    overflow: hidden;
}

.folder-item {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    cursor: pointer;
    transition: background 0.2s;
    border-bottom: 1px solid #4a5568;
}

.folder-item:last-child {
    border-bottom: none;
}

.folder-item:hover {
    background: rgba(160, 174, 192, 0.1);
}

.folder-item.selected {
    background: rgba(66, 153, 225, 0.2);
}

.folder-icon {
    font-size: 20px;
    color: #63b3ed;
    margin-right: 10px;
    flex-shrink: 0;
}

.folder-name {
    flex: 1;
    font-size: 14px;
}

.navigate-btn {
    background: transparent;
    border: none;
    color: #a0aec0;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
}

.navigate-btn:hover {
    color: #e5e7eb;
    background: rgba(160, 174, 192, 0.1);
}

.empty-folder {
    padding: 20px;
    text-align: center;
    color: #a0aec0;
    font-size: 14px;
}

.target-path {
    margin-top: 15px;
    padding: 10px;
    background: #3c4555;
    border-radius: 6px;
    font-size: 14px;
}

.target-path strong {
    display: block;
    margin-top: 5px;
    font-family: monospace;
    word-break: break-all;
    color: #e5e7eb;
}

.move-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 15px;
    border-top: 1px solid #4a5568;
}

.move-actions button {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.cancel-btn {
    background: #4a5568;
    border: none;
    color: #e5e7eb;
}

.cancel-btn:hover {
    background: #5a677d;
}

.confirm-btn {
    background: #4299e1;
    border: none;
    color: white;
}

.confirm-btn:hover:not(:disabled) {
    background: #3182ce;
}

.confirm-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>