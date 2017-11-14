angular.module('buttons',[])
  .controller('buttonCtrl',ButtonCtrl)
  .factory('buttonApi',buttonApi)
  .constant('apiUrl','http://localhost:1337'); // CHANGED for the lab 2017!

function ButtonCtrl($scope,buttonApi){
   $scope.buttons=[]; //Initially all was still
   $scope.items=[];
   $scope.errorMessage='';
   $scope.isLoading=isLoading;
   $scope.refreshButtons=refreshButtons;
   $scope.refreshItems=refreshItems;
   $scope.buttonClick=buttonClick;
   $scope.totalPrice=0;
   $scope.tid='';
   $scope.loggedIn=false;
   $scope.currentUser="";

   var loading = false;

   function isLoading(){
    return loading;
   }
   function refreshButtons(){
      loading=true;
      $scope.errorMessage='';
      buttonApi.getButtons()
        .success(function(data){
           $scope.buttons=data;
           loading=false;
        })
        .error(function () {
            $scope.errorMessage="Unable to load Buttons:  Database request failed";
            loading=false;
        });
   }
   function refreshItems(){
       loading=true;
       $scope.errorMessage='';
       buttonApi.getItems()
           .success(function(data){
               $scope.items=data;
               $scope.totalPrice=0;
               data = data.map(function(item){
                  var subtotal = item.price * item.count;
                  item.subtotal = parseFloat(subtotal).toFixed(2);
                  item.price = parseFloat(item.price).toFixed(2);
                  $scope.totalPrice += subtotal;
                  return item;
               });
               $scope.totalPrice = parseFloat($scope.totalPrice).toFixed(2);
               loading=false;
           })
           .error(function () {
               $scope.errorMessage="Unable to load Items:  Database request failed";
               loading=false;
           });
   }
   $scope.deleteItems = function(id){
      $scope.errorMessage='';
      buttonApi.deleteItems(id)
         .success(refreshItems)
         .error(function(){$scope.errorMessage="Unable to delete item(s)!";});
   }

   function buttonClick($event){
      $scope.errorMessage='';
      buttonApi.clickButton($event.target.id)
         .success(refreshItems)
         .error(function(){$scope.errorMessage="Unable to add item(s)!";});
   }
   $scope.voidTransaction = function() {
      $scope.errorMessage='';
     buttonApi.voidTransaction()
         .success(refreshItems)
         .error(function(){$scope.errorMessag="Failure while voiding!";});
   }
  
  $scope.completeTransaction = function() {
    $scope.errorMessage='';
    buttonApi.completeTransaction()
          .success(function(response){
            $scope.tid = response.tid;
          })
          .error(function() {$scope.errorMessage="Failure while completing transaction!";});
  }

  $scope.printReceipt = function() {
    window.frames["print_frame"].document.body.innerHTML=document.getElementById("to-be-printed").innerHTML;
    window.frames["print_frame"].window.focus();
    window.frames["print_frame"].window.print();
    refreshItems();
  }

  $scope.login = function() {
    $scope.errorMessage='';
    var username = document.getElementById('lg_username').value;
    var password = document.getElementById('lg_password').value;
    buttonApi.login(username, password)
      .success(function() {
        $scope.loggedIn = true;
        $scope.currentUser = username.charAt(0).toUpperCase(0) + username.slice(1);
      })
      .error(function() {
        $scope.errorMessage="Failure logging in!";
      });
  };

   refreshButtons();  //make sure the buttons are loaded
   refreshItems();
}

function buttonApi($http,apiUrl){
  return{
    getButtons: function(){
      var url = apiUrl + '/buttons';
      return $http.get(url);
    },
    getItems: function() {
      var url = apiUrl + '/transaction';
      return $http.get(url);
	},
    clickButton: function(id){
      var url = apiUrl+'/transaction/' +id;
      return $http.post(url);
    },
    deleteItems: function(id){
      var url = apiUrl + '/transaction/' + id;
      return $http.delete(url);
    },
    voidTransaction: function() {
      var url = apiUrl+'/transaction';
      return $http.delete(url);
    },
    completeTransaction: function() {
      var url= apiUrl + '/transaction';
      return $http.post(url, {"action" :"commit sale"});
    },
    login: function(username, password) {
      var url= apiUrl + '/login';
      return $http.post(url, {"username": username, "password": password});
    }
  };
}

