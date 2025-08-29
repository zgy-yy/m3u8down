import fs from 'fs';
import path from 'path';

export  async function saveFile(data: ArrayBufferLike, filename: string) :Promise<string>{   
    checkDir(filename);
    fs.writeFileSync(filename, Buffer.from(data));
    return filename;
}

export async function saveTextFile(data: string, filename: string) :Promise<string>{   
    checkDir(filename);
    fs.writeFileSync(filename, data);
    return filename;
}

export async function removeFile(filename: string) :Promise<string>{   
    checkDir(filename);
    fs.unlinkSync(filename);
    return filename;
}

export function checkDir(filename: string) {
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
