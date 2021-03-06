/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

'use strict';
const BaseHelper = require('../../base/basehelper.js');

class Helper extends BaseHelper {

  acknowledgeMessage(context) {
    if (!context.data.id) {
      return Promise.resolve();
    }
    const ackId = context.data.id;
    return new Promise((resolve, reject) => {
      const sentContext = this.cementHelper.createContext({
        nature: {
          type: 'messages',
          quality: 'acknowledge',
        },
        payload: {
          id: ackId,
        },
      });
      sentContext.on('done', (brickName, response) => {
        resolve({
          returnCode: 'done',
          brickName: this.cementHelper.brickName,
          response,
        });
      });
      sentContext.on('reject', (brickName, err) => {
        reject({
          returnCode: 'reject',
          brickName,
          response: err,
        });
      });
      sentContext.on('error', (brickName, err) => {
        reject({
          returnCode: 'error',
          brickName,
          response: err,
        });
      });
      sentContext.publish();
    });
  }
}

module.exports = Helper;
