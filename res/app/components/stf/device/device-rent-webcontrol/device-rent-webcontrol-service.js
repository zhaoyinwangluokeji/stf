module.exports = function DeviceRentWebControlService($filter, 
    DeviceRentService, GroupService,socket) {
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
        var device_o = device_list[device.serial]
        device_list[device.serial] = device
        console.log("open==" + device_o == device)
        console.log("===" + device_o === device)
        if (!Timer) {
            Timer = setInterval(function () {
                for (key in device_list) {
                    try {
                        element = device_list[key]
                        if (element.present &&
                            element.device_rent_conf &&
                            element.device_rent_conf.rent != undefined &&
                            element.device_rent_conf.rent == true) {
                            element.device_rent_conf.now = element.device_rent_conf.now + 1000;
                            var now = Math.floor(element.device_rent_conf.now / 1000);
                            var time = element.device_rent_conf.rent_time;
                            var start_time = Math.floor(element.device_rent_conf.start_time / 1000);

                            console.log("now:" + now)
                            console.log("start+time:" + (start_time + time * 60))
                            
                            if (now >= (start_time + time * 60)) {
                                console.log("-->getEvent")
                                getEvent(element)
                                GroupService.kick(device, true).then(function(){
                                    console.log("kick end")
                                    DeviceRentService.free_rent(device,socket)    
                                }) 
                            }
                            else {
                                console.log("-->changeEvent")
                                changeEvent(device_list[key], element)
                            }   
                            //changeEvent(device_list[key], element) 
                        }  

                    }
                    catch (e) {    
                        console.log(e)
                    }
                };
                return
            }, 1000);
        }


    }



    return DeviceRentWebControl;
}