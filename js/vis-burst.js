

/*
 * BarChart - Object constructor function
 * @param _parentElement    -- the HTML element in which to draw the bar charts
 * @param _centerSelector -- the selector for the center
 * @param _data -- the dataset 
 *
 */

BurstChart = function(_parentElement, _centerSelector, _data){
    this.parentElement = _parentElement;
    this.centerSelector = _centerSelector;
    this.data = _data;
    this.displayData = _data;

    this.initVis();
}

/*
 * Initialize visualization (static content; e.g. SVG area, axes)
 */

BurstChart.prototype.initVis = function(){
    var vis = this;

    // Create SVG
    vis.margin = {top: -35, right: 40, bottom: 0, left: 50};

    vis.height = 500 - vis.margin.top - vis.margin.bottom;
    vis.width = 525 - vis.margin.left - vis.margin.right;

    vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.width/2 + "," + (25+vis.height/2) + ")");

    // Scales and axes
    vis.x = d3.scale.ordinal()
        .rangeRoundBands([0, vis.width], 0.1);

    vis.y = d3.scale.linear()
        .range([0, vis.height]);

    vis.colorScale = d3.scale.ordinal();
    vis.colors = ['#7fc97f','#beaed4','#fdc086','#ffff99','#386cb0'];

    // Add the chart title
    vis.title = vis.svg.append("text")
        .attr("class", "bar-chart-title")
        .attr("transform", "translate(" + -vis.width/2+ "," + -vis.height/2 + ")");


    vis.illnessSort = new Sortable(simpleList, {
        dataIdAttr: 'data-id',
        setData: function (/** DataTransfer */dataTransfer, /** HTMLElement*/dragEl) {
            dataTransfer.setData('Text', dragEl.textContent); // `dataTransfer` object of HTML5 DragEvent
        },
        // Element dragging ended
        onEnd: function (/**Event*/evt) {

        if (vis.center != "none") {
            var order = vis.illnessSort.toArray();
            order.splice(order.indexOf(fullName(vis.center)),1);
            vis.illnessSort.sort([fullName(vis.center)].concat(order));
        }
            vis.wrangleData();
            evt.oldIndex;  // element's old index within parent
            evt.newIndex;  // element's new index within parent
        },
    });
    vis.updateVis();

    // Add the chart title
    /*vis.svg.append("text")
        .attr("class", "bar-chart-title")
        .text("Generic Burst Chart")
        .attr("transform", "translate(10,-7)");*/

    // Set the listener for the select box and bind vis as this in updateChoropleth so 
    // it works properly
    d3.selectAll(".comorbidBox").on("change", vis.handleCheckboxes.bind(vis));
    //d3.select("#" + vis.demoSelectorElement).on("change", vis.wrangleData.bind(vis));
    //d3.select("#" + vis.illnessSelectorElement).on("change", vis.wrangleData.bind(vis));
    //d3.select("#" + vis.checkboxSelectorElement).on("change", vis.wrangleData.bind(vis));
    // (Filter, aggregate, modify data)
    vis.wrangleData();
}



/*
 * Data wrangling
 */

BurstChart.prototype.wrangleData = function(){
    var vis = this;

    vis.setAttributes();

   
    vis.filteredData = vis.data.filter(vis.filterFunc.bind(vis));
   
    vis.displayData = new Array(Math.pow(2,vis.numCircles)).fill(0);;
    for (var i = 0; i < vis.filteredData.length; i++) {
        vis.displayData[Math.pow(2,vis.numCircles)-1-vis.calcArrayValue(vis.getIllnessArray(vis.filteredData[i]))] += 1;
    }
    vis.total = vis.filteredData.length;

    vis.arcData = [];
    for (var i = 0; i < vis.numCircles; i++) {
        vis.arcData.push(vis.compressArray(i));
    }


    document.getElementById("depressionCheck").style["background-color"] = vis.colors[0];
    document.getElementById("anxietyCheck").style["background-color"] = vis.colors[2];
    document.getElementById("bipolarCheck").style["background-color"] = vis.colors[1];
    document.getElementById("ptsdCheck").style["background-color"] = vis.colors[3];
    document.getElementById("adhdCheck").style["background-color"] = vis.colors[4];
    
    vis.updateVis();
    vis.handleCheckboxes();

}

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

