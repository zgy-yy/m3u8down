import fs from 'fs';
import path from 'path';

export async function saveFile(data: ArrayBufferLike, filename: string): Promise<string> {
    checkDir(filename);
    fs.writeFileSync(filename, Buffer.from(data));
    return filename;
}

export async function saveTextFile(data: string, filename: string): Promise<string> {
    checkDir(filename);
    fs.writeFileSync(filename, data);
    return filename;
}

export async function removeFile(filename: string): Promise<string> {
    checkDir(filename);
    fs.unlinkSync(filename);
    return filename;
}

export async function removeDir(filename: string): Promise<string> {
    checkDir(filename);
    fs.rmSync(filename, {recursive: true});
    return filename;
}

export async function moveFile(filename: string, newFilename: string): Promise<string> {
    checkDir(filename);
    fs.renameSync(filename, newFilename);
    return newFilename;
}

export function checkDir(filename: string) {
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
}

export function screenMp4Files(dirPath: string,): string[] {
    const results: string[] = [];

    try {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // 如果是目录，递归搜索
                results.push(...screenMp4Files(fullPath));
            } else if (path.extname(item).toLowerCase() === '.mp4') {
                // 如果是MP4文件，添加到结果中
                results.push(item);
            }
        }
    } catch (error) {
        console.error(`读取目录时出错: ${dirPath}`, error);
    }

    return results;
}

