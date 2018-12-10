 

module.exports = angular.module('stf.settings.users', [
    require('stf/app-state').name,
    require('ui-bootstrap').name,
    require('angular-xeditable').name,
    require('./users-info').name,
    require('./users-group').name,
    ,'ngTable'
  ])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/users/users-tab.pug', require('./users-tab.pug')
    )
  }])
 //  .controller('UsersController', require('./users-controller'))
   .controller('UsersTabController', require('./users-tab-controller'))
 //  .service('UsersService', require('./users-service'))
 //  .service('UsersGroupService',require('./users-group-service'))
  