BurstChart.prototype.updateVis = function(){
    var vis = this;



    vis.colorScale.domain([0,vis.numCircles-1]);

    vis.angleScale = d3.scale.linear()
        .domain([0, vis.total])
        .range([0, 2 * Math.PI]);

    vis.arc = d3.svg.arc()
        .startAngle(function(d) { return d.startAngle; })
        .endAngle(function(d) { return d.endAngle; })
        .innerRadius(function(d) { return (d.index+1) * 40; })
        .outerRadius(function(d) { return (d.index+2) * 40; });

    var toRemove = vis.svg.selectAll("path");
    if (typeof toRemove != "undefined") {
        toRemove.remove();
    }   
    toRemove = vis.svg.selectAll("circle");
    if (typeof toRemove != "undefined") {
        toRemove.remove();
    }   

    vis.centerCircle = vis.svg.append("circle")
        .attr("r", 40)
        .attr("fill", function(d) {
            if (vis.center == "none") {
                return "#f7f7f7";
            } else if (vis.center == "depression") {
                return vis.colors[0];
            } else if (vis.center == "bipolar") {
                return vis.colors[1];
            } else if (vis.center == "anxiety") {
                return vis.colors[2];
            } else if (vis.center == "ptsd") {
                return vis.colors[3];
            } else if (vis.center == "adhd") {
                return vis.colors[4];
            }            
        })
        .attr("stroke", "black");

    if (typeof vis.center != "undefined") {
        vis.title.text(function(d) {
            return "Comorbid Conditions Suffered for Central Illness: " + formatIllness(vis.center);
        });
    }

    for (var i = 0; i < vis.numCircles; i++) {
        var path = vis.svg.selectAll("path.c" + i.toString())
            .data(vis.arcData[i])
            .enter().append("path")
            .attr("d", vis.arc)
            .attr("class", "c" + i.toString())
            .attr("id", function(d) {
                return "arc" + d.arcNum;
            })
            .attr("fill", function(d) {
                if (d.filled) {
                    var theIllness = vis.illnessOrder[d.index];
                    switch (theIllness) {
                        case "Depression":
                            return vis.colors[0];
                        case "Bipolar":
                            return vis.colors[1];
                        case "Anxiety":
                            return vis.colors[2];
                        case "PTSD":
                            return vis.colors[3];
                        case "ADHD":
                            return vis.colors[4];
                    }
                    return ;
                } else {
                    return "transparent";
                    return "#f7f7f7";
                }
            })
            .attr("stroke", function(d) {
                if (d.filled) {
                    return "black";
                } else {

                    return "transparent";
                    return "#f7f7f7";
                }
            })
            .on("click", function(d) {
                if (d.filled) {

                }
            });
    }

    // create a legend with the overall percentages
}


/* Get the array of illnesses the individual has */

