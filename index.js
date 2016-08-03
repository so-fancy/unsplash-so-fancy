'use strict';
const fetch = require('node-fetch');
const urllib = require('url');
const path = require('path');
const fs = require('fs');
const pathExists = require('path-exists');
const pify = require('pify');
const wallpaper = require('wallpaper');
const Listr = require('listr');

const DEST = path.resolve(process.env.HOME, 'unsplash-so-fancy');

let location;
let filename;
let imageExists;
let response;
let imagePath;

module.exports = url => {
    const tasks = new Listr([
        {
            title: 'Preparing',
            task: () => {
                return new Listr([
                    {
                        title: 'Creating image folder if not exist',
                        task: () => pify(fs.mkdir)(DEST).catch(() => {})
                    },
                    {
                        title: 'Getting image filename',
                        task: () => fetch(url, { redirect: 'manual' }).then(res => {
                            if (res.status !== 302) {
                                throw Error('No redirect - not sure what the image ID is. Bug seph');
                            }

                            location = urllib.resolve('https://source.unsplash.com/', res.headers.get('location'));
                            if (!location) throw Error('No location header');

                            filename = path.parse(urllib.parse(location).pathname).base;
                        })
                    }
                ], { concurrent: true });
            }
        },
        {
            title: 'Checking if image already exists',
            task: () => Promise.all([pathExists(`${filename}.jpeg`), pathExists(`${filename}.png`)])
              .then(exist => imageExists = exist[0] || exist[1])
        },
        {
            title: 'Downloading image',
            task: () => fetch(location).then(res => response = res),
            skip: () => imageExists
        },
        {
            title: 'Copying image',
            task: () => {
                const contenttype = response.headers.get('content-type');
                const ext = contenttype.indexOf('jpeg') !== -1 ? 'jpeg' : 'png'; // bleh.

                imagePath = path.resolve(DEST, `${filename}.${ext}`);
                response.body.pipe(fs.createWriteStream(imagePath));

                return new Promise((resolve, reject) => {
                    response.body.once('end', () => resolve());
                    response.body.once('error', () => reject());
                })
            },
            skip: () => imageExists
        },
        {
            title: 'Setting wallpaper',
            task: () => wallpaper.set(imagePath)
        }
    ]);

    tasks.run().catch(err => {
        console.error(err);
    });
};
