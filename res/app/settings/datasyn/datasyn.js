var oboe = require('oboe')
module.exports = function DataSynController($scope, $http, ProjectSynService, UsersSynService, AppState) {

    $scope.synenable = true

    $scope.vm = {
        value: 0,
        style: 'progress-bar-info',
        showLabel: true,
        striped: true
    }

    $scope.vm1 = {
        value: 0,
        style: 'progress-bar-info',
        showLabel: false,
        striped: true
    }

    $scope.synProjects = function () {
        $scope.synenable = false
        var total = 0
        ProjectSynService.ProjectSyn().then(
            function (ret) {
                if (ret.success == true) {
                    var timeout_ms = 2000; // 2 seconds
                    var stepindex = 0
                    var interval = setInterval(function () {
                        console.log("timed step: " + stepindex++);
                        var user = AppState.user.name
                        if (stepindex > (30 * 10)) {
                            console.log("Time out of 10 minute!")
                            clearInterval(interval);
                        }
                        var data = {
                            user: user,
                            name: "ProjectSynBar"
                        }
                        $http.post('/auth/api/v1/mock/GetProgressBar', data)
                            .success(function (response) {
                                if (response.success == true) {
                                    if (response.data) {
                                        $scope.vm.value = (response.data.curIndex / response.data.total) * 100;
                                        if (response.data.curIndex >= response.data.total) {
                                            alert("同步数据成功")
                                            clearInterval(interval);
                                        }
                                    }
                                } else {
                                    console.log("fail")
                                    alert("同步数据fail:" + JSON.stringify(response.data.error))
                                    clearInterval(interval);
                                }
                            })
                            .error(function (err) {
                                console.log("error")
                                alert("同步数据error:" + JSON.stringify(err))
                                clearInterval(interval);
                            })

                    }, timeout_ms);

                } else {
                    alert("同步失败：" + JSON.stringify(ret.info))
                }
            }
        )

    }

    $scope.synUsers = function () {
        $scope.synenable = false
        var total = 0
        $scope.vm1.showLabel = true
        UsersSynService.UsersSyn().then(
            function (ret) {
                console.log("UsersSyn result:" + JSON.stringify(ret));
                if (ret.success == true) {
                    var timeout_ms = 2000; // 2 seconds
                    var stepindex = 0
                    var interval = setInterval(function () {
                        console.log("timed step: " + stepindex++);
                        var user = AppState.user.name
                        if (stepindex > (30 * 10)) {
                            console.log("Time out of 10 minute!")
                            clearInterval(interval);
                        }
                        var data = {
                            user: user,
                            name: "UsersSynBar"
                        }
                        $http.post('/auth/api/v1/mock/GetProgressBar', data)
                            .success(function (response) {
                                if (response.success == true) {
                                    //    console.log("success:" + JSON.stringify(response.data))
                                    if (response.data) {
                                        $scope.vm1.value = (response.data.curIndex / response.data.total) * 100;
                                        if (response.data.curIndex >= response.data.total) {
                                            alert("同步数据成功")
                                            clearInterval(interval);
                                        }
                                    }
                                } else {
                                    console.log("fail")
                                    alert("同步数据fail:" + JSON.stringify(response.data.error))
                                    clearInterval(interval);
                                }
                            })
                            .error(function (err) {
                                console.log("error")
                                alert("同步数据error:" + JSON.stringify(err))
                                clearInterval(interval);
                            })
                    }, timeout_ms);


                } else {
                    alert("同步失败：" + JSON.stringify(ret.info))
                }
            }
        )

    }

}
