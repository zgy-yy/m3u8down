


export type Progress = {
    data: {
        name: string;
        total: number;
        current: ProgressEvent[];
        done: boolean;
        success: boolean;
        itemSuccessNum:number
    }
}


export  class  ProgressEvent{
    loaded: number;
    total: number;
    progress: number;
    bytes: number;
    rate: number;
    estimated: number;
    event: { lengthComputable: boolean, total: number, loaded: number };
    lengthComputable: boolean;
    download: boolean;
    success: boolean;
    index: number;
    constructor(index: number) {
        this.index = index;
        this.loaded = 0;
        this.total = 0;
        this.progress = 0;
        this.bytes = 0;
        this.rate = 0;
        this.estimated = 0;
        this.event = { lengthComputable: false, total: 0, loaded: 0 };
        this.lengthComputable = false;
        this.download = false;
        this.success = false;
    }
}