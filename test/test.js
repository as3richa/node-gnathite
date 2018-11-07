const assert   = require('assert');
const path     = require('path');
const fs       = require('fs');
const Mandible = require('mandible');
const Gnathite = require('../src/index');

function fixture() {
  const params = Array.prototype.slice.call(arguments);
  const parts = ['test', 'fixtures'].concat(params);
  return path.join.apply(null, parts);
}

function readFixture() {
  return fs.readFileSync(fixture.apply(null, arguments), 'utf8');
}

describe('Gnathite', function() {
  describe('basic functionality', function() {
    const gnat = new Gnathite(fixture('simple'));
    const locals = { name: 'Adam' };

    const expectations = {
      'goodbye.html': readFixture('simple', 'expectations', 'goodbye.html'),
      'welcome.html': readFixture('simple', 'expectations', 'welcome.html'),
      'goodbye.txt':  readFixture('simple', 'expectations', 'goodbye.txt'),
      'welcome.txt':  readFixture('simple', 'expectations', 'welcome.txt')
    };

    it('correctly renders HTML using a layout and a template', function(done) {
      gnat.html('goodbye', locals, function(err, htmlEmail) {
        assert(!err);
        assert.equal(htmlEmail, expectations['goodbye.html']);

        gnat.html('welcome', locals, function(err, htmlEmail) {
          assert(!err);
          assert.equal(htmlEmail, expectations['welcome.html']);

          done();
        });
      });
    });

    it('correctly renders text using a layout and a template', function(done) {
      gnat.txt('goodbye', locals, function(err, txtEmail) {
        assert(!err);
        assert.equal(txtEmail, expectations['goodbye.txt']);

        gnat.txt('welcome', locals, function(err, txtEmail) {
          assert(!err);
          assert.equal(txtEmail, expectations['welcome.txt']);

          done();
        });
      });
    });

    it('correctly renders both text and HTML in a single call to render', function(done) {
      gnat.render('welcome', locals, function(err, txtEmail, htmlEmail) {
        assert(!err);
        assert.equal(txtEmail, expectations['welcome.txt']);
        assert.equal(htmlEmail, expectations['welcome.html']);

        done();
      });
    });

    it('is workalike with Mandible', function(done) {
      const mandible = Mandible(fixture('simple'));

      mandible.render('welcome', locals, function(mErr, mTxtEmail, mHtmlEmail) {
        assert(!mErr);

        gnat.render('welcome', locals, function(err, txtEmail, htmlEmail) {
          assert(!err);
          assert.equal(txtEmail, mTxtEmail);
          assert.equal(htmlEmail, mHtmlEmail);

          done();
        });
      });
    });
  });

  describe('CSS inlining', function() {
    it('inlines CSS from a style tag', function(done) {
      const gnat = new Gnathite(fixture('juice-style'));
      const expectation = readFixture('juice-style', 'expectations', 'hello.html')

      gnat.html('hello', { title: 'hi' }, function(err, htmlEmail) {
        assert(!err);
        assert.equal(htmlEmail, expectation);

        done();
      });
    });

    it('inlines CSS from a linked stylesheet', function(done) {
      const gnat = new Gnathite(fixture('juice-link'));
      const expectation = readFixture('juice-link', 'expectations', 'hello.html')

      gnat.html('hello', { title: 'hi' }, function(err, htmlEmail) {
        assert(!err);
        assert.equal(htmlEmail, expectation);

        done();
      });
    });

    it('yields an error given a bad stylesheet link', function(done) {
      const gnat = new Gnathite(fixture('juice-bad-link'));

      gnat.html('hello', { title: 'hi' }, function(err, htmlEmail) {
        assert(err);
        assert(!htmlEmail);
        done();
      });
    });
  });

  describe('fs errors', function() {
    it('yields an error for HTML but not text if an email has only a text template', function(done) {
      const gnat = new Gnathite(fixture('missing-emails'));

      gnat.txt('text-only', {}, function(err) {
        assert(!err);

        gnat.html('text-only', {}, function(err) {
          assert(err);

          done();
        });
      });
    });

    it('yields an error for text but not HTML if an email has only an HTML template', function(done) {
      const gnat = new Gnathite(fixture('missing-emails'));

      gnat.html('html-only', {}, function(err) {
        assert(!err);

        gnat.txt('html-only', {}, function(err) {
          assert(err);

          done();
        });
      });
    });

    it('yields an error on render if either text or HTML is missing', function(done) {
      const gnat = new Gnathite(fixture('missing-emails'));

      gnat.render('text-only', {}, function(err) {
        assert(err);

        gnat.render('html-only', {}, function(err) {
          assert(err);

          done();
        });
      });
    });

    it('yields an error for text but not HTML if layout.txt is missing', function(done) {
      const gnat = new Gnathite(fixture('missing-txt-layout'));

      gnat.html('welcome', {}, function(err) {
        assert(!err);

        gnat.txt('welcome', {}, function(err) {
          assert(err);

          done();
        });
      });
    });

    it('yields an error for HTML but not text if layout.html is missing', function(done) {
      const gnat = new Gnathite(fixture('missing-html-layout'));

      gnat.txt('goodbye', {}, function(err) {
        assert(!err);

        gnat.html('goodbye', {}, function(err) {
          assert(err);

          done();
        });
      });
    });

    it('yields an error on render if either text or HTML is missing', function(done) {
      const gnat1 = new Gnathite(fixture('missing-txt-layout'));
      const gnat2 = new Gnathite(fixture('missing-html-layout'));

      gnat1.render('welcome', {}, function(err) {
        assert(err);

        gnat2.render('goodbye', {}, function(err) {
          assert(err);

          done();
        });
      })
    });
  });

  describe('caching', function() {
    it('is idempotent', function(done) {
      const gnat = new Gnathite(fixture('simple'));

      gnat.render('welcome', {}, function(err, firstTxt, firstHtml) {
        gnat.render('welcome', {}, function(err, secondTxt, secondHtml) {
          assert.equal(firstTxt, secondTxt);
          assert.equal(firstHtml, secondHtml);

          done();
        });
      });
    });
  });
});
