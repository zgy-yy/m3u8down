import { decodeMedia, downTsSlice, extraM3u8Info, getDecodeKey, getM3u8Data } from "./down";
import { moveFile, removeDir, removeFile, saveFile, saveTextFile } from "./fileIo";
import logger from "./logger";
import { exec } from "child_process";
import { Progress } from "./types";
import path from "path";
import { config } from "./config";

const basedir = config.basedir;

export async function download(url: string, name: string, folder: string) {
    const progress: Progress = {
        data: {
            name: name,
            folder: folder,
            total: 0,
            successSlice: [],
            errorSlice: new Set(),
            done: false,
            success: false,
            successNum: 0
        }
    }
    const dir = `${basedir}/${folder}/${name}`;
    const baseUrl = url
    const m3u8Res = await getM3u8Data(baseUrl).catch((err) => {
        return ""
    })
    if (!m3u8Res) {
        logger.error(name, 'm3u8文件为空');
        progress.data.done = true;
        return progress
    }
    //m3u8 info
    const info = extraM3u8Info(m3u8Res);
    console.log(info);
    const tsSlice = info.urls //ts切片
    const key = await getDecodeKey(baseUrl, info.key); //解密key
    console.log("key", key);

    const sliceTask: Promise<number>[] = [];
    const listFile = `${path.join(dir, 'list')}.txt`;
    const mediaFile = `${path.join(dir, name)}.mp4`;
    let listContent = ""
    logger.info(name, '开始下载...');
    progress.data.total = tsSlice.length;
    (async () => {
        for (const slice of tsSlice) {
            const index: number = tsSlice.indexOf(slice);
            const sliceUrl = new URL(slice, baseUrl).href;
            const task = downTsSlice(sliceUrl, ()=>{
                progress.data.errorSlice.add(index);
            }).then(data => {
                if (data) {
                    progress.data.successNum++;
                    progress.data.successSlice.push(index);
                    progress.data.errorSlice.delete(index);

                    decodeMedia(data, key, index).then(data => {
                        saveFile(data, `${dir}/${index}.ts`);
                    }).catch(error => {
                        logger.error("解密失败", index, error);
                        throw error;
                    })
                }
                return index;
            }).catch(error => {
                logger.error("切片下载失败....", index, error);
                return index;
            })
            listContent += `file ${index}.ts\n`;
            sliceTask.push(task);
        }
        saveTextFile(listContent, listFile).then(data => {
            logger.info(name, '切片列表文件创建完成');
        }).catch((err) => {
            logger.error(name, '切片列表文件创建完成');
        })

        const taskLen = 6;
        for (let i = 0; i < Math.floor(sliceTask.length / taskLen); i++) {
            const taskSlice = sliceTask.slice(i * taskLen, (i + 1) * taskLen);
            await Promise.allSettled(taskSlice).catch((err) => {
                progress.data.done = true;
                progress.data.success = false;
                logger.error(name, '下载失败', err);
            })
        }

        if (progress.data.successNum !== progress.data.total) {
            logger.error(name, '切片数量不一致,下载失败');
            removeDir(dir);//删除目录
            progress.data.done = true;
            return progress;
        }
        logger.info(name, '下载完成,正在合并...');
        const cmd = `./lib/ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${mediaFile}"`
        exec(cmd, (error, stdout, stderr) => {
            moveFile(`${mediaFile}`, `${path.join(dir, '../')}/${name}.mp4`);
            removeDir(dir);//删除目录
            progress.data.done = true;
            progress.data.success = true;
            if (error) {
                logger.error(`执行错误: ${error}`);
            } else {
                logger.info(name, '合并完成');
            }

        })
    })();

    return progress;
}
