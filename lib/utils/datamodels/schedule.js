/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

'use strict';
const ObjectID = require('bson').ObjectID;
const cronParser = require('cron-parser');
const _ = require('lodash');

const keys = {
  id: { type: 'identifier' },
  objId: { type: 'string', optional: true },
  type: { type: 'string', optional: true },
  schedule: { type: 'string' },
  rest: {
    type: 'object',
    items: {
      url: { type: 'string' },
      method: { type: 'string', optional: true, defaultTo: 'GET' },
      headers: { type: 'object', optional: true, defaultTo: {} },
      body: { type: 'object', optional: true },
    },
  },
  scheduledBy: { type: 'string', optional: true },
  scheduledTimestamp: { type: 'number', optional: true },
};

/**
 * Schedule Data Model class
 *
 * @property {ObjectID} id - unique identifier
 * @property {ObjectID} scheduleId - unique identifier of a Schedule
 * @property {Object} rest - Callback rest api
 * @property {String} rest.url - URL of a rest api
 * @property {String} rest.method - method of a rest api
 * @property {Object} rest.headers - headers of a rest api
 * @property {Object} rest.body - body of a rest api
 */
class Schedule {
  /**
   *
   * @param {Object} data - params
   * @param {ObjectID} data.id - unique identifier
   * @param {ObjectID} data.rest - Callback rest api
   * @param {String} data.rest.url - URL of a rest api
   * @param {String} data.rest.method - method of a rest api
   * @param {Object} data.rest.headers - headers of a rest api
   * @param {Object} data.rest.body - body of a rest api
   */
  constructor(data) {
    this.id = data.id || (new ObjectID()).toString();
    this.objId = data.objId;
    this.type = data.type;
    this.schedule = data.schedule;
    this.rest = data.rest;
    this.enabled = data.enabled;
    this.scheduledBy = data.scheduledBy;
    this.scheduledTimestamp = data.scheduledTimestamp;
  }

  static keys() {
    return _.cloneDeep(keys);
  }

  static queryKeys() {
    const queryKeys = _.cloneDeep(keys);
    const keysArray = Object.keys(queryKeys);
    keysArray.forEach(function(key) {
      queryKeys[key].optional = true;
    });
    return queryKeys;
  }

  static convertQueryStrings(query) {
    const converted = {};
    if (query.hasOwnProperty('enabled')) {
      converted.id = query.id;
    }
    if (query.hasOwnProperty('enabled')) {
      converted.enabled = query.enabled.toLowerCase() === 'true';
    }
    return converted;
  }

  static validateSchedule(cronString) {
    if (typeof cronString === 'string') {
      try {
        cronParser.parseExpression(cronString);
      } catch (err) {
        throw new Error('Cron format is not correct');
      }
      return true;
    } else if (typeof cronString === 'number') {
      if (new Date(cronString).getTime() <= Date.now()) {
        throw new Error('Timestamp is already passed');
      }
      return true;
    }
    throw new Error('Schedule must be number or string');
  }
}

module.exports = Schedule;
