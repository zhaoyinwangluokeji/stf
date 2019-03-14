require('./menu.css')

module.exports = angular.module('stf.menu', [
  require('stf/nav-menu').name,
  require('stf/settings').name,
  require('stf/common-ui/modals/external-url-modal').name,
  require('stf/native-url').name,
  require('stf/app-state').name,
 
])
  .controller('MenuCtrl', require('./menu-controller'))
  .service('UsersService', require('../settings/users/service/users-service'))  
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('menu.pug', require('./menu.pug'))
  }])
