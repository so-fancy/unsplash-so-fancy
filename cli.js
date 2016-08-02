#!/usr/bin/env node
'use strict';
const get = require('./');

// Categories: buildings food nature people technology objects
const res = '2560x1440';
const cats = ['buildings', 'food', 'nature', 'objects', 'people'];

//get(`https://source.unsplash.com/category/${category}/${res}/daily`);
get(`https://source.unsplash.com/category/${cats[Math.floor(Math.random() * (cats.length))]}/featured/${res}`);
