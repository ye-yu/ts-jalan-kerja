export abstract class JalanKerjaAsas<T> {
  outputs: {
    [K in keyof T]?: T[K] extends (...args: any) => any
      ? {
          finished: true;
          value: ReturnType<T[K]>;
        }
      : never;
  } = {};
  getOutputFromWorkflow<K extends keyof T>(
    name: K
  ): this["outputs"][K] | undefined {
    const value = this.outputs[name];
    if (!value?.finished)
      throw new Error(`Workflow ${String(name)} is not yet finished!`);
    return value.value;
  }
  setOutputFromWorkflow<K extends keyof T>(name: K, value: any): void {
    Object.defineProperty(this.outputs, name, {
      value,
    });
  }
}
