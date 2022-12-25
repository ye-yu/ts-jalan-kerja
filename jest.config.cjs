/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: "src",
    testRegex: ".*\\.spec\\.ts$",
    collectCoverageFrom: ["**/*.(t|j)s"],
    coverageDirectory: "../coverage",
};