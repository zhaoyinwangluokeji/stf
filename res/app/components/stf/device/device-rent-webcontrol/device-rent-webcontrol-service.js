module.exports = function DeviceRentWebControlService($filter, AppState,GroupService) {
    var DeviceRentWebControl = {}
    var device_list={}
    var Timer=null
    var scope

    
    DeviceRentWebControl.set=function(scop)
    {
        scope = scop;
        scope.$on('$destroy', function() {
            console.log("DeviceRentWebControlService destroy")
            if(Timer){
                clearTimeout(Timer)
                Timer = null
            }
        })
    }
    DeviceRentWebControl.open=function(device,changeEvent,getEvent){
        var device_o = device_list[device.serial]
        device_list[device.serial]=device
        console.log("open=="+device_o==device)
        console.log("==="+device_o===device)
        if(!Timer){
            Timer = setInterval(function(){
                for(key in device_list){
                    try{
                        element = device_list[key]
                        if(element.present && 
                            element.deivce_rent_conf && 
                            element.deivce_rent_conf.rent!=undefined && 
                            element.deivce_rent_conf.rent==true){
                                element.deivce_rent_conf.now = element.deivce_rent_conf.now +1000;
                                var now = Math.floor(element.deivce_rent_conf.now/1000);
                                var time=element.deivce_rent_conf.rent_time;
                                var start_time=Math.floor(element.deivce_rent_conf.start_time/1000);
                                if(now > (start_time+time*1000*60) ){
                                    getEvent(element) 
                                    GroupService.kick(device,true)     
                                }
                                else{
                                    changeEvent(device_list[key],element)
                                }
                        }
                         
                    }
                    catch(e){
                        console.log(e)
                    }
                };    
                return
            }, 1000);
        }
                
        
    }

    

    return DeviceRentWebControl;
}