require('../create-account.css')

module.exports = angular.module('stf.success-create-account', [])
  .config(function($routeProvider) {
    $routeProvider
      .when('/auth/mock/success-create-account', {
        template: require('./success-create-account.pug')
      })
  })
  .controller('SuccessCreateAccountController', require('./success-create-account-controller'))
