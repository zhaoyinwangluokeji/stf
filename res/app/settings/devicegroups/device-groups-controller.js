var oboe = require('oboe')

module.exports = function DeviceGroupsController($scope,$http) {
    $scope.device_groups = []
    $scope.devices = []
    $scope.getAllGroups = function(){
        return new Promise(function (resolve, reject) {
            data = {}
            $http.post('/auth/api/v1/mock/get-all-device-groups', data)
                .success(function (response) {
                    $scope.device_groups = response.data
                    console.log("success: " + JSON.stringify(response.data))
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.data)
                })
        });
    }

    $scope.addGroup = function(){
        return new Promise(function (resolve, reject) {
            data = {
                name: 'android'
                ,users: ['water']
                ,devices: ['ABCDTYUILBJHJ']
            }
            $http.post('/auth/api/v1/mock/add-device-group', data)
                .success(function (response) {
                    console.log("success!")
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.data)
                })
        });
    }

    $scope.getAllDevices = function(){
        return new Promise(function (resolve, reject) {
            data = {}
            $http.post('/auth/api/v1/mock/get-all-devices', data)
                .success(function (response) {
                    $scope.devices = response.data
                    console.log("success: " + JSON.stringify(response.data))
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.data)
                })
        });
    }

}
