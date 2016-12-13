/*
 * BarChart2
 */

BarChart2 = function(_parentElement, _illnessSelectorElement, _checkboxSelectorElement, _data){
    this.parentElement = _parentElement;
    this.illnessSelectorElement = _illnessSelectorElement;
    this.checkboxSelectorElement = _checkboxSelectorElement;
    this.data = _data;
    this.displayData = _data;

    this.initVis();
}


/*
 * Initialize visualization (static content; e.g. SVG area, axes)
 */

BarChart2.prototype.initVis = function(){
    var vis = this;

    // Create SVG
    vis.margin = {top: 100, right: 40, bottom: 40, left: 125};

    vis.height = 700 - vis.margin.top - vis.margin.bottom;
    vis.width = 600 - vis.margin.left - vis.margin.right;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes
    vis.x = d3.scale.linear()
        .range([0, vis.width]);

    vis.y = d3.scale.ordinal()
        .rangeRoundBands([0, vis.height], 0.1);


    vis.colorScale = d3.scale.linear();
    vis.colorScale.domain([0,100]);
    vis.colorScale.range(["white", "red"])

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("top")
        .tickFormat(function(d) {
            return d + "%"
        });

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    vis.chart = vis.svg.append("g")
        .attr("transform", "translate(0,25)");

    vis.chart.append("g")
        .attr("class", "x-axis axis");

    vis.chart.append("g")
        .attr("class", "y-axis axis");

    // Add the chart title
    vis.title = vis.svg.append("text")
        .attr("class", "bar-chart-title")
        .attr("transform", "translate(10,-7)");

    // Set up tooltip
    vis.tip = d3.tip().attr('class', 'd3-tip')
                    .html(function(d) { 
                        return "Ill Percentage: " + Math.round(100*d.perc)/100. + '%';
                    });
    vis.tip.direction('e');
    vis.svg.call(vis.tip);

    // Set up tooltip
    vis.tip2 = d3.tip().attr('class', 'd3-tip')
                    .html(function() { 
                        return "Not Ill Percentage: " + vis.notIllPerc + '%';
                    });
    vis.tip2.direction('e');
    vis.svg.call(vis.tip2);

    vis.notIllAssocs = [
        {assoc: "Employed", num: 0, perc: 0.0},
        {assoc: "Attempted Suicide", num: 0, perc: 0.0},
        {assoc: "Taken Psych. Medicine", num: 0, perc: 0.0},
        {assoc: "Suicidal Thoughts", num: 0, perc: 0.0},
        {assoc: "Missed Work Last Mo.", num: 0, perc: 0.0},
        {assoc: "Married", num: 0, perc: 0.0}
    ];

    vis.notIll = vis.data.filter(vis.filterIll.bind(vis)); 
    for (var i = 0; i < vis.notIll.length; i++) {
        if (vis.notIll[i].suicideattempt == 1) {
            vis.notIllAssocs[1].num += 1;
        }
        if (vis.notIll[i].workstatus == 1) {
            vis.notIllAssocs[0].num += 1;
        }
        if (vis.notIll[i].seriousthoughtssuicide == 1) {
            vis.notIllAssocs[3].num += 1;
        }
        if (vis.notIll[i].noworklastmonth != 0 && vis.notIll[i].noworklastmonth != ' ') {
            vis.notIllAssocs[4].num += 1;
        }
        if (vis.notIll[i].antideprlast12 == 1 || vis.notIll[i].tranqlast12 == 1 || vis.notIll[i].amphstimlast12 == 0 || vis.notIll[i].antipsychlast12 == 1 || vis.notIll[i].medicine == 1) {
            vis.notIllAssocs[2].num += 1;
        }
        if (vis.notIll[i].marital == 1) {
            vis.notIllAssocs[5].num += 1
        }
    }

    for (var i = 0; i < vis.notIllAssocs.length; i++) {
        vis.notIllAssocs[i].perc = Math.round((10000.*vis.notIllAssocs[i].num) / vis.notIll.length)/100;
    }
    // (Filter, aggregate, modify data)
    vis.wrangleData();



    // Set the listener for the select box and bind vis as this in updateChoropleth so 
    // it works properly
    d3.select("#" + vis.illnessSelectorElement).on("change", vis.wrangleData.bind(vis));
    d3.select("#" + vis.checkboxSelectorElement).on("change", vis.wrangleData.bind(vis));
}



/*
 * Data wrangling
 */
