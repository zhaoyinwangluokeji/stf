var oboe = require('oboe')
var _ = require('lodash')
module.exports = function DeviceRentLogService($filter, AppState, GroupService) {
    var DeviceRentLog = {}


    DeviceRentLog.getLogs = function (startdate, enddate, page, count, field, filter) {
        console.log("service getlog:page:" + page)
        return new Promise((resolve, reject) => {
            oboe('/api/v1/devicelog/getlogs?startdate='
                + startdate + '&enddate=' + enddate
                + '&page=' + page + '&count=' + count + '&field=' + field
                + '&filter=' + filter)
                .done(function (res) {
                    //    $scope.itemArray = [];
                    if (res.success == true) {
                        //        $scope.itemArray = res.data;
                        resolve(res.data);
                    }
                    else {
                        reject('[Error]oboe return fail');
                    }
                }) 
                .fail(function (error) {
                    console.log(error);
                    reject('[Error]oboe fail:' + error);
                });
        });

    }


    DeviceRentLog.getStatisticsPerGroup = function (startdate, enddate, group, page, count) {
        return new Promise((resolve, reject) => {
            oboe('/api/v1/devicelog/getStatisticsPerGroup?startdate='
                + startdate + '&enddate=' + enddate
                + '&group=' + group + '&page=' + page + '&count=' + count
            )
                .done(function (res) {
                    //    $scope.itemArray = [];
                    if (res.success == true) {
                        resolve(res.data);
                    }
                    else {
                        reject('[Error]oboe return fail');
                    }
                })
                .fail(function (error) {
                    console.log(error);
                    reject('[Error]oboe fail:' + error);
                });
        });

    }

    DeviceRentLog.getStatisticsPerDate = function (startdate, enddate, group, page, count) {
        return new Promise((resolve, reject) => {
            oboe('/api/v1/devicelog/getStatisticsPerDate?startdate='
                + startdate + '&enddate=' + enddate
                + '&group=' + group + '&page=' + page + '&count=' + count
            )
                .done(function (res) {
                    //    $scope.itemArray = [];
                    if (res.success == true) {
                        resolve(res.data);
                    }
                    else {
                        reject('[Error]oboe return fail');
                    }
                })
                .fail(function (error) {
                    console.log(error);
                    reject('[Error]oboe fail:' + error);
                });
        });

    }
    DeviceRentLog.getStatisticsPerCustom = function (startdate, enddate, group, page, count) {
        return new Promise((resolve, reject) => {
            oboe('/api/v1/devicelog/getStatisticsPerCustom?startdate='
                + startdate + '&enddate=' + enddate
                + '&group=' + group + '&page=' + page + '&count=' + count
            )
                .done(function (res) {
                    //    $scope.itemArray = [];
                    if (res.success == true) {
                        resolve(res.data);
                    }
                    else {
                        reject('[Error]oboe return fail');
                    }
                })
                .fail(function (error) {
                    console.log(error);
                    reject('[Error]oboe fail:' + error);
                });
        });

    }



    return DeviceRentLog;
}