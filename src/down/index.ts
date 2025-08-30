

export async function getM3u8Data(url: string) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'iPhone/16.6.1 (iPhone; iOS 16.6; Scale/3.00)'
        }
    });
    if (!response.ok) {
        console.log(url)
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.text();
}

export async function downTsSlice(url: string) {
    const controller= new AbortController();
    const signal = controller.signal;
    const timer = setTimeout(()=>{
        controller.abort();
    },1000*30);
    const response = await fetch(url,{
        signal
    }).finally(()=>{
        clearTimeout(timer);
    })
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.arrayBuffer()
}

export  function extraM3u8Info(m3u8:string){
    const lines = m3u8.split('\n');
    const info: {
        key:string
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

export async function getDecodeKey(baseUrl: string,uri: string) {
    const url = new URL(uri,baseUrl).href;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'iPhone/16.6.1 (iPhone; iOS 16.6; Scale/3.00)'
        }
    });
    return await response.arrayBuffer()
}


function  makeIv(index: number) {
    const iv = new Uint8Array(16);
    iv[12] = (index >> 24) & 0xff;
    iv[13] = (index >> 16) & 0xff;
    iv[14] = (index >> 8) & 0xff;
    iv[15] = index & 0xff;
    return iv;
}
export async function decodeMedia(data: ArrayBuffer, key: ArrayBuffer,index: number) {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-CBC' },
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
