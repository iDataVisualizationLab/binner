//Inspired from https://github.com/d3/d3-hexbin/blob/master/src/hexbin.js
// even division
export function SquareBinner(){
    // let thirdPi = Math.PI/3,
    //     angles = [0, thirdPi, 2*thirdPi, 3*thirdPi, 4*thirdPi, 5*thirdPi];

    function pointVal(d){
        return d.val;
    }

    var val0 = 0,
        val1 = 1,
        dval,
        val = pointVal,
        r;

    function evenbin(points){
        var binsById = {}, bins = [], i, n = points.length;

        for (i = 0; i < n; ++i) {
            pval = val.call(null, point = points[i], i, points);
            if (pval.some(d=>isNaN(d))) continue;

            var point,
                pval,
                pi = pval.map((pvali,index) => Math.round(pval[index] = pvali / dval));

            var id = pi.reduce((accumulator, currentValue)=>accumulator+"-"+currentValue), bin = binsById[id];
            if (bin) bin.push(point);
            else {
                bins.push(bin = binsById[id] = [point]);
                bin.val = pi.map(d=>d*dval);
            }
        }

        return bins;
    }

    //Export it
    this.evenbin = evenbin;
    // this.centers = function(){
    //     var centers = [],
    //         j = Math.round(y0 / dy),
    //         i = Math.round(x0 / dx);
    //     for (var y = j * dy; y < y1 + r; y += dy, ++j) {
    //         for (var x = i * dx + (j & 1) * dx / 2; x < x1 + dx / 2; x += dx) {
    //             centers.push([x, y]);
    //         }
    //     }
    //     return centers;
    // };
    // this.mesh = function(){
    //     var fragment = hexagon(r).slice(0, 4).join("l");
    //     return hexbin.centers().map(function(p) { return "M" + p + "m" + fragment; }).join("");
    // };
    //Setters/getters
    this.val = function(_){
        return arguments.length ? (val = _, this) : val;
    }
    this.radius = function(_){
        return arguments.length ? (r= +_, dval = r, this): r;
    }
    this.size = function(_) {
        return arguments.length ? (val0 = 0, val1 = +_, this) : (val1 - val0);
    };
    // this.extent = function(_){
    //     return arguments.length ? (x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1], this): [[x0, y0], [x1, y1]];
    // }

    return this.radius(1);
}