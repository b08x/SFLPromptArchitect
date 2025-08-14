#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const { execSync } = require('child_process');

const md = new MarkdownIt();

const rootDir = process.cwd();
const frontendDocsDir = path.join(rootDir, 'docs', 'frontend');
const backendDocsDir = path.join(rootDir, 'docs', 'backend');
const combinedDocsDir = path.join(rootDir, 'docs');
const scriptsDir = path.join(rootDir, 'scripts');

console.log('🚀 Starting documentation combination process...');

async function generateDocs() {
    console.log('📝 Generating frontend and backend documentation...');
    
    try {
        // Generate frontend docs with absolute paths
        console.log('   - Generating frontend TypeDoc documentation...');
        execSync(`npx typedoc --out "${frontendDocsDir}"`, { 
            cwd: path.join(rootDir, 'frontend'),
            stdio: 'inherit'
        });
        
        // Generate backend docs with absolute paths
        console.log('   - Generating backend TypeDoc documentation...');
        execSync(`npx typedoc --out "${backendDocsDir}"`, {
            cwd: path.join(rootDir, 'backend'),
            stdio: 'inherit'
        });
        
        console.log('✅ Documentation generation completed successfully!');
    } catch (error) {
        console.error('❌ Error generating documentation:', error.message);
        process.exit(1);
    }
}

async function createMainIndex() {
    console.log('📄 Creating main documentation index...');
    
    const buildTime = new Date().toISOString();
    const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SFL Prompt Studio - Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 3rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2d3748;
            text-align: center;
            margin-bottom: 0.5rem;
            font-size: 2.5rem;
            font-weight: 700;
        }
        .subtitle {
            text-align: center;
            color: #718096;
            margin-bottom: 3rem;
            font-size: 1.1rem;
        }
        .docs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }
        .doc-card {
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            transition: all 0.3s ease;
            background: #f7fafc;
        }
        .doc-card:hover {
            border-color: #667eea;
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(102, 126, 234, 0.15);
        }
        .doc-card h3 {
            color: #2d3748;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        .doc-card p {
            color: #718096;
            margin-bottom: 1.5rem;
        }
        .doc-link {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: background 0.3s ease;
        }
        .doc-link:hover {
            background: #5a67d8;
        }
        .metadata {
            text-align: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #e2e8f0;
            color: #a0aec0;
            font-size: 0.9rem;
        }
        .tech-stack {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin: 2rem 0;
            flex-wrap: wrap;
        }
        .tech-badge {
            background: #edf2f7;
            color: #4a5568;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 SFL Prompt Studio</h1>
        <p class="subtitle">Complete API Documentation & Technical Reference</p>
        
        <div class="tech-stack">
            <span class="tech-badge">React 19</span>
            <span class="tech-badge">TypeScript</span>
            <span class="tech-badge">Express.js</span>
            <span class="tech-badge">PostgreSQL</span>
            <span class="tech-badge">TypeDoc</span>
        </div>
        
        <div class="docs-grid">
            <div class="doc-card">
                <h3>🎨 Frontend Documentation</h3>
                <p>React components, hooks, services, and TypeScript interfaces for the SFL Prompt Studio user interface.</p>
                <a href="./frontend/README.html" class="doc-link">View Frontend Docs</a>
            </div>
            
            <div class="doc-card">
                <h3>⚙️ Backend Documentation</h3>
                <p>Express.js API endpoints, services, controllers, and database models for the backend server.</p>
                <a href="./backend/index.html" class="doc-link">View Backend Docs</a>
            </div>
        </div>
        
        <div class="metadata">
            <p><strong>Documentation generated:</strong> ${buildTime}</p>
            <p><strong>SFL Prompt Studio</strong> v0.5.0 - Full-stack application for creating and managing prompts using Systemic Functional Linguistics</p>
        </div>
    </div>
</body>
</html>`;

    await fs.writeFile(path.join(combinedDocsDir, 'index.html'), indexContent);
    console.log('✅ Main documentation index created successfully!');
}

async function createFrontendIndexHtml() {
    console.log('🔄 Converting frontend markdown to HTML index...');
    
    try {
        const frontendReadmePath = path.join(frontendDocsDir, 'README.md');
        
        if (await fs.pathExists(frontendReadmePath)) {
            const readmeContent = await fs.readFile(frontendReadmePath, 'utf8');
            const { data: frontmatter, content } = matter(readmeContent);
            
            const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Frontend Documentation - SFL Prompt Studio</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 2rem;
            color: #2d3748;
        }
        h1, h2, h3 { color: #2d3748; }
        a { color: #667eea; text-decoration: none; }
        a:hover { text-decoration: underline; }
        code { 
            background: #f7fafc; 
            padding: 0.2rem 0.4rem; 
            border-radius: 4px; 
            font-size: 0.9em;
        }
        pre { 
            background: #f7fafc; 
            padding: 1rem; 
            border-radius: 8px; 
            overflow-x: auto; 
        }
        .back-link {
            display: inline-block;
            margin-bottom: 2rem;
            padding: 0.5rem 1rem;
            background: #edf2f7;
            border-radius: 6px;
            color: #4a5568;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <a href="../index.html" class="back-link">← Back to Main Documentation</a>
    ${md.render(content)}
</body>
</html>`;
            
            await fs.writeFile(path.join(frontendDocsDir, 'README.html'), htmlContent);
            console.log('✅ Frontend HTML index created successfully!');
        }
    } catch (error) {
        console.log('⚠️  Could not create frontend HTML index:', error.message);
    }
}

