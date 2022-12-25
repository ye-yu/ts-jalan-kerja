import "reflect-metadata";
import { METHODS_TOKEN } from "./constants/methods-token.constant";
import { generateClassToken } from "./utils/generate-class-token.util";

export const JalanKerja: (order: number) => MethodDecorator = (
  order: number
) => {
  return (
    target: Object & { prototype?: Function["prototype"] },
    key: string | symbol
  ) => {
    const token = generateClassToken(METHODS_TOKEN);
    const methodsDefined: {
      order: number;
      key: string | symbol;
      paramTypes: Function[];
      stack: string;
    }[] = Reflect.getMetadata(token, target.constructor) ?? [];
    const alreadyDefined = methodsDefined.find((e) => e.key === key);
    if (alreadyDefined)
      throw new Error(
        `Method ${String(key)} is already defined as a workflow method in ${
          target.constructor.name
        }`
      );
    const paramTypes: Function[] = Reflect.getMetadata(
      "design:paramtypes",
      target,
      key
    );
    const newLocal = { order, key, paramTypes, stack: "" };
    Error.captureStackTrace(newLocal);
    const newMethodsDefined = [...methodsDefined, newLocal];
    Reflect.defineMetadata(token, newMethodsDefined, target.constructor);
    return;
  };
};
