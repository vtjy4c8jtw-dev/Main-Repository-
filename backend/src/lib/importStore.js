const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'data', 'imports.json');

function read() {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function write(data) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function clear() {
  try {
    fs.unlinkSync(STORE_PATH);
  } catch {
    // nothing to remove
  }
}

module.exports = { read, write, clear };
