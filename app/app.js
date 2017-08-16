var zipcodeApp = angular.module('zipcodeApp', ['ngRoute', 'ngResource']).config(function($sceDelegateProvider) {
 $sceDelegateProvider.resourceUrlWhitelist([
   // Allow same origin resource loads.
   'self',
   // Allow loading from our assets domain.  Notice the difference between * and **.
   'https://api.census.gov/data/**']);
 });

// ROUTES
zipcodeApp.config(function ($routeProvider){
    
    $routeProvider
    
    .when('/',{
        templateUrl: 'pages/home.html',
        controller: 'homeController'
    })
    
    .when('/d3/:zipcode', {
        templateUrl: 'pages/zipcode.html',
        controller: 'zipcodeController',
        resolve: {
            init: function() {
              return function() {
                d3.selectAll("svg > *").remove();;
              }
            }
        }
    })
});

// SERVICES
zipcodeApp.service('zcService', function(){
    
    this.zipcode = "95112"
    
})

// CONTROLLERS
zipcodeApp.controller('homeController', ['$scope', '$location', 'zcService', function($scope, $location, zcService){
    $scope.zipcode = zcService.zipcode;
    
    $scope.$watch('zipcode', function(){
        zcService.zipcode = $scope.zipcode;
    })
        
    $scope.submit = function(){
        $location.path('/d3/'+ $scope.zipcode);
    }
}]);

