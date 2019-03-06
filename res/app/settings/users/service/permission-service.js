var oboe = require('oboe')

module.exports = function PermissionService($http,AppState) {
    return {
         
        GetAllPermission: function (page, count, filter) {
            var data = {
                page: page
                , count: count
                , filter: filter
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/GetAllPermission', data)
                    .success(function (response) {
                        console.log("success")
                        return resolve(response.data)
                    })
                    .error(function (response) {
                        console.log("fail")
                        return reject(response.data)
                    })
            });
        },
        AddPermissionToGroup: function (group,permissionlist) {
            var data = {
                group: group
                , permissionlist: permissionlist
                 
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/AddPermissionToGroup', data)
                    .success(function (response) {
                        console.log("success")
                        return resolve(response.data)
                    })
                    .error(function (response) {
                        console.log("fail")
                        return reject(response.data)
                    })
            });
        },
        
        RemovePermissionOfGroup: function (group,permissionlist) {
            var data = {
                group: group,
                permissionlist:permissionlist
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/RemovePermissionOfGroup', data)
                    .success(function (response) {
                    //    console.log("success:" + JSON.stringify(response))
                        return resolve(response.data)
                    })
                    .error(function (response) {
                        console.log("fail")
                        return reject(response.error)
                    })
            });
        },
        getAllPermissionByUser: function () {
            var user = AppState.user
            var data = {
                user: user
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/getAllPermissionByUser', data)
                    .success(function (response) {
                        console.log("success")
                        return resolve(response.data)
                    })
                    .error(function (response) {
                        console.log("fail")
                        return reject(response.data)
                    })
            });
        },
        
        
    }
}