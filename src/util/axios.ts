import axios from "axios";
import { getAccessToken } from "./token";
import { useSettingStore } from "./pinia";

// 普通资源
const axiosBase = axios.create({
    timeout: 30000
});

axiosBase.interceptors.request.use(
    (config) => {
        return config;
    }
)

axiosBase.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        return Promise.reject(error);
    }
)


// 认证资源
const axiosAuth = axios.create({
    timeout: 3000000
});

axiosAuth.interceptors.request.use(
    async (config) => {
        const settingStore = useSettingStore();
        if (settingStore.user.token !== null) {
            config.headers.Authorization = settingStore.user.token;
        } else {
            const access_token = await getAccessToken();
            settingStore.user.token = access_token;
            config.headers.Authorization = access_token;
        }
        return config;
    }
)

axiosAuth.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        return Promise.reject(error);
    }
)

export {
    axiosAuth,
    axiosBase
}