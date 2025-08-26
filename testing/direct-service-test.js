/**
 * CRITICAL INCIDENT - Direct Service Test
 * Test the WorkflowExecutionService directly, bypassing API authentication
 * This tests the core functionality that was failing
 */

// We need to run this inside the Docker container where the service is available
const testCode = `
const WorkflowExecutionService = require('/app/dist/services/workflowExecutionService').default;

async function testService() {
    console.log("🧪 DIRECT SERVICE TEST - WorkflowExecutionService");
    console.log("=" .repeat(50));
    
    const testTask = {
        id: 'test-gemini-task',
        name: 'Test Gemini Prompt Task',
        type: 'GEMINI_PROMPT',
        promptTemplate: 'Respond with exactly: "WORKFLOW_EXECUTION_SUCCESS" and nothing else.',
        dependencies: [],
        inputKeys: [],
        outputKey: 'gemini_result',
        agentConfig: {
            model: 'gemini-1.5-flash',
            temperature: 0.1
        }
    };
    
    const testDataStore = {
        userInput: {}
    };
    
    try {
        console.log("📡 Executing GEMINI_PROMPT task directly...");
        const startTime = Date.now();
        
        const result = await WorkflowExecutionService.executeTask(testTask, testDataStore);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log("✅ Task execution completed!");
        console.log(\`⏱️  Execution time: \${duration}ms\`);
        console.log(\`📄 Result: "\${result}"\`);
        console.log(\`🎯 Expected: "WORKFLOW_EXECUTION_SUCCESS"\`);
        
        const success = typeof result === 'string' && result.includes('WORKFLOW_EXECUTION_SUCCESS');
        console.log(\`🏆 Test Status: \${success ? '✅ SUCCESS' : '❌ FAILED'}\`);
        
        if (success) {
            console.log("\\n🎉 CRITICAL INCIDENT RESOLVED!");
            console.log("   WorkflowExecutionService GEMINI_PROMPT tasks are functioning correctly");
        } else {
            console.log("\\n💥 Service still has issues");
            console.log("   Result does not match expected value");
        }
        
        return success;
        
    } catch (error) {
        console.error("💥 EXECUTION ERROR:");
        console.error("   Error Type:", error.constructor.name);
        console.error("   Error Message:", error.message);
        console.error("   Stack:", error.stack);
        return false;
    }
}

testService().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error("FATAL ERROR:", error);
    process.exit(1);
});
`;

console.log("Executing direct service test...");