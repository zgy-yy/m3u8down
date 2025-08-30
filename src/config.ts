import 'dotenv/config';

export    const config = {
    basedir: process.env.BASE_DIR || "./",
    port: process.env.PORT || 3000,
}