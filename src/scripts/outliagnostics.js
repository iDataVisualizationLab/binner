import {Delaunator} from "./modules/delaunator";
import {createGraph} from "./modules/kruskal-mst";
import {mst} from "./modules/kruskal-mst";
import {Outlying} from "./modules/outlying";
import {Normalizer} from "./modules/normalizer";
import {LeaderBinner} from "./modules/leaderbinner";
import {Binner} from "./modules/binner";
import _ from "underscore";
// import {Binner} from './modules/binner';
(function(window){
    /**
     * initialize a scagnostic object
     * @param inputPoints   {*[][]} set of points from the scatter plot
     * @returns {*[][]}
     */
    window.outliagnostics = function(inputPoints, binType,startBinGridSize, isNormalized, isBinned, outlyingUpperBound) {
        //Clone it to avoid modifying it.
        let points = inputPoints.slice(0);
        let normalizedPoints = points;
        /******This section is about normalizing the data******/
        if(!isNormalized){
            let normalizer = new Normalizer(points);
                normalizedPoints = normalizer.normalizedPoints;
        }
        /******This section is about finding number of bins and binners******/
        let sites = null;
        let bins = null;

        if(!isBinned){//Only do the binning if needed.
            let binSize = null;
            let binner = null;
            let binRadius = 0;
            if(!startBinGridSize){
                startBinGridSize = 40;
            }
            bins = [];
            let minNumOfBins = 50;
            let maxNumOfBins = 250;
            //Don't do the binning if the unique set of values are less than 50. Just return the unique set.
            let uniqueKeys = _.uniq(normalizedPoints.map(p=>p.join(',')));
            let groups = _.groupBy(normalizedPoints, p=>p.join(','));
            if(uniqueKeys.length<minNumOfBins){
                uniqueKeys.forEach(key=>{
                    let bin = groups[key];
                    //Take the coordinate of the first point in the group to be the bin leader (they should have the same points actually=> so just take the first one.
                    bin.x = bin[0][0];
                    bin.y = bin[0][1];
                    bin.binRadius = 0;
                    bins.push(bin);
                });
            }else{
                do{
                    //Start with 40x40 bins, and divided by 2 every time there are more than maxNumberofBins none empty cells, increase 5 (+5) if less than minNumberOfBins
                    if(binSize===null){
                        binSize = startBinGridSize;
                    }else if(bins.length>maxNumOfBins){
                        binSize = binSize/2;
                    }else if(bins.length<minNumOfBins){
                        binSize = binSize + 5;
                    }
                    if(binType==="hexagon"){
                        // This section uses hexagon binning
                        let shortDiagonal = 1/binSize;
                        binRadius = Math.sqrt(3)*shortDiagonal/2;
                        binner = new Binner().radius(binRadius).extent([[0, 0], [1, 1]]);//extent from [0, 0] to [1, 1] since we already normalized data.
                        bins = binner.hexbin(normalizedPoints);
                    }else if(!binType || binType==="leader"){
                        // This section uses leader binner
                        binRadius = 1/(binSize*2);
                        binner = new LeaderBinner(normalizedPoints, binRadius);
                        bins = binner.leaders;
                    }
                }while(bins.length > maxNumOfBins || bins.length < minNumOfBins);
            }
            sites = bins.map(d => [d.x, d.y]); //=>sites are the set of centers of all bins
        }else{
            sites = normalizedPoints;
        }

        /******This section is about the triangulating and triangulating results******/
        //Triangulation calculation
        let delaunay = Delaunator.from(sites);
        let triangleCoordinates = delaunay.triangleCoordinates();
        /******This section is about the spanning tree and spanning tree results******/
        //Spanning tree calculation
        let graph = createGraph(triangleCoordinates);
        let mstree = mst(graph);
        /******This section is about the outlying score and outlying score results******/
        let outlying = new Outlying(mstree, outlyingUpperBound);
        let outlyingScore = outlying.score();
        outputValue("bins", bins);
        outputValue("outlyingScore", outlyingScore);
        outputValue("outlyingUpperBound", outlying.upperBound);

        return window.outliagnostics;
        function outputValue(name, value){
            window.outliagnostics[name] = value;
        }
    };

})(window);