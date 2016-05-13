// Copyright © Citrix Systems, Inc.  All rights reserved.
'use strict';

angular.module('cwc.d3')
.directive('ctxBarStack', ['$window', 'd3', 
function($window, d3) {
    return {
        restrict: 'A',
        scope: {
          config: '=',
          label: '@',
          onClick: '&'
        },
        link: function(scope, element, attrs) {
            var margin = scope.config.margin || { left: 20, top: 20, right: 20, bottom: 20 },
                barHeight = scope.config.barHeight || 80,
                barPadding = scope.config.barPadding || 5,
                leftLabelWidth = scope.config.leftLabelWidth || 0,
                minBarWidth = 30,
                totalBarWidth = 50,
                textWidth = 30,
                totalPadding = 5;

            var svg = d3.select(element[0])
                .append('svg')
                .style('width', '100%');

            $window.onresize = function() {
                scope.$apply();
            };

            scope.$watch(function() {
                return angular.element($window)[0].innerWidth;
            }, function() {
                scope.render(scope.config);
            });

            // scope.$watch('data', function(newData) {
            //     scope.render(newData);
            // }, true);

            var sumOfSeries = function (series) {
                var sum = [];

                if (!series || series.length === 0) {
                    return;
                }

                for (var j=0; j<series[0].data.length; j++) {
                    sum.push(series[0].data[j]);
                }
                for (var i=1; i<series.length; i++) {
                    for (var j=0; j<series[i].data.length; j++) {
                        sum[j] += series[i].data[j];
                    }
                }

                return sum;
            };

            var maxSumOfSeries = function (series) {
                return Math.max.apply(null, sumOfSeries(series));
            };

            scope.render = function() {
                svg.selectAll('*').remove();
                var series = scope.config.series,
                    total = { name: 'Total' },
                    width = d3.select(element[0])[0][0].offsetWidth - margin.left - leftLabelWidth - margin.right,
                    height = scope.config.series[0].data.length * (barHeight + barPadding),
                    color = scope.config.color ? function(c) { return scope.config.color[c%scope.config.color.length]; } : d3.scale.category20(),
                    xScale = d3.scale.linear()
                        .domain([0, maxSumOfSeries(series)+totalBarWidth])
                        .range([0, width]);

                total['data'] = sumOfSeries(series);

                svg.attr('height', height);

                for (var index=0; index<series.length; index++) {
                    var yOffset = index * (barHeight + barPadding);
                    svg.append('g')
                        .attr('class', 'bar-stack')
                        .selectAll('rect')
                        .data(series[index].data)
                        .enter()
                        .append('rect')
                        .attr('height', barHeight)
                        .attr('rx', 3)
                        .attr('ry', 3)
                        .attr('x', function(d, i) {
                            var pos = 0;
                            for (var x=0; x<index; x++) {
                                pos += series[x].data[i];
                            }
                            console.log(pos);
                            return margin.left + leftLabelWidth + xScale(pos);
                        })
                        .attr('y', function(d, i) {
                            return i * (barHeight + barPadding);
                        })
                        .attr('width', 0)
                        .attr('fill', color(index))
                        .transition()
                        .duration(500)
                        .attr('width', function(d) {
                            return xScale(d);
                        });

                    svg.append('g')
                        .attr('class', 'bar-text')
                        .selectAll('text')
                        .data(series[index].data)
                        .enter()
                        .append('text')
                        .attr('y', function(d, i) {
                            return i * (barHeight + barPadding) + barHeight/2 + 5;
                        })
                        .attr('x', function(d, i) {
                            var textPos = margin.left + leftLabelWidth + xScale(series[index].data[i]) - textWidth;
                            for (var x=0; x<index; x++) {
                                textPos += xScale(series[x].data[i]);
                            }
                            return textPos;
                        })
                        .text(function(d) {
                            // ignore text when width too narrow
                            return xScale(d) > minBarWidth ? d : '';
                        });
                }

                if (scope.config.showTotal) {
                    svg.append('g')
                        .attr('class', 'bar-stack-total')
                        .selectAll('rect')
                        .data(total.data)
                        .enter()
                        .append('rect')
                        .attr('height', barHeight)
                        .attr('rx', 3)
                        .attr('ry', 3)
                        .attr('x', function(d) {
                            return margin.left + leftLabelWidth + xScale(d) + totalPadding;
                        })
                        .attr('y', function(d, i) {
                            return i * (barHeight + barPadding);
                        })
                        .attr('width', function() {
                            return 0;
                        })
                        .transition()
                        .duration(500)
                        .attr('width', function() {
                            return totalBarWidth;
                        });

                    svg.append('g')
                        .attr('class', 'bar-text-total')
                        .selectAll('text')
                        .data(total.data)
                        .enter()
                        .append('text')
                        .attr('y', function(d, i) {
                            return i * (barHeight + barPadding) + barHeight/2 + 5;
                        })
                        .attr('x', function(d, i) {
                            return margin.left + leftLabelWidth + xScale(d) + totalBarWidth/4;
                        })
                        .text(function(d) {
                            return d;
                        });
                }

                if (scope.config.showLeftLabel && scope.config.leftLabelWidth > 0) {
                    svg.append('g')
                        .attr('class', 'bar-left-label')
                        .selectAll('text')
                        .data(scope.config.categories)
                        .enter()
                        .append('text')
                        .attr('y', function(d, i) {
                            return i * (barHeight + barPadding) + barHeight/2 + 5;
                        })
                        .attr('x', margin.left)
                        .text(function(d) {
                            return d;
                        });
                }
            };
        }
    };
}]);