module.exports = (statusCode, message, data = {}, error) => {
    let status = 'SUCCESS';
    if (statusCode != 200) {
        status = 'FAILED';
        if (error) {
            // log here
        }
    }
    return {
        code: statusCode,
        status,
        message,
        data: data!=null? data: []
    }
}