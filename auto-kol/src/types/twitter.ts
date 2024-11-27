export type Tweet = {
    readonly id: string;
    readonly text: string;
    readonly authorId: string;
    readonly createdAt: string;
}

export type TwitterCredentials = {
    readonly appKey: string;
    readonly appSecret: string;
    readonly accessToken: string;
    readonly accessSecret: string;
}

export type StreamRule = {
    readonly value: string;
    readonly id?: string;
} 