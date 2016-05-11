// Copyright © Citrix Systems, Inc.  All rights reserved.
'use strict';

angular.module('cwc.d3')
.directive('ctxBarChart', ['$window', '$timeout', 'd3', 
function($window, $timeout, d3) {
  return {
    restrict: 'A',
    scope: {
      data: '=',
      label: '@',
      onClick: '&'
    },
    link: function(scope, ele, attrs) {
        var renderTimeout;
        var margin = parseInt(attrs.margin) || 20,
            barHeight = parseInt(attrs.barHeight) || 20,
            barPadding = parseInt(attrs.barPadding) || 5;

        var svg = d3.select(ele[0])
          .append('svg')
          .style('width', '100%');

        $window.onresize = function() {
          scope.$apply();
        };

        scope.$watch(function() {
          return angular.element($window)[0].innerWidth;
        }, function() {
          scope.render(scope.data);
        });

        scope.$watch('data', function(newData) {
          scope.render(newData);
        }, true);

        scope.render = function(data) {
          svg.selectAll('*').remove();

          if (!data) {
            return;
          }
          if (renderTimeout) {
            clearTimeout(renderTimeout);
          }

          renderTimeout = $timeout(function() {
            var width = d3.select(ele[0])[0][0].offsetWidth - margin,
                height = scope.data.length * (barHeight + barPadding),
                color = d3.scale.category20(),
                xScale = d3.scale.linear()
                  .domain([0, d3.max(data, function(d) {
                    return d.y;
                  })])
                  .range([0, width]);

            svg.attr('height', height);

            svg.selectAll('rect')
              .data(data)
              .enter()
			.append('rect')
			.on('click', function(d) {
				return scope.onClick({item: d});
			})
			.attr('height', barHeight)
			.attr('width', 140)
			.attr('x', Math.round(margin/2))
			.attr('y', function(d, i) {
				return i * (barHeight + barPadding);
			})
			.attr('fill', function(d) {
				return color(d.y);
			})
			.transition()
			.duration(1000)
			.attr('width', function(d) {
				return xScale(d.y);
			});

            svg.selectAll('text')
              .data(data)
              .enter()
			.append('text')
			.attr('fill', '#fff')
			.attr('y', function(d,i) {
				return i * (barHeight + barPadding) + 15;
			})
			.attr('x', 15)
			.text(function(d) {
				return d.name + ' ' + d.y;
			});
          }, 200);
        };
    }};
}]);
// Copyright © Citrix Systems, Inc.  All rights reserved.
'use strict';

angular.module('cwc.d3')
.directive('ctxPieChart', ['$window', 'd3', 
function($window, d3) {
    return {
        restrict: 'A',
        scope: {
            data: '=',
            label: '@',
            onClick: '&'
        },
        link: function(scope, element) { 
            scope.data = scope.data.filter(function(item) {
                return item.y !== 0;
            });

            if (!scope.data || scope.data.length < 1) {
                return;
            }

            var height = element[0].clientHeight;

            if (height === 0) {
                height = 300;
            }

            var svg = d3.select(element[0])
                      .append('svg')
                      .style('width', '100%')
                      .attr({height: height})
                      .append('g');

            svg.append('g')
            .attr('class', 'pie-slices');

            svg.append('g')
            .attr('class', 'pie-labels');

            svg.append('g')
            .attr('class', 'pie-lines');  

            var pie = d3.layout.pie()
              .sort(null)
              .value(function(d) { 
                return d.y; 
            });

            var color = d3.scale.category20();

            var arc = d3.svg.arc()
                      .innerRadius(0),
              arcOver = d3.svg.arc(),
              outerArc = d3.svg.arc();

            function midAngle(d){
                return d.startAngle + (d.endAngle - d.startAngle)/2;
            }

            $window.onresize = function() {
                scope.$apply();
            };

            scope.$watch(function() {
                return angular.element($window)[0].innerWidth;
                }, function() {
                scope.render(scope.data);
            });

            scope.$watch('data', function(newData) {
                scope.render(newData);
            }, true);

            scope.render = function(data) {
                svg.select('.pie-slices').selectAll('*').remove();
                svg.select('.pie-labels').selectAll('*').remove();
                svg.select('.pie-lines').selectAll('*').remove();

                if (!data) { 
                    return;
                }

                var elementWidth = element[0].clientWidth,
                    radius = Math.min(elementWidth, height)/2,
                    outerRadius = Math.round(radius * 0.8),
                    overRadius = Math.round(radius * 0.85),
                    outerArcRadius = Math.round(radius * 0.9);

                svg.attr('transform', 'translate(' + Math.round(elementWidth/2) + ',' + Math.round(Math.min(elementWidth, height)/2) + ')');

                arc.outerRadius(outerRadius);
                arcOver.outerRadius(overRadius);
                outerArc.innerRadius(outerRadius)
                        .outerRadius(outerArcRadius);

                // Pie Slices
                var slice = svg.select('.pie-slices')
                                .selectAll('path.slice')
                                .data(pie(data));

                var overSlice = svg.select('.pie-slices')
                        .append('path')
                        .attr('opacity', 0.6);

                slice.enter()
                    .append('path')
                    .style('fill', function(d, i) { 
                        return color(i); 
                    })
                    .attr('d', arc);

                slice.on('mouseover', function(d, i) {
                    overSlice.attr('d', arcOver(d))
                        .attr('fill', color(i));
                })
                .on('mouseout', function() {
                    overSlice.attr('d', null);
                });

                slice.exit()
                    .remove();    

                // Pie Lables
                var text = svg.select('.pie-labels').selectAll('text')
                    .data(pie(data));

                text.enter()
                    .append('text')
                    .attr('transform', function(d) {
                        var pos = outerArc.centroid(d);
                        pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1);
                        return 'translate(' + pos + ')'; 
                    })
                    .attr('dy', '5')
                    .text(function(d) {
                        return d.data.name + ': ' + d.data.y;
                    })
                    .style('text-anchor', function(d){
                        return midAngle(d) < Math.PI ? 'start':'end';
                    });

                text.exit()
                    .remove();

                // Pie Poly Lines
                var polyline = svg.select('.pie-lines').selectAll('polyline')
                    .data(pie(data));

                polyline.enter()
                    .append('polyline')
                    .attr('stroke', function(d, i) {
                        return color(i);
                    })
                    .attr('points', function(d) {
                        var pos = outerArc.centroid(d);
                        pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
                        return [arc.centroid(d), outerArc.centroid(d), pos];
                    });

                polyline.exit()
                    .remove();                        
            };
            
        }
    };
}]);
    
