exports.config = {
    debug: true,
    port: 8080,
    sessionSecret: "q4dWVEyRKAT6tP7uyik4bxzgYeCxxJOZcp8Pq2TTcHDsNWgojZ3rNTr2ZPZI",
    eventProcessTimeout: 1000,

    plugins: {
        "bridge/ws": {},
        "bridge/zmq": {},
        "bridge/http": {
            origin: "*"
        },

        "debug/dashboard": {}
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