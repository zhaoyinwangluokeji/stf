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
var soap = require('soap');

var CircularJSON = require('circular-json');

module.exports = {
    getProjects: getProjects,
    updateProjects: updateProjects,
    getProjectSynBar: getProjectSynBar
}

function getProjects(req, res) {
    var requirement = req.query.requirement ? req.query.requirement : "";
    if (requirement && requirement.indexOf(":") != -1) {
        var cond_pre = requirement.substr(0, requirement.indexOf(":")).trim().toLowerCase();
        var condition = requirement.substr(requirement.indexOf(":") + 1).trim();
        if (cond_pre.indexOf("id") != -1) {
            dbapi.loadProjectsByProjectId(condition)
                .then(function (cursor) {
                    //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                        .then(function (list) {
                            var datas = []
                            var i = 0;
                            list.forEach(function (token) {
                                token.index = i++;
                                datas.push(token)
                            })
                            //  console.log(JSON.stringify(datas))
                            res.json({
                                success: true
                                , data: datas
                            })
                        })
                })
                .catch(function (err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                        success: false
                    })
                })
        }
        else if (cond_pre.indexOf("user") != -1) {
            dbapi.loadProjectsByUser(condition)
                .then(function (cursor) {
                    //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                        .then(function (list) {
                            var datas = []
                            var i = 0;
                            list.forEach(function (token) {
                                token.index = i++;
                                datas.push(token)
                            })
                            //  console.log(JSON.stringify(datas))
                            res.json({
                                success: true
                                , data: datas
                            })
                        })
                })
                .catch(function (err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                        success: false
                    })
                })
        }
        else if (cond_pre.indexOf("name") != -1) {
            bapi.loadProjectsByProjectName(condition)
                .then(function (cursor) {
                    //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                        .then(function (list) {
                            var datas = []
                            var i = 0;
                            list.forEach(function (token) {
                                token.index = i++;
                                datas.push(token)
                            })
                            //   console.log(JSON.stringify(datas))
                            res.json({
                                success: true
                                , data: datas
                            })
                        })
                })
                .catch(function (err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                        success: false
                    })
                })
        }
        else if (cond_pre.indexOf("code") != -1) {
            bapi.loadProjectsByProjectCode(condition)
                .then(function (cursor) {
                    //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                        .then(function (list) {
                            var datas = []
                            var i = 0;
                            list.forEach(function (token) {
                                token.index = i++;
                                datas.push(token)
                            })
                            //   console.log(JSON.stringify(datas))
                            res.json({
                                success: true
                                , data: datas
                            })
                        })
                })
                .catch(function (err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                        success: false
                    })
                })
        }
        else if (cond_pre.indexOf("st") != -1) {
            bapi.loadProjectsByST(condition)
                .then(function (cursor) {
                    //   console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                        .then(function (list) {
                            var datas = []
                            var i = 0;
                            list.forEach(function (token) {
                                token.index = i++;
                                datas.push(token)
                            })
                            //   console.log(JSON.stringify(datas))
                            res.json({
                                success: true
                                , data: datas
                            })
                        })
                })
                .catch(function (err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                        success: false
                    })
                })
        }
        else if (cond_pre.indexOf("uat") != -1) {
            bapi.loadProjectsByUAT(condition)
                .then(function (cursor) {
                    //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                        .then(function (list) {
                            var datas = []
                            var i = 0;
                            list.forEach(function (token) {
                                token.index = i++;
                                datas.push(token)
                            })
                            //   console.log(JSON.stringify(datas))
                            res.json({
                                success: true
                                , data: datas
                            })
                        })
                })
                .catch(function (err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                        success: false
                    })
                })
        }
        else {
            dbapi.loadProjectsByProjectName(condition)
                .then(function (cursor) {
                    //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                        .then(function (list) {
                            var datas = []
                            var i = 0;
                            list.forEach(function (token) {
                                token.index = i++;
                                datas.push(token)
                            })
                            //   console.log(JSON.stringify(datas))
                            res.json({
                                success: true
                                , data: datas
                            })
                        })
                })
                .catch(function (err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                        success: false
                    })
                })

        }


    }
    else {

        if (requirement && requirement.indexOf("T") == 0) {
            dbapi.loadProjectsByProjectCode(requirement)
                .then(function (cursor) {
                    //   console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                        .then(function (list) {
                            var datas = []
                            var i = 0;
                            list.forEach(function (token) {
                                token.index = i++;
                                datas.push(token)
                            })
                            //   console.log(JSON.stringify(datas))
                            res.json({
                                success: true
                                , data: datas
                            })
                        })
                })
                .catch(function (err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                        success: false
                    })
                })
        }
        else {
            dbapi.loadProjectsByProjectName(requirement)
                .then(function (cursor) {
                    //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                        .then(function (list) {
                            var datas = []
                            var i = 0;
                            list.forEach(function (token) {
                                token.index = i++;
                                datas.push(token)
                            })
                            //   console.log(JSON.stringify(datas))
                            res.json({
                                success: true
                                , data: datas
                            })
                        })
                })
                .catch(function (err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                        success: false
                    })
                })
        }
    }

}


