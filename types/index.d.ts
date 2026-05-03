export declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      DISCORD_TOKEN: string;
      MONGODB_URI: string;
      MONGODB_NAME: string;
    }
  }
}
