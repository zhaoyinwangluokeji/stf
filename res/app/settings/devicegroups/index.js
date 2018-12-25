require('./devicegroups.css')

module.exports = angular.module('stf.settings.devicegroups', [
    require('stf/app-state').name,
    require('ui-bootstrap').name,
    require('angular-xeditable').name,
    ,'ngTable'
  ])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/devicegroups/devicegroups.pug', require('./devicegroups.pug')
    )
  }])
   .controller('DeviceGroupsController', require('./device-groups-controller'))
   .service('DeviceGroupService', require('./device-groups-service'))
 