/*
 *  @module Mapping
 *  @exports function
 *
 */
define(function() {
return function(app) {
    var Map = app.Map;
    
    /*  @Model Mapping
     *
     */
    var Mapping = Backbone.Model.extend({
        idAttribute: '_id',
        urlRoot: '/mappings'
    });

    /*  @Model Point
     *
     */
    var Point = Backbone.Model.extend({
        idAttribute: '_id'
    });

    /*  @Collection MappingList
     *
     */
    var MappingList = Backbone.Collection.extend({
        model: Mapping,
        url: '/mappings'
    });
    

    /*  @Collection PointList
     *
     */
    var PointList = Backbone.Collection.extend({
        model: Point
    });


    /*  @View MyMappingsView
     *
     */
    var MyMappingsView = Backbone.View.extend({
        el: $('#mis-mapas').get(),

        events: {
            "click button#addmap": "openNewMap",
            "keypress input": "captureKey",
            "click #newmap .close": "closeNewMap",
            "click button#savemap": "createMapping"
        },

        initialize: function() {
            var view = this;
            this.render();
            $(window).on('keydown', function(e) {
                if (e.keyCode == 27) {
                    view.closeNewMap();
                }
            });

            this.collection.on('sync', function(e, f) {
                view.render();
                view.closeNewMap();
                location.hash = "#mapping/"+e.id;
            });
        },

        render: function() {
            this.collection.fetch({
                data: {
                    user_id: this.user_id
                },
                success: function(coll, data) {
                    $('ul.mappings').empty();
                    data.forEach(function(item) {
                        item.id = item._id;
                        dust.render('mapping_item', item, function(err, html) {
                            $('ul.mappings').append(html);
                        });
                    });
                }
            });
        },

        openNewMap: function() {
            $('#newmap').slideDown('fast', function() {
                // $('#newmap .close').show()
            });
            $('.overlay').fadeIn('fast');
            $('#newmap input').focus();
            $('button#addmap').fadeOut('fast');
        },

        closeNewMap: function() {
            $('#newmap').slideUp('fast', function() {
                // $('#newmap .close').hide()
            });
            $('.overlay').fadeOut('fast');
            $('button#addmap').fadeIn('fast');
        },

        createMapping: function() {
            var title = $.trim($('#newmap input').val());
            if (!title) {
                return false
            }
            this.collection.create({
                title: title
            });
        },

        captureKey: function(e) {
            switch (e.keyCode) {
            case 13:
                this.createMapping();
                break;
            default:
                break;
            }
        },
    });

    var View = new MyMappingsView({
        collection: new MappingList
    });

    /*  @View MappingView
     *
     */
    var MappingView = new (Backbone.View.extend({        
        initialize: function() {
            var view = this;
            
            this.points = new PointList;
            this.points.on('sync', function(e) {
                this.closeNewPoint();
                this.refresh();
            }.bind(this));
        },

        events: {
            "click button#addpoint": "openNewPoint",
            "click #newpoint .close": "closeNewPoint",
            "click #newpoint #mappoint": "startPointing",
            "click #newpoint #savepoint": "savePoint"
        },
        
        setMapping: function(model, data) {
            this.id = model.id;
            this.model = model;
            this.points.url = '/mappings/'+this.id+'/points';
        },
        
        getMappingById: function(id, callback) {
            var view = this;
            var mapping = new Mapping({ _id: id });
            mapping.fetch({
                success: function(model, data) {
                    view.setMapping(model, data)
                    callback(model);
                }
            });
        },
        
        load: function(id) {       
            this.getMappingById(id, function() {
                this.render();
                app.CardSlider.show('mapping');
            }.bind(this))
        },
        
        render: function() {
            var view = this;
            
            this.__lastPoint = null;
            this._newPointMarker = null;

            app.setMappingName(this.model.get('title'));

            var mapping = this.model.toJSON();
            $('.rslide-card.mapping').remove();
            dust.render('mapping', mapping, function(err, html) {
                $('.rslide-card:last').after(html);
                view.setElement($('.rslide-card.mapping').get());
            });

            // Clear current state
            this.$el.find('ul.points li').remove();
            Map.clearPoints();

            // Render Points
            mapping.points.forEach(function(point) {
                view.renderPointLabel(point);
                dust.render('point_item', point, function(err, html) {
                    var $li = $('<li/>');
                    $li.html(html);
                    view.$el.find('ul.points').append($li);
                });
            });
        },
        
        renderPointLabel: function(data) {
            var point = new OpenLayers.LonLat(data.loc[1], data.loc[0]);
            point.transform(
                new OpenLayers.Projection("EPSG:4326"),
                new OpenLayers.Projection("EPSG:900913")
            );
            Map.addMarker(point);
        
            // Position label
            var popupPoint = new OpenLayers.LonLat(point.lon + 10, point.lat + 40);
            this.popup(popupPoint, data._id, data.title);
        },
        
        refresh: function() {
            var view = this;
            this.model.fetch({
                success: function() {
                    view.render();
                }
            });
        },
        
        /* Display dialog for adding a new Point
         * to this Mapping
         *
         */
        openNewPoint: function() {
            $('#newpoint').slideDown();
            $('button#addpoint').fadeOut('fast');
        },
        
        closeNewPoint: function() {
            $('#newpoint').slideUp(go.bind(this));
            $('#newpoint').find('input, textarea').val('');
            $('button#addpoint').fadeIn('fast');
            function go() {
                this.$el.find('#newpoint .info.pointing').find('.one, .two').show();
                this.$el.find('#newpoint #mappoint').show();
                this.$el.find('#newpoint .info.pointing').find('.three').hide();
                this.$el.find('#newpoint .info.pointing').hide();
                this.$el.find('#newpoint #savepoint').hide();  
            }
        },
        
        startPointing: function() {
            var view = this;
            this.$el.find('#newpoint #mappoint').fadeOut(function() {
                view.$el.find('#newpoint .info.pointing').fadeIn();
            });
            Map.startPointing();
            Map.map.events.register('click', this, this.__onClickMap);
        },
        
        stopPointing: function() {
            this.$el.find('#newpoint .info.pointing').find('.one, .two').hide();
            this.$el.find('#newpoint .info.pointing').find('.three').show();
            this.$el.find('#newpoint #savepoint').fadeIn();
            Map.map.events.unregister('click', this, this.__onClickMap);
            this._newPointMarker.events.register('click', this, this.__onClickNewPointMarker);
        },

        savePoint: function() {
            PointForm.setElement(this.$el.find('#newpoint'));
            var data = PointForm.getValidData();
            if(data) {
                data.mapping_id = this.id;
                this.points.create(data);
                this._newPointMarker.events.unregister('click', this, this.__onClickNewPointMarker);
                Map.map.events.unregister('click', this, this.__onClickMap);
                
                // Place definite marker
                Map.addMarker(this.__lastPoint);
                this._newPointMarker = null;
            }
        },

        popup: function(point, id, text) {
            var popup = new OpenLayers.Popup('pointlabel-'+id, // Label
                point, // Point
                new OpenLayers.Size(text.length * 8, 15), // Size
                text, // Text
                true
            );
            
            Map.map.addPopup(popup);
            
             // Style label
            var $nodeLabel = $("#pointlabel-" + id);
            $nodeLabel.addClass("pointlabel");
            $nodeLabel.css({
                border: "2px solid #666"
            });
            $nodeLabel.find('#pointlabel-' + id + '_close').remove();

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
        },

        __onClickNewPointMarker: function(e) {
            this._newPointMarker.events.unregister('click', this, this.__onClickNewPointMarker);
            Map.map.events.unregister('click', this, this.__onClickMap);
            this.startPointing();
        },
        
        __onClickMap: function(e) {
            // Get Point from Event
            var point = Map.map.getLonLatFromViewPortPx(e.xy);
            this.__lastPoint = point.clone();
            
            this._newPointMarker = Map.getMarker(point);

            point.transform(
                new OpenLayers.Projection("EPSG:900913"),
                new OpenLayers.Projection("EPSG:4326")
            );
            this.$el.find('#newpoint input[name=lat]').val(point.lat);
            this.$el.find('#newpoint input[name=lon]').val(point.lon);

            this.stopPointing();
        }
    }));
    
    var PointView = new (Backbone.View.extend({
        events: {
            'click #addphoto': 'addPhoto'
        },

        initialize: function() {
        },
        
        getPointById: function(mapping_id, point_id, callback) {
            var view = this;
            
            this.mapping_id = mapping_id;
            this.point_id = point_id;
            
            MappingView.getMappingById(mapping_id, function(mapping) {
                view.point = _.find(mapping.get('points'), function(p) {
                    return p._id == point_id
                });
                view.render(callback);
            });
        },
        
        render: function(callback) {
            var view = this;

            dust.render('point', this.point, function(err, html) {
                // Remove existing data
                $('.rslide-card.point').remove();
                $('#galleria-wrapper').remove();
                
                $('.rslide-card:last').after(html);
                view.setElement($('.rslide-card.point').get());
                
                // Setup photo upload
                view.photoUpload();
                
                // Hide file input
                var wrapper = $('<div/>').css({height:0,width:0,'overflow':'hidden'});
                var fileInput = $(':file').wrap(wrapper);
                fileInput.change(function(){
                    var $this = $(this);
                    $('#file').text($this.val());
                });
                // Tell the world you've finished rendering
                if(typeof callback == 'function') callback();
            });
            
            for(var i in this.point.image) {
                var name = this.point.image[i];
                dust.render('point_photo_item', { name: name }, function(err, html) {
                    var $li = $('<li/>');
                    if(i % 2 == 0) $li.addClass('left')
                    else $li.addClass('right')
                    $li.append(html);
                    $li.find('a').attr('index', i);
                    view.$el.find('ul.photos').append($li);
                    
                    // Setup media gallery only last image is appended
                    if(i == view.point.image.length-1) {
                        view.mediaGallery();
                    }
                });
            }
        },
        
        addPhoto: function() {
            $('.media-image :file').click();
        },
        
        photoUpload: function() {
            $("#upload").html5_upload({
                url: '/mappings/'+this.mapping_id+'/points/'+this.point_id+'/image',
                sendBoundary: window.FormData || $.browser.mozilla,
                onStart: function(event, total) {
                    // return true;
                    return confirm("You are trying to upload " + total + " files. Are you sure?");
                },
                onProgress: function(event, progress, name, number, total) {
                    console.log(progress, number);
                },
                setName: function(text) {
                    // $("#progress_report_name").text(text);
                },
                setStatus: function(text) {
                    // $("#progress_report_status").text(text);
                },
                setProgress: function(val) {
                    // $("#progress_report_bar").css('width', Math.ceil(val * 100) + "%");
                },
                onFinishOne: function(event, response, name, number, total) {
                    //alert(response);
                },
                onError: function(event, name, error) {
                    alert('error while uploading file ' + name);
                }
            });
        },
        
        mediaGallery: function() {
            var view = this;
            var height = this.$el.find('ul.photos').height();
            var pageSize = this.$el.find('.photos-wrapper').height()-1;
            var pages = (height/pageSize)|0;
            
            var currentPage = 0;
            
            if(pages > 0) {
                view.$el.find('.photos-wrapper a.next').show();
            }
            
            // Links for launching media gallery
            this.$el.find('#media a.show').click(function(e) {
                e.preventDefault();
                $(this).blur()
                
                if ($(this).closest('li').hasClass('media-image')) {
                    $('#galleria-wrapper').css({'z-index':1});
                    if(!$('#galleria-wrapper').overlay().isOpened()) {
                        $('#galleria-wrapper').overlay().load();
                    }
                    // Galleria.get(0).show(index);
                }
                
            });
            
            
            /* Pages are 0-indexed */
            function goToPage(page) {
                if(page == 0) {
                    view.$el.find('.photos-wrapper a.prev').fadeOut();
                } else if(page > 0) {
                    view.$el.find('.photos-wrapper a.prev').fadeIn();
                }
                
                if(page == pages) {
                    view.$el.find('.photos-wrapper a.next').fadeOut();
                } else if (page < pages) {
                    view.$el.find('.photos-wrapper a.next').fadeIn();
                }
                
                view.$el.find('.scroller-wrapper').scrollTo(page*pageSize, 600)
            }
            
            // Set scrollable ul.photos
            this.$el.find('.photos-wrapper .scroller-bottom a').click(function(e) {
                e.preventDefault();
                $(this).blur();
                if($(this).hasClass('next')) {
                    if(currentPage == pages) return;
                    goToPage(++currentPage)
                } else if($(this).hasClass('prev')) {
                    if(currentPage == 0) return;
                    goToPage(--currentPage)
                }
            });
            
            // Setup Galleria plugin
            var GalleriaData = this.point.image.map(function(img) {
                return {
                    thumb: 'https://s3.amazonaws.com/ow-mapping/200-'+img,
                    image: 'https://s3.amazonaws.com/ow-mapping/'+img
                }
            });

            if(this.__galleria) {
                Galleria.get(0).destroy();
            }
            Galleria.loadTheme('/javascripts/thirdparty/galleria/themes/classic/galleria.classic.min.js');
            Galleria.ready(function() {
                $('#galleria-wrapper').overlay({
                    fixed: false,
                    top: 32
                });
                view.__galleria = true;
            });
            Galleria.run('#galleria', { dataSource: GalleriaData });
        }
    }));
    
    // Backbone Router for Mappings
    var MappingRouter = Backbone.Router.extend({
        routes: {
            "mapping/:id": "getMappingById",
            "mappings/:mapping_id/points/:point_id": "getPointById",
            "mappings": "getMyMappings"
        },
        getMappingById: function(id) {
            MappingView.load(id);
        },
        getMyMappings: function() {
            app.CardSlider.show('mis-mapas');
        },
        getPointById: function(mapping_id, point_id) {
            PointView.getPointById(mapping_id, point_id, function() {
                app.CardSlider.show('point');
            })
        }
    });
    new MappingRouter();

    
    // Detect Geolocation
    function success(pos) {
        var position = [pos.coords.latitude, pos.coords.longitude];
        var point = new OpenLayers.LonLat(position[1], position[0]).transform(new OpenLayers.Projection("EPSG:4326"), Map.map.getProjectionObject());
        Map.map.setCenter(point, 16);
    }

    function error() {}

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    } else {
        alert('Geolocation not supported');
        return;
    }
}
});