var Store = require('../lib/Store');

var CommentStore = Store('Comment', {
    title: { type: String },
    user_id: { type: String },
    mapping_id: { type: String },
    description: { type: String },
    lat: { type: Number },
    lon: { type: Number },
    video: { type: Array },
    audio: { type: Array },
    image: { type: Array }
});