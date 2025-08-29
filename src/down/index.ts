

export async function getM3u8Data(url: string) {
    const response = await fetch(url);
    return await response.text();
}

export async function downTsSlice(url: string) {
    const response = await fetch(url);
    return await response.arrayBuffer()
}
