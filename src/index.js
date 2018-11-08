'use strict';

const fs         = require('fs');
const path       = require('path');
const handlebars = require('handlebars');
const juice      = require('juice');

const LAYOUT_NAME = 'layout';
const ENCODING    = 'utf8';

const Gnathite = function(directory, useCache = true) {
  this._directory = directory;
  this._useCache = useCache;
  this.clearCache();
};

Gnathite.prototype.clearCache = function() {
  this._cache = {};
};

Gnathite.prototype._getTemplate = function(name, extension, cb) {
  const self = this;
  const fullName = name + extension;

  if(self._useCache && self._cache[fullName]) {
    cb(null, self._cache[fullName]);
    return;
  }

  const pathToFile = path.join(self._directory, fullName);

  fs.readFile(pathToFile, ENCODING, function(err, data) {
    if(err) {
      cb(err, null);
      return;
    }

    const template = handlebars.compile(data);
    if(self._useCache) {
      self._cache[fullName] = template;
    }

    cb(null, template);
  });
};

Gnathite.prototype.html = function(emailName, locals, cb) {
  const self = this;

  self._getTemplate(LAYOUT_NAME, '.html', function(err, layoutTemplate) {
    if(err) {
      cb(err);
      return;
    }

    self._getTemplate(emailName, '.html', function(err, bodyTemplate) {
      if(err) {
        cb(err);
        return;
      }

      locals.body = bodyTemplate(locals);

      const unjuicedHtmlEmail = layoutTemplate(locals);

      const juiceOptions = {
        webResources: { 
          relativeTo: self._directory,
          strict: true
        }
      };

      juice.juiceResources(unjuicedHtmlEmail, juiceOptions, cb);
    });
  });
};

Gnathite.prototype.txt = function(emailName, locals, cb) {
  const self = this;

  self._getTemplate(LAYOUT_NAME, '.txt', function(err, layoutTemplate) {
    if(err) {
      cb(err);
      return;
    }

    self._getTemplate(emailName, '.txt', function(err, bodyTemplate) {
      if(err) {
        cb(err);
        return;
      }

      locals.body = bodyTemplate(locals);
      const txtEmail = layoutTemplate(locals);
      cb(null, txtEmail);
    });
  });
};

Gnathite.prototype.render = function(emailName, locals, cb) {
  const self = this;

  self.txt(emailName, locals, function(err, txtEmail) {
    if(err) {
      cb(err, null, null);
      return;
    }

    self.html(emailName, locals, function(err, htmlEmail) {
      if(err) {
        cb(err, null, null);
        return;
      }

      cb(null, txtEmail, htmlEmail);
    });
  });
};

module.exports = Gnathite;
