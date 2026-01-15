const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const buildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
const pbxprojPath = path.join(projectRoot, 'ios', 'HasCart.xcodeproj', 'project.pbxproj');

// 1. Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const oldVersion = packageJson.version;

// Get version from command line or increment patch
let newVersion = process.argv[2];
if (!newVersion) {
    const parts = oldVersion.split('.');
    parts[parts.length - 1] = parseInt(parts[parts.length - 1]) + 1;
    newVersion = parts.join('.');
}

console.log(`Updating version from ${oldVersion} to ${newVersion}...`);

// 2. Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('✓ package.json updated');

// 3. Update android/app/build.gradle
if (fs.existsSync(buildGradlePath)) {
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    
    // Increment versionCode
    const versionCodeMatch = buildGradle.match(/versionCode\s+(\d+)/);
    if (versionCodeMatch) {
        const oldCode = parseInt(versionCodeMatch[1]);
        const newCode = oldCode + 1;
        buildGradle = buildGradle.replace(/versionCode\s+(\d+)/, `versionCode ${newCode}`);
        console.log(`✓ android versionCode updated to ${newCode}`);
    }

    // Update versionName
    buildGradle = buildGradle.replace(/versionName\s+".*"/, `versionName "${newVersion}"`);
    fs.writeFileSync(buildGradlePath, buildGradle);
    console.log(`✓ android versionName updated to ${newVersion}`);
}

// 4. Update iOS (project.pbxproj)
if (fs.existsSync(pbxprojPath)) {
    let pbxproj = fs.readFileSync(pbxprojPath, 'utf8');
    
    // Update MARKETING_VERSION
    pbxproj = pbxproj.replace(/MARKETING_VERSION = .*;/g, `MARKETING_VERSION = ${newVersion};`);
    
    // Increment CURRENT_PROJECT_VERSION (Build number)
    const projectVersionMatch = pbxproj.match(/CURRENT_PROJECT_VERSION = (\d+);/);
    if (projectVersionMatch) {
        const oldBuild = parseInt(projectVersionMatch[1]);
        const newBuild = oldBuild + 1;
        pbxproj = pbxproj.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${newBuild};`);
        console.log(`✓ ios CURRENT_PROJECT_VERSION updated to ${newBuild}`);
    }

    fs.writeFileSync(pbxprojPath, pbxproj);
    console.log(`✓ ios MARKETING_VERSION updated to ${newVersion}`);
}

console.log('\nAll versions updated successfully!');
