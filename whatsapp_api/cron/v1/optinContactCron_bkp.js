const userService = require('../../services/v1/users');
const whatsappService = require('../../services/v1/whatsapp');
const contactService = require('../../services/v1/contacts');
const botUtils = require('../../utils/bot');
const cron = require('node-cron');
var appLoggers = require('../../applogger.js');
var errorLogger = appLoggers.errorLogger;
const batchSize = 50;

module.exports = cron.schedule('0 1 * * *', async () => {
    try {
        const waAuthTokenList = await userService.getoptinusers();
        //console.log(waAuthTokenList);
        if(waAuthTokenList && waAuthTokenList.length){
            await Promise.all(waAuthTokenList.map(async (item) => {
                const waNumberResult = await contactService.getoptinWaNumberFromContacts(item.userid);

                if (!(waNumberResult && waNumberResult.length)) {
                    console.log('No contacts to optin');
                    return;
                }
            
                const waIdList = waNumberResult.map(item1 => {
                    const countryCode = botUtils.getCountryCode(item1.wanumber);
                    item.wanumber = botUtils.formatMobileLocal(item1.wanumber, countryCode);
                    return botUtils.formatMobileWhatsapp(item1.wanumber,countryCode);
                })

                if (waNumberResult && waNumberResult.length) {

                        const iteratorLength = (waIdList.length % batchSize) == 0 ? (waIdList.length / batchSize): (waIdList.length / batchSize) + 1;
                        for (let index = 0; index < parseInt(iteratorLength); index++) {
                            setTimeout(async () => {
                                try {
                                    const tempWaIdList = JSON.parse(JSON.stringify(waIdList));
                                    let waIdBatch = waIdList.splice(0, batchSize);

                                    let waContactList;
                                    waContactList = await Promise.all(waIdBatch.map(async oneRecord => {
                                        try {
                                            let result = await whatsappService.getContactList(item.authtoken, item.waurl, [ oneRecord ]);
                                            //console.log(result);
                                            return result[0];
                                        } catch (error) {
                                            console.log('\x1b[31m%s\x1b[0m', `Batch ${oneRecord} Failed\n`);
                                            return {};
                                        }
                                    }))

                                    const contactList = waContactList.map(item => {
                                        return {
                                            wanumber: item.input,
                                            status: item.status == 'valid' ? 1 : 2,
                                            wa_id: item.wa_id || null
                                        }
                                    }).filter(item => item.wanumber);


                                    if(contactList && contactList.length){
                                      await contactService.updateContactList(contactList);
                                      console.log('\x1b[36m%s\x1b[0m', `Batch ${index + 1} Completed | Time: ${new Date().toLocaleString()}\n`);  
                                    }
                                   
                                } catch (error) {
                                    errorLogger.error(JSON.stringify(error));
                                }
                        
                            }, 1000 * index);  
                        }
                    }
                return;

            }));
        }
        
    } catch (error) {
        console.log(error);
    }
   
}, {
    scheduled: false
})
