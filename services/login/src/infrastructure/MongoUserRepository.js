const { ObjectId } = require('mongodb');
const User = require('../domain/user');


class MongoUserRepository {
    constructor(db) {
        this.collection = db.collection('users');
    }

    async findByOauthId(oauthId, provider) {
        const doc = await this.collection.findOne({ oauthId, provider });
        return doc ? new User(doc._id.toString(), doc.name, doc.provider, doc.email, doc.createdAt) : null;
    }

    async create({ oauthId, name, provider, email }) {
        const result = await this.collection.insertOne({ oauthId, name, provider, email, createdAt: new Date() });
        return new User(result.insertedId.toString(), name, provider, email, new Date());
    }
}

module.exports = MongoUserRepository;
