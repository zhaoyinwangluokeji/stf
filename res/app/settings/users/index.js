require('./users.css')

module.exports = angular.module('stf.settings.users', [
    require('stf/app-state').name
    ,'ngTable'
  ])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/users/users.pug', require('./users.pug')
    )
  }])
   .controller('UsersController', require('./usersController'))
   .service('UsersService', require('./UsersService'))
 