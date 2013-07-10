Math.average= function(array){
    if(array.length === 0) return 0;
    return _.reduce(array, function(a, b){return a+b;})/array.length;
};

Math.standardDeviation= function(array){
    if(array.length === 0) return 0;
    var avg= Math.average(array),
        dev= _.map(array, function(itm){return (itm-avg)*(itm-avg);});
    return Math.sqrt(_.reduce(dev, function(a, b){return a+b;})/array.length);
};