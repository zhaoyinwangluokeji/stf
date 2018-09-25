module.exports =
  function DeviceRentServiceFactory($uibModal, $location, $route, $interval,socket,AppState
    ) {
    var DeviceRentService={}
    var rent_time=[
        {
            time:10,
            title:"10分钟",
            selected:false
        },
        {
            time:30,
            title:"30分钟",
            selected:false
        },
        {
            time:60,
            title:"1小时",
            selected:false
        },
        {
            time:120,
            title:"2小时",
            selected:true
        },
        {
            time:240,
            title:"4小时",
            selected:false
        },
        {
            time:480,
            title:"8小时",
            selected:false
        }
        ,
        {
            time:720,
            title:"12小时",
            selected:false
        }
        ,
        {
            time:1440,
            title:"24小时",
            selected:false
        }
    ]

    var DeviceRentControll=["$scope","$uibModalInstance","device",function($scope, $uibModalInstance,device) {
        $scope.device= device;
        $scope.rent_times = rent_time
        $scope.rent_time_selected =  device.deivce_rent_conf.rent_time
        $scope.Rent = function() {
            $scope.device.deivce_rent_conf={
                rent:true,
                rent_time:$scope.rent_time_selected,
                start_time:Date.now(),
                now:   Date.now(),
                owner:{
                    email:AppState.user.email,
                    group:AppState.user.group,
                    name:AppState.user.name
                }
            }
            socket.emit('device.rent_conf.set', $scope.device)
            $uibModalInstance.close(true)
        }
        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel')
            // $uibModalInstance.close(true)
            // $route.reload()
        }
        }]
    DeviceRentService.open = function(device) {
      var modalInstance = $uibModal.open({
        template: require('./device-rent-dialog.pug'),
        controller: DeviceRentControll,
        resolve: {
          device: function() {
            return device
          }
        }
      })

     return modalInstance.result.then(function(result) { 
        if(confirm("需要直接打开手机的远程控制吗？")){
            
            return {
                result:true,
                device:device,
                message:"open"
            }
        }
        else {
            return {
                result:false,
                device:device,
                message:"not open"
            }
        }
      }, function(reason) {
            return {
                    result:false,
                    device:device,
                    message:reason
                }
      })
        
    }
     
    DeviceRentService.free_rent = function(device,socket){
        if(device.deivce_rent_conf ){
            device.deivce_rent_conf.rent = false;
        }
        socket.emit('device.rent_conf.set', device)
    }
     
    return DeviceRentService
  }
