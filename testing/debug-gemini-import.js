/**
 * CRITICAL INCIDENT - Debug Google GenAI Import Issue
 * Investigating the actual structure of the @google/genai module
 */

console.log("🔍 DEBUGGING GOOGLE GENAI IMPORT");
console.log("=" .repeat(40));

try {
    // Try different import patterns
    console.log("1. Testing require('@google/genai')");
    const genaiModule = require('@google/genai');
    console.log("   Module keys:", Object.keys(genaiModule));
    console.log("   GoogleGenAI type:", typeof genaiModule.GoogleGenAI);
    
    if (genaiModule.GoogleGenAI) {
        console.log("2. Testing GoogleGenAI constructor");
        const testKey = "test-key-123";
        const ai = new genaiModule.GoogleGenAI(testKey);
        console.log("   GoogleGenAI instance keys:", Object.keys(ai));
        console.log("   getGenerativeModel method:", typeof ai.getGenerativeModel);
    }
    
    console.log("\n3. Full module structure:");
    console.log(JSON.stringify(genaiModule, null, 2));
    
} catch (error) {
    console.error("Import error:", error.message);
}