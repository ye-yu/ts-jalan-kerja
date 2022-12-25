export interface IJalanKerjaConfig {
  name?: string;
  dependencies?: {
    provide: any;
    use: () => any;
  }[];
}
