var Map = new (function _Map() {

    // The marker icon
    var size = new OpenLayers.Size(15,24);
    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
    // var icon = new OpenLayers.Icon('/javascripts/thirdparty/img/marker-gold.png', size, offset);
    var icon = new OpenLayers.Icon('/images/marker-3.png', size, offset);

    this.nodes= {};

    this.map = new OpenLayers.Map('map');
    var map= this.map;
    map.addControl(new OpenLayers.Control.LayerSwitcher());

    this._marking= false;

    var markers = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markers);

})();


function init(opts) {
    var self= this;
    
    // Render Geo UI
    startUi.call(this);

    // The marker icon
    var size = new OpenLayers.Size(15,24);
    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
    // var icon = new OpenLayers.Icon('/javascripts/thirdparty/img/marker-gold.png', size, offset);
    var icon = new OpenLayers.Icon('/images/marker-3.png', size, offset);


    $("#map").on('mousedown', function(e) {
        var point= map.getLonLatFromViewPortPx({x:e.offsetX,y:e.offsetY});
        point.transform(
            map.getProjectionObject(),
            new OpenLayers.Projection("EPSG:4326"));
        lastMouseDown= [point.lat,point.lon];
    });
    
    $("#map").on('mousedown', function(e) {
    });

    $("#map").on('mouseup', function(e) {
	// Remove the annoying Google copyright popup
	$(".olLayerGooglePoweredBy.olLayerGoogleV3").hide();
    });

    map.events.register('move', this, function(e) {
	this._moved= true;
    });

    var mousemove= function(e) {
        var point= map.getLonLatFromViewPortPx(e.xy);
	markers.addMarker(new OpenLayers.Marker(point,icon));
    }
    // map.events.register('mousemove', this, mousemove);

    map.events.register('click', this, function(e) {
        var point= map.getLonLatFromViewPortPx(e.xy);

	if(this._marking) {
	    map.events.unregister('mousemove', this, mousemove);
	    markers.addMarker(new OpenLayers.Marker(point,icon));
	    this._marking= false;
	    this._moved= false;

	    $("#formbox input[name=latitude]").val(point.lat);
	    $("#formbox input[name=longitude]").val(point.lon);
	    $("#formbox .button").show();
	    $("#formcontent .move-banner").hide();
	}
    });

    var gphy = new OpenLayers.Layer.Google(
        "Google Physical",
        {type: google.maps.MapTypeId.TERRAIN}
    );
    
    var gmap = new OpenLayers.Layer.Google(
        "Google Streets", // the default
        {numZoomLevels: 20}
    );
    var ghyb = new OpenLayers.Layer.Google(
        "Google Hybrid",
        {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20}
    );
    var gsat = new OpenLayers.Layer.Google(
        "Google Satellite",
        {type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 22}
    );

    var osm = new OpenLayers.Layer.OSM();
    
    map.addLayers([osm, gmap, gphy, ghyb, gsat]);

    // Google.v3 uses EPSG:900913 as projection, so we have to
    // transform our coordinates
    map.setCenter(new OpenLayers.LonLat(10.2, 48.9).transform(
        new OpenLayers.Projection("EPSG:4326"),
        map.getProjectionObject()
    ), 5);

    map.addControl(new OpenLayers.Control.MousePosition());

    $("#formbox .button.mapme").click(function() {
	var data= RegisterForm.getValidData({ exclude: ['latitude','longitude'] });
	if(data) {
	    map.events.register('mousemove', self, mousemove);
	    self._marking= true;
	    $("#formbox .button").hide();
	    $("#formcontent .move-banner").show();
	}
    });

    $("#formbox .button.addme").click(function() {
	var data= RegisterForm.getValidData();
	if(data) {
	    $.post('/registro', data, function(a, b, c) {
		location.href= '/';
	    });
	}
    });

    $(".node-card .button").live('click', function() {
	$(".rslide-card.node-front").animate({"right": "-450"})
	$(".rslide-card.node-list").animate({"right": "0"})
    });

    // Get whatever's there
    this.showLabels = function() {
	$.get('/proyectos.json', function(data) {
	    data.forEach(function(node) {
		self.nodes[node._id]= node;

		var point= new OpenLayers.LonLat(node.longitude, node.latitude);
		var marker= new OpenLayers.Marker(point,icon.clone());
		markers.addMarker(marker);
	    
		// Position label
		var popupPoint= new OpenLayers.LonLat(node.longitude+10, node.latitude+40);
		self.popup(popupPoint, node._id, node.name);

		// Style label
		var $nodeLabel= $("#"+node._id);
		$nodeLabel.addClass("maplabel");
		$nodeLabel.css({
		    border: "2px solid #666"
		});
		$nodeLabel.find('#'+node._id+'_close').remove();

		// on mouse over label
		$nodeLabel.on('mouseover', function(e) {
		    $nodeLabel.addClass('hover');
		    $nodeLabel.css({
			border: "2px solid blue"
		    });
		});

		// on mouse out label
		$nodeLabel.on('mouseout', function(e) {
		    $nodeLabel.removeClass('hover');
		    $nodeLabel.css({
			border: "2px solid #666"
		    });
		});

		// on click label
		$nodeLabel.on('click', function(e) {
		    var id= $(this).attr('id');
		    var node= self.nodes[id];
		    RegisterForm.populate(node);
		    $(".rslide-card.node-front").animate({"right": "0"})
		});
	    });
	});
    };
}