BarChart2.prototype.wrangleData = function(){
    var vis = this;

    vis.setAttributes();

    vis.filteredData = vis.data.filter(vis.filterData.bind(vis));

    vis.displayData = [
        {assoc: "Employed", num: 0, perc: 0.0},
        {assoc: "Attempted Suicide", num: 0, perc: 0.0},
        {assoc: "Taken Psych. Medicine", num: 0, perc: 0.0},
        {assoc: "Suicidal Thoughts", num: 0, perc: 0.0},
        {assoc: "Missed Work Last Mo.", num: 0, perc: 0.0},
        {assoc: "Married", num: 0, perc: 0.0}
    ];

    for (var i = 0; i < vis.filteredData.length; i++) {
        if (vis.filteredData[i].suicideattempt == 1) {
            vis.displayData[1].num += 1;
        }
        if (vis.filteredData[i].workstatus == 1) {
            vis.displayData[0].num += 1;
        }
        if (vis.filteredData[i].seriousthoughtssuicide == 1) {
            vis.displayData[3].num += 1;
        }
        if (vis.filteredData[i].noworklastmonth != 0 && vis.filteredData[i].noworklastmonth != ' ') {
            vis.displayData[4].num += 1;
        }
        if (vis.filteredData[i].antideprlast12 == 1 || vis.filteredData[i].tranqlast12 == 1 || vis.filteredData[i].amphstimlast12 == 0 || vis.filteredData[i].antipsychlast12 == 1 || vis.filteredData[i].medicine == 1) {
            vis.displayData[2].num += 1;
        }
        if (vis.filteredData[i].marital == 1) {
            vis.displayData[5].num += 1
        }
    }

    for (var i = 0; i < vis.displayData.length; i++) {
        vis.displayData[i].perc = Math.round((10000.*vis.displayData[i].num) / vis.filteredData.length)/100;
    }


    vis.displayData.sort(function(x,y) {

        return d3.ascending(x.assoc, y.assoc)  
    })

    vis.updateVis();
}

BarChart2.prototype.filterData = function(d) {
    var vis = this;
    return getIllness(d, vis.illness);
}

BarChart2.prototype.filterIll = function(d) {
    var vis = this;
    return (!getIllness(d, "all"));
}



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

BarChart2.prototype.updateVis = function(){
    var vis = this;

    // (1) Update domains
    // (2) Draw rectangles
    // (3) Draw labels
    vis.categoryDomain = jQuery.unique(vis.displayData.map(function (d) {
        return d.assoc;
    }));

    vis.y.domain(vis.categoryDomain);

    vis.x.domain(vis.getXDomain());

    vis.rect = vis.chart.selectAll("rect.bar")
                .data(vis.displayData, function(d) { return d.assoc; });
    // Initialize, update, and exit bars
    vis.rect
        .enter()
        .append("rect")
        .on("mouseover", vis.tip.show)
        .on("mouseout", vis.tip.hide);

    vis.rect
        .transition()
        .duration(250)
        .attr("height", vis.y.rangeBand())
        .attr("width", function(d) {
            return vis.x(d.perc);
        })
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", function(d) {
            return vis.y(d.assoc);
        })
        .attr("fill", function(d) {
            return vis.colorScale(d.perc);
        });


        if (typeof vis.avgLines != "undefined") {
            for (var i = 0; i < vis.avgLines.length; i++) {
                vis.avgLines[i].remove();
            }
        }   
        vis.avgLines = new Array()

        for (var i = 0; i < vis.displayData.length; i++) {
            vis.avgLines[i] = vis.chart
                .datum(i)
                .append("line")
                .attr("class", "avg-line-2")
                .on("mouseover", function(d) {
                    vis.notIllPerc = Math.round(100*vis.notIllAssocs[d].perc)/100.
                    vis.tip2.show();
                })
                .on("mouseout", vis.tip2.hide);;
            vis.avgLines[i]
                .attr("x1", vis.x(vis.notIllAssocs[i].perc))
                .attr("y1", vis.y(vis.notIllAssocs[i].assoc))
                .attr("x2", vis.x(vis.notIllAssocs[i].perc))
                .attr("y2", vis.y(vis.notIllAssocs[i].assoc) + vis.y.rangeBand())
        }
    vis.rect.exit().remove();

    // Add the chart title
    vis.title.text(function(d) {
        return "Incidence (%) of Associations for Sufferers of " + formatIllness(vis.illness) + "";
    });

    // Update the axes
    vis.svg.select(".x-axis").transition().duration(250).call(vis.xAxis);
    vis.svg.select(".y-axis").transition().duration(250).call(vis.yAxis);
}

// Figure out which attribute we're using
BarChart2.prototype.setAttributes = function() {
    var vis = this;
    vis.illness = d3.select("#" + vis.illnessSelectorElement).property("value");
}

BarChart2.prototype.getXDomain = function() {
    var vis = this;

    var checkBox = document.getElementById(vis.checkboxSelectorElement);
    if (checkBox.checked) {
        var maxPercent = d3.max(vis.displayData, function(d) {
            return d.perc;
        })
        return [0,Math.ceil(maxPercent/10.0)*10];
    } else {
        return [0,100];
    }
}

BarChart2.prototype.handleRace = function(race) {
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

BarChart2.prototype.handleAge = function(age) {
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

BarChart2.prototype.handleEnv = function(env) {
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
