<script lang="ts" setup>
import { now } from '@/util';
import { notyf } from '@/util/notify';
import { useSettingStore } from '@/util/pinia';
import { ref } from 'vue';
import { BiExport, BiImport, BiTrash } from 'vue-icons-plus/bi';

const settingStore = useSettingStore();
const props = defineProps<{
    updateContent: () => void;
}>();
const tokenInput = ref('');
const seedInput = ref('');
const newUrl = ref({
    upload: '',
    download: '',
    pin: ''
});

// 用户设置
const setToken = () => {
    if (tokenInput.value) {
        settingStore.user.token = tokenInput.value;
        notyf.success("Token 设置成功");
    }
}

const setSeed = () => {
    if (seedInput.value) {
        settingStore.user.seed = seedInput.value;
        notyf.success("Seed 设置成功");
    }
}

// 服务管理
const addService = (type: 'upload' | 'download' | 'pin') => {
    const url = newUrl.value[type];
    if (url && !settingStore.server[type].list.includes(url)) {
        settingStore.server[type].list.push(url);
        newUrl.value[type] = '';
        notyf.success("服务地址已添加");
    }
}

const removeService = (type: 'upload' | 'download' | 'pin', index: number) => {
    if (settingStore.server[type].list.length > 1) {
        settingStore.server[type].list.splice(index, 1);
        notyf.success("服务地址已移除");
    }
}

// 文件处理
const exportSettings = () => {
    const data = JSON.stringify(settingStore);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crust-settings-${now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notyf.success("设置导出成功");
}

const importSettings = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = JSON.parse(e.target?.result as string);
            settingStore.$patch(data);
            props.updateContent();
            notyf.success("设置导入成功");
        };
        reader.readAsText(file);
    } catch (error) {
        notyf.error("文件格式不正确");
    }
    input.value = '';
}
</script>

<template>
    <div class="settings-container">
        <!-- 基础设置 -->
        <div class="base-setting">
            <h3 class="section-title">配置管理</h3>
            <div class="action-card">
                <label class="action-btn import-btn">
                    <input type="file" accept=".json" @change="importSettings" hidden>
                    <BiImport class="icon" />
                    <span>导入设置</span>
                </label>
                <button class="action-btn" @click="exportSettings">
                    <BiExport class="icon" />
                    <span>导出设置</span>
                </button>
            </div>
        </div>

        <!-- 用户设置 -->
        <div class="user-setting">
            <h3 class="section-title">用户凭证</h3>
            <div class="user-card">
                <div class="input-group">
                    <input v-model="tokenInput" type="text" placeholder="输入访问令牌">
                    <button class="confirm-btn" @click="setToken">
                        <span>保存</span>
                    </button>
                </div>
                <div class="input-group">
                    <input v-model="seedInput" type="text" placeholder="输入种子短语">
                    <button class="confirm-btn" @click="setSeed">
                        <span>保存</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- 服务器设置 -->
        <div class="server-setting">
            <h3 class="section-title">服务管理</h3>

            <!-- 上传服务 -->
            <div class="server-card">
                <div class="server-header">
                    <h4>上传服务</h4>
                    <span class="current-badge">当前使用: {{ settingStore.server.upload.use }}</span>
                </div>
                <select v-model="settingStore.server.upload.use" class="server-select">
                    <option v-for="(url, index) in settingStore.server.upload.list" :key="index" :value="url">
                        {{ url }}
                    </option>
                </select>
                <div class="url-management">
                    <div v-for="(url, index) in settingStore.server.upload.list" :key="url" class="url-item">
                        <span>{{ url }}</span>
                        <BiTrash class="delete-icon" @click="removeService('upload', index)" />
                    </div>
                    <div class="add-url">
                        <input v-model="newUrl.upload" placeholder="添加新服务地址">
                        <button @click="addService('upload')">
                            添加
                        </button>
                    </div>
                </div>
            </div>

            <!-- 下载服务 -->
            <div class="server-card">
                <div class="server-header">
                    <h4>下载服务</h4>
                    <span class="current-badge">当前使用: {{ settingStore.server.download.use }}</span>
                </div>
                <select v-model="settingStore.server.download.use" class="server-select">
                    <option v-for="(url, index) in settingStore.server.download.list" :key="index" :value="url">
                        {{ url }}
                    </option>
                </select>
                <div class="url-management">
                    <div v-for="(url, index) in settingStore.server.download.list" :key="url" class="url-item">
                        <span>{{ url }}</span>
                        <BiTrash class="delete-icon" @click="removeService('download', index)" />
                    </div>
                    <div class="add-url">
                        <input v-model="newUrl.download" placeholder="添加新服务地址">
                        <button @click="addService('download')">
                            添加
                        </button>
                    </div>
                </div>
            </div>

            <!-- Pin 服务 -->
            <div class="server-card">
                <div class="server-header">
                    <h4>Pin 服务</h4>
                    <span class="current-badge">当前使用: {{ settingStore.server.pin.use }}</span>
                </div>
                <select v-model="settingStore.server.pin.use" class="server-select">
                    <option v-for="(url, index) in settingStore.server.pin.list" :key="index" :value="url">
                        {{ url }}
                    </option>
                </select>
                <div class="url-management">
                    <div v-for="(url, index) in settingStore.server.pin.list" :key="url" class="url-item">
                        <span>{{ url }}</span>
                        <BiTrash class="delete-icon" @click="removeService('pin', index)" />
                    </div>
                    <div class="add-url">
                        <input v-model="newUrl.pin" placeholder="添加新服务地址">
                        <button @click="addService('pin')">
                            添加
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.settings-container {
    padding: 0 2rem;
    height: 100%;
    overflow-y: auto;
    background: #1a202c;
    color: #e5e7eb;
    display: grid;
}

