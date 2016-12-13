

/*
 * BarChart - Object constructor function
 * @param _parentElement    -- the HTML element in which to draw the bar charts
 * @param _data                     -- the dataset 
 *
 * Unimplemented.
 */

BarChart = function(_parentElement, _demoSelectorElement, _illnessSelectorElement, _checkboxSelectorElement, _data){
    this.parentElement = _parentElement;
    this.demoSelectorElement = _demoSelectorElement;
    this.illnessSelectorElement = _illnessSelectorElement;
    this.checkboxSelectorElement = _checkboxSelectorElement;
    this.data = _data;
    this.displayData = _data;

    this.initVis();
}



/*
 * Initialize visualization (static content; e.g. SVG area, axes)
 */

BarChart.prototype.initVis = function(){
    var vis = this;

    // Create SVG
    vis.margin = {top: 22, right: 40, bottom: 40, left: 40};

    vis.height = 450 - vis.margin.top - vis.margin.bottom;
    vis.width = 525 - vis.margin.left - vis.margin.right;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes
    vis.x = d3.scale.ordinal()
        .rangeRoundBands([0, vis.width], 0.1);

    vis.y = d3.scale.linear()
        .range([0, vis.height]);

    vis.colorScale = d3.scale.ordinal();
    vis.colors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6'];

    vis.xAxis = d3.svg.axis()
          .scale(vis.x)
          .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left")
        .tickFormat(function(d) {
            return d + "%"
        });

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    // Add the chart title
    vis.title = vis.svg.append("text")
        .attr("class", "bar-chart-title")
        .attr("transform", "translate(10,-7)");

    // Set up tooltip
    vis.tip = d3.tip().attr('class', 'd3-tip')
                    .html(function(d) { 
                        return Math.round(100*d.values.percent)/100. + '%';
                    });
    vis.tip.direction('e');
    vis.svg.call(vis.tip);

    // Set the listener for the select box and bind vis as this in updateChoropleth so 
    // it works properly
    d3.select("#" + vis.demoSelectorElement).on("change", vis.wrangleData.bind(vis));
    d3.select("#" + vis.illnessSelectorElement).on("change", vis.wrangleData.bind(vis));
    d3.select("#" + vis.checkboxSelectorElement).on("change", vis.wrangleData.bind(vis));
    // (Filter, aggregate, modify data)
    vis.wrangleData();
}

/*
 * Data wrangling
 */

BarChart.prototype.wrangleData = function(){
    var vis = this;

    // need to filter the people who don't have data for the y variable (like emotional disability)
    vis.setAttributes();

    var filteredData = vis.data.filter(vis.filterData.bind(vis));
    vis.displayData = d3.nest()
        .key(function(d) { return vis.getDemo(d); })
        .key(function(d) { return getIllness(d, vis.illness); })
        .rollup(function(leaves) { return leaves.length; })
        .entries(filteredData);

    vis.displayData.forEach(function(d) {
        d.values = trueFalsePercent(d.values);
    })

    vis.displayData.sort(function(x,y) {
        // Orders the data properly for specific demographics 
        if (vis.demo == "age" || vis.demo == "environment") {
            if (x.key == "<19" || y.key == "Other") {
                return -1;
            }
            if (y.key == "<19" || x.key == "Other") {
                return 1;
            }          
        } else if (vis.demo == "education") {
            if (x.key == "No HS Degree" || y.key == "College Graduate") {
                return -1;
            } else if (y.key == "No HS Degree" || x.key == "College Graduate") {
                return 1;
            } else if (x.key == "HS Graduate" && y.key == "Some College") {
                return -1;
            } else if (x.key == "Some College" && y.key == "HS Graduate") {
                return 1;
            }
        }

        return d3.ascending(x.key, y.key)  
    })

    vis.totalData = d3.nest()
        .key(function(d) { return getIllness(d, vis.illness); })
        .rollup(function(leaves) { return leaves.length; })
        .entries(filteredData);

    if (vis.totalData.length == 1) {
        vis.totalPercent = 0;
    } else if (vis.totalData[0].key == "false") {
        vis.totalPercent = 100*(vis.totalData[1].values*1.0)/(1.0*vis.totalData[1].values+vis.totalData[0].values);
    } else {
        vis.totalPercent = 100*(vis.totalData[0].values*1.0)/(1.0*vis.totalData[1].values+vis.totalData[0].values);
    }


    vis.updateVis();

}

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

