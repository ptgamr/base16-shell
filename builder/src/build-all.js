const Base16Builder = require('./Base16Builder');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

function buildAll(schemesDir, templatesDir, outputDir) {
  console.log('Base16 Builder - Building all themes...\n');
  
  // Ensure directories exist
  if (!fs.existsSync(schemesDir)) {
    console.error(`Schemes directory not found: ${schemesDir}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(templatesDir)) {
    console.error(`Templates directory not found: ${templatesDir}`);
    process.exit(1);
  }
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Find all scheme files
  const schemeFiles = glob.sync(path.join(schemesDir, '*.{yaml,yml}'));
  const templateFiles = glob.sync(path.join(templatesDir, '*.mustache'));

  if (schemeFiles.length === 0) {
    console.error(`No scheme files found in ${schemesDir}`);
    process.exit(1);
  }

  if (templateFiles.length === 0) {
    console.error(`No template files found in ${templatesDir}`);
    process.exit(1);
  }

  console.log(`Found ${schemeFiles.length} schemes and ${templateFiles.length} templates\n`);

  const builder = new Base16Builder();
  let successCount = 0;
  let errorCount = 0;

  // Process each combination
  for (const schemeFile of schemeFiles) {
    const schemeName = path.basename(schemeFile, path.extname(schemeFile));
    
    for (const templateFile of templateFiles) {
      const templateName = path.basename(templateFile, '.mustache');
      
      try {
        // Load scheme
        const schemeData = fs.readFileSync(schemeFile, 'utf8');
        
        // Build theme
        const result = builder.build(schemeData, templateFile);
        
        // Determine output path
        const templateDir = path.join(outputDir, templateName);
        if (!fs.existsSync(templateDir)) {
          fs.mkdirSync(templateDir, { recursive: true });
        }
        
        // Determine file extension from template config if available
        let fileExt = '.txt';
        const templateConfigPath = path.join(templatesDir, 'config.yaml');
        if (fs.existsSync(templateConfigPath)) {
          try {
            const yaml = require('js-yaml');
            const config = yaml.load(fs.readFileSync(templateConfigPath, 'utf8'));
            if (config[templateName] && config[templateName].extension) {
              fileExt = '.' + config[templateName].extension;
            }
          } catch (e) {
            // Use default extension
          }
        }
        
        const outputFile = path.join(templateDir, `base16-${schemeName}${fileExt}`);
        
        // Write output
        fs.writeFileSync(outputFile, result);
        console.log(`✓ ${schemeName} + ${templateName} -> ${outputFile}`);
        successCount++;
        
      } catch (error) {
        console.error(`✗ ${schemeName} + ${templateName}: ${error.message}`);
        errorCount++;
      }
    }
  }

  console.log(`\n===========================================`);
  console.log(`Build complete: ${successCount} successful, ${errorCount} errors`);
  console.log(`Output directory: ${outputDir}`);
}

// Export for use as module
module.exports = buildAll;

// Run if called directly
if (require.main === module) {
  const schemesDir = process.argv[2] || './schemes';
  const templatesDir = process.argv[3] || './templates';
  const outputDir = process.argv[4] || './output';
  
  buildAll(schemesDir, templatesDir, outputDir);
}