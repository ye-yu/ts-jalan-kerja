import { CLASS_TOKEN_PREFIX } from "../constants/class-token-prefix.constant";

export function generateClassToken(token: string): string {
  return `${CLASS_TOKEN_PREFIX}${token}`;
}