BarChart.prototype.updateVis = function(){
    var vis = this;
    // (1) Update domains
    // (2) Draw rectangles
    // (3) Draw labels
    vis.categoryDomain = jQuery.unique(vis.displayData.map(function (d) {
        return d.key;
    }));
    vis.x.domain(vis.categoryDomain);
    vis.colorScale.domain(vis.categoryDomain.sort());
    vis.colorScale.range(vis.colors.slice(0,vis.categoryDomain.length))

    vis.y.domain(vis.getYDomain());

    vis.rect = vis.svg.selectAll("rect.bar")
                .data(vis.displayData, function(d) { return d.key; });

    // Initialize, update, and exit bars
    vis.rect
        .enter()
        .append("rect")
        .attr("fill", "#f7f7f7")      
        .on("mouseover", vis.tip.show)
        .on("mouseout", vis.tip.hide);

    vis.rect
        .transition()
        .duration(250)
        .attr("width", vis.x.rangeBand())
        .attr("height", function(d) {
            return vis.height-vis.y(d.values.percent);
        })
        .attr("class", "bar")
        .attr("x", function(d) {
            return vis.x(d.key);
        })
        .attr("y", function(d) {
            return vis.y(d.values.percent);
        })
        .attr("fill", function(d) {
            return vis.colorScale(d.key);
        });

    vis.rect.exit().remove();

    if (typeof vis.avgLine != "undefined") {
        vis.avgLine.remove();
    }   
    // Draw the line indicating the avg across all groups
    vis.avgLine = vis.svg
        .append("line")
        .attr("class", "avg-line");

    vis.avgLine
        .attr("x1", 0)
        .attr("y1", vis.y(vis.totalPercent))
        .attr("x2", vis.width)
        .attr("y2", vis.y(vis.totalPercent))

    vis.text = vis.svg.selectAll("text.label")
        .data(vis.displayData, function(d) { return d.key; })

    // Add the chart title
    vis.title.text(function(d) {
        return "Incidence (%) of " + formatIllness(vis.illness) + " versus " + formatDemo(vis.demo);
    });

    // Update the axes
    vis.svg.select(".y-axis").transition().duration(250).call(vis.yAxis);
    vis.svg.select(".x-axis").transition().duration(250).call(vis.xAxis);
}


BarChart.prototype.getYDomain = function() {
    var vis = this;

    var checkBox = document.getElementById(vis.checkboxSelectorElement);
    if (checkBox.checked) {
        var maxPercent = d3.max(vis.displayData, function(d) {
            return d.values.percent;
        })
        return [Math.ceil(maxPercent/10.0)*10, 0];
    } else {
        return [100,0];
    }
}

BarChart.prototype.filterData = function(d) {
    var vis = this;

    if (vis.handleRace(d.race) == "Other") {
        return false;
    }
    return true;

}

BarChart.prototype.trueFalsePercent = function(values) {
    if (values[0].key == "true") {
        return {
            "true": values[0].values,
            "false": values[1].values,
            "percent": 100*(values[0].values*1.0)/(1.0*values[0].values+values[1].values)
        };
    } else {
        if (values.length == 1) {
            numTrue = 0;
        } else {
            numTrue = values[1].values;
        }
        return {
            "true": numTrue,
            "false": values[0].values,
            "percent": 100*(numTrue*1.0)/(1.0*values[0].values+numTrue)
        };
    }
}

// Figure out which attribute we're using
BarChart.prototype.setAttributes = function() {
    var vis = this;
    vis.demo = d3.select("#" + vis.demoSelectorElement).property("value");
    vis.illness = d3.select("#" + vis.illnessSelectorElement).property("value");
}

// Get the correct attribute
BarChart.prototype.getDemo = function(d) {
    var vis = this;

    switch(vis.demo) {
    case "race":
        return vis.handleRace(d.race);
        break;
    case "sex":
        if (d.sex == 1) {
            return "Male";
        } else {
            return "Female";
        }
        break;
    case "age":
        return vis.handleAge(d.age);
        break;
    case "environment":
        return vis.handleEnv(d.environment);
    case "military":
        if (d.military == 1) {
            return "Military";
        } else {
            return "Civilian";
        }
    case "immigrant":
        if (d.immigrant == 1){
            return "Immigrant"
        } else {
            return "US-born"
        }
    case "education":
        if (d.schoolCompleted < 12) {
            return "No HS Degree"
        } else if (d.schoolCompleted == 12) {
            return "HS Graduate"
        } else if (d.schoolCompleted < 16) {
            return "Some College";
        } else {
            return "College Graduate"
        }
    default:
        break;
    }
}

BarChart.prototype.handleRace = function(race) {
    switch(+race) {
        case 1:
        case 2:
        case 3:
        case 4:
            return "Asian";
        case 5:
        case 6:
        case 7:
        case 8:
            return "Hispanic";
        case 9:
        case 10:
            return "Black";
        case 11:
            return "White";
        default:
            return "Other";
    }
}

BarChart.prototype.handleAge = function(age) {
    if (age == 18 || age == 19) {
        return "<19";
    } else if (age < 30) {
        return "20-29";
    } else if (age < 40) {
        return "30-39";
    } else if (age < 50) {
        return "40-49";
    } else if (age < 60) {
        return "50-59";
    } else if (age < 70) {
        return "60-69";
    } else if (age < 80) {
        return "70-79";
    } else {
        return "80+";
    }
}

BarChart.prototype.handleEnv = function(env) {
    switch(+env) {
        case 1:
            return "Rural";
        case 2:
            return "Small Town";
        case 3:
            return "Small City";
        case 4:
            return "Suburb";
        case 5:
            return "Large City";
        default:
            return "Other";
    }
}


BarChart.prototype.formatDemo = function(demo) {
    if (demo == "immigrant") {
        return "Immigration Status";
    } else if (demo == "education") {
        return "Educational Attainment";
    } else {
        return demo.substring(0,1).toUpperCase() + demo.substring(1);
    }
}

BarChart.prototype.formatIllness = function(illness) {
    if (illness == "adhd" || illness == "ptsd") {
        return illness.toUpperCase();
    } else {
        return illness.substring(0,1).toUpperCase() + illness.substring(1);
    }
}
