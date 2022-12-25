Object.defineProperty(globalThis, "executedAt", {
  get(): string {
    const stack: { stack?: string } = {};
    Error.captureStackTrace(stack);
    return `(${stack.stack?.split("\n")[3]?.split("/")?.at(-1) ?? ""}`;
  },
});

declare var executedAt: string;
