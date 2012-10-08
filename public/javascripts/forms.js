var FormValidator = function($ctx, fields) {
	this.fields = fields;
	this.valid = false;
	this.$ctx = $ctx;
};

FormValidator.prototype.setElement = function($el) {
    this.$ctx = $el;
}

FormValidator.prototype.validate = function(opts) {
	var self = this;
	var exclude = opts.exclude || [];
	var validators = {
		'presence': function(val) {
			if (val == '' || !val) {
				return false
			}
			return true
		},
		'email': function(val) {
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			if (val.match(re)) {
				return true
			}
			return false
		},
		'fecha': function(val) {
			var re = /\d{4}\/(\d{2})\/(\d{2})/;
			if (val.match(re)) {
				return true
			}
			return false
		}
	};

	this.$ctx.find(".error").remove();
	var fields = this.fields;
	for (var f in fields) {
		var val = (function() {
			if (typeof fields[f].val == 'function') return fields[f].val();
			else return self.$ctx.find(fields[f].find).val() || '';
		})();

		if (fields[f].validate && fields[f].validate.length) {
			for (var i in fields[f].validate) {
				if (exclude.indexOf(f) > -1) {
					break;
				}

				var test = fields[f].validate[i];
				if (!validators[test](val)) {
					var lookup = $.trim(fields[f].find.replace(/option:selected|:checked/, ''));
					this.$ctx.find(lookup).first().before("<p class='error'>* campo obligatorio</p>");
					return false;
				}
			}
		}
		fields[f].data = val;
	}
	return true;
}

FormValidator.prototype.getValidData = function(opts) {
	var data;
	opts = opts || {};
	if (this.validate(opts)) {
		data = {};
		for (var f in this.fields) {
			data[f] = this.fields[f].data;
		}
	}
	return data;
};

var PointForm = new FormValidator($("#newpoint"), {
    'title': {
		'find': 'input[name=title]',
		'validate': ['presence']
	},
	'description': {
		'find': 'textarea[name=description]'
	},
    'address': {
        'find': 'textarea[name=address]'
    },
    'lat': {
        'find': 'input[name=lat]'
    },
    'lon': {
        'find': 'input[name=lon]'
    }
});
