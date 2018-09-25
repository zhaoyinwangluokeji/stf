require('angular-route')
require('./device-rent-dialog.css')

module.exports = angular.module('stf.device-rent', [
  require('stf/common-ui/modals/common').name,
  require('stf/socket').name,
  require('stf/app-state').name,
  'ngRoute'
])
  .factory('DeviceRentService', require('./device-rent-service'))