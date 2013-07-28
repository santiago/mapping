var Terms = require('../../domain/Terms');

module.exports = function(ws) {

    function TermsRPCService() {
        ws.on('add_tags', this.addTags.bind(this));
        ws.on('remove_tags', this.removeTags.bind(this));
    }
    
    TermsRPCService.prototype.addTags = function(client, term, tags) {
        Terms.updateTags(term, tags, function() {
            // Notify all clients
            ws.message('tags', term, tags);
        });
    };

    TermsRPCService.prototype.removeTags = function(client, term, tags) {
        Terms.removeTags(term, tags, function() {
            // Notify all clients
            ws.message('tags', term, tags);
        });
    };
    return new TermsRPCService();

};