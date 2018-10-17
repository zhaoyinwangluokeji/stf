/*
this model is writed by d.f.chen
date: 2018.10.16
*/

require('./select-project.css')

module.exports = angular.module('stf.device-rent.select-project', [
   require('stf/socket').name,
   require('stf/socket').name,
   ngModel
])
  .directive('selectProjects', require('./select-project'))