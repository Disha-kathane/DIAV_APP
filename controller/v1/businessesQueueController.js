const sendService = require('../../services/v1/newsend1.js');


let updateWabaApprovalResponseIdResult = null;
let updateTemplateCategoryResult = null;
let updatePhoneNumberNameUpdateResult = null;
let updatePhoneNumberQualityUpdateResult = null;
let updateTemplatePerformanceResult = null;

templateStatusController = async (job) => {
    try {
        // console.log(JSON.stringify(job.data))
        let template_error_title = null;
        let template_error_desc = null;
        let eventstatus = job.data.entry[0].changes[0].value.event;
        let msgtempid = job.data.entry[0].changes[0].value.message_template_id;
        template_error_title = job.data.changes != undefined && job.data.changes[0].value.other_info != undefined ? job.data.changes[0].value.other_info.title : null;
        template_error_desc = job.data.changes && job.data.changes[0].value.other_info != undefined ? job.data.changes[0].value.other_info.description : null;
        if (job.data.object === 'whatsapp_business_account' && job.data.entry[0].changes[0].field === 'message_template_status_update') {
            console.log('message_template_status');
            if (job.data.entry[0].changes != undefined && job.data.entry[0].changes[0].field == 'message_template_status_update') {
                // console.log("Template Blog");
                let status = 0;
                // if (eventstatus === "REJECTED") {
                //     // console.log(eventstatus);
                //     status = 2;
                // } else if (eventstatus === "APPROVED") {
                //     status = 1;
                // } else if (eventstatus === "FLAGGED") {
                //     status = 5;
                // }
                // console.log(status)

                if (eventstatus.toLowerCase() === "REJECTED".toLowerCase()) {
                    console.log(eventstatus);
                    status = 2;
                }
                else if (eventstatus.toLowerCase() === "APPROVED".toLowerCase()) {
                    status = 1;
                }
                else if (eventstatus.toLowerCase() === "FLAGGED".toLowerCase()) {
                    status = 5;
                }
                else if (eventstatus.toLowerCase() === "BAD REQUEST".toLowerCase()) {
                    status = 3;
                }
                else if (eventstatus.toLowerCase() === "INVALID REQUEST".toLowerCase()) {
                    status = 4;
                }
                else if (eventstatus.toLowerCase() === "IN REVIEW".toLowerCase()) {
                    status = 6;
                }
                else if (eventstatus.toLowerCase() === "ACTIVE - QUALITY PENDING".toLowerCase()) {
                    status = 7;
                }
                else if (eventstatus.toLowerCase() === "ACTIVE - HIGH QUALITY".toLowerCase()) {
                    status = 8;
                }
                else if (eventstatus.toLowerCase() === "ACTIVE - MEDIUM QUALITY".toLowerCase()) {
                    status = 9;
                }
                else if (eventstatus.toLowerCase() === "ACTIVE - LOW QUALITY".toLowerCase()) {
                    status = 10;
                }
                else if (eventstatus.toLowerCase() === "PAUSED".toLowerCase()) {
                    status = 11;
                }
                else if (eventstatus.toLowerCase() === "DISABLED".toLowerCase()) {
                    status = 12;
                }
                else if (eventstatus.toLowerCase() === "APPEAL REQUESTED".toLowerCase()) {
                    status = 13;
                }

                // updateWabaApprovalResponseIdResult = await sendService.updateWabaApprovalResponseId(status, msgtempid);

                if (status === 2 || status === 11 || status === 12) {
                    console.log("====================> " + eventstatus);
                    let result = await sendService.updateEmailSentStatus(status, msgtempid);
                    // console.log({ result });
                }
                else {
                    console.log("====================> " + eventstatus);
                    updateWabaApprovalResponseIdResult = await sendService.updateWabaApprovalResponseId(status, msgtempid);
                    // console.log({ updateWabaApprovalResponseIdResult });
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
};

templateCategoryController = async (job) => {
    try {
        // console.log(JSON.stringify(job.data))
        let previouscategory = job.data.entry[0].changes[0].value.previous_category;
        let newcategory = job.data.entry[0].changes[0].value.new_category;

        let msgtempid = job.data.entry[0].changes[0].value.message_template_id;
        if (job.data.object === 'whatsapp_business_account' && job.data.entry[0].changes[0].field === 'template_category_update') {
            console.log('template_category_update');
            if (job.data.entry[0].changes != undefined && job.data.entry[0].changes[0].field == 'template_category_update') {
                updateTemplateCategoryResult = await sendService.updateTemplateCategory(previouscategory, newcategory, msgtempid);
            }
        }
    } catch (err) {
        console.log(err);
    }
};

templatePerformanceController = async (job) => {
    try {
        // console.log(JSON.stringify(job.data))
        let templates_performance_metrics = job.data.entry[0].changes[0].value.templates_performance_metrics;

        if (job.data.object === 'whatsapp_business_account' && job.data.entry[0].changes[0].field === 'template_performance_metrics') {
            console.log('template_performance_metrics');
            if (job.data.entry[0].changes != undefined && job.data.entry[0].changes[0].field == 'template_performance_metrics') {
                if (templates_performance_metrics.length > 0) {
                    for (let i = 0; i < templates_performance_metrics.length; i++) {
                        let msgtempid = job.data.entry[0].changes[0].value.templates_performance_metrics[i].template_id;
                        let top_block_reason = job.data.entry[0].changes[0].value.templates_performance_metrics[i].top_block_reason;
                        let messages_sent_7d = job.data.entry[0].changes[0].value.templates_performance_metrics[i].messages_sent_7d != undefined ? job.data.entry[0].changes[0].value.templates_performance_metrics[i].messages_sent_7d : null;
                        let messages_opened_7d = job.data.entry[0].changes[0].value.templates_performance_metrics[i].messages_opened_7d != undefined ? job.data.entry[0].changes[0].value.templates_performance_metrics[i].messages_opened_7d : null;

                        updateTemplatePerformanceResult = await sendService.updateTemplatePerformance(top_block_reason, messages_sent_7d, messages_opened_7d, msgtempid);
                    }
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
};


phoneNumberUpdateController = async (job) => {
    try {
        // console.log(JSON.stringify(job.data))
        let displayPhonenumber = job.data.entry[0].changes[0].value.display_phone_number;
        let numberDecision = job.data.entry[0].changes[0].value.decision;
        let requestedVerifiedName = job.data.entry[0].changes[0].value.requested_verified_name;
        if (job.data.object === 'whatsapp_business_account' && job.data.entry[0].changes[0].field === 'phone_number_name_update') {
            if (job.data.entry[0].changes !== undefined && job.data.entry[0].changes[0].field === 'phone_number_name_update') {
                // console.log(displayPhonenumber);
                // console.log('phone_number_name_update');
                if (numberDecision === 'APPROVED') {

                    updatePhoneNumberNameUpdateResult = await sendService.updatePhoneNumberNameUpdate(requestedVerifiedName, displayPhonenumber);
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
};

phoneNumberQualityController = async (job) => {
    try {
        // console.log(JSON.stringify(job.data))
        let displayPhonenumber = job.data.entry[0].changes[0].value.display_phone_number;
        let eventQuality = job.data.entry[0].changes[0].value.event;
        let currentLimit = job.data.entry[0].changes[0].value.current_limit;
        if (job.data.object === 'whatsapp_business_account' && job.data.entry[0].changes[0].field === 'phone_number_quality_update') {
            if (job.data.entry[0].changes !== undefined && job.data.entry[0].changes[0].field === 'phone_number_quality_update') {

                updatePhoneNumberQualityUpdateResult = await sendService.updatePhoneNumberQualityUpdate(currentLimit, eventQuality, displayPhonenumber);
            }
        }

    } catch (err) {
        console.log(err);
    }
};

module.exports = {
    templateStatusController,
    templateCategoryController,
    templatePerformanceController,
    phoneNumberUpdateController,
    phoneNumberQualityController
};