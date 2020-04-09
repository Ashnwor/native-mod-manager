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

exports.appName = appName;
exports.appDataDir = appDataDir;
