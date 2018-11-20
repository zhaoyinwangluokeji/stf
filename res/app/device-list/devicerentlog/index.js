require('./log-list.css')

module.exports = angular.module('stf.device-list.log-list', [
    require('stf/device').name,
    require('stf/user/group').name,
    require('stf/common-ui').name,
    require('stf/admin-mode').name,
    require('../columnlog').name,
    require('../empty').name,
    require('stf/app-state').name
  ])
  .directive('deviceRentLog', require('./log-list-directive'))
  