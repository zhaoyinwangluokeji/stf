module.exports = function CompatIconsCtrl(
  $scope
, $rootScope
) {
  selected_serials = []

  $scope.createItem = function(device) {
    var id = calculateId(device)
    var item = builder.build()

    item.onclick = function(){
      if (this.classList.contains("compat-selected")) {
        this.classList.remove('compat-selected')
        this.children[0].className = 'checkImg isUnChecked'
        console.log('Child className:  ' + this.children[0].className)
        if(selected_serials.indexOf(id) > -1){
          selected_serials.splice(selected_serials.indexOf(id),1)
        }
      }else{
        this.classList.add('compat-selected')
        this.children[0].className = 'checkImg isChecked'
        console.log('Child className2:  ' + this.children[0].className)
        selected_serials.push(id)
      }
      $rootScope.$broadcast('selected_serials', selected_serials)
    }
    
    item.id = id
    builder.update(item, device)
    mapping[id] = device

    return item
  }
  
}
