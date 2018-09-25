var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var dbapi = require('../../../db/api')
var wirerouter = require('../../../wire/router')

module.exports = syrup.serial()
  .dependency(require('./service'))
  .dependency(require('./solo'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/sub'))
  .dependency(require('./group'))
  .define(function(options, service, solo,router, push,sub,group) {
    var rent_control={}
    var Timer =null;
    var log = logger.createLogger('device:plugins:rent-control.js')
    console.log(options.serial +' CreteTimer');
    var serial = options.serial;
    var device;
    var now;
    rent_control.start = function(options){
        dbapi.loadDevice(options.serial).then(
            function(para){
                device = para;
                var timerIndex = 0;
                sub.on('message', wirerouter()
                .on(wire.DeviceRentMessage, function(channel, message) {
                dbapi.loadDevice(message.serial).then(
                    function(para){
                        device = para;})
                })
                .handler())
                if(!Timer){
                    Timer = setInterval(function(){
                        timerIndex++;
                        if(timerIndex%60 == 0){
                            dbapi.loadDevice(serial).then(
                                function(dev){
                                    device = dev;
                                    if(calctimer(device)){
                                        exec_write_config(device)
                                    } 
                                }  
                            )
                        }
                        else{
                            if(calctimer(device)){
                                dbapi.loadDevice(serial).then(
                                    function(dev){
                                        device = dev;
                                        if(calctimer(device)){
                                            exec_write_config(device)
                                        } 
                                    })
                            }     
                        }
                        if(timerIndex%5 == 0){
                            try{
                                console.log(timerIndex%60 +' timer1-1 :'+JSON.stringify(device.deivce_rent_conf));
                                console.log('timer1-2 :'+device.deivce_rent_conf.rent);
                                if(device.deivce_rent_conf.rent){
                                    var nw = Date.now()/1000;
                                    var target = device.deivce_rent_conf.start_time/1000 + device.deivce_rent_conf.rent_time * 60 ;
                                    var rem_time = target - nw;

                                    console.log('timer1-3 :'+device.deivce_rent_conf.rent_time);
                                    console.log('remainder  :'+Math.floor(rem_time/3600) +'/'+Math.floor((rem_time%(60*60))/60)+'/'+Math.floor(rem_time%60) );   
                                }
                            }
                            catch(e){
        
                            } 
                        }
                    },1000);
                }
                
            }
        ).catch(function(err) {
            log.fatal('rent-control had an error:', err.stack)
        // process.exit(1)
        })
    }
    function calctimer(device){
        if(device && 
            device.deivce_rent_conf && 
            device.deivce_rent_conf.rent && 
            device.deivce_rent_conf.rent_time && 
            device.deivce_rent_conf.start_time){
                now = Date.now();
                target_time = device.deivce_rent_conf.start_time + device.deivce_rent_conf.rent_time * 60 * 1000;
                if(now>target_time){
                    device.deivce_rent_conf.now     = Date.now()
                    device.deivce_rent_conf.rent    = false
                    return true
                }
                else{
                    return false
                }
        }
        return false
    }
    function exec_write_config(device){
        device.deivce_rent_conf.now   = Date.now()
        device.deivce_rent_conf.rent  = false
        dbapi.setDeviceRentConf(options.serial, device.deivce_rent_conf)
            .then(function() {
                console.log(options.serial +' send DeviceRentMessage ');
                push.send([
                    wireutil.global
                , wireutil.envelope(new wire.DeviceRentMessage(
                    options.serial,
                    false,
                    Date.now(),
                    Date.now()
                    ))
                ])
                try {
                    if(group.currentGroup)  {
                        group.leave('device-rent-overtime');   
                    }
                }
                catch(e) {
                    console.log("device-rent-overtime error:"+e);
                }  
            })
            .then(function(){
                console.log("ClearTimer");
            })         
    }

    rent_control.stop = function(device){
        dbapi.loadDevice(device.serial).then(
            function(dev){
                device = dev;
                exec_write_config(device)
            }
            
        )
    } 
    rent_control.start(options);
    return rent_control;
    
  })
