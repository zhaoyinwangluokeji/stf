module.exports = function CreateAccountController($scope, $http) {

  $scope.error = null

  $scope.submit = function () {
    var data = {
      name: $scope.create_account.username
      , email: $scope.create_account.email
      , password: $scope.create_account.password
    }
    $scope.invalid = false
    $http.post('/auth/api/v1/mock/create-account', data)
      .success(function (response) {
        $scope.error = null
        location.replace(response.redirect)
      })
      .error(function (response) {
        switch (response.error) {
          case 'ValidationError':
            $scope.error = {
              $invalid: true
              ,  message: (response.data) ? response.data.message : null
            }
            break
          case 'InvalidCredentialsError':
            $scope.error = {
              $incorrect: true
              ,  message: (response.data) ? response.data.message : null
            }
            break
          default:
            $scope.error = {
              $server: true
              ,  message: (response.data) ? response.data.message : null
            }
            break
        }
      })
  }
}
