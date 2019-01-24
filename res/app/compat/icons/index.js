require('./compat-icons.css')

module.exports = angular.module('stf.compat.icons', [
  require('gettext').name,
  require('stf/user/group').name,
  require('stf/common-ui').name,
  require('../empty').name,
  require('stf/standalone').name,
  'ngRoute',
  require('stf/app-state').name
]).directive('compatIcons', require('./compat-icons-directive'))
.controller('CompatIconsCtrl', require('./compat-icons-controller'))
