module.exports = function DeviceRentWebControlService($filter,
  DeviceRentService, GroupService, socket) {
  var DeviceRentWebControl = {}
  var device_list = {}
  var events_list = {}
  var Timer = null
  var scope


  DeviceRentWebControl.set = function (scop) {
    scope = scop;
    scope.$on('$destroy', function () {
      console.log("DeviceRentWebControlService destroy")
      if (Timer) {
        clearTimeout(Timer)
        Timer = null
      }
    })
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

  DeviceRentWebControl.open = function (device, event, getEvent) {
    device_list[device.serial] = device
    events_list[device.serial] = event
    //    device_list[device.serial] = device
    //    console.log("device.serial==" + device.serial)
    //    console.log("open==" + (device_list[device.serial] == device))
    //    console.log("===" + (device_list[device.serial] === device))
    if (!Timer) {
      console.log("create timer:"+device.serial)
      Timer = setInterval(function () {
        for (serial in device_list) {
          try {

            var changeEvent = events_list[serial]
            var device_o = angular.copy(device_list[serial])
            // console.log("device_o===" + (device_o === device_list[device.serial]))
            if (//device_o.present &&
              device_o.device_rent_conf &&
              device_o.device_rent_conf.rent != undefined &&
              device_o.device_rent_conf.rent == true) {
              device_o.device_rent_conf.now = device_o.device_rent_conf.now + 1000;
              var now = Math.floor(device_o.device_rent_conf.now / 1000);
              var time = device_o.device_rent_conf.rent_time;
              var start_time = Math.floor(device_o.device_rent_conf.start_time / 1000);

            //  console.log(serial + ",now:" + new Date(now * 1000).Format("yyyy/MM/dd HH:mm:ss") + ",target:"
            //    + new Date((start_time + time * 60) * 1000).Format("yyyy/MM/dd HH:mm:ss"))
              //  console.log("start+time:" + (start_time + time * 60))

              if (now >= (start_time + time * 60)) {
                console.log("-->kick:" + serial + "," + device_list[serial].serial)
                device_o.device_rent_conf.rent = false
                changeEvent(device_list[serial], device_o)
                try {
                  GroupService.kick(device_o, true)
                  DeviceRentService.free_rent(device_o, socket).then(function () {
                    //    getEvent(device_o)
                    device_o.device_rent_conf.rent = false
                  })
                } catch (e) {
                  console.log("kick err:" + e)
                }

              }
              else {
                //    console.log("-->changeEvent")
                changeEvent(device_list[serial], device_o)
              }
              //changeEvent(device_list[key], element)
            } else {
              //    console.log("device_o:" + device_o.serial) //+ "," + JSON.stringify(device_o.device_rent_conf))
            }

          }
          catch (e) {
            console.log("rent error:" + e)
          }
        }
        return
      }
        , 1000);
    }

  }



  return DeviceRentWebControl;
}
