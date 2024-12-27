const userService = require('../../services/v1/users');
const whatsappService = require('../../services/v1/whatsapp');
const contactService = require('../../services/v1/contacts');
const cron = require('node-cron');
const batchSize = 50;

const scheduler = cron.schedule(' * * * * * *', async () => {
    try {
        const waAuthTokenList = await userService.getoptinusers();
        await Promise.all(waAuthTokenList.map(async (item) => {
            const waContactList = await whatsappService.getoptinContactList(item.userid, item.authtoken, item.waurl);
            if (waContactList && waContactList.length) {
                const iteratorLength = (waContactList.length % batchSize) == 0 ? (waContactList.length / batchSize) : (waContactList.length / batchSize) + 1;

                for (let index = 0; index < parseInt(iteratorLength); index++) {
                    setTimeout(async () => {
                        const waContactListBatch = waContactList.splice(0, batchSize);
                        if (waContactListBatch && waContactListBatch.length) {
                            const contactList = waContactListBatch.map((item1) => ({
                                wanumber: item1.input,
                                status: item1.status == 'valid' ? 1 : 2,
                                wa_id: item1.wa_id || null
                            }))
                            const resp = await contactService.updateoptinContactList(contactList, item.userid);
                        }
                        console.log('\x1b[36m%s\x1b[0m', `Batch ${index + 1} Completed\n`);
                    }, 1000 * index);
                };
            }
            return;
        }));
        return;
    } catch (error) {
        console.log(error);
    }

}, {
    scheduled: false
})

setTimeout(() => {
    console.log('Schduler Stopper');
    scheduler.stop();
}, 30000); s

module.exports = scheduler;