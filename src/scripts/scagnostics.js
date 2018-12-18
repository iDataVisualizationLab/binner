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
import {Binner} from "./modules/binner";
import _ from "underscore"
// import {Binner} from './modules/binner';
(function(window){
    /**
     * initialize a scagnostic object
     * @param inputPoints   {*[][]} set of points from the scatter plot
     * @returns {*[][]}
     */
    window.scagnostics = function(inputPoints, binType, startBinGridSize) {
        //TODO: If the input points have less than 3 unique values => it is pointless to do all scagnostics => should check this. We leave this for the user to check to improve performance.
        //Clone it to avoid modifying it.
        let points = inputPoints.slice(0);
        /******This section is about normalizing the data******/
        let normalizer = new Normalizer(points);
        let normalizedPoints = normalizer.normalizedPoints;
        outputValue("normalizer", normalizer);
        outputValue("normalizedPoints", normalizedPoints);
        /******This section is about finding number of bins and binners******/
        let binSize = null;
        let bins = [];
        let binner = null;
        let binRadius = 0;
        if(!startBinGridSize){
            startBinGridSize = 40;
        }
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
        let sites = bins.map(d => [d.x, d.y]); //=>sites are the set of centers of all bins
        //Assigning output results
        outputValue("binner", binner);
        outputValue("bins", bins);
        outputValue("binSize", binSize);
        outputValue("binRadius", binRadius)
        outputValue("binnedSites", sites);

        /******This section is about the triangulating and triangulating results******/
        //Triangulation calculation
        let delaunay = Delaunator.from(sites);
        let triangles = delaunay.triangles;
        let triangleCoordinates = delaunay.triangleCoordinates();
        //Assigning output values
        outputValue("delaunay", delaunay);
        outputValue("triangles", triangles);
        outputValue("triangleCoordinates", triangleCoordinates);

        /******This section is about the spanning tree and spanning tree results******/
        //Spanning tree calculation
        let graph = createGraph(triangleCoordinates);
        let mstree = mst(graph);
        //Assigning the output values
        outputValue("graph", graph);
        outputValue("mst", mstree);

        /******This section is about the outlying score and outlying score results******/
        let outlying = new Outlying(mstree);
        let outlyingScore = outlying.score();
        let outlyingUpperBound = outlying.upperBound;
        let outlyingLinks = outlying.links();
        let outlyingPoints = outlying.points();
        let noOutlyingTree = outlying.removeOutlying();
        outputValue("outlyingScore", outlyingScore);
        outputValue("outlyingUpperBound", outlyingUpperBound);
        outputValue("outlyingLinks", outlyingLinks);
        outputValue("outlyingPoints", outlyingPoints);
        outputValue("noOutlyingTree", noOutlyingTree);

        /******This section is about the skewed score and skewed score results******/
        let skewed = new Skewed(noOutlyingTree);
        outputValue("skewedScore", skewed.score());

        /******This section is about the sparse score and sparse score results******/
        let sparse = new Sparse(noOutlyingTree);
        outputValue("sparseScore", sparse.score());

        /******This section is about the clumpy score and clumpy score results******/
        let clumpy = new Clumpy(noOutlyingTree);
        outputValue("clumpy", clumpy);
        outputValue("clumpyScore", clumpy.score());

        /******This section is about the striated score and striated score results******/
        let striated = new Striated(noOutlyingTree);
        let v2Corners = striated.getAllV2Corners();
        let obtuseV2Corners = striated.getAllObtuseV2Corners();
        outputValue("striatedScore", striated.score());
        outputValue("v2Corners", v2Corners);
        outputValue("obtuseV2Corners", obtuseV2Corners);

        /******This section is about the convex hull and convex hull results******/
        let convex = new Convex(noOutlyingTree);
        let convexHull = convex.convexHull();
        let noOutlyingTriangleCoordinates = convex.noOutlyingTriangleCoordinates();
        outputValue("noOutlyingTriangleCoordinates", noOutlyingTriangleCoordinates);
        outputValue("convexHull", convexHull);

        /******This section is about the concave hull and concave hull results******/
        let concaveHull = convex.concaveHull();
        outputValue("concaveHull", concaveHull);

        /******This section is about the convex score and convex score results******/
        let convexScore = convex.score();
        outputValue("convexScore", convexScore);

        /******This section is about the skinny score and skinny score results******/
        let skinny = new Skinny(concaveHull);
        let skinnyScore = skinny.score();
        outputValue("skinnyScore", skinnyScore);

        /******This section is about the stringy score and stringy score results******/
        let stringy = new Stringy(noOutlyingTree);
        let v1s = stringy.getAllV1s();
        let stringyScore = stringy.score();
        outputValue("v1s", v1s);
        outputValue("stringyScore", stringyScore);

        /******This section is about the monotonic score and monotonic score results******/
        let monotonic = new Monotonic(noOutlyingTree.nodes.map(n=>n.id));
        let monotonicScore = monotonic.score();
        outputValue("monotonicScore", monotonicScore);

        return window.scagnostics;
        function outputValue(name, value){
            window.scagnostics[name] = value;
        }
    };

})(window);