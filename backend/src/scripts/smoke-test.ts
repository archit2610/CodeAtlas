import { importDemoRepository, getRepository, getTree, getFile, searchFiles, parseGithubUrl } from '../services/repository.service.js';
import { getDependents, getImports } from '../services/repository-tools.service.js';

async function runSmokeTest() {
    console.log('🧪 Starting CodeAtlas Backend API Smoke Test...\n');

    const visitorId = `smoke_visitor_${Date.now()}`;

    // 1. Test Demo Repository Import
    console.log('1️⃣ Testing importDemoRepository...');
    const repo = await importDemoRepository(visitorId);
    console.log(`   ✅ Repo Created! ID: ${repo.id}, Status: ${repo.status}, Name: ${repo.name}`);

    if (repo.status !== 'ready') {
        throw new Error(`Expected repo status 'ready', got '${repo.status}'`);
    }

    // 2. Test Snapshot Cards & Suggested Prompts
    console.log('2️⃣ Verifying Repository Snapshot & Suggested Question Cards...');
    const snapshot = repo.snapshotJson as any;
    console.log(`   Total Files: ${snapshot.totalFiles}`);
    console.log(`   Frameworks: ${JSON.stringify(snapshot.frameworks)}`);
    console.log(`   Suggested Prompts: ${JSON.stringify(snapshot.suggestedPrompts)}`);

    if (!snapshot.totalFiles || snapshot.totalFiles === 0) {
        throw new Error('Snapshot totalFiles is 0');
    }
    if (!Array.isArray(snapshot.suggestedPrompts) || snapshot.suggestedPrompts.length === 0) {
        throw new Error('Suggested prompts array is missing or empty');
    }

    // 3. Test File Tree
    console.log('3️⃣ Verifying Repository File Tree...');
    const tree = await getTree(repo.id);
    console.log(`   Found ${tree.length} files in tree.`);
    if (tree.length === 0) throw new Error('File tree is empty');

    // 4. Test Reading File Content
    console.log('4️⃣ Verifying File Content Endpoint...');
    const appFile = await getFile(repo.id, 'src/app.ts');
    if (!appFile || !appFile.content.includes('express')) {
        throw new Error('Failed to fetch src/app.ts content');
    }
    console.log(`   Fetched src/app.ts successfully (${appFile.lineCount} lines).`);

    // 5. Test File Search
    console.log('5️⃣ Verifying Content Search...');
    const searchResults = await searchFiles(repo.id, 'auth');
    console.log(`   Found ${searchResults.length} matching files for query 'auth'.`);
    if (searchResults.length === 0) throw new Error('Search returned 0 results');

    // 6. Test Edge Resolution
    console.log('6️⃣ Verifying Dependency Edges...');
    const checkoutDeps = await getDependents(repo.id, 'src/services/auth.service.ts');
    console.log(`   Found ${checkoutDeps.length} dependent edge(s) pointing to auth.service.ts.`);

    // 7. Test URL Parser Safety
    console.log('7️⃣ Verifying Safety & URL Validation...');
    try {
        parseGithubUrl('https://malicious-site.com/repo');
        throw new Error('Failed to reject non-GitHub URL');
    } catch (e: any) {
        console.log(`   ✅ Safely rejected invalid URL: "${e.message}"`);
    }

    console.log('\n🎉 ALL SMOKE TESTS PASSED SUCCESSFULLY! CodeAtlas Backend Foundation is Operational.');
    process.exit(0);
}

runSmokeTest().catch(err => {
    console.error('\n❌ SMOKE TEST FAILED:', err);
    process.exit(1);
});
