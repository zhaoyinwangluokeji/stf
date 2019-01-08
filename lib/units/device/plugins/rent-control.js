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
    .define(function (options, service, solo, router, push, sub, group) {
        var rent_control = {}
        var Timer = null;
        var log = logger.createLogger('device:plugins:rent-control.js')
        console.log(options.serial + ' CreteTimer');
        var serial = options.serial;
        var device;
        var now;
        rent_control.start = function (options) {
            dbapi.loadDevice(options.serial).then(
                function (para) {
                    device = para;
                    var timerIndex = 0;
                    sub.on('message', wirerouter()
                        .on(wire.DeviceRentMessage, function (channel, message) {
                            dbapi.loadDevice(message.serial).then(
                                function (para) {
                                    device = para;
                                })
                        })
                        .handler())
                    if (!Timer) {
                        Timer = setInterval(function () {
                            timerIndex++;
                            if (timerIndex % 60 == 0) {
                                dbapi.loadDevice(serial).then(
                                    function (dev) {
                                        device = dev;
                                        if (calctimer(device)) {
                                            exec_write_config(device)
                                        }
                                    }
                                )
                            }
                            else {
                                if (calctimer(device)) {
                                    dbapi.loadDevice(serial).then(
                                        function (dev) {
                                            device = dev;
                                            if (calctimer(device)) {
                                                exec_write_config(device)
                                            }
                                        })
                                }
                            }
                            if (timerIndex % 5 == 0) {
                                try {
                                    //  console.log(timerIndex%60 +' timer1-1 :'+JSON.stringify(device.device_rent_conf));
                                    //  console.log('timer1-2 :'+device.device_rent_conf.rent);
                                    if (device.device_rent_conf.rent) {
                                        var nw = Date.now() / 1000;
                                        var target = device.device_rent_conf.start_time / 1000 + device.device_rent_conf.rent_time * 60;
                                        var rem_time = target - nw;

                                        //  console.log('timer1-3 :'+device.device_rent_conf.rent_time);
                                        // console.log('remainder  :'+Math.floor(rem_time/3600) +'/'+Math.floor((rem_time%(60*60))/60)+'/'+Math.floor(rem_time%60) );   
                                    }
                                }
                                catch (e) {

                                }
                            }
                        }, 1000);
                    }

                }
            ).catch(function (err) {
                log.fatal('rent-control had an error:', err.stack)
                // process.exit(1)
            })
        }
        function calctimer(device) {
            if (device &&
                device.device_rent_conf &&
                device.device_rent_conf.rent &&
                device.device_rent_conf.rent_time &&
                device.device_rent_conf.start_time) {
                now = Date.now();
                target_time = device.device_rent_conf.start_time + device.device_rent_conf.rent_time * 60 * 1000;
                if (now > target_time) {
                    device.device_rent_conf.now = Date.now()
                    device.device_rent_conf.rent = false
                    return true
                }
                else {
                    return false
                }
            }
            return false
        }
        Date.prototype.Format = function (fmt) {
            var o = {
                "M+": this.getMonth() + 1, //月份           
                "d+": this.getDate(), //日           
                "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时           
                "H+": this.getHours(), //小时           
                "m+": this.getMinutes(), //分           
                "s+": this.getSeconds(), //秒           
                "q+": Math.floor((this.getMonth() + 3) / 3), //季度           
                "S": this.getMilliseconds() //毫秒           
            };
            var week = {
                "0": "/u65e5",
                "1": "/u4e00",
                "2": "/u4e8c",
                "3": "/u4e09",
                "4": "/u56db",
                "5": "/u4e94",
                "6": "/u516d"
            };
            if (/(y+)/.test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
            }
            if (/(E+)/.test(fmt)) {
                fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
            }
            for (var k in o) {
                if (new RegExp("(" + k + ")").test(fmt)) {
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                }
            }
            return fmt;
        }
        function exec_write_config(dev) {
            dev.device_rent_conf.now = Date.now()
            dev.device_rent_conf.rent = false
            dbapi.setDeviceOwner(dev.serial, dev.device_rent_conf.owner).then(function () {
                console.log("rentowner1:"+JSON.stringify(dev.device_rent_conf.owner))
                dbapi.setDeviceRentConf(dev.serial, dev.device_rent_conf)
                    .then(function () {
                        push.send([
                            wireutil.global
                            , wireutil.envelope(new wire.DeviceRentMessage(
                                dev.serial,
                                false,
                                Date.now(),
                                Date.now()
                            ))
                        ])
                        try {
                            console.log('device-rent-overtime1')
                            console.log('device-rent-overtime send cmd start')
                            group.leave2(
                                dev.device_rent_conf.owner
                                , "rent overtime"
                            )
                            console.log('device-rent-overtime send cmd end')
                        }
                        catch (e) {
                            console.log("device-rent-overtime error:" + e);
                        }
                    })
                    .then(function () {
                        return dbapi.loadDevice(dev.serial)
                    })

                    .then(function (device) {
                        var rentId = device.device_rent_conf.rentId
                        var time = Date.now() - device.device_rent_conf.start_time;
                        console.log("start:" + device.device_rent_conf.start_time);
                        console.log("now:" + Date.now());
                        console.log("2now2:" + device.device_rent_conf.now);
                        console.log("time:" + time);
                        var t2 = Math.round((time % (1000 * 3600)) / (1000 * 60.0));
                        var datenow = new Date();
                        var curtime = datenow.Format("yyyy-MM-dd hh:mm:ss");
                        var logconf = {
                            serial: device.serial,
                            rentId: rentId,
                            manufacturer: device.manufacturer,
                            model: device.model,
                            platform: device.platform,
                            version: device.version,
                            CurrentTime: curtime,
                            test_centerCode: "---",
                            mac_address: "---",
                            device_type: '---',
                            rent_time: device.device_rent_conf.rent_time,
                            start_time: device.device_rent_conf.start_time,
                            real_rent_time: t2,
                            owner_email: device.device_rent_conf.owner.email,
                            owner_name: device.device_rent_conf.owner.name,
                            owner_group: device.device_rent_conf.owner.group,
                            ProjectCode: device.device_rent_conf.project.ProjectCode,
                            ProjectName: device.device_rent_conf.project.ProjectName

                        };
                        return dbapi.saveDeviceUsingLog(rentId, logconf)
                    })
                    .then(function () {
                        console.log("ClearTimer");
                    })
            })
        }


        rent_control.stop = function (device) {
            dbapi.loadDevice(device.serial).then(
                function (dev) {
                    device = dev;
                    exec_write_config(device)
                }

            )
        }
        rent_control.start(options);
        return rent_control;

    })
