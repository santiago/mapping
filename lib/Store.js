// App starts here
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mapping');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
  
module.exports = function(name, fields) {
    var schema = new Schema(fields);
    return mongoose.model(name, schema);
}