"use strict";
/**
 * @file index.ts
 * @description This is the main entry point for the SFL-Prompt-Architect backend server.
 * It sets up the Express application, configures middleware, defines API routes,
 * and starts the server.
 *
 * @requires express
 * @requires ./middleware/errorHandler
 * @requires ./config/logger
 * @requires ./api/routes
 * @requires ./config/env
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const logger_1 = __importDefault(require("./config/logger"));
const routes_1 = __importDefault(require("./api/routes"));
const env_1 = __importDefault(require("./config/env"));
const app = (0, express_1.default)();
const port = env_1.default.port;
app.use(express_1.default.json());
app.use('/api', routes_1.default);
app.get('/', (req, res) => {
    res.send('SFL-Prompt-Architect Backend is running!');
});
app.use(errorHandler_1.default);
app.listen(port, () => {
    logger_1.default.info(`Server is running on http://localhost:${port}`);
});
