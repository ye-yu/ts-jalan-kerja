export function trimDecoratorStackTrace(
  error: Error,
  replaceStack?: string
): Error {
  const stack = replaceStack ?? error?.stack ?? "";
  const [message, , , , , ...traces] = stack.split("\n");
  error.stack = `${message}\n${traces.join("\n")}`;
  return error;
}
