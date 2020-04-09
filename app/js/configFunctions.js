const fs = require('fs');
const { join } = require('path');
const { homedir } = require('os');

const appName = 'arcus';

let dir;

if (process.platform === 'darwin') {
	dir = join(`${homedir}/Library/Application Support`);
} else if (process.platform === 'linux') {
	dir = join(`${homedir}/.local/share`);
}

const getConfig = () => {
	const rawConfig = fs.readFileSync(join(`${dir}/${appName}/config.json`));
	const config = JSON.parse(rawConfig);
	return config;
};

const writeConfig = config => {
	fs.writeFileSync(join(`${dir}/${appName}/config.json`), JSON.stringify(config, null, 4), err => {
		if (err) throw err;
		// debug('The file has been saved!');
	});
};

exports.getConfig = getConfig;
exports.writeConfig = writeConfig;
