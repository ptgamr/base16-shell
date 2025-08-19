const Mustache = require('mustache');
const tinycolor = require('tinycolor2');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

class Base16Builder {
  constructor() {
    this.scheme = null;
    this.template = null;
  }

  loadScheme(schemeData) {
    if (typeof schemeData === 'string') {
      if (schemeData.endsWith('.yaml') || schemeData.endsWith('.yml')) {
        schemeData = fs.readFileSync(schemeData, 'utf8');
      }
      this.scheme = yaml.load(schemeData);
    } else {
      this.scheme = schemeData;
    }
    return this;
  }

  loadTemplate(templatePath) {
    this.template = fs.readFileSync(templatePath, 'utf8');
    return this;
  }

  buildTagsForTemplate() {
    if (!this.scheme) {
      throw new Error('No scheme loaded');
    }

    const tags = {
      'scheme-name': this.scheme.scheme || 'Unnamed',
      'scheme-author': this.scheme.author || 'Anonymous',
      'scheme-description': this.scheme.description || this.scheme.scheme || 'Base16 Color Scheme',
      'scheme-slug': this.generateSlug(this.scheme.scheme || 'unnamed')
    };

    // Process each base color
    for (let i = 0; i <= 15; i++) {
      const baseKey = `base${i.toString(16).toUpperCase().padStart(2, '0')}`;
      const hexColor = this.scheme[baseKey];
      
      if (!hexColor) {
        throw new Error(`Missing color definition for ${baseKey}`);
      }

      // Add hex value
      tags[baseKey] = hexColor;
      tags[`${baseKey}-hex`] = hexColor;
      
      // Create tinycolor instance
      const color = tinycolor('#' + hexColor);
      
      // Add RGB values
      const rgb = color.toRgb();
      tags[`${baseKey}-rgb-r`] = rgb.r;
      tags[`${baseKey}-rgb-g`] = rgb.g;
      tags[`${baseKey}-rgb-b`] = rgb.b;
      
      // Add normalized RGB (0-1)
      tags[`${baseKey}-rgb-r-norm`] = (rgb.r / 255).toFixed(4);
      tags[`${baseKey}-rgb-g-norm`] = (rgb.g / 255).toFixed(4);
      tags[`${baseKey}-rgb-b-norm`] = (rgb.b / 255).toFixed(4);
      
      // Add HSL values
      const hsl = color.toHsl();
      tags[`${baseKey}-hsl-h`] = Math.round(hsl.h);
      tags[`${baseKey}-hsl-s`] = Math.round(hsl.s * 100);
      tags[`${baseKey}-hsl-l`] = Math.round(hsl.l * 100);
      
      // Add decimal RGB (for some formats)
      tags[`${baseKey}-dec-r`] = rgb.r;
      tags[`${baseKey}-dec-g`] = rgb.g;
      tags[`${baseKey}-dec-b`] = rgb.b;
      
      // Add hex RGB components
      tags[`${baseKey}-hex-r`] = rgb.r.toString(16).padStart(2, '0').toUpperCase();
      tags[`${baseKey}-hex-g`] = rgb.g.toString(16).padStart(2, '0').toUpperCase();
      tags[`${baseKey}-hex-b`] = rgb.b.toString(16).padStart(2, '0').toUpperCase();
      
      // Add slash-separated RGB for shell scripts
      const hexR = hexColor.substring(0, 2);
      const hexG = hexColor.substring(2, 4);
      const hexB = hexColor.substring(4, 6);
      tags[`${baseKey}-hex-bgr`] = `${hexB}/${hexG}/${hexR}`;
      tags[`${baseKey}-hex-rgb`] = `${hexR}/${hexG}/${hexB}`;
    }

    return tags;
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  render() {
    if (!this.template) {
      throw new Error('No template loaded');
    }
    
    const tags = this.buildTagsForTemplate();
    // Disable HTML escaping for shell scripts and other non-HTML templates
    Mustache.escape = function(text) {
      return text;
    };
    return Mustache.render(this.template, tags);
  }

  build(schemeData, templatePath) {
    return this
      .loadScheme(schemeData)
      .loadTemplate(templatePath)
      .render();
  }
}

module.exports = Base16Builder;