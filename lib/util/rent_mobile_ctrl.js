var dbapi = require('../db/api')


calctimer = function (device) {
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

exec_write_config = function (dev) {
  dev.device_rent_conf.now = Date.now()
  dev.device_rent_conf.rent = false

  return  dbapi.setDeviceOwner(dev.serial, null).then(function () {
    dbapi.setDeviceRentConf(dev.serial, dev.device_rent_conf)
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
        var curtime = datenow.Format("yyyy-MM-dd HH:mm:ss");
        console.log("curtime:" + curtime+",real_rent_time:"+t2);
        var logconf = {
          serial: device.serial,
          rentId: rentId,
          manufacturer: device.manufacturer,
          model: device.model,
          platform: device.platform,
          version: device.version,
          CurrentTime: curtime,
          test_centerCode: device.productNo ? device.productNo : "---",
          mac_address: "---",
          device_type: '---',
          rent_time: device.device_rent_conf.rent_time,
          start_time: device.device_rent_conf.start_time,
          real_rent_time: t2,
          owner_email: device.device_rent_conf.owner.email,
          owner_name: device.device_rent_conf.owner.name + '\\' + device.device_rent_conf.owner.NameCN,
          owner_group: device.device_rent_conf.owner.group,
          ProjectCode: device.device_rent_conf.project.ProjectCode,
          ProjectName: device.device_rent_conf.project.ProjectName

        };
        return dbapi.saveDeviceUsingLog(rentId, logconf)
      })

  })
}

stop = function (device) {
  return dbapi.loadDevice(device.serial).then(
    function (dev) {
      device = dev;
      return exec_write_config(device)
    }

  )
}

exports.stop = stop
