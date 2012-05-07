exports.config = {
    debug: true,
    port: 8080,
    sessionSecret: "q4dWVEyRKAT6tP7uyik4bxzgYeCxxJOZcp8Pq2TTcHDsNWgojZ3rNTr2ZPZI",

    plugins: {
        "debug/dashboard": {},
        "bridge/ws": {},
        "bridge/zmq": {},
        "bridge/http": {
            origin: "*"
        }
    },

    auth: {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'heapio',
        user: 'heapio',
        password: 'stackio',
        rounds: 10,
        privilegesSleepTime: 1 * 1000
    }
};