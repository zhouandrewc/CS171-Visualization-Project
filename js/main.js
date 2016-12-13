d3.tsv("data/cpes-condensed.tsv", function(data) {
    //console.log("Data loading complete. Work with dataset.");
    //console.log(data);

    // Add the charts
    var pie = new PieChart("pie-area", "center-variable", data);
    var bar = new BarChart("bar-area-1", "demographic-variable", "illness-variable", "y-axis-check", data);
    var bar2 = new BarChart2("bar-area-2", "illness-variable-2", "x-axis-check", data);
    var burst = new BurstChart("burst-area", "center-variable", data);

    d3.select("#center-variable").on("change", function() {
        pie.wrangleData();
        burst.wrangleData();
    });
 });
