/*
* Helper functions for the visualizations
*
*/
formatDemo = function(demo) {
    if (demo == "immigrant") {
        return "Immigration Status";
    } else if (demo == "education") {
        return "Educational Attainment";
    } else {
        return demo.substring(0,1).toUpperCase() + demo.substring(1);
    }
}

formatIllness = function(illness) {
    if (illness == "none") {
        return "No Base Illness"
    }
    if (illness == "adhd" || illness == "ptsd") {
        return illness.toUpperCase();
    } else if (illness == "all") {
        return "All Illnesses"
    } else if (illness == "bipolar") {
        return "Bipolar Disorder"
    } else {
        return illness.substring(0,1).toUpperCase() + illness.substring(1);
    }
}

fullName = function(illness) {
    if (illness == "anxiety") {
        return "Anxiety";
    } else if (illness == "depression") {
        return "Depression";
    } else if (illness == "adhd") {
        return "ADHD";
    } else if (illness == "ptsd") {
        return "PTSD";
    } else if (illness == "bipolar") {
        return "Bipolar";
    }
}

// Get the correct attribute
getIllness = function(d, illness) {
    switch(illness) {
    case "all":
        return (d.add == 1) || (d.ptsd == 1) || (d.bipolari == 1) || (d.bipolarii == 1) || (d.mania == 1) || (d.bipolarsub == 1) || (d.hypomania == 1) || (d.mdd == 1) || (d.dysthymia == 1) || (d.gad == 1) || (d.adultsepanx == 1) || (d.sepanx == 1) || (d.panicdisorder == 1) || (d.socialphobia == 1) || (d.specphobia == 1) || (d.agorawopanic == 1) || (d.agorawithpanic == 1); 
        break;
    case "depression":
        return (d.mdd == 1) || (d.dysthymia == 1);
        break;
    case "bipolar":
        return (d.bipolari == 1) || (d.bipolarii == 1) || (d.mania == 1) || (d.bipolarsub == 1) || (d.hypomania == 1);
        break;
    case "anxiety":
        return (d.gad == 1) || (d.adultsepanx == 1) || (d.sepanx == 1) || (d.panicdisorder == 1) || (d.socialphobia == 1) || (d.specphobia == 1) || (d.agorawopanic == 1) || (d.agorawithpanic == 1);
        break;
    case "ptsd":
        return (d.ptsd == 1);
    case "adhd":
        return (d.add == 1);
    default:
        break;
    }
}

trueFalsePercent = function(values) {
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