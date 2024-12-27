var fs = require('fs');
var path = require('path');
const log4js = require('log4js');

//logging
var logDirectory = path.join(__dirname, 'logs');

//ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

//log4js logger
log4js.configure({
    appenders: {
        pinbot: {
            type: 'dateFile',
            filename: logDirectory + '/pinbot.log'
        }
    }, //info:{type:'dateFile',filename:logDirectory+'/info.log'}
    categories: {
        default: {
            appenders: ['pinbot'],
            level: 'info'
        }
    } //default:{appenders:['info'],level:'info'}
});

function getErrorLogger() {
    return ;
}

function getInfoLogger() {
    return ;
}

module.exports = {
    errorLogger: log4js.getLogger('pinbot'),
    infoLogger: log4js.getLogger('info')
}