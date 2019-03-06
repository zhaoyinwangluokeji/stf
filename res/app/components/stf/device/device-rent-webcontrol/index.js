module.exports = angular.module('stf/device/device-rent-webcontrol', [
    require('stf/app-state').name,
    require('stf/user/group').name,
  ])
    .factory('DeviceRentWebControl', require('./device-rent-webcontrol-service.js'))
     