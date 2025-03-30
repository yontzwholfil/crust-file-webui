<script lang="ts" setup>
import { ref, computed } from 'vue';
import { taskFromFile, useTaskStore, type TaskItem } from '@/util/pinia';
import { VscDebugRestart } from 'vue-icons-plus/vsc';
import { IpDeleteFive } from 'vue-icons-plus/ip';
import { postUploadContent } from '@/api/postUploadContent';
import { postRePin } from '@/api/postRepin';
import { formatSize } from '@/util';

const taskStore = useTaskStore();
const selectedTab = ref<'transfer' | 'success' | 'failed'>('transfer');
const showPinTasks = ref(false);

// 计算任务分类
const transferringTasks = computed(() =>
    Array.from(taskStore.task_map.values()).filter(t =>
        !t.upload.response || !taskStore.failure_task_list.includes(t)
    )
);

const successTasks = computed(() =>
    taskStore.success_task_list.filter(t =>
        showPinTasks.value ? t.pin.response : true
    )
);

const failedTasks = computed(() =>
    taskStore.failure_task_list.filter(t =>
        showPinTasks.value ? t.pin.response : true
    )
);

const currentTasks = computed(() => {
    switch (selectedTab.value) {
        case 'transfer': return transferringTasks.value;
        case 'success': return successTasks.value;
        case 'failed': return failedTasks.value;
    }
});

const showUploadOptions = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const folderInput = ref<HTMLInputElement | null>(null);

const triggerFileUpload = () => {
    fileInput.value?.click();
};

const triggerFolderUpload = () => {
    folderInput.value?.click();
};

const handleFileUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    const path = document.location.pathname;
    if (files) {
        for (const file of files) {
            const task: TaskItem = taskFromFile(path, file);
            taskStore.task_map.set(task.id, task);
            taskStore.pool.add(() => postUploadContent(task));
        }
    }
    input.value = ''; // Clear input for same file selection
};

const handleFolderUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    const path = document.location.pathname;
    if (files) {
        for (const file of files) {
            const task: TaskItem = taskFromFile(path, file);
            taskStore.task_map.set(task.id, task);
            taskStore.pool.add(() => postUploadContent(task));
        }
    }
    input.value = ''; // Clear input for same folder selection
};

const selectedTasks = ref<string[]>([]);

const retrySelectedTasks = async () => {
    for (const taskId of selectedTasks.value) {
        const task = taskStore.failure_task_list.find(t => t.id === taskId)
        if (task) {
            taskStore.failure_task_list = taskStore.failure_task_list.filter(t => t.id !== taskId);
            taskStore.task_map.set(taskId, task);
            if (task.upload.status === 'success') {
                await postRePin(task);
            } else {
                task.upload = {
                    status: 'wait',
                    progress: '0',
                    response: null
                }
                task.pin = {
                    status: 'wait',
                    response: null
                }
                taskStore.pool.add(() => postUploadContent(task));
            }
        }
    }
    selectedTasks.value = []
}

const retryTasks = async (taskId: string) => {
    const task = taskStore.failure_task_list.find(t => t.id === taskId)
    if (task) {
        taskStore.failure_task_list = taskStore.failure_task_list.filter(t => t.id !== taskId);
        taskStore.task_map.set(taskId, task);
        if (task.upload.status === 'success') {
            await postRePin(task);
        } else {
            task.upload = {
                status: 'wait',
                progress: '0',
                response: null
            }
            task.pin = {
                status: 'wait',
                response: null
            }
            taskStore.pool.add(() => postUploadContent(task));
        }
    }
}

const delTask = (taskId: string) => {
    taskStore.failure_task_list = taskStore.failure_task_list.filter(t => t.id !== taskId);
}

const isAllSelected = computed({
    get: () => {
        return failedTasks.value.length > 0 &&
            failedTasks.value.every(t => selectedTasks.value.includes(t.id))
    },
    set: (value) => {
        if (value) {
            selectedTasks.value = failedTasks.value.map(t => t.id)
        } else {
            selectedTasks.value = []
        }
    }
})

const handleHeaderCheck = (event: Event) => {
    const target = event.target as HTMLInputElement
    isAllSelected.value = target.checked
}

