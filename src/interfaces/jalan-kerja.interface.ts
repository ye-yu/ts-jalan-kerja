export interface IJalanKerja<T> {
  start(): Promise<void>;
  instance: T;
}
