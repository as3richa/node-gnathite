'use strict';

const fs         = require('fs');
const path       = require('path');
const handlebars = require('handlebars');
const juice      = require('juice');

const LAYOUT_NAME = 'layout';
const ENCODING    = 'utf8';

const Gnathite = function(directory, useCache = true) {
  this._directory    = directory;
  this._useCache     = useCache;
  this.clearCache();
};

Gnathite.prototype.clearCache = function() {
  this._cachedTemplate = null;
  this._htmlCache      = {};
  this._txtCache       = {};
};

Gnathite.prototype._getTemplate = function(cache, name, extension, cb) {
  const self = this;

  if(self._useCache && cache[name]) {
    cb(null, cache[name]);
    return;
  }

  const pathToFile = path.join(self._directory, name + extension);

  fs.readFile(pathToFile, ENCODING, function(err, data) {
    if(err) {
      cb(err, null);
      return;
    }

    const template = handlebars.compile(data);
    if(self._useCache) {
      cache[name] = template;
    }

    cb(null, template);
  });
};

Gnathite.prototype.html = function(emailName, locals, cb) {
  const self = this;

  self._getTemplate(self._htmlCache, LAYOUT_NAME, '.html', function(err, layoutTemplate) {
    if(err) {
      cb(err);
      return;
    }

    self._getTemplate(self._htmlCache, emailName, '.html', function(err, bodyTemplate) {
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

  self._getTemplate(self._txtCache, LAYOUT_NAME, '.txt', function(err, layoutTemplate) {
    if(err) {
      cb(err);
      return;
    }

    self._getTemplate(self._txtCache, emailName, '.txt', function(err, bodyTemplate) {
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
