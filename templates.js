var dust = require('dustjs-linkedin');
var jade = require('jade');

var tplDir = './views/dust';
var compiled = '';

['mapping_item'].forEach(function(name) {
    jade.renderFile(tplDir+'/'+name+'.jade', function(err, tpl) {
        compiled += dust.compile(tpl, name);
    });
});

module.exports = compiled;