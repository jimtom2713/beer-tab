var main = angular.module('beer-tab.main', ['beer-tab.services', 'angular-jwt', 'ngTable']);


main.controller('MainCtrl', function ($scope, $window, beerPmt, jwtHelper, AuthService, getTable, util, location) {
  // Retrieve token from localStorage
  $scope.jwt = $window.localStorage.getItem('com.beer-tab');
  // Decode token (this uses angular-jwt. notice jwtHelper)
  $scope.decodedJwt = $scope.jwt && jwtHelper.decodeToken($scope.jwt);
  // Object used to contain user's beer network

  $scope.getTable = function(){
    console.log('getting network');
    getTable.getTable($scope.user)
      .then(function (derp) {
        $scope.network = util.toArr(derp);
      })
  }


  // $scope.network =  argle || $scope.decodedJwt.network;
  // Pull username from token to display on main page
  $scope.user = $scope.decodedJwt.username;
  // console.log('$scope.user', $scope.user);


  //this is used to show the add friend button, and hide the
  // new friend form
  $scope.clicked = false;


  //This function sennds a request to the server, it returns 
  //the updated information
  $scope.sendBeer = function (user) {

    if(user){
      console.log('sendBeer called', user);
      if(AuthService.isAuth()) {
        beerPmt.newIOU(user)
        .then(function(derp){
          console.log(derp); 
          $scope.network = util.toArr(derp.network);
          
        });
      }
    }
  };

  $scope.sendLoc = function(user){
    if(navigator.geolocation){
      navigator.geolocation.watchPosition(function(position){
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        console.log('check your server', lat, lon);
        location.locPost(user, [lat, lon]);
      });
    }else{
      console.log('you goofed');
    }
  }

  $scope.getLoc = function (user) {
    location.locGet(user);
  }

  $scope.sendLoc($scope.user);
  $scope.getLoc($scope.user);


});

/*Cytoscape directive*/

main.factory('cytoService', ['$document', '$window', '$q', '$rootScope',
  function($document, $window, $q, $rootScope) {
    var c = $q.defer(),
        cytoService = {
          //return as a promise so we wait for D3 to load and render our scripts
          cytoscape: function() { return c.promise; }
        };
  function onScriptLoad() {
    // Load client in the browser
    $rootScope.$apply(function() { c.resolve($window.cytoscape); });
  }
  var scriptTag = $document[0].createElement('script');
  scriptTag.type = 'text/javascript'; 
  scriptTag.async = true;
  scriptTag.src = 'assets/cytoscape.min.js';
  scriptTag.onreadystatechange = function () {
    if (this.readyState == 'complete') onScriptLoad();
  }
  scriptTag.onload = onScriptLoad;

  var s = $document[0].getElementsByTagName('body')[0];
  s.appendChild(scriptTag);

  return cytoService;
}]);

main.directive('cytoGraph', ['$window', '$timeout', 'cytoService', 
  function($window, $timeout, cytoService){
    return {
      restrict: 'ACE',
      scope: false,
      link: function(scope, ele, attrs){
        var unwatch = scope.$watchCollection('network', function(newVal, oldVal){
          if(newVal){
            init();
            unwatch();
          }
        });
    /*    var resizse = scope.$watch(function(){
               return $window.innerWidth;
            }, function(value) {
               console.log("window -----> ",value);
           });*/
        // console.log($window);
     /*   var size = scope.$watch('$window.innerHeight', function(newVal, oldVal){
          if(newVal){
            console.log('we resized');
          }
        })*/
        // var resize = 
        //start cytoscape visualization
        function init(){
          cytoService.cytoscape().then(function(cytoscape){
            var createGraph = function(user){
              var g = {};
              g.nodes = [];
              g.edges = [];
              g.nodes.push({
                data:{
                  id: user.user,
                  name: user.user
                }
              });
              for(var i=0; i< user.network.length; i++){
                console.log("network: ",user.network[i]);
                g.nodes.push({
                  data:{
                    id: user.network[i].username,
                    name: user.network[i].username + ":" + user.network[i].tab,
                    beerDebt: user.network[i].tab
                  }
                });
      /*          g.edges.push({
                  data:{
                    source: user.user,
                    target: user.network[i].username
                  }
                })*/
              }
              return g;
            };
              
            var cy = cytoscape({
              container: document.getElementById('cy'),
              
              style: cytoscape.stylesheet()
                .selector('node')
                  .css({
                    'content': 'data(name)',
                    'text-valign': 'center',
                    'color': 'black',
                    'height': 70,
                    'width': 70,
                    'background-fit': 'cover',
                    'border-color': '#162FCE',
                    'border-width': 9,
                    'border-opacity': 0.5,
                    // 'background-image': 'http://www.charbase.com/images/glyph/127866'
                    'background-image': 'assets/beerMug.png'
                  })
                .selector('.owed')
                  .css({
                    'border-color': 'red'
                  })
                .selector('.owe')
                  .css({
                    // 'border-width': 9
                    'border-color': 'green'
                  })
                .selector('edge')
                  .css({
                    'width': 6,
                    'target-arrow-shape': 'triangle',
                    'line-color': '#162FCE',
                    'target-arrow-color': '#162FCE',
                    'content': 'data(beerStatus)',
                    'font-size': 8
                  }),
              
              elements: createGraph(scope),
   /*             layout: {
                  name: 'grid',
                  padding: 30,
                  avoidOverlap: true,
                  animate: true,
                  animationDuration: 500
                }*/
                layout: {
                  name: 'random',
                  fit: true,
                  padding: 30,
                  boundingBox: {100,100,100,100}
                  animate: true,
                  animationDuration: 500
                }
           /*     layout: {
                  name: "circle",
                  fit: true,
                  padding: 30,
                  avoidOverlap: true,
                  radius: 50
                }*/
            }); // cy init

            cy.ready(function(){
              var nodes = this;
              // console.log(nodes.elements());
              nodes.elements().forEach(function(element){
                // console.log(element._private.group);
                if(element._private.group === "nodes"  && element._private.data.beerDebt !== undefined){
                  // console.log(element._private);
                  // element.addClass('owed');
                  if(element._private.data.beerDebt > 0){
                    element.addClass('owed');
                  }else if(element._private.data.beerDebt <= 0){
                    element.addClass('owe');
                  }
                }
                // stuff.toggleClass('owe');
              })
            })
           cy.on('click', 'node', function(){
            console.log('hi again');
            var nodes = this;
            var tapped = nodes;
            var Beer = [];
            for(;;){
              var connectedEdges = nodes.connectedEdges(function(){
                return !this.target().anySame( nodes );
              });
              
              var connectedNodes = connectedEdges.targets();
              
              Array.prototype.push.apply( Beer, connectedNodes );
              
              nodes = connectedNodes;
              // console.log("NODES------->",nodes);
              if( nodes.empty() ){ break; }
            }
            // console.log("BEER --------->",Beer);


           });
          })  
        }
        //end cytoscape visualization code
      }
    }
  }])