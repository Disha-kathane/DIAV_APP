

module.exports = async (req, res) => {
    
    try {
        if (!req.headers.apikey) {
            return responseHelper(403, 'API Key is required');
        }
        const apiKey = req.headers.apikey;
        const { userId, wabaId } = await userService.getUserId(apiKey);

        // User Validation
        if (!userId) {
            return responseHelper(404, 'Correct API Key is required');
        }
        const { waurl, authtoken, usrnm, usrpass, wanumber } = await userService.getUserSettings(userId);         
        
        let  result, fileColumnKey;

        if (req.body.contactUrl) {
            result = await csvtojson().fromFile(req.body.contactUrl);
        } else if (req.files && req.files.sheet && req.files.sheet[0]) {
            if (req.files.sheet[0].mimetype == 'text/csv') {
                result = await csvtojson().fromFile(req.files.sheet[0].path);
            } else {
                const excelSheet = xlsx.readFile(req.files.sheet[0].path);
                result = xlsx.utils.sheet_to_json(excelSheet.Sheets.Sheet1);
            }
        }

        if (result) {
            [fileColumnKey] = Object.keys(result[0]);
            result = result.map(item => {
                item[fileColumnKey] = item[fileColumnKey].toString();
                const [ _, ...args] = Object.values(item);
                return {
                    [fileColumnKey]: item[fileColumnKey],
                    placeholders: args
                };
            });
        }

        result = _.uniqBy(result, fileColumnKey);
        if (result && result.length) {
            const botId = '5eaeea2f-a461-11e9-b6ac-d094664b194b';
            const invalidContacts = [];
            
            result = result.filter(waNumber => {
                if (waNumber[fileColumnKey].length >= 12) {
                    return true;
                }
                invalidContacts.push(waNumber[fileColumnKey]);
                return false;
            })

            // TODO: Make this dynamic
            const campaignId = 23;
            const contacts = await Promise.all(result.map(async waNumber => {
                waNumber[fileColumnKey].replace(/[^0-9]/g, "");
                return contactService.getOneContact(waNumber[fileColumnKey], userId, campaignId);
            }));

            let contactsToInsert = result.filter((_, index) => !contacts[index].length);

            if (!contactsToInsert.length) {
                return 'Contacts already inserted';
            }

            contactsToInsert = contactsToInsert.map(waNumber => {
                const countryCode = botUtils.getCountryCode(waNumber[fileColumnKey]);
                waNumber[fileColumnKey] = botUtils.formatMobileLocal(waNumber[fileColumnKey], countryCode);
                return waNumber[fileColumnKey];
            })

            await contactService.insertContacts(contactsToInsert, botId, userId, campaignId);

            if (invalidContacts.length) {
                setImmediate(() => {
                    contactService.insertInvalidContacts(invalidContacts, botId, userId).catch(err => {
                        console.log(err);
                        errorLogger.error(JSON.stringify(err));
                    });
                })
            }

            const waNumberResult = await contactService.getWaNumberFromContacts();;

            if (!(waNumberResult && waNumberResult.length)) {
                return;
            }

            const waIdList = contactsToInsert && contactsToInsert.length ? 
                contactsToInsert.map(item => {
                    const countryCode = botUtils.getCountryCode(item);
                    item = botUtils.formatMobileLocal(item, countryCode);
                    return botUtils.formatMobileWhatsapp(item, countryCode);
                }) :
                waNumberResult.map(item => {
                    const countryCode = botUtils.getCountryCode(item.wanumber);
                    item.wanumber = botUtils.formatMobileLocal(item.wanumber, countryCode);
                    return botUtils.formatMobileWhatsapp(item.wanumber, countryCode);
                })

            const iteratorLength = (waIdList.length % batchSize) == 0 ? (waIdList.length / batchSize): (waIdList.length / batchSize) + 1;
                
            for (let index = 0; index < parseInt(iteratorLength); index++) {
                setTimeout(async () => {
                    //console.time('ExecutionTime');
                    const waIdBatch = waIdList.splice(0, batchSize);
                    const waContactList = await whatsappService.getContactList(authtoken, waurl, waIdBatch);

                    if (waContactList && waContactList.length) {
                        const contactList = waContactList.map(item => ({
                            wanumber: item.input,
                            status: item.status == 'valid' ? 1 : 2,
                            wa_id: item.wa_id || null
                        }))
                        await contactService.updateContactList(contactList);
                    }
                    //console.timeEnd('ExecutionTime');
                    console.log('\x1b[36m%s\x1b[0m', `Batch ${index + 1} Completed\n`);
                    
                    // Code here for request master table

                }, 1000 * index);
            }

            if (req.files && req.files.sheet && req.files.sheet[0]) {
                fs.unlink(req.files.sheet[0].path, (err) => {
                    if (err) {
                        console.log(err);
                        errorLogger.error(JSON.stringify(err));
                    }
                });
            }

            return({
                code: 200,
                status: 'SUCCESS',
                message: 'Contacts Inserted',
            });
        } else {
            //console.log('here');
            const { token, expires_after } = await whatsappService.userLogin(waurl, authtoken, usrnm, usrpass, wanumber);
            const validExpiresDate = moment(expires_after).format('YYYY-MM-DD HH:mm:ss')
            await userService.updateUserSettings(token, validExpiresDate, userId)
            return({
                code: 200,
                status: 'SUCCESS',
                message: 'Token Generated',
                data: {
                    token: token,
                    validity: expires_after
                }
            });
        }
    } catch (error) {
        console.log(error);
        errorLogger.error(JSON.stringify(error));
        return error;
    }
}