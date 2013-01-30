/*!
 * JavaScript template precompiler
 * https://github.com/kupriyanenko/grunt-jsttojs
 * 
 * Copyright(c) 2012 Alexey Kupriyanenko <a.kupriyanenko@gmail.com>
 * MIT Licensed
 */

// Module dependencies
var fs = require('fs');
var walk = require('walk');
var watchTree = require("fs-watch-tree").watchTree;

/**
 * Jsttojs
 */
function Jsttojs() {
  this.options = {};
  this.files = [];
}

Jsttojs.prototype = {
  /**
   * Create walker and files array
   * @param  {Function} callback
   * @return {walk}
   */
  createWalker: function(callback) {
    var walker;

    this.files = [];

    walker = walk.walk(this.options.root, {
      followLinks: false
    });

    walker.on('file', function(root, stat, next) {
      if (stat.name.indexOf(this.options.ext) + this.options.ext.length === stat.name.length) {
        this.files.push(root + '/' + stat.name);
      }

      next();
    }.bind(this));

    walker.on('end', function() {
      this.generateFiles(callback);
    }.bind(this));

    return walker;
  },

  /**
   * Generate template and write in output file
   * @param  {Function} callback
   */
  generateFiles: function(callback) {
    var templates = this.getTemplates()
      , data;

    if (this.options.amd) {
      data =  'define(';
      data += this.options.requirements ? JSON.stringify(this.options.requirements) + ',' : '';
      data += 'function() {return ';
      data += JSON.stringify(templates, null, 2) + ';';
      data += '});';
    } else {
      data = 'window.' + this.options.name + ' = ' + JSON.stringify(templates, null, 2);
    }

    fs.writeFile(this.options.output, data, function(err) {
      if (err) {
        return console.log("error, file don't write, check path!");
      }
      
      if (typeof callback != "undefined") {
        callback();
      }
    });
  },

  /**
   * Read files and get templates
   * @param {array} files
   * @return {object}
   */
  getTemplates: function() {
    var templates = {}
      , template
      , index;
    
    this.files.forEach(function(path) {
      try {
        template = fs.readFileSync(path, 'utf8');
      } catch(e) {
        return console.log(e);
      }

      if (this.options.removebreak) {
        template = template.replace(/(\n(\r)?(\t)?)/g, '');
        template = template.replace(/(\t)/g, '');
      }

      index = path.replace(this.options.root, '').replace('.' + this.options.ext, '').substring(1);

      templates[index] = template;
    }, this);

    return templates;
  },

  /**
   * Compile templates
   * @param  {Object} options
   * @param  {Function} callback
   */
  compile: function(options, callback) {
    this.options = options;
    this.createWalker(callback);

    if (this.options.watch) {
      console.log('watch start...');

      watchTree(this.options.root, function (event) {
        this.createWalker(callback);
      }.bind(this));
    }
  }
}

module.exports = new Jsttojs;