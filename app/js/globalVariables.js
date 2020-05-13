const { join } = require('path');
const { homedir } = require('os');

const appName = 'arcus';

const appDataDir = () => {
	if (process.platform === 'darwin') {
		const dir = join(`${homedir}/Library/Application Support`);
		return dir;
	}
	if (process.platform === 'linux') {
		const dir = join(`${homedir}/.local/share`);
		return dir;
	}
};

let config;
const lines = [];

exports.appName = appName;
exports.appDataDir = appDataDir;
exports.config = config;
exports.lines = lines;