const clearAll = () => {
    if (selectedTab.value === 'failed') {
        taskStore.failure_task_list = [];
    } else if (selectedTab.value === 'success') {
        taskStore.success_task_list = [];
    }
    selectedTasks.value = [];
}

const getTaskStatus = (task: TaskItem) => {
    if (task.pin.status === 'success') {
        return 'success'
    } else if (task.upload.status === 'failed' || task.pin.status === 'failed') {
        return 'failed'
    } else if (task.upload.status === 'start' || task.pin.status === 'start') {
        return 'doing'
    } else {
        return 'wait'
    }
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'success': return '#48bb78';
        case 'failed': return '#f56565';
        case 'doing': return '#4299e1';
        default: return '#a0aec0';
    }
}
</script>

<template>
    <div class="upload-comp-container">
        <!-- 顶部导航栏 -->
        <div class="nav-header">
            <div class="nav-left">
                <a :class="{ active: selectedTab === 'transfer' }" @click="selectedTab = 'transfer'">
                    传输 ({{ transferringTasks.length }})
                </a>
                <a :class="{ active: selectedTab === 'success' }" @click="selectedTab = 'success'">
                    成功 ({{ successTasks.length }})
                </a>
                <a :class="{ active: selectedTab === 'failed' }" @click="selectedTab = 'failed'">
                    失败 ({{ failedTasks.length }})
                </a>
            </div>

            <div class="nav-right">
                <div v-show="selectedTab === 'transfer'" class="upload-container" @mouseenter="showUploadOptions = true"
                    @mouseleave="showUploadOptions = false">
                    <button class="upload-main-btn">
                        上传
                    </button>
                    <transition name="fade">
                        <div v-show="showUploadOptions" class="upload-options">
                            <button @click.stop="triggerFileUpload">
                                <span>📄 文件</span>
                                <input ref="fileInput" type="file" multiple hidden @change="handleFileUpload">
                            </button>
                            <button @click.stop="triggerFolderUpload">
                                <span>📁 文件夹</span>
                                <input ref="folderInput" type="file" webkitdirectory hidden
                                    @change="handleFolderUpload">
                            </button>
                        </div>
                    </transition>
                </div>
                <button v-show="selectedTab === 'failed'" @click="retrySelectedTasks"
                    :disabled="selectedTasks.length === 0" class="action-btn">
                    重试选中
                </button>
                <button v-show="selectedTab === 'failed' || selectedTab === 'success'" @click="clearAll"
                    :disabled="currentTasks.length === 0" class="action-btn danger">
                    清空全部
                </button>
            </div>
        </div>

        <!-- 任务列表 -->
        <div class="task-list-container">
            <table class="file-table">
                <thead>
                    <tr>
                        <th class="checkbox-cell" v-show="selectedTab === 'failed'">
                            <input type="checkbox" v-model="isAllSelected" @change="handleHeaderCheck">
                        </th>
                        <th class="name-header">名称</th>
                        <th class="size-header">大小</th>
                        <th class="progress-header" v-show="selectedTab === 'transfer'">进度</th>
                        <th class="action-header" v-show="selectedTab === 'failed'">操作</th>
                        <th class="status-header">状态</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="task in currentTasks" :key="task.id" class="file-row">
                        <td class="checkbox-cell" v-show="selectedTab === 'failed'">
                            <input type="checkbox" :value="task.id" v-model="selectedTasks">
                        </td>
                        <td class="name-cell">
                            <span class="filename">{{ task.name }}</span>
                        </td>
                        <td class="size-cell">{{ formatSize(task.size) }}</td>
                        <td class="progress-cell" v-show="selectedTab === 'transfer'">
                            <div class="progress-wrapper">
                                <div class="progress-container">
                                    <div class="progress-bar" :style="{ width: task.upload.progress + '%' }"></div>
                                </div>
                                <span class="progress-text">{{ task.upload.progress }}</span>
                            </div>
                        </td>
                        <td class="action-cell" v-show="selectedTab === 'failed'">
                            <button class="icon-btn" @click="retryTasks(task.id)" title="重试">
                                <VscDebugRestart />
                            </button>
                            <button class="icon-btn danger" @click="delTask(task.id)" title="删除">
                                <IpDeleteFive />
                            </button>
                        </td>
                        <td class="status-cell">
                            <span class="status-badge"
                                :style="{ backgroundColor: getStatusColor(getTaskStatus(task)) }">
                                {{ getTaskStatus(task) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- 空状态提示 -->
            <div v-if="currentTasks.length === 0" class="empty-state">
                <div class="empty-content">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                        stroke="#a0aec0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>暂无任务</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.upload-comp-container {
    height: 100%;
    overflow-y: auto;
    background: #1a202c;
    color: #e5e7eb;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.nav-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: transparent;
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(8px);
    background-color: rgba(26, 32, 44, 0.8);
}

.nav-left,
.nav-right {
    display: flex;
    align-items: center;
    border-radius: 0.5rem;
    gap: 0.5rem;
}

.nav-left a,
.nav-right button {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    outline: none;
}

.nav-left a {
    color: #a0aec0;
    background: transparent;
    text-decoration: none;
}

.nav-left a:hover {
    color: #e5e7eb;
    background: rgba(160, 174, 192, 0.1);
}

.nav-left a.active {
    color: white;
    background: #2d3748;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.upload-container {
    position: relative;
}

.upload-main-btn {
    background: #4299e1;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;
}

.upload-main-btn:hover {
    background: #3182ce;
}

.upload-options {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background: #2d3748;
    border-radius: 0.5rem;
    padding: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    min-width: 120px;
    z-index: 20;
}

.upload-options button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.5rem 1rem;
    color: #e5e7eb;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    border-radius: 0.25rem;
    transition: background 0.2s;
}

