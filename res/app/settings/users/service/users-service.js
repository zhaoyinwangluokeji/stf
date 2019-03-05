var oboe = require('oboe')

module.exports = function UsersService($http,$q,$location,AppState) {
    return {
         
        GetUsers: function (page, count, filter) {
            var data = {
                page: page
                , count: count
                , filter: filter
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/getUsers', data)
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
        AddNewUser: function (user) {
            var data = {
                email: user.email
                , name: email.name
                 
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/AddNewUser', data)
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
        
        GetGroupUsers: function (group_id, count, filter) {
            var data = {
                user_group_id: group_id
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/GetGroupUsers', data)
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
        ResetUserPassword: function (email,name) {
            var data = {
                email: email,
                name: name
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/ResetUserPassword', data)
                    .success(function (response) {
                    //    console.log("success:" + response.msg)
                            return resolve(response)
                    })
                    .error(function (response) {
                        console.log("fail")
                            return reject(response)
                    })
            });
        },
        ModifyPassword: function (user, password) {
            var data = {
                email: user.email,
                name: user.name,
                password:   password
            }
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/modify-password', data)
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
        Logout: function (user, password) {
            var data = {
                email: user.email,
                name: user.name,
                password: password
            }
            var url='/auth/api/v1/mock/Logout?'+"email="+user.email+"&name="+user.name
            return new Promise(function (resolve, reject) {
                $http.post('/auth/api/v1/mock/Logout', data)
                    .success(function (response) {
                        console.log("success："+response.data.url)
                        return resolve(response.data)
                    })
                    .error(function (response) {
                        console.log("fail")
                        return reject(response.data)
                    })
            });
        }
        
    }
}