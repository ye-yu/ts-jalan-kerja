export interface IPengendaliJalanKerja<T> {
  start(): Promise<void>;
  instance: T;
}
