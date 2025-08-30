// src/app.ts

import express from 'express';
import { downTsSlice, getM3u8Data } from './down';
import { removeFile, saveFile, saveTextFile } from './fileIo';
import { exec } from 'child_process';
import logger from './logger';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const basedir = "/Users/tal/Movies/vid";

type Progress = {
    data: {
        name: string;
        total: number;
        current: number[];
    }
}



async function download(url: string, name: string, progress: Progress) {
    progress.data.name = name;
    const dir = `${basedir}/${name}`;
    const baseUrl = 'https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/hls/xgplayer-demo.m3u8'
    const m3u8Res = await getM3u8Data(baseUrl)
    const tsSlice = m3u8Res.split('\n').filter(line => line.includes('.ts'));
    const sliceTask: Promise<void>[] = [];
    const listFile = "list.txt";
    let listContent = ""
    tsSlice.forEach(async (slice: string, index: number) => {
        progress.data.total = tsSlice.length;
        const sliceUrl = new URL(slice, baseUrl).href;
        const task = downTsSlice(sliceUrl.toString()).then(data => {
            progress.data.current.push(index);
            saveFile(data, `${dir}/${index}.ts`);
        })
        listContent += `file ${index}.ts\n`;
        sliceTask.push(task);
    })
    saveTextFile(listContent, `${dir}/${listFile}`);
    await Promise.all(sliceTask)
    logger.info(name, '下载完成,开始合并...');
    exec(`./lib/ffmpeg -f concat -safe 0 -i ${dir}/${listFile} -c copy ${dir}/${name}.mp4`, (error, stdout, stderr) => {
        tsSlice.forEach(async (slice: string, index: number) => {
            removeFile(`${dir}/${index}.ts`);
        })
        removeFile(`${dir}/${listFile}`);
        if (error) {
            logger.error(`执行错误: ${error}`);
            return;
        }
        logger.info(name, '合并完成');
    })
}




// 路由
app.get('/', (req, res) => {
    res.json({
        message: '欢迎使用 Express TypeScript API',
        version: '1.0.0'
    });
});

// 健康检查
app.get('/download', async (req, res) => {
    const { url, name } = req.query;
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    
    while(true){
        res.write(`data: ${JSON.stringify(23)}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
});

// 启动服务器
app.listen(PORT, () => {
    logger.info(`🚀 服务器运行在 http://localhost:${PORT}`);
    logger.info(`💚 download: http://localhost:${PORT}/download`);
});

export default app;
