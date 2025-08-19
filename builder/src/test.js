#!/usr/bin/env node

const Base16Builder = require('./Base16Builder');
const fs = require('fs');
const path = require('path');

console.log('Base16 Builder Node.js - Test Suite\n');
console.log('=====================================\n');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    return false;
  }
}

let passed = 0;
let failed = 0;

// Test 1: Create builder instance
if (test('Create Base16Builder instance', () => {
  const builder = new Base16Builder();
  if (!builder) throw new Error('Failed to create builder');
})) passed++; else failed++;

// Test 2: Load scheme from YAML string
if (test('Load scheme from YAML string', () => {
  const builder = new Base16Builder();
  const yamlContent = `
scheme: "Test Scheme"
author: "Test Author"
base00: "000000"
base01: "111111"
base02: "222222"
base03: "333333"
base04: "444444"
base05: "555555"
base06: "666666"
base07: "777777"
base08: "888888"
base09: "999999"
base0A: "aaaaaa"
base0B: "bbbbbb"
base0C: "cccccc"
base0D: "dddddd"
base0E: "eeeeee"
base0F: "ffffff"
`;
  builder.loadScheme(yamlContent);
  if (builder.scheme.scheme !== 'Test Scheme') {
    throw new Error('Scheme not loaded correctly');
  }
})) passed++; else failed++;

// Test 3: Build tags for template
if (test('Build template tags with color transformations', () => {
  const builder = new Base16Builder();
  const yamlContent = `
scheme: "Test"
author: "Tester"
base00: "1a1b26"
base01: "24283b"
base02: "2e3452"
base03: "414560"
base04: "787c99"
base05: "a9b1d6"
base06: "c0caf5"
base07: "f5f5f5"
base08: "f7768e"
base09: "ff9e64"
base0A: "e0af68"
base0B: "9ece6a"
base0C: "7dcfff"
base0D: "7aa2f7"
base0E: "bb9af7"
base0F: "db4b4b"
`;
  builder.loadScheme(yamlContent);
  const tags = builder.buildTagsForTemplate();
  
  // Check basic tags
  if (!tags['scheme-name']) throw new Error('Missing scheme-name');
  if (!tags['base00']) throw new Error('Missing base00');
  if (tags['base00'] !== '1a1b26') throw new Error('Incorrect base00 value');
  
  // Check RGB conversion
  if (!tags['base00-rgb-r']) throw new Error('Missing RGB red component');
  if (!tags['base00-hex-rgb']) throw new Error('Missing hex-rgb format');
  if (tags['base00-hex-rgb'] !== '1a/1b/26') throw new Error('Incorrect hex-rgb format');
  
  // Check HSL conversion
  if (tags['base00-hsl-h'] === undefined) throw new Error('Missing HSL hue');
})) passed++; else failed++;

// Test 4: Render template
if (test('Render Mustache template', () => {
  const builder = new Base16Builder();
  const yamlContent = `
scheme: "Tokyo Night"
author: "Test"
base00: "1a1b26"
base01: "111111"
base02: "222222"
base03: "333333"
base04: "444444"
base05: "555555"
base06: "666666"
base07: "777777"
base08: "888888"
base09: "999999"
base0A: "aaaaaa"
base0B: "bbbbbb"
base0C: "cccccc"
base0D: "dddddd"
base0E: "eeeeee"
base0F: "ffffff"
`;
  
  // Create a simple test template
  const templateContent = '/* {{scheme-name}} by {{scheme-author}} */\n.color { background: #{{base00}}; }';
  
  // Create temp template file
  const tempTemplate = path.join(__dirname, 'test-template.mustache');
  fs.writeFileSync(tempTemplate, templateContent);
  
  try {
    builder.loadScheme(yamlContent);
    builder.loadTemplate(tempTemplate);
    const result = builder.render();
    
    if (!result.includes('Tokyo Night')) throw new Error('Scheme name not rendered');
    if (!result.includes('#1a1b26')) throw new Error('Color not rendered correctly');
  } finally {
    // Clean up
    if (fs.existsSync(tempTemplate)) {
      fs.unlinkSync(tempTemplate);
    }
  }
})) passed++; else failed++;

// Test 5: Build complete workflow
if (test('Complete build workflow', () => {
  const builder = new Base16Builder();
  
  // Check if example files exist
  const schemeFile = path.join(__dirname, '..', 'schemes', 'tokyo-night.yaml');
  const templateFile = path.join(__dirname, '..', 'templates', 'css.mustache');
  
  if (!fs.existsSync(schemeFile)) {
    console.log('  (Skipping - example scheme not found)');
    return;
  }
  
  if (!fs.existsSync(templateFile)) {
    console.log('  (Skipping - example template not found)');
    return;
  }
  
  const schemeData = fs.readFileSync(schemeFile, 'utf8');
  const result = builder.build(schemeData, templateFile);
  
  if (!result.includes('Tokyo Night')) throw new Error('Build failed');
  if (!result.includes('--base00: #1a1b26')) throw new Error('CSS variable not generated');
})) passed++; else failed++;

// Test 6: Slug generation
if (test('Generate slug from scheme name', () => {
  const builder = new Base16Builder();
  
  const tests = [
    ['Tokyo Night', 'tokyo-night'],
    ['Base16 Default Dark', 'base16-default-dark'],
    ['Test_Scheme-123', 'test-scheme-123'],
    ['!!!Special###Characters!!!', 'special-characters']
  ];
  
  for (const [input, expected] of tests) {
    const slug = builder.generateSlug(input);
    if (slug !== expected) {
      throw new Error(`Slug generation failed: ${input} -> ${slug} (expected ${expected})`);
    }
  }
})) passed++; else failed++;

// Summary
console.log('\n=====================================');
console.log(`Tests completed: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}