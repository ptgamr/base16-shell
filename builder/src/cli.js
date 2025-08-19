#!/usr/bin/env node

const { program } = require('commander');
const Base16Builder = require('./Base16Builder');
const fs = require('fs');
const path = require('path');

program
  .name('base16-builder')
  .description('Base16 Builder - Generate themes from base16 color schemes')
  .version('1.0.0');

program
  .command('build')
  .description('Build a theme from a scheme and template')
  .option('-s, --scheme <path>', 'Path to YAML scheme file (or read from stdin)')
  .option('-t, --template <path>', 'Path to Mustache template file', null)
  .option('-o, --output <path>', 'Output file path (or write to stdout)')
  .action(async (options) => {
    try {
      if (!options.template) {
        console.error('Error: Template file is required (-t or --template)');
        process.exit(1);
      }

      const builder = new Base16Builder();
      
      // Load scheme from file or stdin
      let schemeData;
      if (options.scheme) {
        schemeData = fs.readFileSync(options.scheme, 'utf8');
      } else {
        // Read from stdin
        schemeData = await readStdin();
        if (!schemeData) {
          console.error('Error: No scheme data provided. Use -s option or pipe YAML to stdin');
          process.exit(1);
        }
      }

      // Build the theme
      const result = builder.build(schemeData, options.template);

      // Output result
      if (options.output) {
        fs.writeFileSync(options.output, result);
        console.error(`Theme written to ${options.output}`);
      } else {
        process.stdout.write(result);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('build-all')
  .description('Build all combinations of schemes and templates')
  .option('-s, --schemes <dir>', 'Directory containing YAML scheme files', './schemes')
  .option('-t, --templates <dir>', 'Directory containing Mustache template files', './templates')
  .option('-o, --output <dir>', 'Output directory', './output')
  .action((options) => {
    const buildAll = require('./build-all');
    buildAll(options.schemes, options.templates, options.output);
  });

// Helper function to read from stdin
function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve(null);
      return;
    }

    let data = '';
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}