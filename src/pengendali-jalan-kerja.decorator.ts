import "reflect-metadata";
import { DEPENDENCIES_TOKEN } from "./constants/dependencies-token.constant";
import { IJalanKerjaConfig } from "./interfaces/jalan-kerja-config.interface";
import { generateClassToken } from "./utils/generate-class-token.util";

/**
 *
 * @param name Workflow name
 * @returns Class decorated with WorkflowHandler
 */
export const PengendaliJalanKerja: (
  config?: IJalanKerjaConfig
) => ClassDecorator = <T extends Function>({
  name = "",
  dependencies = [] as IJalanKerjaConfig["dependencies"],
} = {}) => {
  return (target: T) => {
    const dependenciesToken = generateClassToken(DEPENDENCIES_TOKEN);
    Reflect.defineMetadata(dependenciesToken, dependencies, target);
  };
};
