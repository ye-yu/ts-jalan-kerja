import { randomUUID } from "crypto";
import { DEPENDENCIES_TOKEN } from "./constants/dependencies-token.constant";
import { METHODS_TOKEN } from "./constants/methods-token.constant";
import { IJalanKerjaConfig } from "./interfaces/jalan-kerja-config.interface";
import { IPengendaliJalanKerja } from "./interfaces/pengendali-jalan-kerja.interface";
import { generateClassToken } from "./utils/generate-class-token.util";
import { trimDecoratorStackTrace } from "./utils/trim-decorator-stack-trace.util";

type NoParamConstructorType<T> = new () => T;

type WorkflowProfile = {
  metadata?: Record<string, unknown>;
} & {
  [workflow: string]: {
    timeTaken?: number;
    order: number;
    name: string | symbol;
  };
};

export class JalanKerjaAsas<
  T extends { [name: string]: (...p: any[]) => Promise<void> }
> implements IPengendaliJalanKerja<T>
{
  workflowId = "";
  workflowProfile: WorkflowProfile = {};
  workflowStartTime = 0;
  workflowEndTime = 0;
  shouldStop = false;
  readonly newId = (): string => randomUUID().split("-")[0];
  stop = (): boolean => (this.shouldStop = true);

  constructor(
    readonly instance: T,
    readonly dependenciesMap = new Map<any, any>(),
    readonly dependencies = new Map<string | symbol, any[]>(),
    readonly workflows: Array<WorkflowProfile[string]> = [],
    readonly tearDowns: Array<WorkflowProfile[string]> = []
  ) {}

  createFunctionFactory(name: any): () => Promise<void> {
    const instance = this.instance;
    if (name in instance && typeof instance[name] === "function") {
      const dependencies = this.dependencies.get(name as any);
      if (!dependencies) {
        return () =>
          Promise.reject(
            new Error(
              `Cannot prepare function ` +
                `${String(name)} ` +
                `for execution: Dependencies not defined`
            )
          );
      }
      const deps = dependencies.map((e) => this.dependenciesMap.get(e)());
      return () => Promise.resolve(instance[name].bind(instance)(...deps));
    } else {
      return () =>
        Promise.reject(
          new Error(
            `Cannot prepare function ` +
              `${String(name)} ` +
              `for execution: Not a function`
          )
        );
    }
  }

  async start(): Promise<void> {
    this.workflowId = this.newId();
    this.workflowProfile = {};
    this.workflowStartTime = performance.now();

    for (const { name, order } of this.workflows.sort(
      (a, b) => a.order - b.order
    )) {
      const start = performance.now();
      const workflow = this.createFunctionFactory(name);
      try {
        await workflow();
      } catch (error) {
        this.stop();
      }
      const end = performance.now();
      const timeTaken = end - start;
      this.workflowProfile[String(name)] = {
        timeTaken,
        order,
        name,
      };
      if (this.shouldStop) break;
    }

    const tearDownTasks = this.tearDowns.sort((a, b) => a.order - b.order);
    await Promise.all(
      tearDownTasks.map(async ({ name, order }) => {
        try {
          const tearDown = this.createFunctionFactory(name);
          await tearDown();
        } catch (error) {
          console.error(
            `Error at tear down process ${String(name)}, ignoring error...`,
            { error, order }
          );
        }
      })
    );

    this.workflowEndTime = performance.now();
  }
}

export function compileJalanKerja<T>(
  Pengendali: NoParamConstructorType<T>,
  overrideDependencies: IJalanKerjaConfig["dependencies"] = []
): IPengendaliJalanKerja<T> {
  const instance: any = new Pengendali();
  const dependenciesToken = generateClassToken(DEPENDENCIES_TOKEN);
  const dependenciesConfig: IJalanKerjaConfig["dependencies"] =
    Reflect.getMetadata(dependenciesToken, Pengendali);

  if (!dependenciesConfig) {
    throw new Error(
      `Class ${Pengendali.name} is not decorated with @WorkflowHandler`
    );
  }

  const dependenciesMap = [
    ...dependenciesConfig,
    ...overrideDependencies,
  ].reduce((a, b) => {
    a.set(b.provide, b.use);
    return a;
  }, new Map<any, any>());

  const token = generateClassToken(METHODS_TOKEN);
  const methodsDefined: {
    order: number;
    key: string | symbol;
    paramTypes: Function[];
    stack: string;
  }[] = Reflect.getMetadata(token, Pengendali) ?? [];
  const workflowsDefinedSorted = methodsDefined.sort(
    (a, b) => a.order - b.order
  );

  const dependencies = new Map<string | symbol, any[]>();
  for (const { key, paramTypes, stack } of workflowsDefinedSorted) {
    const notFound = paramTypes
      .map((dep, index) => ({ dep, index }))
      .filter((e) => !dependenciesMap.has(e.dep));
    if (notFound.length) {
      const notFoundToString = notFound
        .map((e) => `${e.dep.name} (index ${e.index})`)
        .join(", ");
      const error: any = new Error(
        `Cannot find instance for method ${String(key)} ` +
          `[${notFoundToString}]. ` +
          `Pass the initializer in the dependency configuration. `
      );

      error["cause"] = trimDecoratorStackTrace(
        new Error(notFoundToString),
        stack
      );
      throw error;
    }
    dependencies.set(key, paramTypes);
  }
  const pengendali: IPengendaliJalanKerja<T> = new JalanKerjaAsas(
    instance,
    dependenciesMap,
    dependencies,
    workflowsDefinedSorted.map((e) => ({
      order: e.order,
      name: e.key,
    }))
  );
  return pengendali;
}
