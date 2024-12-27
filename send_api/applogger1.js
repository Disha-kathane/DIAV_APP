const fs = require('fs');
const path = require('path');
const log4js = require('log4js');

//logging
//const logDirectory = path.join('/home/logs', 'send_new_logs');
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


module.exports = {
    errorLogger: log4js.getLogger('pinbot'),
    infoLogger: log4js.getLogger('info')
}
