require('./select-project-box.css')

module.exports = angular.module('stf.device-rent.select-project', [
   require('stf/socket').name
])
.directive('selectProjects', require('./select-project-box'))