function getProjectSynBar(req, res) {

    var user = req.query.user ? req.query.user : "";
    var ProcessBarName = "ProjectSynBar"
    console.log('getProjectSynBar');
    return dbapi.getProcessBar(user, ProcessBarName)
        .then(function (cursor) {
            //  console.log(cursor)
            return Promise.promisify(cursor.toArray, cursor)()
                .then(function (list) {
                    var datas = []
                    var i = 0;
                    list.forEach(function (token) {
                        token.index = i++;
                        datas.push(token)
                    })
                    //   console.log(JSON.stringify(datas))
                    res.json({
                        success: true
                        , data: datas
                    })
                })
        })

}

function updateProjectsArray(index, array, user, ProcessBarName) {

    if (index == array.length) {
        return;
    }
    console.log('update: ' + JSON.stringify(array[index]));
    var element = array[index]
    return dbapi.updateProjectsByProjectCode(element.ProjectCode, element).then(
        function () {
            console.log('update1: ' + index);
            return dbapi.updateProcessBar(user, ProcessBarName,
                {
                    user: user,
                    name: ProcessBarName,
                    total: array.length,
                    curIndex: index
                }
            ).then(function () {
                console.log('update Bar:' + index);
                updateProjectsArray(index + 1, array, user, ProcessBarName)
            })
        }
    )
}

function updateProjects(req, res) {

    var user = req.query.user ? req.query.user : "";
    var ProcessBarName = "ProjectSynBar"
    var url = 'http://99.1.26.7:8012/Services/WebService.asmx?wsdl';
    var args = { 'clientName': 'tm', 'clientCode': '201006', 'currMaxId': '0' };
    console.log('updateProjects get from url:' + url);
    soap.createClientAsync(url, { timeout: 5000 }).then((client) => {
        return client.GetProjectList(args, function (err, result) {
            if (err) {
                console.log('err:' + CircularJSON.stringify(err));
                res.json({
                    success: false
                    , info: err
                })
                dbapi.updateProcessBar(user, ProcessBarName, {}, true)
            }
            else {
                console.log('result:');
                console.log(CircularJSON.stringify(result));
                res.json({
                    success: true
                    , total: result.GetProjectListResult.ProjectInfo.length
                })
                dbapi.updateProcessBar(user, ProcessBarName,
                    {
                        user: user,
                        name: ProcessBarName,
                        total: result.GetProjectListResult.ProjectInfo.length,
                        curIndex: 0,
                        restart:true
                    }
                ).then(
                    function () {
                        console.log('updateProjects start ...');
                        //  updateProjectsArray(0, result.GetProjectListResult.ProjectInfo,user,ProcessBarName)
                        result.GetProjectListResult.ProjectInfo.map((element, index, array) => {
                            return dbapi.updateProjectsByProjectCode(element.ProjectCode, element).then(
                                function () {
                                    console.log('update1: ' + index);
                                    return dbapi.updateProcessBar(user, ProcessBarName,
                                        {
                                            user: user,
                                            name: ProcessBarName,
                                            total: array.length,
                                            curIndex: index
                                        }
                                    ).then(function () {
                                        console.log('update Bar:' + index);
                                        //  updateProjectsArray(index + 1, array,user,ProcessBarName)
                                    })
                                }
                            )
                        })
                    }
                )
            }
        })
    }).then((result) => {
        console.log('recv:');
    }).catch(function (err) {
        console.log('error:' + CircularJSON.stringify(err));
        dbapi.updateProcessBar(user, ProcessBarName, {}, true)
        res.json({
            success: false
            , info: err
        })
    });

}

