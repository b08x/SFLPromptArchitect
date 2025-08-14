"use strict";
/**
 * @file index.ts
 * @description This is the main entry point for the SFL-Prompt-Architect backend server.
 * It imports the Express application and starts the server.
 *
 * @requires ./app
 * @requires ./config/logger
 * @requires ./config/env
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const logger_1 = __importDefault(require("./config/logger"));
const env_1 = __importDefault(require("./config/env"));
const port = env_1.default.port;
app_1.default.listen(port, () => {
    logger_1.default.info(`Server is running on http://localhost:${port}`);
});
