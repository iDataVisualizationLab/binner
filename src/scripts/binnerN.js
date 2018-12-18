import {Delaunator} from "./modules/delaunator";
import {createGraph} from "./modules/kruskal-mst";
import {mst} from "./modules/kruskal-mst";
import {Outlying} from "./modules/outlying";
import {Skewed} from "./modules/skewed";
import {Sparse} from "./modules/sparse";
import {Clumpy} from "./modules/clumpy";
import {Striated} from "./modules/striated";
import {Convex} from "./modules/convex";
import {Skinny} from "./modules/skinny";
import {Stringy} from "./modules/stringy";
import {Monotonic} from "./modules/monotonic";
import {Normalizer} from "./modules/normalizer";
import {LeaderBinner} from "./modules/leaderbinner";
import {SquareBinner} from "./modules/squarebinner";
import _ from "underscore"
// import {Binner} from './modules/binner';
(function(window){
    /**
     * initialize a scagnostic object
     * @param inputPoints   {*[][]} set of points from the scatter plot
     * @returns {*[][]}
     */
    window.binnerN = function() {
        //TODO: If the input points have less than 3 unique values => it is pointless to do all scagnostics => should check this. We leave this for the user to check to improve performance.
        //Clone it to avoid modifying it.
        let startBinGridSize = 40,
            isNormalized = false,
            minNumOfBins = 50,
            maxNumOfBins = 250,
            inputPoints=[],
            points = [],
            normalizedPoints = [],
            binSize = null,
            bins = [],
            binner = null,
            binRadius = 0,
            updateRadius = true;

        outputValue("calculate", function () {
            points = inputPoints.slice(0);
            normalizedPoints = points;
            if(!isNormalized) {
                let normalizer = new Normalizer(points);
                normalizedPoints = normalizer.normalizedPoints;
                outputValue("normalizedFun", normalizer);
            }
            outputValue("normalizedPoints", normalizedPoints);
            /******This section is about finding number of bins and binners******/
            //Don't do the binning if the unique set of values are less than 50. Just return the unique set.
            let uniqueKeys = _.uniq(normalizedPoints.map(p=>p.join(',')));
            let groups = _.groupBy(normalizedPoints, p=>p.join(','));
            // if(uniqueKeys.length<minNumOfBins){
            //     uniqueKeys.forEach(key=>{
            //         let bin = groups[key];
            //         //Take the coordinate of the first point in the group to be the bin leader (they should have the same points actually=> so just take the first one.
            //         bin.val = bin[0];
            //         bin.binRadius = 0;
            //         bins.push(bin);
            //     });
            // }else{
            binSize = updateRadius? null:binSize;
                do{
                    //Start with 40x40 bins, and divided by 2 every time there are more than maxNumberofBins none empty cells, increase 5 (+5) if less than minNumberOfBins
                    if(binSize===null){
                        binSize = startBinGridSize;
                        updateRadius = false;
                    }else if(bins.length>maxNumOfBins){
                        binSize = binSize*0.9;
                    }else if(bins.length<minNumOfBins){
                        binSize = binSize + 5;
                    }

                    // }else if(!binType || binType==="leader"){
                    // This section uses leader binner
                    if(binType==="hexagon"){
                        // This section uses hexagon binning
                        let gridsize = 1/binSize;
                        binner = new SquareBinner().radius(gridsize);//extent from [0, 0] to [1, 1] since we already normalized data.
                        bins = binner.evenbin(normalizedPoints);
                    }else if(!binType || binType==="leader"){
                        binRadius = 1/(binSize*2);
                        binner = new LeaderBinner(normalizedPoints, binRadius);
                        bins = binner.leaders;
                    }
                }while(bins.length > maxNumOfBins || bins.length < minNumOfBins);
            // }
            let sites = bins.map(d => d.val); //=>sites are the set of centers of all bins
            //Assigning output results
            outputValue("binner", binner);
            outputValue("bins", bins);
            outputValue("binSize", binSize);
            outputValue("binRadius", binRadius);
            outputValue("binnedSites", sites);
            return window.binnerN;
        });

            outputValue("calculatePoint", function (siginput) {
            points = inputPoints.slice(0).concat(siginput);
            inputPoints=points;
            normalizedPoints = points;
            if(!isNormalized) {
                let normalizer = new Normalizer(points);
                normalizedPoints = normalizer.normalizedPoints;
                outputValue("normalizedFun", normalizer);
            }
            outputValue("normalizedPoints", normalizedPoints);
            /******This section is about finding number of bins and binners******/
                //Don't do the binning if the unique set of values are less than 50. Just return the unique set.
            let uniqueKeys = _.uniq(normalizedPoints.map(p=>p.join(',')));
            let groups = _.groupBy(normalizedPoints, p=>p.join(','));
            if(uniqueKeys.length<minNumOfBins){
                uniqueKeys.forEach(key=>{
                    let bin = groups[key];
                    //Take the coordinate of the first point in the group to be the bin leader (they should have the same points actually=> so just take the first one.
                    bin.val = bin[0];
                    bin.binRadius = updateRadius?0:binRadius;
                    bins.push(bin);
                });
            }else{
            do{
                    //Start with 40x40 bins, and divided by 2 every time there are more than maxNumberofBins none empty cells, increase 5 (+5) if less than minNumberOfBins
                    if(binSize===null){
                        binSize = startBinGridSize;
                    }else if(bins.length>maxNumOfBins*2){
                        binSize = binSize*0.9;
                    }else if(bins.length<minNumOfBins){
                        binSize = binSize + 5;
                    }

                    // }else if(!binType || binType==="leader"){
                    // This section uses leader binner
                    binRadius = 1/(binSize*2);
                    binner = new LeaderBinner(normalizedPoints, binRadius);
                    bins = binner.leaders;
                    //}
                }while(bins.length > maxNumOfBins*2 || bins.length < minNumOfBins);
            }
            let sites = bins.map(d => d.val); //=>sites are the set of centers of all bins
            //Assigning output results
            outputValue("binner", binner);
            outputValue("bins", bins);
            outputValue("binSize", binSize);
            outputValue("binRadius", binRadius);
            outputValue("binnedSites", sites);
            return window.binnerN;
        });



        outputValue("startBinGridSize", function (_) {
            return arguments.length ? (startBinGridSize = _, window.binnerN) : startBinGridSize;

        });
        outputValue("isNormalized", function (_) {
            return arguments.length ? (isNormalized = _, window.binnerN) : isNormalized;

        });
        outputValue("minNumOfBins", function (_) {
            return arguments.length ? (minNumOfBins = _, window.binnerN) : minNumOfBins;

        });
        outputValue("maxNumOfBins", function (_) {
            return arguments.length ? (maxNumOfBins = _, window.binnerN) : maxNumOfBins;

        });
        outputValue("data", function (_) {
            return arguments.length ? (inputPoints = _, window.binnerN) : inputPoints;
        });
        outputValue("updateRadius", function (_) {
            if (arguments.length&& _)
                binSize=null;
            return arguments.length ? (updateRadius = _, window.binnerN) : updateRadius;
        });
        return window.binnerN;
        function outputValue(name, value){
            window.binnerN[name] = value;
        }
    };

})(window);