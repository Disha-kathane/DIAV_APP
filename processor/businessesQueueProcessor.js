const { businessesPayloadQueue } = require('../queue/businessesPayloadQueue');
const template_status_Controller = require('../controller/v1/businessesQueueController');
const phonenumber_update_Controller = require('../controller/v1/businessesQueueController');
const phonenumber_quality_Controller = require('../controller/v1/businessesQueueController');
const template_category_Controller = require('../controller/v1/businessesQueueController');
const template_performance_metrics_Controller = require('../controller/v1/businessesQueueController');


businessesPayloadQueue.process((job, done) => {
    console.log('running task');
    template_status_Controller.templateStatusController(job);
    phonenumber_update_Controller.phoneNumberUpdateController(job);
    phonenumber_quality_Controller.phoneNumberQualityController(job);
    template_category_Controller.templateCategoryController(job);
    template_performance_metrics_Controller.templatePerformanceController(job);
    done();
});

console.log('BUSINESSES PAYLOAD QUEUE PROCESSOR');