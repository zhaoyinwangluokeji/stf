require('./create-account.css')

module.exports = angular.module('stf.create-account', [
    require('./success-create-account').name
])
  .config(function($routeProvider) {
    $routeProvider
      .when('/auth/mock/create-account', {
        template: require('./create-account.pug')
      })
  })
  .controller('CreateAccountController', require('./create-account-controller'))

  