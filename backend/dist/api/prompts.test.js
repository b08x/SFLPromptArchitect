"use strict";
/**
 * @file prompts.test.ts
 * @description Integration tests for the /api/prompts endpoints.
 * Tests all CRUD operations for prompts with proper HTTP status codes and error handling.
 * Uses mocked database to isolate API logic testing.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
// Mock the database getPool function
jest.mock('../config/database', () => jest.fn(() => Promise.resolve({
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
})));
const database_1 = __importDefault(require("../config/database"));
const mockGetPool = database_1.default;
const mockPool = {
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
}; // Mock pool object
mockGetPool.mockResolvedValue(mockPool);
const mockQuery = mockPool.query;
const mockEnd = mockPool.end;
describe('/api/prompts', () => {
    const mockPromptId = 'test-prompt-id-123';
    const validPromptData = {
        title: 'Test Prompt',
        promptText: 'This is a test prompt for testing purposes.',
        sflField: {
            topic: 'Testing',
            taskType: 'Code Generation',
            domainSpecifics: 'Unit tests',
            keywords: 'test, jest, supertest'
        },
        sflTenor: {
            aiPersona: 'Expert',
            targetAudience: ['Software Developers'],
            desiredTone: 'Technical',
            interpersonalStance: 'Helpful'
        },
        sflMode: {
            outputFormat: 'Code',
            rhetoricalStructure: 'Step-by-step',
            lengthConstraint: 'Detailed',
            textualDirectives: 'Include comments'
        },
        notes: 'Test prompt for integration testing'
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield mockEnd();
    }));
    describe('POST /api/prompts', () => {
        it('should create a prompt successfully with valid data', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockDbResponse = {
                rows: [{
                        id: mockPromptId,
                        user_id: '00000000-0000-0000-0000-000000000001',
                        title: validPromptData.title,
                        body: validPromptData.promptText,
                        metadata: {
                            sflField: validPromptData.sflField,
                            sflTenor: validPromptData.sflTenor,
                            sflMode: validPromptData.sflMode,
                            notes: validPromptData.notes
                        },
                        created_at: '2024-01-01T00:00:00Z',
                        updated_at: '2024-01-01T00:00:00Z'
                    }]
            };
            mockQuery.mockResolvedValueOnce(mockDbResponse);
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/prompts')
                .send(validPromptData)
                .expect(201);
            expect(response.body).toMatchObject({
                id: mockPromptId,
                title: validPromptData.title,
                promptText: validPromptData.promptText,
                sflField: validPromptData.sflField
            });
            expect(mockQuery).toHaveBeenCalledWith('INSERT INTO prompts (user_id, title, body, metadata) VALUES ($1, $2, $3, $4) RETURNING *', expect.any(Array));
        }));
        it('should return 400 when title is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidData = Object.assign(Object.assign({}, validPromptData), { title: '' });
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/prompts')
                .send(invalidData)
                .expect(400);
            expect(response.body.message).toContain('Title');
            expect(mockQuery).not.toHaveBeenCalled();
        }));
        it('should return 400 when promptText is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidData = Object.assign(Object.assign({}, validPromptData), { promptText: '' });
            const response = yield (0, supertest_1.default)(app_1.default)
                .post('/api/prompts')
                .send(invalidData)
                .expect(400);
            expect(response.body.message).toContain('Prompt text');
            expect(mockQuery).not.toHaveBeenCalled();
        }));
    });
    describe('GET /api/prompts', () => {
        it('should retrieve all prompts successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockDbResponse = {
                rows: [
                    {
                        id: mockPromptId,
                        user_id: '00000000-0000-0000-0000-000000000001',
                        title: 'Test Prompt',
                        body: 'Test prompt text',
                        metadata: {
                            sflField: { topic: 'Test', taskType: 'Testing', domainSpecifics: '', keywords: '' },
                            sflTenor: { aiPersona: 'Expert', targetAudience: [], desiredTone: 'Neutral', interpersonalStance: '' },
                            sflMode: { outputFormat: 'Text', rhetoricalStructure: '', lengthConstraint: 'Short', textualDirectives: '' }
                        },
                        created_at: '2024-01-01T00:00:00Z',
                        updated_at: '2024-01-01T00:00:00Z'
                    }
                ]
            };
            mockQuery.mockResolvedValueOnce(mockDbResponse);
            const response = yield (0, supertest_1.default)(app_1.default)
                .get('/api/prompts')
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toMatchObject({
                id: mockPromptId,
                title: 'Test Prompt'
            });
            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM prompts ORDER BY updated_at DESC');
        }));
    });
    describe('GET /api/prompts/:id', () => {
        it('should retrieve a single prompt successfully with valid ID', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockDbResponse = {
                rows: [{
                        id: mockPromptId,
                        user_id: '00000000-0000-0000-0000-000000000001',
                        title: 'Test Prompt',
                        body: 'Test prompt text',
                        metadata: {},
                        created_at: '2024-01-01T00:00:00Z',
                        updated_at: '2024-01-01T00:00:00Z'
                    }]
            };
            mockQuery.mockResolvedValueOnce(mockDbResponse);
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/prompts/${mockPromptId}`)
                .expect(200);
            expect(response.body).toMatchObject({
                id: mockPromptId,
                title: 'Test Prompt'
            });
            expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM prompts WHERE id = $1', [mockPromptId]);
        }));
        it('should return 404 for non-existent prompt ID', () => __awaiter(void 0, void 0, void 0, function* () {
            const nonExistentId = '00000000-0000-0000-0000-000000000999';
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const response = yield (0, supertest_1.default)(app_1.default)
                .get(`/api/prompts/${nonExistentId}`)
                .expect(404);
            expect(response.body.message).toBe('Prompt not found');
        }));
    });
    describe('PUT /api/prompts/:id', () => {
        it('should update a prompt successfully with valid data', () => __awaiter(void 0, void 0, void 0, function* () {
            const existingPrompt = {
                rows: [{
                        id: mockPromptId,
                        user_id: '00000000-0000-0000-0000-000000000001',
                        title: 'Original Title',
                        body: 'Original text',
                        metadata: {},
                        created_at: '2024-01-01T00:00:00Z',
                        updated_at: '2024-01-01T00:00:00Z'
                    }]
            };
            const updatedPrompt = {
                rows: [Object.assign(Object.assign({}, existingPrompt.rows[0]), { title: 'Updated Title', body: 'Updated text', updated_at: '2024-01-01T01:00:00Z' })]
            };
            mockQuery
                .mockResolvedValueOnce(existingPrompt) // SELECT existing
                .mockResolvedValueOnce(updatedPrompt); // UPDATE
            const updateData = { title: 'Updated Title', promptText: 'Updated text' };
            const response = yield (0, supertest_1.default)(app_1.default)
                .put(`/api/prompts/${mockPromptId}`)
                .send(updateData)
                .expect(200);
            expect(response.body).toMatchObject({
                id: mockPromptId,
                title: 'Updated Title',
                promptText: 'Updated text'
            });
        }));
        it('should return 404 for non-existent prompt ID', () => __awaiter(void 0, void 0, void 0, function* () {
            const nonExistentId = '00000000-0000-0000-0000-000000000999';
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const response = yield (0, supertest_1.default)(app_1.default)
                .put(`/api/prompts/${nonExistentId}`)
                .send({ title: 'Updated Title' })
                .expect(404);
            expect(response.body.message).toBe('Prompt not found');
        }));
        it('should return 400 when trying to update title to empty string', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .put(`/api/prompts/${mockPromptId}`)
                .send({ title: '' })
                .expect(400);
            expect(response.body.message).toContain('Title');
            expect(mockQuery).not.toHaveBeenCalled();
        }));
        it('should return 400 when trying to update promptText to empty string', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app_1.default)
                .put(`/api/prompts/${mockPromptId}`)
                .send({ promptText: '' })
                .expect(400);
            expect(response.body.message).toContain('Prompt text');
            expect(mockQuery).not.toHaveBeenCalled();
        }));
    });
    describe('DELETE /api/prompts/:id', () => {
        it('should delete a prompt successfully with valid ID', () => __awaiter(void 0, void 0, void 0, function* () {
            mockQuery.mockResolvedValueOnce({ rowCount: 1 });
            yield (0, supertest_1.default)(app_1.default)
                .delete(`/api/prompts/${mockPromptId}`)
                .expect(204);
            expect(mockQuery).toHaveBeenCalledWith('DELETE FROM prompts WHERE id = $1', [mockPromptId]);
        }));
        it('should return 404 for non-existent prompt ID', () => __awaiter(void 0, void 0, void 0, function* () {
            const nonExistentId = '00000000-0000-0000-0000-000000000999';
            mockQuery.mockResolvedValueOnce({ rowCount: 0 });
            const response = yield (0, supertest_1.default)(app_1.default)
                .delete(`/api/prompts/${nonExistentId}`)
                .expect(404);
            expect(response.body.message).toBe('Prompt not found');
        }));
    });
});
