'use strict';

const config = {
  name: 'base-businesslogic',
  module: './bricks/businesslogics/schedule/index.js',
  properties: {},
  publish: [],
  subscribe: [
    {
      topic: 'bl.base',
      data: [
        {},
      ],
    },
  ],
};

module.exports = config;
