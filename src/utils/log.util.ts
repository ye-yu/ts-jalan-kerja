import "../constants/executed-at.constant";

export const info = (...logObject: any[]): void => {
  console.info(executedAt, ...logObject);
};
