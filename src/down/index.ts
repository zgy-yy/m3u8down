import logger from "../logger";
import axios from "axios";
import axiosRetry from "axios-retry";


const instance = axios.create({})

axiosRetry(instance, {
    retries: 10,
    retryDelay: (retryCount) => {
        return retryCount * 1000;
    },
    retryCondition: (error) => {
        return axiosRetry.isNetworkError(error) ||
            axiosRetry.isRetryableError(error) ||
            (error.response && error.response.status >= 500);
    }
})

instance.interceptors.request.use(
    config => {
        if (config.headers) {
            config.headers['User-Agent'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
        }

        return config;
    },
    error => {
        return Promise.reject(error);
    }
)

export async function getM3u8Data(url: string) {
    const res = await instance.get<string>(url);
    return res.data;
}

export async function downTsSlice(url: string, index: number) {
    try{
        const res = await instance.get<ArrayBuffer>(url, {
            responseType: 'arraybuffer',
        })
        return res.data
    }catch(error:any){
        logger.error("切片下载失败", index,error?.response);
        throw error;
    }

}

export function extraM3u8Info(m3u8: string) {
    const lines = m3u8.split('\n');
    const info: {
        key: string
        urls: string[]
    } = {
        key: "",
        urls: []
    };
    lines.forEach(line => {
        if (line.includes('URI')) {
            info.key = line.split('URI=')[1].replace(/"/g, '');
        }
        if (line.includes('https')) {
            info.urls.push(line);
        }
    });
    return info
}

export async function getDecodeKey(baseUrl: string, uri: string) {
    const url = new URL(uri, baseUrl).href;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'iPhone/16.6.1 (iPhone; iOS 16.6; Scale/3.00)'
        }
    });
    return await response.arrayBuffer()
}


function makeIv(index: number) {
    const iv = new Uint8Array(16);
    iv[12] = (index >> 24) & 0xff;
    iv[13] = (index >> 16) & 0xff;
    iv[14] = (index >> 8) & 0xff;
    iv[15] = index & 0xff;
    return iv;
}

export async function decodeMedia(data: ArrayBuffer, key: ArrayBuffer, index: number) {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        {name: 'AES-CBC'},
        false,
        ['decrypt']
    );
    return await crypto.subtle.decrypt(
        {
            name: 'AES-CBC',
            iv: makeIv(index)
        },
        cryptoKey,
        data
    );
}
