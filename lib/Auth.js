var everyauth = require('everyauth');
var Store = require('./Store');

var IdentityStore = Store('Identity', {
    source: { type: String },
    user_id: { type: String },
    date: { type: Date, 'default': Date.now }
});

module.exports = function(app) {
    var env = app.env;
    
    everyauth.helpExpress(app);
    everyauth.debug = true;

    var usersById = {};
    var usersByGoogleId = {};
    
    function addUser(source, identity) {
        var promise = this.Promise();
        var model = new IdentityStore({
            source: source,
            user_id: identity.id
        });
        model.save(function(err, r) {
            if (err) {
                promise.fail(err);
            } else {
                promise.fulfill(r);
            }
        });
        return promise;
    }

    everyauth.everymodule.findUserById(function(id, callback) {
        callback(null, usersById[id]);
    });

    var auth = {
        development: {
            facebook: {
                appId: '290491051026125',
                appSecret: 'b3f20e1678af9d70dfc0a4aad9f156af'
            },
            google: {
                clientId: '634411416057.apps.googleusercontent.com',
                clientSecret: '0YvhqMI0F7Vn2dlh-sDlZrQx'
            },
            twitter: ''
        },

        production: {
            facebook: {
                appId: '385877844809808',
                appSecret: 'c7149334401b7bd293222ba587ef4f1b'
            },
            google: {
                clientId: '634411416057-3gt1246874h496k1iak4rqpvmqm99r2e.apps.googleusercontent.com',
                clientSecret: 'wzBAL0PyTGm5kh9YEZ02Ygbo'
            },
            twitter: ''
        }
    };

    function checkUser(source, identity) {
        var promise = this.Promise();
        var self = this;
        console.log('\n\ncheckUser\n\n');
        IdentityStore.findOne({ source: source, user_id: identity.id }, function(err, r) {
            if (err) {
                promise.fulfill(['failed']);
            }
            if (r) {
                console.log(r);
                r.id = r._id;
                promise.fulfill(r.toObject());
            } else {
                return addUser.call(self, source, identity);
            }
        });
        return promise;        
    }

    everyauth.facebook.appId(auth[env].facebook.appId).appSecret(auth[env].facebook.appSecret).findOrCreateUser(function(session, accessToken, accessTokenExtra, fbUserMetadata) {
        session._user = fbUserMetadata;
        return checkUser.call(this, 'facebook', fbUserMetadata);
    }).redirectPath('/');

    everyauth.google.appId(auth[env].google.clientId).appSecret(auth[env].google.clientSecret).scope('https://www.googleapis.com/auth/userinfo.profile https://www.google.com/m8/feeds/').findOrCreateUser(function(sess, accessToken, extra, googleUser) {
        googleUser.refreshToken = extra.refresh_token;
        googleUser.expiresIn = extra.expires_in;
        return usersByGoogleId[googleUser.id] || (usersByGoogleId[googleUser.id] = addUser('google', googleUser));
    }).redirectPath('/');

}