.upload-options button:hover {
    background: rgba(160, 174, 192, 0.1);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s, transform 0.15s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-5px);
}

.task-list-container {
    padding: 0 1rem 1rem;
}

.file-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: #2d3748;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.file-table thead {
    background: #3c4555;
}

.file-table th {
    padding: 0.75rem 1rem;
    text-align: left;
    color: #a0aec0;
    font-weight: 500;
    font-size: 0.875rem;
    border-bottom: 1px solid #4a5568;
}

.file-table tbody tr {
    transition: background 0.2s;
}

.file-table tbody tr:hover {
    background: rgba(160, 174, 192, 0.05);
}

.file-table td {
    padding: 0.75rem 1rem;
    color: #e5e7eb;
    font-size: 0.875rem;
    border-bottom: 1px solid #4a5568;
}

.file-table tbody tr:last-child td {
    border-bottom: none;
}

.progress-cell {
    min-width: 200px;
    /* 给进度条和文字更多空间 */
}

.progress-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    /* 进度条和文字之间的间距 */
}

.progress-container {
    flex: 1;
    /* 让进度条占据剩余空间 */
    background: #1a202c;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #4299e1, #63b3ed);
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 0.75rem;
    color: #a0aec0;
    min-width: 40px;
    /* 防止文字换行 */
    text-align: right;
}

.status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
}

.checkbox-cell {
    width: 40px;
    text-align: center;
}

.checkbox-cell input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #4299e1;
}

.name-cell {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.filename {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
}

.size-cell {
    white-space: nowrap;
}

.action-cell {
    display: flex;
    gap: 0.5rem;
}

.icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: #a0aec0;
    cursor: pointer;
    transition: all 0.2s;
}

.icon-btn:hover {
    background: rgba(160, 174, 192, 0.1);
    color: #e5e7eb;
}

.icon-btn.danger:hover {
    background: rgba(245, 101, 101, 0.1);
    color: #f56565;
}

.action-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    background: #4299e1;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
}

.action-btn:hover {
    background: #3182ce;
}

.action-btn:disabled {
    background: #4a5568;
    color: #718096;
    cursor: not-allowed;
}

.action-btn.danger {
    background: #f56565;
}

.action-btn.danger:hover {
    background: #e53e3e;
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 3rem;
    color: #a0aec0;
    border: 1px dashed #4a5568;
    border-radius: 0.5rem;
    margin-top: 1rem;
}

.empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.empty-content p {
    margin: 0;
    font-size: 1rem;
    color: #a0aec0;
}
</style>