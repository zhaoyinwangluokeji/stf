module.exports = function ModifyPasswordController($scope, $http) {

    $scope.error = null
  
    $scope.submit = function() {
      var data = {
        name: $scope.modify_password.username
        , email: $scope.modify_password.email
        , password: $scope.modify_password.password.$modelValue
      }
      $scope.invalid = false
      $http.post('/auth/api/v1/mock/modify_password', data)
        .success(function(response) {
          $scope.error = null
          location.replace(response.redirect)
        })
        .error(function(response) {
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
  