export type Tweet = {
    readonly id: string;
    readonly text: string;
    readonly authorId: string;
    readonly authorUsername: string;
    readonly createdAt: string;
}

export type TwitterCredentials = {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
};
