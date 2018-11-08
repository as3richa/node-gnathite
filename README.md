# gnathite

Dead-simple HTML and plaintext email templates with Handlebars. A workalike reimplementation of [mandible](https://github.com/defunctzombie/node-mandible), since Mandible is now unmaintained (and is dependent on multiple vulnerable packages).

## API

```js
const Gnathite = require('gnathite');

/* `path/to/templates` is a directory containing `layout.txt` and/or `layout.html`,
 * as well as `some-email.txt` and/or `some-email.html` */

const mailer = new Gnathite('path/to/templates');

/* When render is called, `some-email.txt` is parsed and rendered with context
 * `{ message: 'hi' }`, and then `layout.txt` is parsed and rendered with context
 * `{ message: 'hi', body: '...' }`, where the body is the result of rendering
 * `some-email.txt`. The same process is repeated for the HTML templates */

mailer.render('some-email', { message: 'hi' }, function(err, txtEmail, htmlEmail) {
  if(err) {
    throw err;
  }

  console.log(txtEmail);
  console.log(htmlEmail);
});

/* You can render text or HTML only, like: */
mailer.txt('some-email', {}, function(err, txtEmail) { console.log(txtEmail); });
mailer.html('some-email', {}, function(err, htmlEmail) { console.log(htmlEmail); });

/* By default, each template is read only once, and subsequently cached in the
 * Gnathite object for the its lifetime. You can clear this cache manually with
 * clearCache: */

mailer.clearCache();

/* Subsequent calls to render will reread `layout.txt`, etc.
 * Alternatively, you can disable caching entirely: */

const uncachedMailer = new Gnathite('path/to/templates', false);
```

## Stylesheets

[juice](https://www.npmjs.com/package/juice) is used to transform stylesheets in the rendered HTML into inline per-element styles. A stylesheet can be specified in a layout, either as a `<style>` tag, or as a `<link>` tag referencing a CSS file.

## Previews

`yarn preview <directory>` spawns an HTTP server that allows you to render your templates in your browser. Try `yarn preview test/fixtures/simple` and open `http://localhost:3000/welcome.html?title=foo&name=bar` in your browser.

## Differences to Mandible

- Errors from `fs` are no longer thrown, and are rather passed as the first argument to the callback
- Files are read asynchronously rather than synchronously so as not to block the event loop
- Templates are cached between calls to `render`/`txt`/`html` (see above)
- The default export of the module is a constructor rather than a regular function (ie. `new Gnathite(dir)` rather than `Mandible(dir)`

## License

MIT; see `LICENSE`.
