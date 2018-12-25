require('./devicemanager.css')

module.exports = angular.module('stf.settings.devicemanager', [
    require('stf/app-state').name,
    require('ui-bootstrap').name,
    require('angular-xeditable').name,
    ,'ngTable'
  ])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/devicemanager/devicemanager.pug', require('./devicemanager.pug')
    )
  }])
   .controller('DeviceManagerController', require('./device-manager-controller'))
   .service('DeviceManagerService', require('./device-manager-service'))
 