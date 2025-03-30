import { Keyring } from "@polkadot/keyring";
import { Buffer } from "buffer";
import { useSettingStore } from "./pinia";
import { notyf } from "./notify";

const getAccessToken = async () => {
    const settingStore = useSettingStore()
    if (settingStore.user.seed !== null) {
        const keyring = new Keyring();
        const pair = keyring.addFromUri(settingStore.user.seed);

        const sign = pair.sign(pair.address);
        const signHex = '0x' + Buffer.from(sign).toString('hex');

        const access_token = Buffer.from(`sub-${pair.address}:${signHex}`).toString('base64');

        settingStore.user.token = access_token;

        return `Bearer ${access_token}`
    } else {
        notyf.error("没有 seeds 也没有 accessToken; 使用内置accessToken, 如果无效请联系作者");
        return `Basic c3Vic3RyYXRlLWNUR2ZLYXk0c0tDb0VTTW43WVpxcThtQVZ1SzhSbjJNV2I5N1JZRXlaZ3BkRmZYWDM6MHgxNDVlOGY0MmIwMmIyNzBjODhjYzk1NzYzNDUwYTdkZTVkOTk2NDNjYjA0ZDM4OGY5MzVjZTJlNWY2OTNiMzNhNzk2NWIyNTdiN2M4ZTQ5MmM1NjhjYTU1MmJiY2M1YzQxYjM0ZTRkYmE4ZDJjM2VkM2FlMTdmN2Y2MGU0YTk4NQ==`
    }
}

export {
    getAccessToken,
}