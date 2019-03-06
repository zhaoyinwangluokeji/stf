module.exports = angular.module('stf/device', [
  require('./device-info-filter').name,
  require('./enhance-device').name,
  require('./device-rent-webcontrol').name,
  require('../common-ui').name,
  require('./device-rent-log').name
])
  .factory('DeviceService', require('./device-service'))
  .factory('StateClassesService', require('./state-classes-service'))
