require('./device-list-icons2.css')

module.exports = angular.module('stf.device-list.icons2', [
  require('gettext').name,
  require('stf/user/group').name,
  require('stf/common-ui').name,
  require('../column').name,
  require('../empty').name,
  require('stf/standalone').name,
  'ngRoute',
  require('stf/app-state').name
]).directive('deviceListIcons2', require('./device-list-icons2-directive'))
