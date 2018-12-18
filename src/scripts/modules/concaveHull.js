import {quantile} from 'simple-statistics';
import {distance} from "./kruskal-mst";
import * as polygon from "d3-polygon";
import {createGraph, mst} from "./kruskal-mst";


export class ConcaveHull{
    constructor(distance){
        if(!distance){
            this.calculateDistance = this.stdevDistance;
        }
        else if(typeof distance === "function"){
            this.calculateDistance = distance;
        }else if(typeof distance === "number"){
            this.calculateDistance = function () {return distance;};
        }
        this.padding = 0;
    }
    coveringConcaveHull(delaunay){
        let theMst = mst(createGraph(delaunay));
        let allLengths = theMst.links.map(l=>l.weight);
        let allPoints = theMst.nodes.map(n=>n.id);
        //We will start with q7
        let qx = 0.5,
            increment = 0.01;
        let theHull = null;
        do{
            qx = qx + increment;
            let longEdge = quantile(allLengths, qx);
            theHull = this.concaveHull(delaunay, longEdge);
        }while(!coverAllPoints(theHull, allPoints));

        return theHull;

        function coverAllPoints(hull, points) {
            for (let i = 0; i < points.length; i++) {
                let point = points[i];
                let pointIsCovered = false;
                for (let j = 0; j < hull.length; j++) {
                    if(polygon.polygonContains(hull[j], point)){
                        pointIsCovered = true;
                        break;
                    }
                }
                if(!pointIsCovered){
                    return false;
                }
            }
            return true;
        }
    }
    /**
     * generate the concave hull.
     * @param delaunay is inform of coordinates of triangulated triangles (3 points per triangle)
     * @returns {Array}
     */
    concaveHull(delaunay, longEdge) {
        if(!longEdge){
            longEdge = this.calculateDistance(delaunay);
        }
        let mesh = delaunay.filter(function (d) {
            return distance(d[0], d[1]) < longEdge && distance(d[0], d[2]) < longEdge && distance(d[1], d[2]) < longEdge
        })

        var counts = {},
            edges = {},
            r,
            result = [];
        // Traverse the edges of all triangles and discard any edges that appear twice.
        mesh.forEach(function (triangle) {
            for (var i = 0; i < 3; i++) {
                var edge = [triangle[i], triangle[(i + 1) % 3]].sort(ascendingCoords).map(String);
                (edges[edge[0]] = (edges[edge[0]] || [])).push(edge[1]);
                (edges[edge[1]] = (edges[edge[1]] || [])).push(edge[0]);
                var k = edge.join(":");
                if (counts[k]) delete counts[k];
                else counts[k] = 1;
            }
        });

        while (1) {
            var k = null;
            // Pick an arbitrary starting point on a boundary.
            for (k in counts) break;
            if (k == null) break;
            result.push(r = k.split(":").map(function (d) {
                return d.split(",").map(Number);
            }));
            delete counts[k];
            var q = r[1];
            while (q[0] !== r[0][0] || q[1] !== r[0][1]) {
                var p = q,
                    qs = edges[p.join(",")],
                    n = qs.length;
                for (var i = 0; i < n; i++) {
                    q = qs[i].split(",").map(Number);
                    var edge = [p, q].sort(ascendingCoords).join(":");
                    if (counts[edge]) {
                        delete counts[edge];
                        r.push(q);
                        break;
                    }
                }
            }
        }

        if (this.padding !== 0) {
            result = pad(result, this.padding);
        }

        return result;

        function pad(bounds, amount) {
            var result = [];
            bounds.forEach(function (bound) {
                var padded = [];

                var area = 0;
                bound.forEach(function (p, i) {
                    // http://forums.esri.com/Thread.asp?c=2&f=1718&t=174277
                    // Area = Area + (X2 - X1) * (Y2 + Y1) / 2

                    var im1 = i - 1;
                    if (i == 0) {
                        im1 = bound.length - 1;
                    }
                    var pm = bound[im1];
                    area += (p[0] - pm[0]) * (p[1] + pm[1]) / 2;
                });
                var handedness = 1;
                if (area > 0) handedness = -1
                bound.forEach(function (p, i) {
                    // average the tangent between
                    var im1 = i - 1;
                    if (i == 0) {
                        im1 = bound.length - 2;
                    }
                    //var tp = getTangent(p, bound[ip1]);
                    var tm = getTangent(p, bound[im1]);
                    //var avg = { x: (tp.x + tm.x)/2, y: (tp.y + tm.y)/2 };
                    //var normal = rotate2d(avg, 90);
                    var normal = rotate2d(tm, 90 * handedness);
                    padded.push([p[0] + normal.x * amount, p[1] + normal.y * amount])
                })
                result.push(padded)
            })
            return result
        }

        function getTangent(a, b) {
            var vector = {x: b[0] - a[0], y: b[1] - a[1]}
            var magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
            vector.x /= magnitude;
            vector.y /= magnitude;
            return vector
        }

        function rotate2d(vector, angle) {
            //rotate a vector
            angle *= Math.PI / 180; //convert to radians
            return {
                x: vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
                y: vector.x * Math.sin(angle) + vector.y * Math.cos(angle)
            }
        }

        function ascendingCoords(a, b) {
            return a[0] === b[0] ? b[1] - a[1] : b[0] - a[0];
        }
    }
    stdevDistance(delaunay) {
        var sides = [];
        delaunay.forEach(function (d) {
            sides.push(distance(d[0], d[1]));
            sides.push(distance(d[0], d[2]));
            sides.push(distance(d[1], d[2]));
        });

        var dev = d3.deviation(sides);
        var mean = d3.mean(sides);

        return mean + dev;
    }
    qDistance(delaunay){

    }
}
export function concaveHullArea(concaveHull) {
    let concaveArea = 0;
    concaveHull.forEach(hull => {
        let area = polygon.polygonArea(hull);
        concaveArea += area>0?area:-area;
    });
    return concaveArea;
}
export function concaveHullLength(concaveHull) {
    let concaveLength = 0;
    concaveHull.forEach(hull => {
        concaveLength += polygon.polygonLength(hull);
    });
    return concaveLength;
}