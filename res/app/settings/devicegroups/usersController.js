var oboe = require('oboe')
module.exports = function usersController($scope, NgTableParams, UsersService, AppState) {

    $scope.synenable = true
    $scope.vm = {
        value: 0,
        style: 'progress-bar-info',
        showLabel: true,
        striped: true
    }
    $scope.queryFilter = ""
    $scope.func = function () {
        $scope.synenable = false
        var total = 0
    }
    $scope.check = function (row) {
        
        $scope.CurRow = row
    }

    $scope.IsArray = Array.isArray || function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    $scope.IsBoolean = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Boolean]';
    }


    $scope.simpleList = [
        { "id": 1, "name": "Nissim", "age": 41, "money": 454 },
        { "id": 2, "name": "Mariko", "age": 10, "money": -100 },
        { "id": 3, "name": "Mark", "age": 39, "money": 291 },
        { "id": 4, "name": "Allen", "age": 85, "money": 871 },
        { "id": 5, "name": "Dustin", "age": 10, "money": 378 },
        { "id": 6, "name": "Macon", "age": 9, "money": 128 },
        { "id": 7, "name": "Ezra", "age": 78, "money": 11 },
        { "id": 8, "name": "Fiona", "age": 87, "money": 285 },
        { "id": 9, "name": "Ira", "age": 7, "money": 816 },
        { "id": 10, "name": "Barbara", "age": 46, "money": 44 },
        { "id": 11, "name": "Lydia", "age": 56, "money": 494 },
        { "id": 12, "name": "Carlos", "age": 80, "money": 193 }
    ];
    $scope.CurRow
    $scope.RowClick = function (row) {
        row.checked = true
        $scope.CurRow = row
    }
    $scope.ResetPassword = function () {
        if (!$scope.CurRow) {
            alert('没有选择用户')
        } else {
            var email = $scope.CurRow.email
            var name = $scope.CurRow.name
            return UsersService.ResetUserPassword(email, name).then(function (data) {
                alert(data.msg)
            }).catch(function (err) {
                console.log("err:" + JSON.stringify(err))
            })
        }
    }
    $scope.ModifyPassword = function () {
        if (!$scope.CurRow) {
            alert('没有选择用户')
        } else {
            var password = prompt("请输入新的密码", ""); //将输入的内容赋给变量 name ，   
            if (password)//如果返回的有内容  
            {

                var email = $scope.CurRow.email
                var name = $scope.CurRow.name
                /*    var content = password
                    var md5 = crypto.createHash('md5')//定义加密方式:md5不可逆,此处的md5可以换成任意hash加密的方法名称；
                    md5.update(content);
                    var password_md5 = md5.digest('hex')  //加密后的值d
    */
                return UsersService.ModifyPassword($scope.CurRow, password).then(function (data) {
                    alert(data.msg)
                }).catch(function (err) {
                    console.log("err:" + JSON.stringify(err))
                })

            }


        }
    }
    $scope.Query3 = function (params) {
        var filter = $scope.queryFilter
        var count = params.parameters().count
        var page = params.parameters().page
        console.log("count:" + count)
        console.log("page:" + page)
        return UsersService.GetUsers(page, count, filter).then(function (data) {
            var ret = data
            params.total(ret.total)
            console.log("all page count:" + ret.total)
            console.log("recv count:" + ret.datasets.length)
            $scope.pagesCustomCount = Math.ceil($scope.tableParamsCustom.total() / $scope.tableParamsCustom.parameters().count)
            return ret.datasets
        }).catch(function (err) {
            console.log("err:" + JSON.stringify(err))
        })
    }
    $scope.tableParamsCustom = new NgTableParams(
        { count: 5 },
        {
            counts: [5, 10, 15, 30, 50],
            getData: $scope.Query3
            /*          getData: function (params) {
                            return $scope.simpleList
                        }
            */
        }
    );

    $scope.pagesCustomCount = Math.ceil($scope.tableParamsCustom.total() / $scope.tableParamsCustom.parameters().count)


    $scope.QueryMessage = function () {
        try {

            $scope.tableParamsCustom.reload()
        } catch (e) {
            console.log("[Error] $scope.tableParamsDate.reload()");
        }
    };

}
