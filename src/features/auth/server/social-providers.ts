export type SocialProviders = {
  google: boolean;
  kakao: boolean;
};

export function getSocialProviders(): SocialProviders {
  return {
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    kakao: Boolean(process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET),
  };
}
