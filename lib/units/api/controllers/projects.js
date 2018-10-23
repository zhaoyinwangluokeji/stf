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
    getProjects: getProjects
  }

function getProjects(req, res) {
    var requirement = req.query.requirement ? req.query.requirement:"";
    if(requirement && requirement.indexOf(":") != -1){
        var cond_pre = requirement.substr(0,requirement.indexOf(":")).trim().toLowerCase();
        var condition= requirement.substr(requirement.indexOf(":")+1).trim();
        if(cond_pre.indexOf("id") != -1){
            dbapi.loadProjectsByProjectId(condition)
                .then(function(cursor) {
                  //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                    .then(function(list) {
                            var datas = []
                            var i=0;
                            list.forEach(function(token) {
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
            .catch(function(err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                    success: false
                    })
            })
        }
        else if(cond_pre.indexOf("user") != -1){
            dbapi.loadProjectsByUser(condition)
                .then(function(cursor) {
                  //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                    .then(function(list) {
                            var datas = []
                            var i=0;
                            list.forEach(function(token) {
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
            .catch(function(err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                    success: false
                    })
            })
        }
        else if(cond_pre.indexOf("name") != -1){
            bapi.loadProjectsByProjectName(condition)
                .then(function(cursor) {
                  //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                    .then(function(list) {
                            var datas = []
                            var i=0;
                            list.forEach(function(token) {
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
            .catch(function(err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                    success: false
                    })
            })
        }
        else if(cond_pre.indexOf("code") != -1){
            bapi.loadProjectsByProjectCode(condition)
                .then(function(cursor) {
                  //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                    .then(function(list) {
                            var datas = []
                            var i=0;
                            list.forEach(function(token) {
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
            .catch(function(err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                    success: false
                    })
            })
        }
        else if(cond_pre.indexOf("st") != -1){
            bapi.loadProjectsByST(condition)
                .then(function(cursor) {
                 //   console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                    .then(function(list) {
                            var datas = []
                            var i=0;
                            list.forEach(function(token) {
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
            .catch(function(err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                    success: false
                    })
            })
        }
        else if(cond_pre.indexOf("uat") != -1){
            bapi.loadProjectsByUAT(condition)
                .then(function(cursor) {
                  //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                    .then(function(list) {
                            var datas = []
                            var i=0;
                            list.forEach(function(token) {
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
            .catch(function(err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                    success: false
                    })
            })
        }
        else{
            dbapi.loadProjectsByProjectName(condition)
                .then(function(cursor) {
                  //  console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                    .then(function(list) {
                            var datas = []
                            var i=0;
                            list.forEach(function(token) {
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
            .catch(function(err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                    success: false
                    })
            })

        }
       

    }
    else {

        if(requirement && requirement.indexOf("T")==0) {
            dbapi.loadProjectsByProjectCode(requirement)
                .then(function(cursor) {
                 //   console.log(cursor)
                    return Promise.promisify(cursor.toArray, cursor)()
                    .then(function(list) {
                            var datas = []
                            var i=0;
                            list.forEach(function(token) {
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
            .catch(function(err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                    success: false
                    })
            })
        }
        else{
            dbapi.loadProjectsByProjectName(requirement)
            .then(function(cursor) {
              //  console.log(cursor)
                return Promise.promisify(cursor.toArray, cursor)()
                .then(function(list) {
                        var datas = []
                        var i=0;
                        list.forEach(function(token) {
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
            .catch(function(err) {
                    log.error('Failed to loadProjectsByProjectName: ', err.stack)
                    res.status(500).json({
                    success: false
                    })
            })
        }  
    }
    
  }
  