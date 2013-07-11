/**
 * Math utilities
 */

Math.average= function(array){
    "use strict";

    if(array.length === 0) return 0;
    return _.reduce(array, function(a, b){return a+b;})/array.length;
};

Math.standardDeviation= function(array){
    "use strict";

    if(array.length === 0) return 0;
    var avg= Math.average(array),
        dev= _.map(array, function(itm){return (itm-avg)*(itm-avg);});
    return Math.sqrt(_.reduce(dev, function(a, b){return a+b;})/array.length);
};