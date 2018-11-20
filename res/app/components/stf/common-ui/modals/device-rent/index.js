require('angular-route')
require('./device-rent-dialog.css')
//require('ui.select')

 
  //'ui.select',
  //'ngSanitize'

module.exports = angular.module('stf.device-rent', [
  require('stf/common-ui/modals/common').name,
  require('stf/socket').name,
  require('stf/app-state').name,
  require('./select-project').name,
  'ngRoute'

])
  .factory('DeviceRentService', require('./device-rent-service'))