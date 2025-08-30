// src/app.ts

import express from 'express';
import cors from 'cors';
import logger from './logger';
import {download} from "./index";
import {Progress} from "./types";
import {config} from "./config";
import {screenMp4Files} from "./fileIo";


const app = express();
const PORT = config.port

// 中间件
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());


const mp4Files: string[] = screenMp4Files(config.basedir);
logger.info("files", mp4Files);

const progressMap: Map<string, Progress> = new Map();

// 路由
app.get('/', (req, res) => {
    res.json({
        message: '欢迎使用 Express TypeScript API',
        version: '1.0.0'
    });
});



// 健康检查
app.post('/download', async (req, res) => {
    console.log(req.body);
    let {url, name,folder} = req.body;
    if(!url || !name || !folder) {
        res.json({
            code: 1,
            msg: "url or name or folder is empty"
        })
    }
    if(mp4Files.find((item) => item === name+'.mp4')) {
        res.json({
            code: 1,
            msg: "file exists"
        })
        return;
    }
    download(url, name,folder).then(res=>{
        progressMap.set(name, res);
    })
    res.json({
        code: 0,
        msg: "success"
    })
});



app.get("/list", (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream;charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
    });

   const timer = setInterval(() => {
        const result: {
            downloaded: string[],
            processList: {
                name: string,
                progress: Progress
            }[]
        } = {
            downloaded: mp4Files,
            processList: []
        }
        progressMap.forEach((item, key) => {
            result.processList.push({
                name: key,
                progress: item
            });

            if(item.data.done){
                mp4Files.push(key+'.mp4');
                progressMap.delete(key);
            }
        })
        res.write("data: "+JSON.stringify(result)+"\n\n");
    }, 1000);
    req.on("error", (err) => {
        clearInterval(timer);
    })
    res.on("close", () => {
        clearInterval(timer);
    })
})

// 启动服务器
app.listen(PORT, () => {
    logger.info(`🚀 服务器运行在 http://localhost:${PORT}`);
    logger.info(`💚 download: http://localhost:${PORT}/download`);
    logger.info(`💚 process: http://localhost:${PORT}/list`);
});

export default app;
