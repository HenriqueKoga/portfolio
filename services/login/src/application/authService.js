class AuthService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async findOrCreateUser(oauthId, name, provider, email) {
        let user = await this.userRepository.findByOauthId(oauthId, provider);
        if (!user) {
            user = await this.userRepository.create({
                oauthId,
                name,
                provider,
                email
            });
        }
        return user;
    }
}

module.exports = AuthService;
