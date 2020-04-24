module.exports = {
    hello: 'hello project2',
    remoteHello: import('project1/index').then(mod => mod.default),
};

