var mongoose = require('mongoose');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var User = new Schema({
    name          :  { type: String, default: 'hahaha' }
  , description   :  { type: Number, min: 18, index: true }
  , bio           :  { type: String, match: /[a-z]/ }
  , date          :  { type: Date, default: Date.now }
});
mongoose.model('User', User);

var fixUrl= function(url) {
    console.log(url);
}

var Node = new Schema({
    name	: { type: String, default: 'Nudo' }
    , description : { type: String, default: 'Que haces' }
    , url       : { type: String, default: 'http://', get: fixUrl }
    , twitter     : { type: String, default: '@', get: fixUrl }
    , facebook    : { type: String, default: '', get: fixUrl }
    , tags        : { type: String, default: '' }
    , members     : { type: [User] }
    , longitude   : { type: Number }
    , latitude    : { type: Number }
    , date        : { type: Date, default: Date.now }
});
mongoose.model('Node', Node);

// a setter
User.path('name').set(function (v) {
  return capitalize(v);
});

module.exports= {
    User: User
}

var Mapping= new Schema({
    visibility: { type: String, enum: ['public', 'private'] },
    nodes: [Node]
});