


export type Progress = {
    data: {
        name: string;
        folder: string;
        total: number;
        successSlice: number[];
        errorSlice: Set<number>;
        done: boolean;
        success: boolean;
        successNum:number
    }
}

export type Mp4FileInfo = {
    name: string;
    createdAt: Date;
    parentDir: string;
}