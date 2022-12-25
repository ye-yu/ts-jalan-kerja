import { METHODS_TOKEN } from "../constants/methods-token.constant";

export function generateClassTokenForMethods(token: string): string {
  return `${METHODS_TOKEN}${token}`;
}
