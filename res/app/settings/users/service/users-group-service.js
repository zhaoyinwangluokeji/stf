var oboe = require('oboe')

module.exports = function UsersGroupService($http,
    AppState) {
    return {
        GetGroups: function (page, count, filter) {
            var data = {
                page: page
                , count: count
                , filter: filter
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/getGroup', data)
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
        NewGroups: function (groupname) {
            var data = {
                group: groupname
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/newGroup', data)
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
        ModifyGroup: function (group, new_group) {
            var data = {
                group: group,
                new_group: new_group
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/ModifyGroup', data)
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
        DeleteGroup: function (group) {
            var data = {
                group: group
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/DeleteGroup', data)
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
        AddUserToGroup: function (group,userslist) {
            var data = {
                group: group,
                userslist:userslist
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/AddUserToGroup', data)
                    .success(function (response) {
                    //    console.log("success:" + JSON.stringify(response))
                        return resolve(response.data)
                    })
                    .error(function (response) {
                        console.log("fail")
                        return reject(response.error)
                    })
            });
        }
        ,
        RemoveUserOfGroup: function (group,userslist) {
            var data = {
                group: group,
                userslist:userslist
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/RemoveUserOfGroup', data)
                    .success(function (response) {
                    //    console.log("success:" + JSON.stringify(response))
                        return resolve(response.data)
                    })
                    .error(function (response) {
                        console.log("fail")
                        return reject(response.error)
                    })
            });
        }
        

    }

}