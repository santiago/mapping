var dust = require('dustjs-linkedin');
var jade = require('jade');

var tplDir = './views/dust';
var compiled = '';

['mapping', 'mapping_item', 'point_item', 'point', 'media_gallery', 'point_photo_item', 'add_videos'].forEach(function(name) {
    jade.renderFile(tplDir+'/'+name+'.jade', function(err, tpl) {
        compiled += dust.compile(tpl, name);
    });
});

module.exports = compiled;