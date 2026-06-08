import { getSocialProviders } from "@/features/auth/server/social-providers";
import { SocialLoginButtons } from "./social-login-buttons";

export function SocialLoginSection({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const providers = getSocialProviders();
  return (
    <SocialLoginButtons
      google={providers.google}
      kakao={providers.kakao}
      callbackUrl={callbackUrl}
    />
  );
}
