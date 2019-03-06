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

        dbapi.loadProjectsByProject(requirement)
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
    dbapi.updateProcessBar(user, ProcessBarName, {
        user: user,
        name: ProcessBarName,
        total: 100,
        curIndex: 0,
        restart: true,
        fail: false
    })
    soap.createClientAsync(url, { timeout: 5000 }).then((client) => {
        console.log('create linked ');
        return dbapi.updateProcessBar(user, ProcessBarName, {
            user: user,
            name: ProcessBarName,
            total: 100,
            curIndex: 5,
            restart: false,
            fail: false
        }).then(function () {
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
                    //    console.log('result:');
                    //    console.log(CircularJSON.stringify(result));
                    res.json({
                        success: true
                        , total: 100
                    })
                    var ProjectCodes = []
                    result.GetProjectListResult.ProjectInfo.forEach(element => {
                        ProjectCodes.push(element.ProjectCode)
                    });

                    dbapi.deleteExistsProjects(ProjectCodes).then(function () {
                        dbapi.updateProcessBar(user, ProcessBarName, {
                            user: user,
                            name: ProcessBarName,
                            total: 100,
                            curIndex: 10,
                            fail: false
                        }
                        ).then(
                            function () {
                                var AllPromises = []
                                var length = result.GetProjectListResult.ProjectInfo.length
                                var stepone = Math.ceil(length / 90)
                                console.log("length:" + length)
                                console.log("stepone:" + stepone)
                                result.GetProjectListResult.ProjectInfo.map((element, index, array) => {
                                    AllPromises.push(dbapi.updateProjectsByProjectCode(element.ProjectCode, element).then(
                                        function () {
                                            if ((index % stepone) == 0) {
                                                console.log('update projects step1 rate: ' + (10 + (index / stepone)));
                                                return dbapi.updateProcessBar(user, ProcessBarName,
                                                    {
                                                        user: user,
                                                        name: ProcessBarName,
                                                        total: 100,
                                                        curIndex: (10 + (index / stepone))
                                                    }
                                                ).then(function () {
                                                    if ((index % stepone) == 0) {
                                                        console.log('update projects step2 rate: ' + (10 + (index / stepone)));
                                                    }
                                                })
                                            }
                                        }
                                    )
                                    )
                                })
                                Promise.all(AllPromises).then(function (result) {
                                    console.log('update projects step3 End')
                                    return dbapi.updateProcessBar(user, ProcessBarName, {
                                        user: user,
                                        name: ProcessBarName,
                                        total: 100,
                                        curIndex: 100
                                    }).then(function () {
                                        console.log('update projects step4  rate > End')
                                    })
                                })
                            }
                        )
                    })

                }
            })
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

