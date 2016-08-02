'use strict';
const fetch = require('node-fetch');
const urllib = require('url');
const path = require('path');
const fs = require('fs');
const pathExists = require('path-exists');
const pify = require('pify');
const wallpaper = require('wallpaper');

const DEST = path.resolve(process.env.HOME, 'unsplash-so-fancy');

let location;
let filename;

module.exports = url => {
  // todo: use listr
  Promise.all([
    pify(fs.mkdir)(DEST).catch(_ => {}),
    fetch(url, { redirect: 'manual' })
  ])
  .then(data => {
    const res = data[1];
    if (res.status !== 302) {
      throw Error('No redirect - not sure what the image ID is. Bug seph');
    }

    location = urllib.resolve('https://source.unsplash.com/', res.headers.get('location'));
    if (!location) throw Error('No location header');

    filename = path.parse(urllib.parse(location).pathname).base;

    return Promise.all([pathExists(`${filename}.jpeg`), pathExists(`${filename}.png`)]);
  })
  .then(exist => {
    if (exist[0] || exist[1]) {
      console.log(`Already downloaded ${filename}`);
    } else {
      console.log('Fetching', filename);

      return fetch(location);
    }
  })
  .then(res => {
    const contenttype = res.headers.get('content-type');
    const ext = contenttype.indexOf('jpeg') !== -1 ? 'jpeg' : 'png'; // bleh.

    const p = path.resolve(DEST, `${filename}.${ext}`);
    res.body.pipe(fs.createWriteStream(p));
    res.body.once('end', _ => {
      console.log(`setting ${p} as wallpaper`);
      wallpaper.set(p)
      .then(_ => console.log('done'));
    });
  })
  .catch(e => {
    console.error(e.stack);
  });
};
