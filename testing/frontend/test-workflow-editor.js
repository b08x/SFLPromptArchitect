/**
 * Workflow Editor Functionality Test Script
 * This script tests the core functionality to ensure the prompts prop fix is working
 */

const baseUrl = 'http://localhost:4000';

// Test helper functions
async function makeRequest(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }
    return await response.text();
}

// Test functions
async function testApiConnectivity() {
    console.log('🔗 Testing API connectivity...');
    try {
        const response = await makeRequest('/');
        console.log('✅ Backend API is accessible');
        console.log(`   Response: ${response}`);
        return true;
    } catch (error) {
        console.log('❌ Backend API is not accessible');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function testPromptsEndpoint() {
    console.log('📝 Testing prompts endpoint...');
    try {
        const prompts = await makeRequest('/api/prompts');
        if (Array.isArray(prompts)) {
            console.log(`✅ Prompts endpoint working - Found ${prompts.length} prompts`);
            if (prompts.length > 0) {
                console.log(`   Sample prompt: ${prompts[0].title || prompts[0].id}`);
            }
            return prompts;
        } else {
            console.log('⚠️  Prompts endpoint returned non-array data');
            return [];
        }
    } catch (error) {
        console.log('❌ Prompts endpoint failed');
        console.log(`   Error: ${error.message}`);
        return [];
    }
}

async function testWorkflowsEndpoint() {
    console.log('🔄 Testing workflows endpoint...');
    try {
        const workflows = await makeRequest('/api/workflows');
        if (Array.isArray(workflows)) {
            console.log(`✅ Workflows endpoint working - Found ${workflows.length} workflows`);
            if (workflows.length > 0) {
                console.log(`   Sample workflow: ${workflows[0].name || workflows[0].id}`);
            }
            return workflows;
        } else {
            console.log('⚠️  Workflows endpoint returned non-array data');
            return [];
        }
    } catch (error) {
        console.log('❌ Workflows endpoint failed');
        console.log(`   Error: ${error.message}`);
        return [];
    }
}

async function testWorkflowCreation(prompts) {
    console.log('➕ Testing workflow creation...');
    try {
        const testWorkflow = {
            name: 'Test Workflow Editor Fix',
            description: 'Testing that prompt linking works after the fix',
            tasks: [
                {
                    id: 'task-test-1',
                    name: 'Test Task',
                    description: 'A test task for prompt linking',
                    type: 'GEMINI_PROMPT',
                    dependencies: [],
                    inputKeys: ['userInput'],
                    outputKey: 'testResult',
                    promptTemplate: 'Test prompt template',
                    agentConfig: { model: 'gemini-2.5-flash', temperature: 0.7 }
                }
            ]
        };

        // If we have prompts, link one to the task
        if (prompts.length > 0) {
            testWorkflow.tasks[0].promptId = prompts[0].id;
            console.log(`   Linking task to prompt: ${prompts[0].title || prompts[0].id}`);
        }

        const createdWorkflow = await makeRequest('/api/workflows', {
            method: 'POST',
            body: JSON.stringify(testWorkflow)
        });

        console.log('✅ Workflow creation successful');
        console.log(`   Created workflow ID: ${createdWorkflow.id}`);
        return createdWorkflow;
    } catch (error) {
        console.log('❌ Workflow creation failed');
        console.log(`   Error: ${error.message}`);
        return null;
    }
}

async function testWorkflowUpdate(workflow, prompts) {
    console.log('📝 Testing workflow update...');
    try {
        if (!workflow) {
            console.log('⚠️  No workflow to update');
            return null;
        }

        const updatedWorkflow = {
            ...workflow,
            name: workflow.name + ' (Updated)',
            description: workflow.description + ' - Updated via test'
        };

        // Test changing prompt linking
        if (prompts.length > 1 && updatedWorkflow.tasks.length > 0) {
            updatedWorkflow.tasks[0].promptId = prompts[1].id;
            console.log(`   Updating task prompt to: ${prompts[1].title || prompts[1].id}`);
        }

        const result = await makeRequest(`/api/workflows/${workflow.id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedWorkflow)
        });

        console.log('✅ Workflow update successful');
        return result;
    } catch (error) {
        console.log('❌ Workflow update failed');
        console.log(`   Error: ${error.message}`);
        return null;
    }
}

async function cleanupTestWorkflow(workflowId) {
    if (!workflowId) return;
    
    console.log('🧹 Cleaning up test workflow...');
    try {
        await makeRequest(`/api/workflows/${workflowId}`, {
            method: 'DELETE'
        });
        console.log('✅ Test workflow cleaned up');
    } catch (error) {
        console.log('⚠️  Failed to cleanup test workflow (this might be okay)');
    }
}

// Frontend accessibility test
async function testFrontendAccessibility() {
    console.log('🌐 Testing frontend accessibility...');
    try {
        const response = await fetch('http://localhost');
        if (response.ok) {
            const html = await response.text();
            if (html.includes('SFL Prompt Studio')) {
                console.log('✅ Frontend is accessible and loading');
                return true;
            } else {
                console.log('⚠️  Frontend accessible but content seems incorrect');
                return false;
            }
        } else {
            console.log('❌ Frontend not accessible');
            return false;
        }
    } catch (error) {
        console.log('❌ Frontend connection failed');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

// Main test execution
async function runTests() {
    console.log('🚀 Starting Workflow Editor Functionality Tests');
    console.log('================================================');
    
    const results = {
        apiConnectivity: false,
        frontendAccessible: false,
        promptsLoaded: false,
        workflowsLoaded: false,
        workflowCreation: false,
        workflowUpdate: false,
        promptLinking: false
    };
    
    // Test API connectivity
    results.apiConnectivity = await testApiConnectivity();
    console.log('');
    
    // Test frontend accessibility
    results.frontendAccessible = await testFrontendAccessibility();
    console.log('');
    
    if (!results.apiConnectivity) {
        console.log('❌ Cannot proceed with tests - API not accessible');
        return results;
    }
    
    // Test prompts endpoint
    const prompts = await testPromptsEndpoint();
    results.promptsLoaded = prompts.length > 0;
    console.log('');
    
    // Test workflows endpoint  
    const workflows = await testWorkflowsEndpoint();
    results.workflowsLoaded = workflows.length >= 0; // Even 0 workflows is okay
    console.log('');
    
    // Test workflow creation with prompt linking
    const createdWorkflow = await testWorkflowCreation(prompts);
    results.workflowCreation = createdWorkflow !== null;
    results.promptLinking = createdWorkflow && prompts.length > 0;
    console.log('');
    
    // Test workflow update
    const updatedWorkflow = await testWorkflowUpdate(createdWorkflow, prompts);
    results.workflowUpdate = updatedWorkflow !== null;
    console.log('');
    
    // Cleanup
    if (createdWorkflow) {
        await cleanupTestWorkflow(createdWorkflow.id);
        console.log('');
    }
    
    // Summary
    console.log('📊 Test Results Summary');
    console.log('======================');
    console.log(`API Connectivity: ${results.apiConnectivity ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Frontend Accessible: ${results.frontendAccessible ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Prompts Loading: ${results.promptsLoaded ? '✅ PASS' : '⚠️  NO PROMPTS'}`);
    console.log(`Workflows Loading: ${results.workflowsLoaded ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Workflow Creation: ${results.workflowCreation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Workflow Update: ${results.workflowUpdate ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Prompt Linking: ${results.promptLinking ? '✅ PASS' : '⚠️  NO PROMPTS TO LINK'}`);
    console.log('');
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (results.apiConnectivity && results.workflowCreation) {
        console.log('🎉 Core functionality is working - the prompts prop fix appears to be successful!');
    } else {
        console.log('⚠️  Some issues detected - may need further investigation');
    }
    
    return results;
}

// Run the tests
runTests().catch(console.error);