module.exports = function SignInCtrl($scope, $http) {

  $scope.error = null
  $scope.login_mode = "name"

  $scope.submit = function () {
    var data = {
      name: $scope.signin.username.$modelValue
      , email: ""
      , password: $scope.signin.password.$modelValue
    }
    /*
var data = {
      name: $scope.signin.username.$modelValue
      , email: $scope.signin.email.$modelValue
      , password: $scope.signin.password.$modelValue
    }
    */
    $scope.invalid = false
    $http.post('/auth/api/v1/mock', data)
      .success(function (response) {
        $scope.error = null
        location.replace(response.redirect)
      })
      .error(function (response) {
        switch (response.error) {
          case 'ValidationError':
            $scope.error = {
              $invalid: true
              , message: (response.data) ? response.data.message : null
            }
            break
          case 'InvalidCredentialsError':
            $scope.error = {
              $incorrect: true
              , message: (response.data) ? response.data.message : null
            }
            break
          default:
            $scope.error = {
              $server: true
              , message: (response.data) ? response.data.message : null
            }
            break
        }
      })




  }
}
