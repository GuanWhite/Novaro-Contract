const fs = require('fs');
const path = require('path');

function fromJson(relativePath) {
    const filePath = path.resolve(__dirname, "..", relativePath);
    try {
        const fileData = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileData);
    } catch (error) {
        console.error('Error reading or parsing the JSON file:', error);
        return null;
    }
}
function toJson(relativePath, data) {
    const filePath = path.resolve(__dirname, "..", relativePath);

    try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, jsonData, 'utf8');
        console.log('JSON data successfully written to file:', filePath);
    } catch (error) {
        console.error('Error writing JSON data to file:', error);
    }
}
module.exports = {fromJson, toJson};