// Copyright © Citrix Systems, Inc.  All rights reserved.
'use strict';

angular.module('cwc.d3')
.directive('ctxSplineChart', ['$window', 'd3', 
function($window, d3) {
    return {
        restrict: 'A',
        scope: {
            config: '=',
            onClick: '&'
        },
        link: function(scope, element) { 
            var width = element[0].clientWidth;
            var height = element[0].clientHeight;

            if (height === 0) {
                height = 300;
            }

            var margin = {left: 60, top: 30, right: 60, bottom: 30};

            var maxOfSeries = function(series) {
                var max = Math.max.apply(null, series[0].data);
                for (var i=1; i<series.length; i++) {
                    var tmp = Math.max.apply(null, series[i].data);
                    max = Math.max(max, tmp);
                }
                return max;
            };

            var svg = d3.select(element[0])
                .append('svg')
                .style('width', '100%')
                .attr({height: height});

            var group = svg.append('g')
                .attr('transform', 'translate(' + margin.left +', ' + margin.top + ')');

            // tooltip appends to body, because it uses postion:absolute based on body
            var tooltip = d3.select('body').append('div')   
                .attr('class', 'tooltip')               
                .style('opacity', 0);

            var color = d3.scale.category20();

            var svgWidth = width - margin.left - margin.right,
                svgHeight = height - margin.top - margin.bottom;
            
            var xScale = d3.scale.ordinal();

            var yScale = d3.scale.linear()
                .range([svgHeight, 0]);

            var lineGenerator = d3.svg.line()
                .x(function(d, i) {
                    return xScale(scope.config.xAxis.categories[i]);
                })
                .y(function(d) {
                    return yScale(d);
                });

            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom');

            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left');

            var elementXAxis = group.append('g')
                .attr('class', 'x spline-axis')
                .attr('transform', 'translate(' + 0 +', ' + svgHeight + ')');

            var elementYAxis = group.append('g')
                .attr('class', 'y spline-axis');

            var lines = group.append('g')
                .attr('class', 'spline-lines');
              
            $window.onresize = function() {
                scope.$apply();
            };

            scope.$watch(function() {
                return angular.element($window)[0].innerWidth;
            }, function() {
                scope.render(scope.config.series);
            });

            scope.$watch('config.series', function(newData) {
                scope.render(newData);
            }, true);  

            scope.render = function(series) {
                svg.select('.spline-lines')
                    .selectAll('*').remove();

                if (!series) {
                    return;
                }

                width = element[0].clientWidth;
                svgWidth = width - margin.left - margin.right;

                svg.attr('width', width);

                xScale.domain(scope.config.xAxis.categories.map(function(d) { return d; }))
                    .rangePoints([0, svgWidth]);
                yScale.domain([0, maxOfSeries(scope.config.series)]);

                var ticks = scope.config.xAxis.categories.length;
                var base = Math.ceil(100*(ticks-1)/svgWidth); //tick width 100px
                xAxis.tickValues(scope.config.xAxis.categories.filter(function(value, index) {
                    return index % base === 0;
                }));

                elementXAxis.call(xAxis);
                elementYAxis.call(yAxis);

                for (var index=0; index<scope.config.series.length; index++) {
                    var data = scope.config.series[index].data;
                    var linesGroup = lines.append('g')
                        .attr('class', 'spline-line');

                    linesGroup
                        .append('path')
                        .attr('stroke', color(index))
                        .attr('d', lineGenerator(data));

                    linesGroup.selectAll('dot')    
                        .data(data)
                        .enter()
                        .append('circle')
                        .attr('class', 'dot')
                        .attr('fill', color(index))
                        .attr('r', 5)
                        .attr('cx', function(d, i) { return xScale(scope.config.xAxis.categories[i]); })       
                        .attr('cy', function(d) { return yScale(d); })
                        .on('mouseover', function(d, i) {

                            d3.select(this).transition()
                                .duration(200)
                                .attr('r', 7);

                            tooltip.transition()
                                .duration(200)
                                .style('opacity', 0.8);

                            tooltip.html(scope.config.xAxis.categories[i] + '<br/>'  + d)
                                .style('left', (d3.event.pageX - 50) + 'px')
                                .style('top', (d3.event.pageY - 38) + 'px');
                            })                  
                        .on('mouseout', function() {
                            d3.select(this).transition()
                                .duration(500)
                                .attr('r', 5);
                
                            tooltip.transition()
                                .duration(500)
                                .style('opacity', 0);
                        });
                }
            };
        }
    };
}]);
// Copyright © Citrix Systems, Inc.  All rights reserved.

angular.module('cwc.d3', []);

angular.module('cwc.d3.templates', []);

angular.module('cwc.d3.templates', []);

