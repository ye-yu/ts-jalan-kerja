import "reflect-metadata";
import { METHODS_TOKEN } from "./constants/methods-token.constant";
import { generateClassToken } from "./utils/generate-class-token.util";
import { info } from "./utils/log.util";
import { trimDecoratorStackTrace } from "./utils/trim-decorator-stack-trace.util";

/**
 *
 * @param name Workflow name
 * @returns Class decorated with WorkflowHandler
 */
export const PengendaliJalanKerja: (config?: {
  name?: string;
  dependencies?: { provide: any; use: () => any }[];
}) => ClassDecorator = <T extends Function>({
  name = "",
  dependencies = new Array<{ provide: any; use: () => any }>(),
} = {}) => {
  return (target: T) => {
    const dependencyMap = dependencies.reduce((a, b) => {
      a.set(b.provide, b.use);
      return a;
    }, new Map<any, any>());

    const token = generateClassToken(METHODS_TOKEN);
    const methodsDefined: {
      order: number;
      key: string | symbol;
      paramTypes: Function[];
      stack: string;
    }[] = Reflect.getMetadata(token, target) ?? [];
    const methodsDefinedSorted = methodsDefined.sort(
      (a, b) => a.order - b.order
    );

    for (const { key, paramTypes, stack } of methodsDefinedSorted) {
      const method = target.prototype[key];
      const notFound = paramTypes.filter((e) => !dependencyMap.has(e));
      if (notFound.length) {
        throw trimDecoratorStackTrace(
          new Error(
            `Error initializing workflow for method ` +
              `${String(key)}: ` +
              `Cannot find dependency for ` +
              `${notFound.map((e) => e.name).join(", ")}. ` +
              `Pass the initializer in the dependency configuration.`
          ),
          stack
        );
      }
      info({ paramTypes, method });
    }
  };
};
