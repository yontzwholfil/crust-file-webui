class Node<T> {
    value: T;
    next: Node<T> | null;

    constructor(value: T) {
        this.value = value;
        this.next = null;
    }
}

class Queue<T> {
    private head: Node<T> | null;
    private tail: Node<T> | null;
    private size: number;

    constructor() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    enqueue(value: T): void {
        const node = new Node(value);
        if (this.tail) {
            this.tail.next = node;
        } else {
            this.head = node;
        }
        this.tail = node;
        this.size++;
    }

    dequeue(): T | null {
        if (!this.head) return null;
        const value = this.head.value;
        this.head = this.head.next;
        if (!this.head) {
            this.tail = null;
        }
        this.size--;
        return value;
    }

    isEmpty(): boolean {
        return this.size === 0;
    }
}

type Task = {
    taskFn: () => Promise<void>; // 任务函数
}

class PromisePool {
    private maxConcurrency: number;
    private queue: Queue<Task>;
    private running: number;
    private errors: any[]; // 用于存储任务中的错误

    constructor(maxConcurrency: number) {
        this.maxConcurrency = maxConcurrency;
        this.queue = new Queue();
        this.running = 0;
        this.errors = [];
    }

    add(taskFn: () => Promise<void>,): void {
        this.queue.enqueue({ taskFn });
        this.run();
    }

    private run(): void {
        while (this.running < this.maxConcurrency && !this.queue.isEmpty()) {
            const task = this.queue.dequeue();
            if (task) {
                this.running++;
                this.executeTask(task);
            }
        }
    }

    private executeTask(task: Task): void {
        task
            .taskFn()
            .catch((error) => {
                console.error('Task failed:', error);
                // if (task.retries > 0) {
                //     console.log(`Retrying task (${task.maxRetries - task.retries + 1}/${task.maxRetries})`);
                //     task.retries--;
                //     this.queue.enqueue(task); // 重新加入队列
                // } else {
                //     this.errors.push(error); // 记录最终失败的任务
                // }
            })
            .finally(() => {
                this.running--;
                this.run(); // 继续执行下一个任务
            });
    }

    async waitForCompletion(): Promise<void> {
        // 等待所有任务完成
        while (this.running > 0 || !this.queue.isEmpty()) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // 如果有错误，抛出错误数组
        if (this.errors.length > 0) {
            throw this.errors; // 直接抛出错误数组
        }
    }
}

export {
    Queue,
    PromisePool
}
