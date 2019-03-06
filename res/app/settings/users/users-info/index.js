require('./users-info.css')

module.exports = angular.module('stf.users.users-info', [
    require('gettext').name,
    require('stf/app-state').name,
    'ngRoute',
    'ngTable'
]).directive('usersInfo', require('./users-info'))
.service('UsersService', require('../service/users-service'))  
