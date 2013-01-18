var Store = require('../lib/Store');

var CommentStore = Store('Comment', {
    comment: { type: String },
    user_id: { type: String },
    mapping_id: { type: String },
    date: { type: Date }
});