BurstChart.prototype.getIllnessArray = function(d) {
    var vis = this;

    var depression = (d.mdd == 1) || (d.dysthymia == 1);
    var bipolar = (d.bipolari == 1) || (d.bipolarii == 1) || (d.mania == 1) || (d.bipolarsub == 1) || (d.hypomania == 1);
    var anxiety = (d.gad == 1) || (d.adultsepanx == 1) || (d.sepanx == 1) || (d.panicdisorder == 1) || (d.socialphobia == 1) || (d.specphobia == 1) || (d.agorawopanic == 1) || (d.agorawithpanic == 1);
    var ptsd = (d.ptsd == 1);
    var adhd = (d.add == 1);


    
    vis.illnessOrder = vis.illnessSort.toArray();

    anxIndex = vis.illnessOrder.indexOf("Anxiety");
    depIndex = vis.illnessOrder.indexOf("Depression");
    ptsdIndex = vis.illnessOrder.indexOf("PTSD");
    bipolarIndex = vis.illnessOrder.indexOf("Bipolar");
    adhdIndex = vis.illnessOrder.indexOf("ADHD");

    if (vis.center == "anxiety") {
        vis.illnessOrder.splice(anxIndex, 1);
    } else if (vis.center == "ptsd") {
        vis.illnessOrder.splice(ptsdIndex, 1);
    } else if (vis.center == "depression") {
        vis.illnessOrder.splice(depIndex, 1);
    } else if (vis.center == "bipolar") {
        vis.illnessOrder.splice(bipolarIndex, 1);
    } else if (vis.center == "adhd") {
        vis.illnessOrder.splice(adhdIndex, 1);
    }

    anxIndex = vis.illnessOrder.indexOf("Anxiety");
    depIndex = vis.illnessOrder.indexOf("Depression");
    ptsdIndex = vis.illnessOrder.indexOf("PTSD");
    bipolarIndex = vis.illnessOrder.indexOf("Bipolar");
    adhdIndex = vis.illnessOrder.indexOf("ADHD");

    if (vis.center == "none") {
        var theArray = [0,0,0,0,0]
        theArray[anxIndex] = anxiety;
        theArray[depIndex] = depression;
        theArray[ptsdIndex] = ptsd;
        theArray[bipolarIndex] = bipolar;
        theArray[adhdIndex] = adhd;
        var colorArray = new Array();
        colorArray[anxIndex] = vis.colors[2];
        colorArray[depIndex] = vis.colors[0];
        colorArray[ptsdIndex] = vis.colors[3];
        colorArray[bipolarIndex] = vis.colors[1];
        colorArray[adhdIndex] = vis.colors[4];
        vis.colorScale.range(colorArray)
        return theArray;
    } else {
        var theArray = [0,0,0,0]
        var colorArray = new Array();
        if (vis.center != "anxiety") {
            theArray[anxIndex] = anxiety;
            colorArray[anxIndex] = vis.colors[2];
        } 
        if (vis.center != "depression") {
            theArray[depIndex] = depression;
            colorArray[depIndex] = vis.colors[0];
        } 
        if (vis.center != "ptsd") {
            theArray[ptsdIndex] = ptsd;
            colorArray[ptsdIndex] = vis.colors[3];
        } 
        if (vis.center != "adhd") {
            theArray[adhdIndex] = adhd;
            colorArray[adhdIndex] = vis.colors[4];
        } 
        if (vis.center != "bipolar") {
            theArray[bipolarIndex] = bipolar;
            colorArray[bipolarIndex] = vis.colors[1];
        }
        vis.colorScale.range(colorArray)
        return theArray;
    }
}

/* Calculate the value that we assign to this array */
BurstChart.prototype.calcArrayValue = function(illnesses) {
    var value = 0;
    for (var i = 0; i < illnesses.length; i++) {
        value += Math.pow(2,illnesses.length-(i+1)) * illnesses[i];
    }
    return value;
}

/* Turn the array into a number that we can use to identify the arc */
BurstChart.prototype.compressArray = function(illnessNum) {
    var vis = this;

    var numIntervals = Math.pow(2,(illnessNum+1));
    var intervalLength = Math.pow(2,vis.numCircles)/numIntervals;
    var arcArray = Array(numIntervals).fill(0);

    for (var i = 0; i < numIntervals; i++) {
        for (var j = 0; j < intervalLength; j++) {
            arcArray[i] += vis.displayData[i * intervalLength + j];
        }
    }

    var cumArcArray = arcArray.slice();
    for (var i = cumArcArray.length-1; i >= 0; i--) {
        for (var j = i+1; j < cumArcArray.length; j++) {
            cumArcArray[j] += cumArcArray[i];
        }
    }
    var cumArcArray = [0].concat(cumArcArray.slice(0,cumArcArray.length-1))
    
    var compressedArray = [];
    for (var i = 0; i < arcArray.length; i++) {
        var theNum = Math.pow(2,vis.numCircles-1-illnessNum);
        for (var j = 0; j < illnessNum; j++) {
            theNum += Math.pow(2,vis.numCircles-1-j);
        }
        theNum -= Math.pow(2,vis.numCircles-illnessNum)* Math.floor(i/2);

        var item = {
            startAngle: (2*Math.PI*cumArcArray[i])/vis.total,
            endAngle: (2*Math.PI*(cumArcArray[i] + arcArray[i]))/vis.total,
            filled: ((i % 2) == 0),
            index: illnessNum,
            arcNum: theNum
        };
        compressedArray.push(item);
    }

    return compressedArray;
}