async function addGitHubPagesSupport() {
    console.log('🐙 Adding GitHub Pages support...');
    
    // Create .nojekyll file to prevent Jekyll processing
    await fs.writeFile(path.join(combinedDocsDir, '.nojekyll'), '');
    console.log('✅ Added .nojekyll file for GitHub Pages compatibility');
}

async function generateDocumentationSummary() {
    console.log('📊 Generating documentation summary...');
    
    const summary = {
        generatedAt: new Date().toISOString(),
        version: '0.5.0',
        frontend: {
            path: './frontend/',
            format: 'Markdown',
            hasHtmlIndex: await fs.pathExists(path.join(frontendDocsDir, 'README.html'))
        },
        backend: {
            path: './backend/',
            format: 'HTML',
            hasIndex: await fs.pathExists(path.join(backendDocsDir, 'index.html'))
        }
    };
    
    await fs.writeFile(
        path.join(combinedDocsDir, 'docs-summary.json'),
        JSON.stringify(summary, null, 2)
    );
    
    console.log('✅ Documentation summary generated');
}

async function combineDocs() {
    try {
        console.log('🏗️  SFL Prompt Studio Documentation Builder');
        console.log('================================================\n');
        
        // Step 1: Generate documentation
        await generateDocs();
        
        // Step 2: Ensure directories exist
        console.log('📁 Verifying documentation directories...');
        await fs.ensureDir(combinedDocsDir);
        
        // Verify that docs were generated
        const frontendExists = await fs.pathExists(frontendDocsDir);
        const backendExists = await fs.pathExists(backendDocsDir);
        
        if (!frontendExists) {
            throw new Error('Frontend documentation was not generated properly');
        }
        if (!backendExists) {
            throw new Error('Backend documentation was not generated properly');
        }
        
        console.log('✅ Documentation directories verified');
        
        // Step 3: Create main documentation index
        await createMainIndex();
        
        // Step 4: Create frontend HTML index for better navigation
        await createFrontendIndexHtml();
        
        // Step 5: Add GitHub Pages support
        await addGitHubPagesSupport();
        
        // Step 6: Generate summary
        await generateDocumentationSummary();
        
        console.log('\n🎉 Documentation combination completed successfully!');
        console.log('📖 Open docs/index.html to view the combined documentation');
        console.log('🌐 Frontend docs: docs/frontend/');
        console.log('🔧 Backend docs: docs/backend/');
        
    } catch (error) {
        console.error('\n❌ Error combining documentation:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the combination process
if (require.main === module) {
    combineDocs();
}

module.exports = { combineDocs };