zipcodeApp.controller('zipcodeController', ['$scope', '$http', '$routeParams', 'zcService', function($scope, $http, $routeParams, zcService){
    
    $scope.zipcode = $routeParams.zipcode;
    
    console.log($routeParams.zipcode);
    
    var years = ["2006","2007","2008","2009","2010","2011","2012","2013","2014","2015"];
    
    var KEY = "5cfde1bf5fdaf44ca41a8c650f07b6c5a881a32e"
    var ROOT_URL = "https://api.census.gov/data/"
    var MIDDLE_URL = "/zbp?get=EMP,GEO_TTL,PAYANN,ESTAB,EMPSZES_TTL,EMPSZES&for=zipcode:"
    
    var params ={
        key: "&key=" + KEY
    }
    
    $scope.chart0 = [];
    $scope.chart1 = [];
    $scope.chart2 = [];
    $scope.chart3 = [];
    
    
    for(var i = 0; i < years.length; i++) {
        
        if( years[i] === "2015"){
            $http.get(`${ROOT_URL}${years[i]}${MIDDLE_URL}${$scope.zipcode}${params.key}`).then(function(response){
                $scope.chart1.push(response.data.map((index) => {
                    return index[3];
                }));
                $scope.chart0.push(response.data[1][0]);
                $scope.chart2.push(response.data[1][2]);
                $scope.chart3.push(response.data[1][3]);
                var chart11 = $scope.chart1[0];
                $scope.chart1 = [];
                $scope.chart1 = chart11.splice(2,6);
                //console.log(chart1);
            });
        } else {
            $http.get(`${ROOT_URL}${years[i]}${MIDDLE_URL}${$scope.zipcode}${params.key}`).then(function(response){
                $scope.chart0.push(response.data[1][0]);
                $scope.chart2.push(response.data[1][2]);
                $scope.chart3.push(response.data[1][3]);
            });  
        }
    };
    
    $scope.donutChart = function(data){
        if(data.length !== 0){
        
        legend_array = [
                        "Companies with 1 to 4 employees",
                        "Companies with 5 to 9 employees",
                        "Companies with 10 to 19 employees",
                        "Companies with 20 to 49 employees",
                        "Companies with 50 to 99 employees",
                        "Companies with more than 100 employees"
                       ];
        var dataset = data.map(function(d) { return {"y": d } });
        legend_array.map(function(l){ dataset[legend_array.indexOf(l)].x = l } );
        var height = 700
        var width = 700
        var totalRadius = Math.min(width, height) / 2
        var donutHoleRadius = totalRadius * 0.5
        var color = d3.scaleOrdinal(d3.schemeCategory10);

        var svg = d3.select('.donut').append('svg').attr('width', width).attr('height', height)
          .append('g')
          .attr('transform', `translate(${width / 2}, ${height / 2})`)

        var arc = d3.arc().innerRadius(totalRadius - donutHoleRadius).outerRadius(totalRadius)

        var pie = d3.pie()
          .value((d) => d.y)
          .sort(null)

        var path = svg
          .selectAll('path')
          .data(pie(dataset))
          .enter()
          .append('path')
          .attr('d', arc)
          .attr('fill', (d, i) => color(d.data.x))

        var legendItemSize = 18
        var legendSpacing = 4

        var legend = svg
          .selectAll('.legend')
          .data(color.domain())
          .enter()
          .append('g')
          .attr('class', 'legend')
          .attr('transform', (d, i) => {
            var height = legendItemSize + legendSpacing
            var offset = height * color.domain().length / 2
            var x = legendItemSize * -2;
            var y = (i * height) - offset
            return `translate(${-100}, ${y})`
          })

        legend
          .append('rect')
          .attr('width', legendItemSize)
          .attr('height', legendItemSize)
          .style('fill', color);

        legend
          .append('text')
          .attr('x', legendItemSize + legendSpacing)
          .attr('y', legendItemSize - legendSpacing)
          .text((d) => d)
            
        }
    }
    
    $scope.horizontalChart = function(data){
        if(data.length === 10){
            // 8. An array of objects of length N. Each object has key -> value pair, the key being "y" and the value is a random number
            var dataset = data.map(function(d) { return {"y": d,"x": data.indexOf(d)+2006 } })
            
            var max = data.reduce(function(a, b) {
                return Math.max(a, b);
            });
            
            console.log(max);

            var margin = {top: 50, right: 50, bottom: 50, left: 50}
              , width = window.innerWidth - margin.left - margin.right // Use the window's width 
              , height = window.innerHeight - margin.top - margin.bottom; // Use the window's height

            // The number of datapoints
            var n = data.length;

            // 5. X scale will use the index of our data
            var xScale = d3.scaleLinear()
                .domain([2006, 2015]) // input
                .range([0, width]); // output

            // 6. Y scale will use the randomly generate number 
            var yScale = d3.scaleLinear()
                .domain([0, max*1.05]) // input 
                .range([height, 0]); // output 

            // 7. d3's line generator
            var line = d3.line()
                .x(function(d, i) { return xScale(d.x); }) // set the x values for the line generator
                .y(function(d) { return yScale(d.y); }) // set the y values for the line generator 
                .curve(d3.curveMonotoneX) // apply smoothing to the line

            // 1. Add the SVG to the page and employ #2
            var svg = d3.select(".horizontal").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .style("float","left");

            // 3. Call the x axis in a group tag
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

            // 4. Call the y axis in a group tag
            svg.append("g")
                .attr("class", "y axis")
                .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

            // 9. Append the path, bind the data, and call the line generator 
            svg.append("path")
                .datum(dataset) // 10. Binds data to the line 
                .attr("class", "line") // Assign a class for styling 
                .attr("d", line); // 11. Calls the line generator 

            // 12. Appends a circle for each datapoint 
            svg.selectAll(".dot")
                .data(dataset)
              .enter().append("circle") // Uses the enter().append() method
                .attr("class", "dot") // Assign a class for styling
                .attr("cx", function(d, i) { return xScale(d.x) })
                .attr("cy", function(d) { return yScale(d.y) })
                .attr("r", 5);
            }
    }
}]);

//DIRECTIVES

zipcodeApp.directive("donutChart", function(){
    return {
        restrict: "EA",
        templateUrl: "directives/donutChart.html",
        replace: true,
        scope: {
            genDonutChart: "&",
            dData: "="
        }
    }
})

zipcodeApp.directive("horizontalChart", function(){
    return {
        restrict: "EA",
        templateUrl: "directives/horizontalChart.html",
        replace: true,
        scope: {
            genHorizontalChart: "&",
            hData: "="
        }
    }
})

