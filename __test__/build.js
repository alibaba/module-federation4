const { join } = require('path');
const rimraf = require('rimraf');
const shell = require('shelljs');

const tmp = join(__dirname, '.tmp');
const src = join(__dirname, 'fixtures');

shell.rm('-r', tmp);
shell.cp('-r', src, tmp);

shell.exec(`cd ${join(tmp, './project1')} && npx webpack`);
shell.exec(`cd ${join(tmp, './project2')} && npx webpack`);
