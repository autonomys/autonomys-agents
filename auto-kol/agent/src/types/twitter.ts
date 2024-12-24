export type Tweet = {
  readonly id: string;
  readonly text: string;
  readonly author_id: string;
  readonly author_username: string;
  readonly created_at: string;
  readonly thread?: Tweet[];
};

export type TwitterCredentials = {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
};
