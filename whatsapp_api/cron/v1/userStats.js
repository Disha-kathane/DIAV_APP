const userService = require('../../services/v1/users');
const whatsappService = require('../../services/v1/whatsapp');
const contactService = require('../../services/v1/contacts');
const botUtils = require('../../utils/bot');
const cron = require('node-cron');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;


const DBStatusCron = async () => {
    try {
        const waDBStatList =await userService.getDBStatusers();
        //console.log(waAuthTokenList);
        if(waDBStatList && waDBStatList.length){
            await Promise.all(waDBStatList.map(async (item) => {
                try {
                    let result = await whatsappService.getDbStat(item.authtoken, item.waurl);
                    const whatsappUser = [];
                    const nonWhatsappUser = [];
                    result.db_contacts.data.forEach(item => {
                        if (item.labels.type == 'whatsapp_user') {
                            whatsappUser.push(item.value);
                        } else if (item.labels.type == 'non_whatsapp_user') {
                            nonWhatsappUser.push(item.value);
                        }
                    })
                    
                    const dbMessageReceipts = result.db_message_receipts.data.map(item => item.value);

                    const dbMessages = {};
                    result.db_messages.data.forEach(item => {
                        dbMessages[item.labels.type] = item.value;
                    })

                    const pendingCb = result.db_pending_callbacks.data.map(item => item.value);
                    const pendingMessages = result.db_pending_messages.data.map(item => item.value);

                    // console.log('whatsappUser', whatsappUser);
                    // console.log('nonWhatsappUser', nonWhatsappUser);
                    // console.log('dbMessageReceipts', dbMessageReceipts);
                    // console.log('dbMessages',  dbMessages['buttons-response']);

                    // console.log('pendingCb', pendingCb);
                    // console.log('pendingMessages', pendingMessages);

                    const checkUserStats = await userService.getUserStatCount(item.userid, item.wanumber);
                    if(checkUserStats && checkUserStats.length){
                        try {
                            await userService.updateUserDBStats(whatsappUser, 
                                nonWhatsappUser, 
                                dbMessageReceipts, 
                                dbMessages['hsm'], 
                                dbMessages['revoked'],
                                dbMessages['buttons-response'],
                                dbMessages['list-response'],
                                dbMessages['button'],
                                dbMessages['template'],
                                dbMessages['image'],
                                dbMessages['document'],
                                dbMessages['location'],
                                dbMessages['list-request'],
                                dbMessages['undefined'], 
                                pendingCb, 
                                pendingMessages,
                                item.userid, 
                                item.wanumber);
                            
                        } catch (error) {
                           console.log(error); 
                        }
                    }else{
                        await userService.insertUserDBStats(item.userid, 
                            item.wanumber, 
                            whatsappUser, 
                            nonWhatsappUser, 
                            dbMessageReceipts, 
                            dbMessages['hsm'], 
                            dbMessages['revoked'],
                            dbMessages['buttons-response'],
                            dbMessages['list-response'],
                            dbMessages['button'],
                            dbMessages['template'],
                            dbMessages['image'],
                            dbMessages['document'],
                            dbMessages['location'],
                            dbMessages['list-request'],
                            dbMessages['undefined'], 
                            pendingCb,
                            pendingMessages);
                    }

                    return;
                } catch (error) {
                    //console.log(error);
                    return;
                }

                
            }));
        
        
        }

        } catch (error) {
            //console.log(error);
        }
       
    }
    
    // DBStatusCron()
    //     .then(resp => console.log('success'))
    //     .catch(console.log);

    // module.exports = cron.schedule('*/30 * * * * *', () => {}, {
    // scheduled: false
    // })
    
    
    module.exports = cron.schedule('  */30 * * * *', DBStatusCron, {
        scheduled: false
    })
    