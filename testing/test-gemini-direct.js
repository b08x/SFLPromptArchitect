/**
 * CRITICAL INCIDENT TEST SCRIPT
 * Direct Gemini API functionality test to isolate library/API issues
 * 
 * Purpose: Verify GoogleGenAI library functionality independently of workflow execution
 * Run with: node test-gemini-direct.js
 */

const { GoogleGenAI } = require("@google/genai");

// Test configuration
const API_KEY = process.env.GEMINI_API_KEY;
const TEST_PROMPT = "Hello! Please respond with exactly: 'GEMINI_API_TEST_SUCCESS'";

async function testGeminiAPI() {
    console.log("🔥 INCIDENT RESPONSE - Direct Gemini API Test");
    console.log("=" .repeat(50));
    
    // Check API key
    if (!API_KEY) {
        console.error("❌ CRITICAL: GEMINI_API_KEY environment variable not set");
        process.exit(1);
    }
    
    console.log("✅ API Key found:", API_KEY.substring(0, 10) + "...");
    
    try {
        // Initialize client
        console.log("🔧 Initializing GoogleGenAI client...");
        const ai = new GoogleGenAI(API_KEY);
        
        // Get model
        console.log("📡 Getting generative model (gemini-1.5-flash)...");
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // Test basic generation
        console.log("⚡ Testing content generation...");
        const startTime = Date.now();
        
        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: TEST_PROMPT }] }],
            generationConfig: {
                temperature: 0.1,
            }
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Extract result
        const result = response.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        console.log("📊 Test Results:");
        console.log(`   Response Time: ${responseTime}ms`);
        console.log(`   Response Text: "${result}"`);
        console.log(`   Expected: "GEMINI_API_TEST_SUCCESS"`);
        console.log(`   Match: ${result.includes('GEMINI_API_TEST_SUCCESS') ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        // Test with agent config similar to workflow
        console.log("\n🧪 Testing with AgentConfig parameters...");
        const agentConfigResponse = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: "Respond with 'AGENT_CONFIG_TEST_SUCCESS'" }] }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.9,
            },
            systemInstruction: { role: "system", parts: [{ text: "You are a helpful assistant." }] }
        });
        
        const agentResult = agentConfigResponse.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log(`   AgentConfig Result: "${agentResult}"`);
        console.log(`   AgentConfig Success: ${agentResult.includes('AGENT_CONFIG_TEST_SUCCESS') ? '✅ YES' : '❌ NO'}`);
        
        if (result.includes('GEMINI_API_TEST_SUCCESS') && agentResult.includes('AGENT_CONFIG_TEST_SUCCESS')) {
            console.log("\n🎉 GEMINI API FUNCTIONING CORRECTLY - Issue is in workflow execution layer");
            return true;
        } else {
            console.log("\n💥 GEMINI API ISSUES DETECTED - Library or API problem");
            return false;
        }
        
    } catch (error) {
        console.error("\n💥 CRITICAL API ERROR:");
        console.error("   Error Type:", error.constructor.name);
        console.error("   Error Message:", error.message);
        if (error.status) console.error("   HTTP Status:", error.status);
        if (error.code) console.error("   Error Code:", error.code);
        console.error("   Full Error:", error);
        return false;
    }
}

// Run test
testGeminiAPI().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error("FATAL TEST ERROR:", error);
    process.exit(1);
});