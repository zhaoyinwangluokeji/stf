var logger = require('../../util/logger')
var lifecycle = require('../../util/lifecycle')
var zmqutil = require('../../util/zmqutil')
var soap=require('soap')
var dbapi = require('../../db/api')
var Promise = require('bluebird')
var log = logger.createLogger('triproxy')

module.exports = function(options) {
    log.info('synchrodata present:'+options.project_url)

  function synchroProjects() {
    var url='http://99.1.26.7:8012/Services/WebService.asmx?wsdl';
    var args={'clientName':'tm','clientCode':'201006','currMaxId':'0'};
    if(options && options.project_url){
        url = options.project_url;
    }
    if(options && options.project_args){
        args = options.project_args;
    }
    soap.createClientAsync(url).then((client) => {
        return client.GetProjectList(args,function(err,result) {
            if(err){
                console.log('err:'+err);
            }
            else {   
                //console.log('result:');
                //console.log(JSON.stringify(result));
                if(result) {
                    Promise.map(result.GetProjectListResult.ProjectInfo,function(projectinfo){
                        //console.log(projectinfo);
                       return dbapi.synchroProject(projectinfo.ProjectId,projectinfo).then(function(d){
                                  
                        }).catch(function(err) {
                            log.fatal('error synchroProject:', err.stack)
                          })
                    }).then(function(result){
                        log.info('synchrodata is end')
                    })
                }
            }});
        }).then((result) => {
            console.log('recv:');
        }).catch(function(err){
            console.log('error:');
            console.log(err);
        });
  }
  synchroProjects()
  lifecycle.observe(function() {
 
  })
}
