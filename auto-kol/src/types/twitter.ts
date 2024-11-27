export type Tweet = {
    readonly id: string;
    readonly text: string;
    readonly authorId: string;
    readonly createdAt: string;
}

export type TwitterCredentials = Readonly<{
    appKey: string;
    appSecret: string;
}>;

export type StreamRule = {
    readonly value: string;
    readonly id?: string;
} 