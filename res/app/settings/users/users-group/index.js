require('./users-group.css')

module.exports = angular.module('stf.users.users-group', [
    require('gettext').name,
    require('stf/app-state').name,
    'ngRoute',
    'ngTable'
]).directive('usersGroup', require('./users-group'))
.service('UsersGroupService', require('../service/users-group-service'))  
.service('UsersService', require('../service/users-service'))  
