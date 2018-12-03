require('./modify-password.css')

module.exports = angular.module('stf.modify-password', [])
  .config(function($routeProvider) {
    $routeProvider
      .when('/auth/mock/modify-password', {
        template: require('./modify-password.pug')
      })
  })
  .controller('ModifyPassword', require('./modify-password-controller'))