init.prototype.popup= function(lonlat, id, text) {
    var popup= new OpenLayers.Popup(id, // Label
		    lonlat, // Point
                    new OpenLayers.Size(text.length*8,15), // Size
                    text, // Text
                    true); // ?
    this.map.addPopup(popup);
};

var FormValidator= function(fields) {
    this.fields= fields;
    this.valid= false;
};

FormValidator.prototype.populate= function(obj) {
    var url;
    for(var f in this.fields) {
	var url= f == 'url'  ? "http://"+obj[f] : undefined;
	url= f == 'twitter'  ? "http://twitter.com/"+obj[f] : url;
	url= f == 'facebook' ? "http://facebook.com/"+obj[f] : url;

	switch(f) {
	case 'name':
	    $("#node-front").find("h2").text(obj[f]);
	    break;	    
	case 'description':
	    $("#node-front").find(".element."+f+" p").text(obj[f]);
	    break;	    
	case 'url':
	case 'facebook':
	case 'twitter':
	    $("#node-front").find(".element."+f+" a")
		.text(obj[f])
		.attr('href', url)
	    break;
	}
    }
};

FormValidator.prototype.validate= function(opts) {
    var exclude= opts.exclude||[];
    var validators= {
	'presence': function(val) {
	    if(val == '' || !val) {
		return false
	    }
	    return true
	}
    };

    $("#formbox").find(".error").remove();
    var fields= this.fields;
    for(var f in fields) {
	var val= $("#formbox").find(fields[f].find).val();
	if(fields[f].validate && fields[f].validate.length) {
	    for(var i in fields[f].validate) {
		if(exclude.indexOf(f) > -1) {
		    break;
		}
		var test= fields[f].validate[i];
		if(!validators[test](val)) {
		    $("#formbox").find(fields[f].find)
			.before("<p class='error'>* campo obligatorio</p>");
		    return false;
		}
	    }
	}
	fields[f].data= val;
    }
    return true;
}

FormValidator.prototype.getValidData= function(opts) {
    var data;
    opts= opts||{};
    if(this.validate(opts)) {
	data= {};
	for(var f in this.fields) {
	    data[f]= this.fields[f].data;
	}
    }
    return data;
};

var RegisterForm= new FormValidator(
    {
	'name': {
	    'find': 'input[name=name]',
	    'validate': ['presence']
	},
	'email': {
	    'find': 'input[name=email]',
	    'validate': ['presence']
	},
	'description': {
	    'find': 'textarea[name=descripcion]',
	    'validate': ['presence']
	},
	'url': {
	    'find': 'input[name=url]',
	    'validate': ['presence']
	},
	'latitude': {
	    'find': 'input[name=latitude]',
	    'validate': ['presence']
	},
	'longitude': {
	    'find': 'input[name=longitude]',
	    'validate': ['presence']
	},
	'twitter': {
	    'find': 'input[name=twitter]',
	},
	'facebook': {
	    'find': 'input[name=fb]',
	},
	'tags': {
	    'find': 'input[name=tags]',
	    'validate': ['presence']
	},
	'members': {
	    'find': 'input[name=miembros]'
	}
    });