BurstChart.prototype.filterData = function(d) {
    var vis = this;

    if (vis.demo == "race" || vis.demo == "environment") {
        return (vis.getDemo(d) != "Other");
    }
    return true;

}

// Figure out which attribute we're using
BurstChart.prototype.setAttributes = function() {
    var vis = this;
    d3.selectAll(".comorbidCheck").style("opacity", 1);
    d3.selectAll(".comorbidBox").property("checked", false)
    d3.selectAll(".comorbidBox").property("disabled", false)

    vis.center = d3.select("#" + vis.centerSelector).property("value");
    if (vis.center == "none") {
        vis.numCircles = 5;
    } else {
        
        var order = vis.illnessSort.toArray();
        order.splice(order.indexOf(fullName(vis.center)),1);
        vis.illnessSort.sort([fullName(vis.center)].concat(order));


        vis.numCircles = 4;
        var removeCheck = document.getElementById(vis.center + "Check");
        removeCheck.style["opacity"] = 0.5;
        var removeBox = document.getElementById(vis.center + "Box");
        removeBox.checked = true;
        removeBox.disabled = true;
    }

}

BurstChart.prototype.handleCheckboxes = function() {
    var vis = this;

    vis.checkFilteredData = vis.filteredData;
    var numIllnesses = 4;
    if (vis.center == "none") {
        numIllnesses = 5;
    }
    for (var i = 0; i < numIllnesses; i++) {
        var theIllness = vis.illnessOrder[i];
        if (document.getElementById(theIllness.toLowerCase() + "Box").checked) {
            vis.checkFilterVar = theIllness.toLowerCase();
            vis.checkFilteredData = vis.checkFilteredData.filter(vis.checkFilter.bind(vis))
        }
    }
    var comPercent = (100.0*vis.checkFilteredData.length)/vis.filteredData.length;

    document.getElementById("comorbid-text").innerHTML = "The comorbidity rate for individuals with the specified combination of diseases is: " + (comPercent.toPrecision(4)).toString() + "%.";


    // Calculate the arc corresponding to the selection and highlight it
    for (var i = 0; i < Math.pow(2, numIllnesses); i++) {
        var theArc = d3.select("#arc" + i);
        if (theArc != null) {
            d3.select("#arc" + i).style("opacity", 0.5);
            d3.select("#arc" + i).attr("stroke-width", 1);
            d3.select("#arc" + i).attr("stroke", "black");
        }           
    }

    var theArc = 0;
    for (var j = 0; j < vis.numCircles; j++) {
        var theIllness = vis.illnessOrder[j];
        
        if (theIllness.toLowerCase() != vis.center) {// && document.getElementById(theIllness.toLowerCase() + "Box").checked) {
            if (document.getElementById(theIllness.toLowerCase() + "Box").checked) {
                theArc += Math.pow(2,vis.numCircles-j-1);
            }
        } 
    }
    d3.select("#arc" + theArc).style("opacity", 1);
    d3.select("#arc" + theArc).attr("stroke", "red").attr("stroke-width", 2);
}

BurstChart.prototype.checkFilter = function(d) {
    var vis = this;

    var depression = (d.mdd == 1) || (d.dysthymia == 1);
    var bipolar = (d.bipolari == 1) || (d.bipolarii == 1) || (d.mania == 1) || (d.bipolarsub == 1) || (d.hypomania == 1);
    var anxiety = (d.gad == 1) || (d.adultsepanx == 1) || (d.sepanx == 1) || (d.panicdisorder == 1) || (d.socialphobia == 1) || (d.specphobia == 1) || (d.agorawopanic == 1) || (d.agorawithpanic == 1);
    var ptsd = (d.ptsd == 1);
    var adhd = (d.add == 1);
    switch(vis.checkFilterVar) {
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

BurstChart.prototype.filterFunc = function(d) {
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
