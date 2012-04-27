CREATE TABLE users (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(128) NOT NULL,
    password_hash CHAR(44) NOT NULL,
    UNIQUE (name)
);

CREATE TABLE groups (
    id SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(128) NOT NULL,
    UNIQUE (name)
);

CREATE TABLE user_groups (
    user_id INT UNSIGNED REFERENCES users(id),
    group_id SMALLINT UNSIGNED REFERENCES groups(id)
);

CREATE TABLE privileges (
    group_id SMALLINT UNSIGNED REFERENCES groups(id),
    key_pattern TEXT NOT NULL,
    key_type ENUM('simple', 'complex') NOT NULL
);