require('./users-group.css')

module.exports = angular.module('stf.users.users-group', [
    require('gettext').name,
    require('stf/app-state').name,
    'ngRoute',
    'ngTable'
]).directive('usersGroup', require('./users-group'))
 
