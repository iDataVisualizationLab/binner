import _ from 'underscore';

export class Normalizer {
    constructor(points) {
        this.points = points.slice(0);
        let Arr = this.Arr = _.unzip(this.points),
            maxAI = this.maxAI = Arr.map(d=>_.max(d)),
            minAI = this.minAI = Arr.map(d=>_.min(d)),
            rangeAI = this.rangeAI = Arr.map((d,i)=>((maxAI[i]!=minAI[i]) ? maxAI[i] - minAI[i]: 1)),
            normalizedArr = this.normalizedArr = Arr.map((d,i)=>d.map(x => (x - minAI[i]) / rangeAI[i]));
        this.normalizedPoints = _.zip.apply(_,normalizedArr);
        //Add one step to pass the data over if there is.
        let length = this.points.length;
        for (let i = 0; i < length; i++) {
            this.normalizedPoints[i].data = this.points[i].data;
        }
    }

    /**
     * Input a set of points in this scale range [0, 1] and will be scaled back to
     * - Original scale ([minX, maxX], [minY, maxY])
     * @param points
     */
    scaleBackPoints(points) {
        return points.map(point=>{
            return this.scaleBackPoint(point);
        });
    }
    /**
     * Input a single point in this scale range [0, 1] and will be scaled back to
     * - Original scale ([minX, maxX], [minY, maxY])
     * @param points
     */
    scaleBackPoint(point) {
        let xs = point,
            x = this.rangeAI.map((d,i)=> d* xs[i] + this.minAI[i]);
        return x;
    }
}
