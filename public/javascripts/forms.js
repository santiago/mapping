var FormValidator = function(fields) {
        this.fields = fields;
        this.valid = false;
    };

FormValidator.prototype.populate = function(obj) {
    var url;
    for (var f in this.fields) {
        var url = f == 'url' ? "http://" + obj[f] : undefined;
        url = f == 'twitter' ? "http://twitter.com/" + obj[f] : url;
        url = f == 'facebook' ? "http://facebook.com/" + obj[f] : url;

        switch (f) {
        case 'name':
            $("#node-front").find("h2").text(obj[f]);
            break;
        case 'description':
            $("#node-front").find(".element." + f + " p").text(obj[f]);
            break;
        case 'url':
        case 'facebook':
        case 'twitter':
            $("#node-front").find(".element." + f + " a").text(obj[f]).attr('href', url)
            break;
        }
    }
};

FormValidator.prototype.validate = function(opts) {
    var exclude = opts.exclude || [];
    var validators = {
        'presence': function(val) {
            if (val == '' || !val) {
                return false
            }
            return true
        }
    };

    $("#formbox").find(".error").remove();
    var fields = this.fields;
    for (var f in fields) {
        var val = $("#formbox").find(fields[f].find).val();
        if (fields[f].validate && fields[f].validate.length) {
            for (var i in fields[f].validate) {
                if (exclude.indexOf(f) > -1) {
                    break;
                }
                var test = fields[f].validate[i];
                if (!validators[test](val)) {
                    $("#formbox").find(fields[f].find).before("<p class='error'>* campo obligatorio</p>");
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

var RegisterForm = new FormValidator({
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