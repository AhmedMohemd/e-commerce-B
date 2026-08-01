export const APPLICATION_NAME = process.env.APPLICATION_NAME as string;
export const PORT = process.env.PORT ?? 8000;
export const IV_LENGTH = Number(process.env.IV_LENGTH ?? 16);
export const DB_URI = process.env.DB_URI as string;
export const ENC_SECRET_KEY = process.env.ENC_SECRET_KEY as string;
export const ACCESS_SYSTEM_TOKEN_SIGNATURE = process.env
  .ACCESS_SYSTEM_TOKEN_SIGNATURE as string;
export const ACCESS_USER_TOKEN_SIGNATURE = process.env
  .ACCESS_USER_TOKEN_SIGNATURE as string;
export const REFRESH_SYSTEM_TOKEN_SIGNATURE = process.env
  .REFRESH_SYSTEM_TOKEN_SIGNATURE as string;
export const REFRESH_USER_TOKEN_SIGNATURE = process.env
  .REFRESH_USER_TOKEN_SIGNATURE as string;
export const REFRESH_TOKEN_EXPIRES_IN = parseInt(
  process.env.REFRESH_TOKEN_EXPIRES_IN ?? "1800",
);
export const ACCESS_TOKEN_EXPIRES_IN = parseInt(
  process.env.ACCESS_TOKEN_EXPIRES_IN ?? "1800",
);
export const REDIS_URI = process.env.REDIS_URI as string;
export const EMAIL_APP = process.env.EMAIL_APP as string;
export const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD as string;
export const FACEBOOKLINK = process.env.FACEBOOKLINK as string;
export const INSTAGRAM = process.env.INSTAGRAM as string;
export const TWITTERLINK = process.env.TWITTERLINK as string;
export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10");
export const ORIGINS = (process.env.ORIGINS?.split(",") || []) as string[];
export const CLIENT_ID = (process.env.CLIENT_ID?.split(",") || []) as string[];
export const AWS_REGION = process.env.AWS_REGION as string;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME as string;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
export const AWS_SECRET_ACCESS_KEY = process.env
  .AWS_SECRET_ACCESS_KEY as string;
export const AWS_EXPIRES_IN = parseInt(
  (process.env.AWS_EXPIRES_IN as string) || "120",
);