// init private methods
function startUi() {
    var self= this;
    
    $(".start").hide();
    $("#main").show();
    $("header .user").text(this.userId);
    
    $("#actions .action").click(function(e) {
        e.preventDefault();
        $(this).blur();

	$("#actions .action.on").removeClass('on');
	$(this).addClass('on');

        if($(this).hasClass('registro')) { 
	    $(".active.rslide-card").animate({ right: '-450px' });

	    $(".login.rslide-card").animate({ right: '0px' }, function() {
		$(".active.rslide-card").removeClass('active');
		$(".login.rslide-card").addClass('active');
	    });
	}

        if($(this).hasClass('search')) { 
	    $(".active.rslide-card").animate({ right: '-450px' });

	    $(".node-list.rslide-card").animate({ right: '0px' }, function() {
		$(".active.rslide-card").removeClass('active');
		$(".node-list.rslide-card").addClass('active');
	    });
	}

        if($(this).hasClass('salir')) { 
	    location.href= '/logout'
	}
    });

    $("#node-list .node-item").on('mouseover', function(e) {
	var id= $(this).attr('id').split('-')[2];
	$(this).addClass('hover');

	// Click on social icons
	$("#node-list .social-icons a").hide();

	(function(cx) {
	    var sites= ['facebook', 'twitter', 'youtube', 'vimeo'];
	    for(var _s in sites) {
		var s= sites[_s];
		if(self.nodes[id][s]) {
		    var $a= $(cx).find('.'+s).closest('a');
		    var url= s == 'facebook' ? self.nodes[id][s] : undefined;
		    if(url && !url.match(/facebook.com/)) {
			url= 'http://facebook.com/'+url;
		    }
		    if(url && !url.match(/^http:/)) {
			url= 'http://'+url;
		    }

		    url= s == 'twitter' ? 'http://twitter.com/'+self.nodes[id][s] : url;
		    $a.attr('href', url);
		    $a.show();
		}
	    }
	})(this);

	setTimeout(function() {
	    var h= $("#node-"+id+" .desc").height();
	    $("#node-"+id+" .info")
	    $("#node-"+id+" .info").animate({ height: 40+h });
	}, 200);
	
	$(this).append(
	    $("#node-list .social-icons").show()
	);
    }); // mouseover

    $("#node-list .node-item").on('mouseout', function(e) {
	$(this).removeClass('hover');
    });

    // Click on .name at node-item
    $("#node-list .node-item .name a").on('click', function(e) {
	e.preventDefault();
	$(this).blur();
	var id= $(this).closest('.node-item').attr('id').split('-')[2];
	$.get('/data/node/'+id+'.html', function(data) {
	    $(".rslide-card.node-list").animate({"right": "-450"})
	    $(".rslide-card.node-front").html(data);
	    $("#node-"+id).show();
	    var lonlat= [self.nodes[id].longitude, self.nodes[id].latitude];
	    var point= new OpenLayers.LonLat(lonlat[0], lonlat[1])
	    self.map.panTo(point);

	    $(".rslide-card.node-front").animate({"right": "0"}, function() {
		$(".rslide-card.active").removeClass("active");
		$(".rslide-card.node-front").addClass("active");
	    })
	});
    });
}

// Start the App
jQuery(document).ready(function($) {
    function success(pos) {
	var position= [pos.coords.latitude,pos.coords.longitude];
	var point= new OpenLayers.LonLat(position[1],position[0])
            .transform(new OpenLayers.Projection("EPSG:4326"),app.map.getProjectionObject());
	app.map.setCenter(point, 16);
	app.showLabels();
    }

    function error() {
    }

    var userId= sessionStorage.getItem("userId");
    var app= new init();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    } else {
        alert('Geolocation not supported');
        return;
    }
});