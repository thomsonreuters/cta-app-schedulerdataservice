/**
 * This source code is provided under the Apache 2.0 license and is provided
 * AS IS with no warranty or guarantee of fit for purpose. See the project's
 * LICENSE.md for details.
 * Copyright 2017 Thomson Reuters. All rights reserved.
 */

'use strict';

const _ = require('lodash');
const Helper = require('./helper.js');
const Schedule = require('../../../../utils/datamodels/schedule.js');
const Scheduler = require('../scheduler.js');
const Synchronizer = require('../synchronizer.js');
const validate = require('cta-common').validate;

/**
 * Business Logic Schedule Helper Update class
 *
 * @augments BaseHelper
 * @property {CementHelper} cementHelper - cementHelper instance
 * @property {Logger} logger - logger instance
 */
class UpdateByObjIdType extends Helper {

  constructor(cementHelper, logger) {
    super(cementHelper, logger);
    this.synchronizer = new Synchronizer(cementHelper, logger);
    this.scheduler = new Scheduler(cementHelper, logger);
  }
  /**
   * Validates Context properties specific to this Helper
   * Validates Schedule Model fields
   * @param {Context} context - a Context
   * @abstract
   * @returns {Promise}
   */
  _validate(context) {
    return new Promise((resolve, reject) => {
      const keys = Schedule.queryKeys();
      delete keys.schedule;
      const updatePattern = {
        type: 'object',
        items: keys,
      };
      updatePattern.items.objId.optional = false;
      updatePattern.items.type.optional = false;
      const validation = validate(context.data.payload, updatePattern);

      if (!validation.isValid) {
        const resultsKeysArray = Object.keys(validation.results);
        if (typeof validation.results === 'object'
          && resultsKeysArray.length > 0) {
          for (let i = 0; i < resultsKeysArray.length; i += 1) {
            const key = resultsKeysArray[i];
            if (!validation.results[key].isValid) {
              const error = validation.results[key].error;
              reject(new Error(`incorrect '${key}' in job payload: ${error}`));
              break;
            }
          }
        } else {
          reject(new Error('missing/incorrect \'payload\' Object in job'));
        }
      }

      if (context.data.payload.schedule) {
        const schedule = context.data.payload.schedule;
        if (typeof schedule !== 'string' && typeof schedule !== 'number') {
          reject(new Error('incorrect \'schedule\' in job payload: invalid type for value ' +
            `"${schedule}", expected "number" or "string"`));
        } else {
          Schedule.validateSchedule(context.data.payload.schedule);
        }
      }
      resolve({ ok: 1 });
    });
  }

  /**
   * Process the context
   * @param {Context} context - a Context
   */
  _process(context) {
    const that = this;
    return this.acknowledgeMessage(context)
      .then(() => this.updateDB(context.data.payload))
      .then((updatedScheduleObj) => {
        if (updatedScheduleObj === null) {
          context.emit('error', that.cementHelper.brickName, new Error('Schedule not found'));
        } else {
          that.synchronizer.broadcast('update', updatedScheduleObj)
            .then(() => {
              context.emit('done', that.cementHelper.brickName, updatedScheduleObj);
            })
            .catch((err) => {
              that.logger.error('Cannot broadcast updating schedule ' +
                `${err.returnCode} ${err.response}`);
              context.emit(err.returnCode, err.brickName, err.response);
            });
        }
      })
      .catch((err) => {
        that.logger.error(`Cannot update schedule to DB ${err.returnCode} ${err.response}`);
        context.emit(err.returnCode, err.brickName, err.response);
      });
  }

  updateDB(payload) {
    return new Promise((resolve, reject) => {
      const data = {
        nature: {
          type: 'dbinterface',
          quality: 'updateonebyobjidtype',
        },
        payload: {
          collection: 'schedules',
          objId: payload.objId,
          type: payload.type,
          content: _.omit(payload, ['id', 'objId', 'type']),
        },
      };
      const updateContext = this.cementHelper.createContext(data);
      updateContext.on('done', function(brickName, response) {
        resolve(response);
      });
      updateContext.on('reject', function(brickName, error) {
        reject({
          returnCode: 'reject',
          brickName: brickName,
          response: error,
        });
      });
      updateContext.on('error', function(brickName, error) {
        reject({
          returnCode: 'error',
          brickName: brickName,
          response: error,
        });
      });
      updateContext.publish();
    });
  }
}

module.exports = UpdateByObjIdType;
