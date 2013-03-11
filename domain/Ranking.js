var Store = require('../lib/Store');

var RankingStore = Store('Ranking', {
    ranking: { type: Integer },
    user_id: { type: String },
    mapping_id: { type: String },
    date: { type: Date }
});
