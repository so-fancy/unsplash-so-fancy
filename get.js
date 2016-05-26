#!/usr/local/bin/node
const fetch = require('node-fetch');
const urllib = require('url');
const path = require('path');
const fs = require('fs');

//fetch('https://google.com/', {redirect: 'manual'})

const DEST = '/Users/josephg/unsplash/';

const exists = (filename) => {
  try {
    return fs.statSync(filename);
  } catch(e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}


const get = (url) => {
  fetch(url, {redirect: 'manual'})
  .then(res => {
    if (res.status !== 302) {
      throw Error('No redirect - not sure what the image ID is. Bug seph');
    }

    const location = urllib.resolve('https://source.unsplash.com/', res.headers.get('location'));
    if (!location) throw Error('No location header');

    const filename = path.parse(urllib.parse(location).pathname).base;

    if (exists(`${filename}.jpeg`) || exists(`${filename}.png`)) {
      console.log(`Already downloaded ${filename}`);
      return;
    }

    console.log('Fetching', filename);

    fetch(location).then(res => {
      const contenttype = res.headers.get('content-type');
      const ext = contenttype.indexOf('jpeg') !== -1 ? 'jpeg' : 'png'; // bleh.

      const p = path.resolve(DEST, `${filename}.${ext}`);
      res.body.pipe(fs.createWriteStream(p));
      res.body.once('end', () => console.log('wrote', p));
    });
  })
  .catch(e => {
    console.error(e.stack);
  });
};

const res = '2560x1440';
['nature', 'technology', 'objects', 'people'].forEach(category => {
  //get(`https://source.unsplash.com/category/${category}/${res}/daily`);
  get(`https://source.unsplash.com/category/${category}/${res}`);
});
