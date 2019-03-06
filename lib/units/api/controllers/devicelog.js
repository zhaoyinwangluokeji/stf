var util = require('util')

var _ = require('lodash')
var Promise = require('bluebird')
var uuid = require('uuid')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')
var deviceutil = require('../../../util/deviceutil')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var wirerouter = require('../../../wire/router')

var log = logger.createLogger('api:controllers:user')

module.exports = {
    getLogs: getLogs,
    getStatisticsPerGroup: getStatisticsPerGroup,
    getStatisticsPerDate: getStatisticsPerDate,
    getStatisticsPerCustom: getStatisticsPerCustom
}

Date.prototype.format = function (formatStr) {
    var str = formatStr;
    var Week = ['日', '一', '二', '三', '四', '五', '六'];
    str = str.replace(/yyyy|YYYY/, this.getFullYear());
    str = str.replace(/MM/, (this.getMonth() + 1) > 9 ? (this.getMonth() + 1).toString() : '0' + (this.getMonth() + 1));
    str = str.replace(/dd|DD/, this.getDate() > 9 ? this.getDate().toString() : '0' + this.getDate());
    return str;
}

function getLogs(req, res) {
    var startdate = req.query.startdate ? req.query.startdate : "1970-01-01";
    var enddate = req.query.enddate ? (req.query.enddate + " 23:59:59") : new Date().format("yyyy-MM-dd") + " 23:59:59";
    var page = req.query.page ? req.query.page : 1;
    var count = req.query.count ? req.query.count : 30;
    var field = req.query.field ? req.query.field : "";
    var filter = req.query.filter ? req.query.filter : "";

    console.log("getLogs page:" + page + ",count:" + count)

    if (field == "" && filter == "") {


        return dbapi.getLogsCount(startdate)
            .then(function (ret) {
                console.log("Recv ret:" + JSON.stringify(ret));
                var countall = ret

                return dbapi.getLogs(startdate, page, count)
                    .then(function (cursor) {
                        return Promise.promisify(cursor.toArray, cursor)()
                            .then(function (list) {
                                var datas = []
                                var i = 0;
                                list.forEach(function (token) {
                                    var item = {}
                                    item.index = i;
                                    for (var itname in token) {
                                        item[itname] = token[itname]

                                    }
                                    // token.index = i++;
                                    datas.push(item)
                                })
                                console.log("Recv Logs Cnt:" + datas.length);
                                res.json({
                                    success: true
                                    , data: {
                                        total: countall,
                                        data: datas
                                    }
                                })
                            })
                    })
                    .catch(function (err) {
                        log.error('Failed to getLogs: ', err.stack)
                        res.status(500).json({
                            success: false
                        })
                    })
            })
    } else {
        return dbapi.getLogsCount(startdate)
            .then(function (ret) {
                console.log("Recv ret:" + JSON.stringify(ret));
                var countall = ret
                return dbapi.getLogsFilter(startdate, field, filter)
                    .then(function (cursor) {
                        return Promise.promisify(cursor.toArray, cursor)()
                            .then(function (list) {
                                var datas = []
                                var i = 0;
                                list.forEach(function (token) {
                                    var item = {}
                                    item.index = i;
                                    for (var itname in token) {
                                        item[itname] = token[itname]
                                    }
                                    datas.push(item)
                                })
                                console.log("Recv getLogsFilter Cnt:" + datas.length);
                                res.json({
                                    success: true
                                    , data: {
                                        total: countall,
                                        data: datas
                                    }
                                })
                            })
                    })
            })
            .catch(function (err) {
                log.error('Failed to getLogsFilter: ', err.stack)
                res.status(500).json({
                    success: false
                })
            })
    }
}



function getStatisticsPerGroup(req, res) {
    var startdate = req.query.startdate ? req.query.startdate : "1970-01-01";
    var enddate = req.query.enddate ? (req.query.enddate + " 23:59:59") : new Date().format("yyyy-MM-dd") + " 23:59:59";
    var group = req.query.group ? req.query.group : "ProjectName";
    var page = req.query.page ? req.query.page : 1;
    var count = req.query.count ? req.query.count : 30;

    console.log("start:" + startdate)
    console.log("end:" + enddate)

    return dbapi.getStatticsCounts(startdate, enddate, group)
        .then(function (ret) {
            console.log("Recv ret:" + JSON.stringify(ret));
            var countall = ret
            return dbapi.getStatticsPer(startdate, enddate, group, page, count)
                .then(function (cursor) {
                    return Promise.promisify(cursor.toArray, cursor)()
                        .then(function (list) {
                            var datas = []
                            var i = (page - 1) * count + 1;
                            list.forEach(function (token) {
                                var item = {};
                                item.index = i++;
                                item["pergroup"] = token["pergroup"]
                                for (var itname in token) {
                                    if (itname != "pergroup") {
                                        item[itname] = token[itname]
                                    }
                                }
                                datas.push(item)
                            })
                            /*
                                                        list.forEach(function (token) {
                                                            token.index = i++;
                                                            datas.push(token)
                                                        })*/
                            console.log("Recv Data Cnt:" + datas.length);
                            res.json({
                                success: true
                                , data: {
                                    total: countall,
                                    data: datas
                                }

                            })
                        })
                })
                .catch(function (err) {
                    log.error('Failed to getStatisticsPerGroup: ', err.stack)
                    res.status(500).json({
                        success: false
                    })
                })
        }).catch(function (err) {
            log.error('Failed to getStatisticsPer: ', err.stack)
            res.status(500).json({
                success: false
            })
        })

}



