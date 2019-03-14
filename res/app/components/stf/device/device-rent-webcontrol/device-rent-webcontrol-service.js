module.exports = function DeviceRentWebControlService($filter,
    DeviceRentService, GroupService, socket) {
    var DeviceRentWebControl = {}
    var device_list = {}
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
    DeviceRentWebControl.open = function (device, changeEvent, getEvent) {
        device_list[device.serial] = device
        //    device_list[device.serial] = device
    //    console.log("device.serial==" + device.serial)
    //    console.log("open==" + (device_list[device.serial] == device))
    //    console.log("===" + (device_list[device.serial] === device))
        if (!Timer) {
            console.log("create timer")
            Timer = setInterval(function () {
                for (serial in device_list) {
                    try {

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

                          //  console.log("now:" + now)
                          //  console.log("start+time:" + (start_time + time * 60))

                            if (now >= (start_time + time * 60)) {
                                    console.log("-->kick:"+serial+","+device_list[serial].serial)
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
