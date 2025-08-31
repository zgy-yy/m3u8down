import logger from "../logger";
import axios from "axios";
import {ProgressEvent} from "../types";


const instance = axios.create({})


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
    try {
        const res = await instance.get<string>(url, {
            timeout: 10000,
        });
        return res.data;
    } catch (error: any) {
        logger.error("获取m3u8文件失败", error.message);
        throw error;
    }
}

export async function downTsSlice(url: string, progress: ProgressEvent) {


    async function download() {
        const controller = new AbortController();
        const signal = controller.signal;
        const timer = setTimeout(() => {
            controller.abort();
        }, 1000 * 60*5)

        try {
            const res = await instance.get<ArrayBuffer>(url, {
                responseType: 'arraybuffer',
                //@ts-ignore
                signal,
                //@ts-ignore
                onDownloadProgress: (progressEvent: ProgressEvent) => {
                    progress.loaded = progressEvent.loaded;
                    progress.total = progressEvent.total;
                    progress.progress = progressEvent.progress;
                    progress.rate = progressEvent.rate;
                    progress.estimated = progressEvent.estimated;
                    progress.event = progressEvent;
                    progress.lengthComputable = progressEvent.lengthComputable;
                    progress.download = progressEvent.download;
                }
            })
            progress.success = true;
            return res.data
        } catch (error: any) {
            logger.error("切片下载失败,重试", progress.index, error.message);
            return download();
        } finally {
            clearTimeout(timer);
        }
    }

    return await download();

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
