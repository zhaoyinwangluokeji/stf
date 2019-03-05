var oboe = require('oboe')
/*
module.exports = function usersController($scope, NgTableParams, UsersService, UsersGroupService, AppState) {

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
    $scope.CurGroup
    $scope.RowClick = function (row) {
        //    row.checked = true
        $scope.CurRow = row
    }
    $scope.SelectGroup = function (row) {
        $scope.CurGroup = row
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


    $scope.Query2 = function (params) {
        var filter = $scope.filterGroup
        var count = params.parameters().count
        var page = params.parameters().page
        console.log("count:" + count)
        console.log("page:" + page)
        return UsersGroupService.GetGroups(page, count, filter).then(function (data) {
            var ret = data
            params.total(ret.total)
            console.log("all page count:" + ret.total)
            console.log("recv count:" + ret.datasets.length)
            $scope.pagesGroupCount = Math.ceil($scope.tableParamsGroup.total() / $scope.tableParamsGroup.parameters().count)
            return ret.datasets
        }).catch(function (err) {
            console.log("err:" + JSON.stringify(err))
        })
    }
    $scope.tableParamsGroup = new NgTableParams(
        { count: 5 },
        {
            counts: [5, 10, 15, 30, 50],
            getData: $scope.Query2
        }
    );
    $scope.pagesGroupCount = Math.ceil($scope.tableParamsGroup.total() / $scope.tableParamsGroup.parameters().count)

    $scope.AddNewGroup = function () {
        var group = prompt("输入新的用户组", ""); //将输入的内容赋给变量 name ，   
        if (group) {
            return UsersGroupService.NewGroups(group).then(function (data) {
                alert(JSON.stringify(data))
                $scope.QueryGroup()
            }).catch(function (err) {
                console.log("err:" + JSON.stringify(err))
            })
        }
    }

    $scope.filterGroup = ""
    $scope.QueryGroup = function () {
        try {
            $scope.tableParamsGroup.reload()
        } catch (e) {
            console.log("[Error] $scope.tableParamsDate.reload()");
        }
    };

    $scope.ModifyGroup = function () {
        var group = prompt("修改为新的用户组", ""); //将输入的内容赋给变量 name ，   
        if (group) {
            return UsersGroupService.ModifyGroup($scope.CurGroup.GroupName, group).then(function (data) {
                alert(JSON.stringify(data))
                $scope.QueryGroup()
            }).catch(function (err) {
                console.log("err:" + JSON.stringify(err))
            })
        }
    }
    $scope.DeleteGroup = function () {

        if ($scope.CurGroup) {
            return UsersGroupService.DeleteGroup($scope.CurGroup.GroupName, group).then(function (data) {
                alert(JSON.stringify(data))
                $scope.QueryGroup()
            }).catch(function (err) {
                console.log("err:" + JSON.stringify(err))
            })
        } else {
            alert("fail:当前用户组为空，请选择用户组！")
        }
    }


}
*/