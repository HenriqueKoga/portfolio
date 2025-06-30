class User {
  constructor(id, name, provider, email, createdAt = new Date()) {
    this.id = id;
    this.name = name;
    this.provider = provider;
    this.email = email;
    this.createdAt = createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      provider: this.provider,
      email: this.email,
    };
  }
}

module.exports = User;
