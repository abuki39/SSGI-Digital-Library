const db = require('./db');

async function checkSchema() {
    try {
        const [rows] = await db.execute('DESCRIBE documents');
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkSchema();