function getStatisticsPerDate(req, res) {
    var startdate = req.query.startdate ? req.query.startdate : "1970-01-01";
    var enddate = req.query.enddate ? (req.query.enddate + " 23:59:59") : new Date().format("yyyy-MM-dd") + " 23:59:59";
    var group = req.query.group ? req.query.group : "CurrentTime";
    var page = req.query.page ? req.query.page : 1;
    var count = req.query.count ? req.query.count : 30;
    var order_by = req.query.order_by ? req.query.order_by : "groupby";
    var asc_desc = req.query.asc_desc ? req.query.asc_desc : "asc";
    console.log("start:" + startdate)
    console.log("end:" + enddate)

    return dbapi.getStatticsAllCountsPerDate(startdate, enddate, group)
        .then(function (ret) {
            console.log("Recv ret:" + JSON.stringify(ret));
            var countall = ret
            return dbapi.getStatticsPerDate(startdate, enddate, group, page, count, order_by, asc_desc)
                .then(function (cursor) {
                    return Promise.promisify(cursor.toArray, cursor)()
                        .then(function (list) {
                            var datas = []
                            var i = (page - 1) * count + 1;
                            /*  list.forEach(function (token) {
                                  token.index = i++;
                                  datas.push(token)
                              })*/
                            list.forEach(function (token) {
                                var item = {};
                                item.index = i++;
                                item["pergroup"] = token["pergroup"]
                                for (var itname in token) {
                                    if (itname != "pergroup") {
                                        item[itname] = token[itname]
                                    }
                                }
                                datas.push(item)
                            })
                            console.log("Recv Data Cnt:" + datas.length);
                            res.json({
                                success: true
                                , data: {
                                    total: countall,
                                    data: datas
                                }

                            })
                        })
                })
                .catch(function (err) {
                    log.error('[Error]Failed to getStatisticsPerDate: ', err.stack)
                    res.status(500).json({
                        success: false
                    })
                })
        }).catch(function (err) {
            log.error('[Error]Failed to getStatisticsPerDate: ', err.stack)
            res.status(500).json({
                success: false
            })
        })

}


function getStatisticsPerCustom(req, res) {
    var startdate = req.query.startdate ? req.query.startdate : "1970-01-01";
    var enddate = req.query.enddate ? (req.query.enddate + " 23:59:59") : new Date().format("yyyy-MM-dd") + " 23:59:59";
    var group = req.query.group ? req.query.group : "CurrentTime";
    var page = req.query.page ? req.query.page : 1;
    var count = req.query.count ? req.query.count : 30;
    var order_by = req.query.order_by ? req.query.order_by : "groupby";
    var asc_desc = req.query.asc_desc ? req.query.asc_desc : "asc";
    console.log("start:" + startdate)
    console.log("end:" + enddate)
    var arrays = group.split('|')
    var group_by = "";
    var btime = false

    arrays.forEach(value => {
        if (value == "CurrentTime" && btime == false) {
            group_by += ("r.CurrentTime.split(' ')[0]" + ",")
            btime = true
        }
        else if (value == "CurrentTime Month" && btime == false) {
            btime = true
            group_by += ("r.CurrentTime.substr(0,7)" + ",")
        }
        else if (value == "CurrentTime Year" && btime == false) {
            btime = true
            group_by += ("r.CurrentTime.substr(0,4)" + ",")
        }
        else if (value == "rentId" || value == "start_time") {

        } else {
            group_by += ("r." + value + ",")
        }

        console.log(group_by)
    })
    if (group_by.indexOf(",") !== -1) {
        group_by = group_by.substr(0, group_by.length - 1)
    }
    console.log("group_by:" + group_by)
    var isArray = Array.isArray || function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    return dbapi.getStatticsCountPerCustom(startdate, enddate, group_by)
        .then(function (ret) {
            console.log("Recv ret:" + JSON.stringify(ret));
            var countall = ret
            return dbapi.getStatticsPerCustom(startdate, enddate, group_by, page, count, order_by, asc_desc)
                .then(function (cursor) {
                    return Promise.promisify(cursor.toArray, cursor)()
                        .then(function (list) {
                            var datas = []
                            var i = (page - 1) * count + 1;
                            list.forEach(function (token) {
                                var item = {};
                                item.index = i++;
                                item["pergroup"] = token["pergroup"]
                                for (var itname in token) {
                                    if (itname != "pergroup") {
                                        if (isArray(token[itname])) {
                                            var per = []
                                            token[itname].forEach(ele => {
                                                if (typeof (ele) == "object") {
                                                    var kname = ""
                                                    var vname = ""
                                                    for (var n in ele) {
                                                        if (n == "count") {
                                                            vname = n
                                                        } else {
                                                            kname = n
                                                        }
                                                    }
                                                    var iv = {};
                                                    iv[ele[kname]] = ele[vname]
                                                    per.push(iv)
                                                } else {
                                                    per.push(ele)
                                                }
                                            })
                                            item[itname] = per
                                        } else {
                                            item[itname] = token[itname]
                                        }
                                    }
                                }
                                datas.push(item)
                            })
                            console.log("Recv Data Cnt:" + datas.length);
                            res.json({
                                success: true
                                , data: {
                                    total: countall,
                                    data: datas
                                }
                            })
                        })
                })
                .catch(function (err) {
                    log.error('[Error]Failed to getStatisticsPerDate: ', err.stack)
                    res.status(500).json({
                        success: false
                    })
                })
        }).catch(function (err) {
            log.error('[Error]Failed to getStatisticsPerDate: ', err.stack)
            res.status(500).json({
                success: false
            })
        })

}