.section-title {
    color: #63b3ed;
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #2d3748;
}

/* 基础设置 */
.action-card {
    display: flex;
    gap: 1rem;
}

.action-btn {
    background: #2d3748;
    border: 1px solid #4a5568;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: #e5e7eb;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;

    &:hover {
        background: rgba(99, 179, 237, 0.1);
        border-color: #63b3ed;
    }
}

.import-btn {
    position: relative;
    overflow: hidden;
}

/* 用户设置 */
.user-card {
    background: #2d3748;
    padding: 1.5rem;
    border-radius: 8px;
    display: grid;
    gap: 1rem;
}

.input-group {
    display: flex;
    gap: 0.5rem;
    align-items: stretch;
    height: 40px;
    /* 统一高度 */

    input {
        flex: 1;
        background: #1a202c;
        border: 1px solid #4a5568;
        padding: 0 1rem;
        /* 调整内边距 */
        border-radius: 6px;
        color: inherit;
        height: 100%;
        /* 填满父容器 */
        line-height: 1.5;
        box-sizing: border-box;
        /* 新增 */
    }

    .confirm-btn {
        background: #2d3748;
        border: 1px solid #4a5568;
        padding: 0 1.5rem;
        /* 调整内边距 */
        border-radius: 6px;
        color: #e5e7eb;
        cursor: pointer;
        height: 100%;
        /* 填满父容器 */
        display: flex;
        align-items: center;
        transition: all 0.2s;
        box-sizing: border-box;
        /* 新增 */
    }
}

/* 服务设置 */
.server-card {
    background: #2d3748;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
}

.server-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.current-badge {
    background: rgba(99, 179, 237, 0.15);
    color: #63b3ed;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.9rem;
}

/* 服务器选择框 */
.server-select {
    width: 100%;
    background: #1a202c;
    border: 1px solid #4a5568;
    padding: 0.75rem;
    border-radius: 6px;
    color: inherit;
    margin-bottom: 1rem;
    height: 40px;
    /* 统一高度 */
    box-sizing: border-box;
    /* 新增 */
}

.url-management {
    display: grid;
    gap: 0.5rem;
}

.url-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #1a202c;
    padding: 0;
    border-radius: 4px;

    span {
        margin-left: 10px;
        font-size: 15px;
    }

    .delete-icon {
        color: #fc8181;
        cursor: pointer;
        padding: 0.25rem;
        transition: color 0.2s;

        &:hover {
            color: #f56565;
        }
    }
}

/* 添加服务地址 */
.add-url {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    align-items: stretch;
    height: 40px;
    /* 统一高度 */

    input {
        flex: 1;
        background: #1a202c;
        border: 1px solid #4a5568;
        padding: 0 1rem;
        border-radius: 6px;
        color: inherit;
        height: 100%;
        /* 填满父容器 */
        box-sizing: border-box;
        /* 新增 */
    }

    button {
        background: #2d3748;
        border: 1px solid #4a5568;
        padding: 0 1.5rem;
        /* 调整内边距 */
        border-radius: 6px;
        color: #e5e7eb;
        cursor: pointer;
        height: 100%;
        /* 填满父容器 */
        display: flex;
        align-items: center;
        transition: all 0.2s;
        box-sizing: border-box;
        /* 新增 */
    }
}

.icon {
    font-size: 1.2rem;
}
</style>