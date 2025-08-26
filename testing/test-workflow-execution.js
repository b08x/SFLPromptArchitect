/**
 * CRITICAL INCIDENT TEST - Workflow Execution Verification
 * Test GEMINI_PROMPT task execution through the actual workflow service
 * This simulates the exact same execution path users experience
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:4000';

// Test workflow with GEMINI_PROMPT task
const testWorkflow = {
    id: 'incident-test-workflow',
    name: 'Incident Test - GEMINI_PROMPT',
    description: 'Critical incident test for GEMINI_PROMPT execution',
    tasks: [{
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
    }]
};

async function testWorkflowExecution() {
    console.log("🚨 CRITICAL INCIDENT TEST - GEMINI_PROMPT Workflow Execution");
    console.log("=" .repeat(60));
    
    try {
        // Test 1: Direct task execution (bypasses queue)
        console.log("\n🧪 TEST 1: Direct Task Execution");
        console.log("-" .repeat(40));
        
        const taskPayload = {
            task: testWorkflow.tasks[0],
            dataStore: { userInput: {} }
        };
        
        console.log("📡 Sending request to /api/workflow-execution/run-task");
        const taskStart = Date.now();
        
        const taskResponse = await axios.post(`${BACKEND_URL}/api/workflow-execution/run-task`, taskPayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        
        const taskEnd = Date.now();
        const taskDuration = taskEnd - taskStart;
        
        console.log(`✅ Task Response Status: ${taskResponse.status}`);
        console.log(`⏱️  Task Duration: ${taskDuration}ms`);
        console.log(`📄 Task Result: "${taskResponse.data}"`);
        console.log(`🎯 Expected: "WORKFLOW_EXECUTION_SUCCESS"`);
        console.log(`✅ Task Success: ${taskResponse.data?.includes?.('WORKFLOW_EXECUTION_SUCCESS') ? 'YES' : 'NO'}`);
        
        // Test 2: Full workflow execution (uses queue)
        console.log("\n🧪 TEST 2: Full Workflow Execution");
        console.log("-" .repeat(40));
        
        const workflowPayload = {
            workflow: testWorkflow,
            userInput: {}
        };
        
        console.log("📡 Sending request to /api/workflow-execution/execute");
        const workflowStart = Date.now();
        
        const workflowResponse = await axios.post(`${BACKEND_URL}/api/workflow-execution/execute`, workflowPayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        
        const workflowEnd = Date.now();
        const workflowDuration = workflowEnd - workflowStart;
        
        console.log(`✅ Workflow Response Status: ${workflowResponse.status}`);
        console.log(`⏱️  Workflow Duration: ${workflowDuration}ms`);
        console.log(`📄 Workflow Response:`, JSON.stringify(workflowResponse.data, null, 2));
        
        // If we get a job ID, check the job status
        if (workflowResponse.data.jobId) {
            console.log("\n🔍 Checking Job Status...");
            
            // Wait for job to complete (poll for up to 60 seconds)
            let jobCompleted = false;
            let attempts = 0;
            const maxAttempts = 12; // 60 seconds with 5 second intervals
            
            while (!jobCompleted && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                attempts++;
                
                console.log(`   Attempt ${attempts}/${maxAttempts}: Checking job status...`);
                
                try {
                    const jobStatusResponse = await axios.get(`${BACKEND_URL}/api/workflow-execution/job/${workflowResponse.data.jobId}`, {
                        timeout: 10000
                    });
                    
                    console.log(`   Job Status: ${jobStatusResponse.data.status}`);
                    
                    if (jobStatusResponse.data.status === 'completed') {
                        console.log("🎉 JOB COMPLETED SUCCESSFULLY!");
                        console.log("📄 Job Results:", JSON.stringify(jobStatusResponse.data, null, 2));
                        jobCompleted = true;
                        
                        // Check if the result contains our expected text
                        const jobResultString = JSON.stringify(jobStatusResponse.data);
                        if (jobResultString.includes('WORKFLOW_EXECUTION_SUCCESS')) {
                            console.log("✅ WORKFLOW EXECUTION SUCCESS CONFIRMED!");
                        } else {
                            console.log("❌ Expected result not found in job output");
                        }
                    } else if (jobStatusResponse.data.status === 'failed') {
                        console.log("💥 JOB FAILED!");
                        console.log("📄 Job Error:", JSON.stringify(jobStatusResponse.data, null, 2));
                        jobCompleted = true;
                    }
                } catch (statusError) {
                    console.log(`   Status check error: ${statusError.message}`);
                }
            }
            
            if (!jobCompleted) {
                console.log("⏰ Job did not complete within timeout period");
            }
        }
        
        // Summary
        console.log("\n🏁 INCIDENT TEST SUMMARY");
        console.log("=" .repeat(50));
        console.log(`Direct Task Test: ${taskResponse.data?.includes?.('WORKFLOW_EXECUTION_SUCCESS') ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Workflow Queue Test: ${workflowResponse.status === 202 ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (taskResponse.data?.includes?.('WORKFLOW_EXECUTION_SUCCESS')) {
            console.log("\n🎉 CRITICAL INCIDENT RESOLVED!");
            console.log("   GEMINI_PROMPT tasks are now executing successfully.");
            console.log("   Root cause: @google/genai library API change");
            console.log("   Resolution: Updated API calls to use new pattern");
            return true;
        } else {
            console.log("\n💥 INCIDENT NOT FULLY RESOLVED");
            console.log("   Further investigation required");
            return false;
        }
        
    } catch (error) {
        console.error("\n💥 CRITICAL TEST FAILURE:");
        console.error(`   Error Type: ${error.constructor.name}`);
        console.error(`   Error Message: ${error.message}`);
        
        if (error.response) {
            console.error(`   HTTP Status: ${error.response.status}`);
            console.error(`   Response Data:`, error.response.data);
        }
        
        console.error("   Full Error:", error);
        return false;
    }
}

// Execute test
testWorkflowExecution()
    .then(success => {
        console.log(`\n🏁 Test completed with ${success ? 'SUCCESS' : 'FAILURE'}`);
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error("\nFATAL TEST ERROR:", error);
        process.exit(1);
    });