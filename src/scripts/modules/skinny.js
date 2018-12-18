import {concaveHullLength, concaveHullArea} from "./concaveHull";

export class Skinny {
    constructor(alphaHull) {
        //Clone it in order to avoid modifying it.
        this.alphaHull = alphaHull.slice(0);
    }
    /**
     * Returns skinny score
     * @returns {number}
     */
    score() {
        return 1 - Math.sqrt(4*Math.PI*concaveHullArea(this.alphaHull))/concaveHullLength(this.alphaHull);
    }
}
