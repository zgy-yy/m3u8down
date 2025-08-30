import {decodeMedia, downTsSlice, extraM3u8Info, getDecodeKey, getM3u8Data} from "./down";
import {moveFile, removeDir, removeFile, saveFile, saveTextFile} from "./fileIo";
import logger from "./logger";
import {exec} from "child_process";
import {Progress} from "./types";
import path from "path";
import {config} from "./config";

const basedir = config.basedir;

export async function download(url: string, name: string, folder: string) {
    const progress: Progress = {
        data: {
            name: name,
            total: 0,
            current: [],
            done: false
        }
    }
    const dir = `${basedir}/${folder}/${name}`;
    const baseUrl = url
    const m3u8Res = await getM3u8Data(baseUrl)
    if (!m3u8Res) {
        progress.data.done = true;
        return progress
    }
    //m3u8 info
    const info = extraM3u8Info(m3u8Res);
    const tsSlice = info.urls //ts切片
    const key = await getDecodeKey(baseUrl, info.key); //解密key

    const sliceTask: Promise<void>[] = [];
    const listFile = `${path.join(dir, 'list')}.txt`;
    const mediaFile = `${path.join(dir, name)}.mp4`;
    let listContent = ""
    logger.info(name, '开始下载...');
    for (const slice of tsSlice) {
        const index: number = tsSlice.indexOf(slice);
        progress.data.total = tsSlice.length;
        const sliceUrl = new URL(slice, baseUrl).href;
        const task = downTsSlice(sliceUrl).then(data => {
            progress.data.current.push(index);
            decodeMedia(data, key, index).then(data => {
                saveFile(data, `${dir}/${index}.ts`);
            })
        })
        listContent += `file ${index}.ts\n`;
        sliceTask.push(task);
    }
    saveTextFile(listContent, listFile).then(data => {
        logger.info(name, '列表文件创建完成');
    }).catch((err) => {
        logger.error(name, '列表文件创建失败');
    })
    Promise.all(sliceTask).then(() => {
        logger.info(name, '下载完成,正在合并...');
        const cmd =`./lib/ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${mediaFile}"`
        exec(cmd, (error, stdout, stderr) => {
            moveFile(`${mediaFile}`, `${path.join(dir, '../')}/${name}.mp4`);
            removeDir(dir);//删除目录
            progress.data.done = true;
            if (error) {
                logger.error(`执行错误: ${error}`);
            }else{
                logger.info(name, '合并完成');
            }

        })

    }).catch((err) => {
        progress.data.done = true;
        logger.error(name, '下载失败', err);
    })
    return progress;
}
