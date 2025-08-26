/**
 * CRITICAL INCIDENT - Test New Google GenAI API Pattern
 * The old getGenerativeModel() method no longer exists
 * Need to find the correct API pattern for the new version
 */

const { GoogleGenAI } = require('@google/genai');

async function testNewAPI() {
    console.log("🔥 TESTING NEW GOOGLE GENAI API PATTERN");
    console.log("=" .repeat(50));
    
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        console.error("❌ No API key found");
        return;
    }
    
    try {
        const ai = new GoogleGenAI(API_KEY);
        console.log("✅ GoogleGenAI instance created");
        console.log("📋 Available properties:", Object.keys(ai));
        
        // Test models property - likely the new access pattern
        if (ai.models) {
            console.log("🔧 Testing ai.models...");
            console.log("   Models type:", typeof ai.models);
            console.log("   Models keys:", Object.keys(ai.models));
            
            // Try different model access patterns
            if (typeof ai.models.generateContent === 'function') {
                console.log("📡 Testing ai.models.generateContent()...");
                const result = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: [{ role: "user", parts: [{ text: "Say 'NEW_API_SUCCESS'" }] }]
                });
                console.log("   Result:", result);
            }
            
            // Try getting a specific model
            if (typeof ai.models.get === 'function') {
                console.log("📡 Testing ai.models.get()...");
                const model = await ai.models.get('gemini-1.5-flash');
                console.log("   Model:", model);
                
                if (model && typeof model.generateContent === 'function') {
                    console.log("📡 Testing model.generateContent()...");
                    const result = await model.generateContent({
                        contents: [{ role: "user", parts: [{ text: "Say 'MODEL_API_SUCCESS'" }] }]
                    });
                    console.log("   Result:", result);
                }
            }
        }
        
    } catch (error) {
        console.error("❌ API Test Error:", error.message);
        console.error("   Full error:", error);
    }
}

testNewAPI().catch(console.error);