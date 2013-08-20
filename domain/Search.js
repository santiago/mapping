var esclient = (function() {
    var fork = true;
    if(fork) {
        return require('/Projects/node-elasticsearch-client');
    }
    return require('elasticsearchclient');
})();

// Initialize ES
module.exports = (function() {
    var opts = {
        host: 'localhost',
        port: 9200
    };

    return new (esclient)(opts);
})();

module.exports.Search = Search;

function Search() {
}