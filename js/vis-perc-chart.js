/*
 * Choropleth - Object constructor function
 * @param _parentElement    -- the HTML element in which to draw the bar choropleth
 *
 * Template for pie chart taken from https://bl.ocks.org/mbostock/3887235
 *
 * CS171 Project - Andrew Zhou and Lennon Bensaou
 */

PieChart = function(_parentElement, _centerSelector, _data) {
    this.parentElement = _parentElement;
    this.centerSelector = _centerSelector;
    this.data = _data
    this.initVis();
}

PieChart.prototype.initVis = function(){
    var vis = this;

    // Create SVG
    vis.margin = {top: 22, right: 40, bottom: 40, left: 40};

    vis.height = 450 - vis.margin.top - vis.margin.bottom;
    vis.width = 525 - vis.margin.left - vis.margin.right;
    vis.radius = Math.min(vis.width, vis.height) / 2;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.color = d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"]);

    vis.arc = d3.svg.arc()
        .outerRadius(vis.radius - 10)
        .innerRadius(0);

    vis.labelArc = d3.svg.arc()
        .outerRadius(vis.radius + 5)
        .innerRadius(vis.radius);

    vis.pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.count; });    

    // Set up tooltip
    vis.tip = d3.tip().attr('class', 'd3-tip')
                    .html(function(d) { 
                        return (Math.round(10000*d.value/vis.filteredData.length)/100).toString() + "%";
                    });
    vis.tip.direction('e');
    vis.svg.call(vis.tip);

    //d3.select("#" + vis.centerSelector).on("change", vis.wrangleData.bind(vis));
    vis.wrangleData();

}    

PieChart.prototype.wrangleData = function() {
    console.log("wRANGINGL PIE")
    var vis = this;
    vis.center = d3.select("#" + vis.centerSelector).property("value");

    if (vis.center == "none") {
        vis.displayData = [{numIllness: "None", count: 0, index: 0}, {numIllness: 1, count: 0, index: 1}, {numIllness: 2, count: 0, index: 2}, {numIllness: 3, count: 0, index: 3}, {numIllness: "4+", count: 0, index: 4}]
    } else {
        vis.displayData = [{numIllness: "None", count: 0, index: 0}, {numIllness: 1, count: 0, index: 1}, {numIllness: 2, count: 0, index: 2}, {numIllness: "3+", count: 0, index: 3}]
    }
    vis.filteredData = vis.data.filter(vis.filterFunc.bind(vis));
    for (i = 0; i < vis.filteredData.length; i++) {
        if (vis.center == "none") {
            vis.displayData[vis.countIllnesses(vis.filteredData[i])].count += 1;
        } else {
            vis.displayData[vis.countIllnesses(vis.filteredData[i])-1].count += 1;
        }
    }

    console.log(vis.displayData);
    vis.updateVis();
}

PieChart.prototype.filterFunc = function(d) {
    var vis = this;

    var depression = (d.mdd == 1) || (d.dysthymia == 1);
    var bipolar = (d.bipolari == 1) || (d.bipolarii == 1) || (d.mania == 1) || (d.bipolarsub == 1) || (d.hypomania == 1);
    var anxiety = (d.gad == 1) || (d.adultsepanx == 1) || (d.sepanx == 1) || (d.panicdisorder == 1) || (d.socialphobia == 1) || (d.specphobia == 1) || (d.agorawopanic == 1) || (d.agorawithpanic == 1);
    var ptsd = (d.ptsd == 1);
    var adhd = (d.add == 1);
    switch(vis.center) {
        case "none":
            return true;
        case "depression":
            return depression;
        case "bipolar":
            return bipolar;
        case "anxiety":
            return anxiety;
        case "ptsd":
            return ptsd;
        case "adhd":
            return adhd;
    }
    return true;
}

PieChart.prototype.countIllnesses = function(d) {
    var vis = this;

    var num = 0;
    if (d.add == "1") {
        num += 1;
    }
    if ((d.bipolari == 1) || (d.bipolarii == 1) || (d.mania == 1) || (d.bipolarsub == 1) || (d.hypomania == 1)) {
        num += 1;
    }
    if (d.ptsd == 1) {
        num += 1;
    }
    if ((d.gad == 1) || (d.adultsepanx == 1) || (d.sepanx == 1) || (d.panicdisorder == 1) || (d.socialphobia == 1) || (d.specphobia == 1) || (d.agorawopanic == 1) || (d.agorawithpanic == 1)) {
        num += 1;
    }  
    if ((d.mdd == 1) || (d.dysthymia == 1)) {
        num += 1;
    }         

    return Math.min(num, 4);
}

PieChart.prototype.updateVis = function() {
    var vis = this;

    var toRemove = vis.svg.selectAll(".arc");
    if (typeof toRemove != "undefined") {
        toRemove.remove();
    }

    var g = vis.svg.selectAll(".arc")
      .data(vis.pie(vis.displayData))
      .enter().append("g")
      .attr("transform", function(d) { return "translate(" + (vis.width/2).toString() + "," + (vis.height/2 + 20).toString() + ")"; })
      .attr("class", "arc");

    g.append("path")
      .attr("d", vis.arc)
      .style("fill", function(d) { return vis.color(d.data.index); })
      .on("mouseover", vis.tip.show)
      .on("mouseout", vis.tip.hide);

    g.append("text")
      .attr("transform", function(d) { return "translate(" + vis.labelArc.centroid(d) + ")"; })
      .attr("dy", ".35em")
      .text(function(d) { return d.data.numIllness; });

    vis.svg.append("text")
      .attr("id", "pie-title")
      .attr("transform", "translate(" + (vis.width/2).toString() + ",0)")
      .text("Number of Additional Mental Ilnesses Suffered");
}