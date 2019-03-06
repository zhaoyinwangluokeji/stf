module.exports = angular.module('stf/device/device-rent-log', [
    require('stf/app-state').name,
    require('stf/user/group').name,
  ])
    .factory('DeviceRentLogService', require('./device-rent-log-service.js'))
  