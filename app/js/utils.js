const isDebugON = true;
const debug = debugThis => {
	if (isDebugON === true) {
		if (typeof debugThis === 'object') {
			window.con.log(`\x1b[31mDEBUG:\x1b[0m`);
			window.con.log(debugThis);
		} else {
			window.con.log(`\x1b[31mDEBUG:\x1b[0m ${debugThis}`);
		}
	}
};

exports.debug = debug;
