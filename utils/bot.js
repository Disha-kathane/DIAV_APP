var validator = require('validator');
var crypto = require('crypto');
var phoneUtil = require("google-libphonenumber").PhoneNumberUtil.getInstance();
var appLoggers = require('../applogger.js');
var errorLogger = appLoggers.errorLogger;
const axios = require('axios');
/* WhatsApp Biz API */
var urlencode = require('urlencode');
var http = require('http');
var https = require('https');
var httpUrl = require('url');
var qs = require("querystring");
var Promise = require('promise');
var fileType = require('file-type');
var moment = require('moment');
const uuidv4 = require('uuid').v4;
const config = require('../config');
/* WhatsApp Biz API */
// var mysql = require('../dbcon');

module.exports = {
    // dbconmode: mysql.MODE_DEV,
    // getDBPool: function () {
    //     mysql.connect(this.dbconmode, function (err) {
    //         if (err) {
    //             errorLogger.error(err);
    //             process.exit(1);
    //         }
    //     });
    //     return mysql.getPool();
    // },
    //mobLocale : {'AE':'ar-AE','EG':'ar-EG','JO':'ar-JO','SA':'ar-SA','SY':'ar-SY','BY':'be-BY','BG':'bg-BG','CZ':'cs-CZ','DK':'da-DK','DE':'de-DE','GR':'el-GR','AU':'en-AU','GB':'en-GB', 'HK':'en-HK','IN':'en-IN','KE':'en-KE','NG':'en-NG','NZ':'en-NZ','PK':'en-PK','RW':'en-RW','SG':'en-SG','TZ':'en-TZ','UG':'en-UG','US':'en-US','ZA':'en-ZA','ZM':'en-ZM','ES':'es-ES','EE' :'et-EE','IR':'fa-IR','FI':'fi-FI','FO':'fo-FO','FR':'fr-FR','IL':'he-IL','HU':'hu-HU','ID':'id-ID','IT':'it-IT','JP':'ja-JP','KZ':'kk-KZ','GL':'kl-GL','KR':'ko-KR','LT':'lt-LT','MY' :'ms-MY','NO':'nb-NO','BE':'nl-BE','NO':'nn-NO','PL':'pl-PL','BR':'pt-BR','PT':'pt-PT','RO':'ro-RO','RU':'ru-RU','SK':'sk-SK','RS':'sr-RS','TH':'th-TH','TR':'tr-TR','UA':'uk-UA','VN':'vi-VN', 'CN':'zh-CN','TW':'zh-TW'},
    capitalize: function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    checkDate: function (date) {
        var matches = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(date);
        if (matches == null) return false;
        var d = matches[1];
        var m = parseInt(matches[2]) - 1;
        var y = matches[3];
        var composedDate = new Date(y, m, d);
        return composedDate.getDate() == d && composedDate.getMonth() == m && composedDate.getFullYear() == y;
    },
    formatDateMysql: function (date) {
        var matches = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(date);
        if (matches == null) return false;
        var d = matches[1];
        var m = matches[2];
        var y = matches[3];
        return y + '-' + m + '-' + d;
    },
    formatTimestampMysql: function (date) {
        var rxDatePattern = /^(\d{4}(\/|-)(\d{1,2})(\/|-)(\d{1,2})\s\d{2}:\d{2}(:\d{2})?)$/; //Declare Regex
        if (!rxDatePattern.test(date)) return false;

        var d1 = Date.parse(date);
        var d = matches[1];
        var m = matches[2];
        var y = matches[3];
        return y + '-' + m + '-' + d;
    },
    excelDateToJSDate: function (serial) {
        var utc_days = Math.floor(serial - 25569);
        var utc_value = utc_days * 86400;
        var date_info = new Date(utc_value * 1000);
        var fractional_day = serial - Math.floor(serial) + 0.0000001;
        var total_seconds = Math.floor(86400 * fractional_day);
        var seconds = total_seconds % 60;
        total_seconds -= seconds;
        var hours = Math.floor(total_seconds / (60 * 60));
        var minutes = Math.floor(total_seconds / 60) % 60;
        var timestamp = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
        return timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + hours + ':' + minutes + ':' + seconds;
    },
    reportDateVal: function (timestamp) {
        var rxDatePattern = /^(\d{1,2}(\/|-)(\d{1,2})(\/|-)(\d{4})\s\d{2}:\d{2}(:\d{2})?)$/;
        if (!rxDatePattern.test(timestamp)) {
            return false;
        }
        var arrts = timestamp.split(" ");
        if (arrts.length != 2) {
            return false;
        }
        var rdate = this.formatDateMysql(arrts[0]);
        var rtime = arrts[1];
        timestamp = rdate + " " + rtime;
        var ts = new Date(timestamp);
        if (!this.isValidDate(ts)) {
            return false;
        }
        return ts.getFullYear() + "-" + this.padNumber(ts.getMonth() + 1, 2) + "-" + this.padNumber(ts.getDate(), 2) + " " + this.padNumber(ts.getHours(), 2) + ":" + this.padNumber(ts.getMinutes(), 2) + ":" + this.padNumber(ts.getSeconds(), 2);
    },
    padNumber: function (n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },
    isValidDate: function (d) {
        return d instanceof Date && !isNaN(d);
    },
    isMobileLocal: function (number, countrycode) {
        /*var locale = (typeof this.mobLocale[countrycode]!='undefined')?mobLocale[countrycode]:'en-IN';
        return validator.isMobilePhone(number,locale);*/
        var isValid = false;
        try {
            var mobileNumber = phoneUtil.parse(number, countrycode);
            if (phoneUtil.isValidNumber(mobileNumber) && (phoneUtil.getNumberType(mobileNumber) == 1 || phoneUtil.getNumberType(mobileNumber) == 2)) {
                isValid = true;
            }
        } catch (e) {
            errorLogger.error('Invalid Number ' + number);
            errorLogger.error(e);
        }
        return isValid;
    },
    isMobileInternational: function (number) {
        if (typeof number == 'undefined' || number.length == 0) {
            return false;
        }

        if (/^\+/.test(number) == false) {
            number = '+' + number;
        }

        var isValid = false;
        try {
            var mobileNumber = phoneUtil.parse(number, '');
            if (phoneUtil.isValidNumber(mobileNumber) && (phoneUtil.getNumberType(mobileNumber) == 1 || phoneUtil.getNumberType(mobileNumber) == 2)) {
                isValid = true;
            }
        } catch (e) {
            errorLogger.error('Invalid Number ' + number);
            errorLogger.error(e);
        }
        return isValid;
    },
    formatMobileWhatsapp: function (number, countrycode) {
        var formattedNumber = '';
        try {
            var mobileNumber = phoneUtil.parse(number, countrycode);
            formattedNumber = '+' + mobileNumber.getCountryCode() + mobileNumber.getNationalNumber() + '';
        } catch (e) {
            errorLogger.error('Invalid Number ' + number);
            errorLogger.error(e);
        }
        return formattedNumber;
    },
    formatMobileLocal: function (number, countrycode) {
        var formattedNumber = '';
        try {
            var mobileNumber = phoneUtil.parse(number, countrycode);
            formattedNumber = mobileNumber.getCountryCode() + '' + mobileNumber.getNationalNumber() + '';
        } catch (e) {
            errorLogger.error('Invalid Number ' + number);
            errorLogger.error(e);
        }
        return formattedNumber;
    },
    formatMobileInternational: function (number) {
        if (/^\+/.test(number) == false) {
            number = '+' + number;
        }
        var formattedNumber = '';
        try {
            var mobileNumber = phoneUtil.parse(number, '');
            formattedNumber = mobileNumber.getCountryCode() + '' + mobileNumber.getNationalNumber() + '';
        } catch (e) {
            errorLogger.error('Invalid Number ' + number);
            errorLogger.error(e);
        }
        return formattedNumber;
    },
    getCountryCode: function (number) {
        if (/^\+/.test(number) == false) {
            number = '+' + number;
        }
        var countryCode = '';
        try {
            var mobileNumber = phoneUtil.parse(number, '');
            countryCode = phoneUtil.getRegionCodeForNumber(mobileNumber);
            //countryCode=mobileNumber.getCountryCode();
            //console.log('getRegionCodeForNumber' + phoneUtil.getRegionCodeForNumber(mobileNumber));
        } catch (e) {
            errorLogger.error('Invalid Number ' + number);
            errorLogger.error(e);
        }
        return countryCode;
    },
    getCountryCodeNumeric: function (number) {
        if (/^\+/.test(number) == false) {
            number = '+' + number;
        }
        var countryCode = '';
        try {
            var mobileNumber = phoneUtil.parse(number, '');
            countryCode = mobileNumber.getCountryCode();
        } catch (e) {
            errorLogger.error('Invalid Number ' + number);
            errorLogger.error(e);
        }
        return countryCode;
    },
    getMonthAndYear: function () {
        var now = new Date();
        var m = now.getMonth();
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var month = (typeof months[m] != 'undefined') ? months[m] : ' ';
        var year = now.getFullYear();
        return month + ', ' + year;
    },
    hasTags: function (inputStr) {
        var regExTags = /<\/?[^>]*(>|$)/g;
        return regExTags.test(inputStr);
    },
    stripTags: function (inputStr) {
        var regExTags = /<\/?[^>]*(>|$)/g;
        inputStr = (inputStr == "" || inputStr.length == 0) ? '' : inputStr + "";
        return inputStr.replace(regExTags, '');
    },
    filterInput: function (input) {
        input = input.trim()
        let regExp = /[\t\r\n]|(--[^\r\n]*)|(\/\*[\w\W]*?(?=\*)\*\/)/gi;
        if (typeof input == 'undefined' || input.length == 0 || input == null) {
            input = "";
        }
        return input.replace(regExp, '');
    },
    getDateArray: function (start, end) {
        var arr = new Array();
        var dt = new Date(start);
        var dt1 = new Date(end);
        while (dt <= dt1) {
            var fd = new Date(dt);
            var fday = fd.getDate();
            var fmonth = fd.getMonth() + 1;
            var fyear = fd.getFullYear();
            var fromdate = fd.getFullYear() + '-' + (fmonth < 10 ? '0' : '') + fmonth + '-' + (fday < 10 ? '0' : '') + fday;
            arr.push(fromdate);
            dt.setDate(dt.getDate() + 1);
        }
        return arr;
    },
    compareDate: function (date) {
        var matches = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/.exec(date);
        if (matches == null) {
            return true;
        } else {
            var dt1 = date.split('-');
            var dt2 = new Date();
            dt2.setMonth(dt2.getMonth() - 6);
            var dt2_year = dt2.getFullYear();
            var dt2_day = dt2.getDate();
            var dt2_month = dt2.getMonth();
            var date1 = new Date(parseInt(dt1[0]), (parseInt(dt1[1]) - 1), parseInt(dt1[2]));
            var date2 = new Date(parseInt(dt2_year), (parseInt(dt2_month) - 1), parseInt(dt2_day));
            return date1.getTime() < date2.getTime();
        }
    },
    generate_key: function () {
        var sha = crypto.createHash('md5');
        sha.update(Math.random().toString());
        return sha.digest('hex');
    },
    mkUniString: function (length) {
        var result = '';
        var characters = 'QNKIADOCETUBFVMWXJHRYGZSPLhpgycdijvlmoaeqrstuwxzbfkn';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },
    callWhatsAppApi: function (instanceUrl, api, data, httpMethod, requestType, apiHeaders) {
        var url = instanceUrl + api;
        var httpMethod = parseInt(httpMethod);
        var requestType = parseInt(requestType);
        var postData = {};
        var getData = {};
        if (httpMethod == 0) {
            if (requestType == 0) {
                getData = data;
            } else {
                getData = data;
            }
        } else {
            postData = (requestType == 0) ? qs.stringify(data) : data;
        }
        var contentType = (requestType == 0) ? 'application/x-www-form-urlencoded' : 'application/json';
        var headers = {
            'Content-Type': contentType,
            'cache-control': 'no-cache'
        };
        var len = apiHeaders.length;
        for (var y = 0; y < len; ++y) {
            var obj = apiHeaders[y];
            headers[obj.headerName] = obj.headerVal;
        }
        // if (httpMethod == 1) {
        //     postData = (requestType == 0) ? qs.stringify(postData) : postData;
        // }
        return new Promise(function (resolve, reject) {
            var options = {
                url: api,
                method: (httpMethod == 1) ? 'POST' : 'GET',
                baseURL: instanceUrl,
                timeout: 3000,
                responseType: 'json',
                responseEncoding: 'utf8',
                headers: headers,
            };
            var protocol = httpUrl.parse(url).protocol;
            if (protocol != null && protocol == "https:") {
                options.httpsAgent = new https.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }) //secureProtocol: 'TLSv1_method'
            } else {
                options.httpAgent = new http.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            }
            if (httpMethod == 1) { //POST
                options.data = postData;
            } else {
                options.params = getData;
            }
            const instance = axios.create(options);
            try {
                if (httpMethod == 1) { //POST
                    instance.post(url, postData).then(function (response) {
                        // console.log(response);
                        resolve(response.data);
                    }).catch(function (error) {
                        reject(error);
                    });
                } else { //GET
                    instance.get(url, {
                        getData
                    }).then(function (response) {
                        resolve(response.data);
                    }).catch(function (error) {
                        reject(error);
                    });
                }
            } catch (e) {
               return reject(e);
            }
        });
    },
    
    markWaMessageRead: function (instanceUrl, apiHeaders, messageId, objData) {
        var url = instanceUrl + '/v1/messages/' + messageId;
        var contentType = 'application/json';
        var headers = {
            'Content-Type': contentType,
            'cache-control': 'no-cache'
        };
        var len = apiHeaders.length;
        for (var y = 0; y < len; ++y) {
            var obj = apiHeaders[y];
            headers[obj.headerName] = obj.headerVal;
        }
        /*var options = {
            host: httpUrl.parse(url).hostname,
            port: httpUrl.parse(url).port,
            path: httpUrl.parse(url).pathname,
            Accept:'*!/!*',
            "User-Agent": "PostmanRuntime/7.13.0",
            "accept-encoding": "gzip, deflate",
            method: 'PUT',
            rejectUnauthorized: false,
            headers: headers,
            timeout: 3000
        };*/
        return new Promise(function (resolve, reject) {
            var options = {
                url: '/v1/messages/' + messageId,
                method: 'PUT',
                baseURL: instanceUrl,
                timeout: 3000,
                responseType: 'json',
                responseEncoding: 'utf8',
                headers: headers,
                params: {}
            };
            var protocol = httpUrl.parse(url).protocol;
            if (protocol != null && protocol == "https:") {
                options.httpsAgent = new https.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }) //secureProtocol: 'TLSv1_method'
            } else {
                options.httpAgent = new http.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            }
            const instance = axios.create(options);
            try {
                instance.put(url, objData).then(function (response) {
                    resolve(response.data);
                }).catch(function (error) {
                    reject(error);
                });
            } catch (e) {
                reject(e);
            }
        });
        /*return new Promise(function(resolve,reject){
            try{
                var protocol = httpUrl.parse(url).protocol;
                var callHttp = (protocol!=null && protocol=="https:")?https:http;
                var httpReq = callHttp.request(options,function(httpResponse){
                    httpResponse.setEncoding('utf-8');
                    var responseData = {};
                    httpResponse.on('data',function(data){
                        try{
                            responseData = JSON.parse(data);
                        }catch(e){
                            errorLogger.error(e.message);
                        }
                    });
                    httpResponse.on('end',function(){
                        resolve(responseData);
                    });
                    httpResponse.on('error',function(e){
                        errorLogger.error(e);
                        reject(e);
                    })
                });
                httpReq.write(JSON.stringify(objData));
                httpReq.end()
            }catch(e){
                errorLogger.error(e);
                reject(e);
            }
        });*/
    },
    mkWhatsappSessionId: function (bot, waid) {
        var botid = (typeof bot.botid != 'undefined') ? bot.botid : '';
        var userid = (typeof bot.userid != 'undefined') ? bot.userid : '';
        if (botid != '' && userid != '') {
            var arr = botid.split(/\-/);
            var sessionid = (typeof arr[0] != 'undefined') ? arr[0] : '';
            sessionid += '_' + userid + '_' + waid;
            return 'wa' + sessionid;
        } else {
            return null;
        }
    },
    isWhatsAppnumber: function (number) {
        if (typeof number == 'undefined' || number.length == 0) {
            return false;
        }
        if (/^\+/.test(number) == false) {
            number = '+' + number;
        }
        var isValid = false;
        try {
            var mobileNumber = phoneUtil.parse(number, '');
            if (phoneUtil.isValidNumber(mobileNumber) && phoneUtil.getNumberType(mobileNumber) != -1) {
                isValid = true;
            }
        } catch (e) {
            errorLogger.error('Invalid Number ' + number);
            errorLogger.error(e);
        }
        return isValid;
    },
    callWhatsAppMediaApi: function (instanceUrl, api, data, httpMethod, requestType, apiHeaders, res) {
        var url = instanceUrl + api;
        var httpMethod = parseInt(httpMethod);
        var requestType = parseInt(requestType);
        var postData = {};
        var getData = '';
        if (httpMethod == 0) {
            if (requestType == 0) {
                getData = data;
            } else {
                getData = JSON.stringify(data);
            }
        } else {
            postData = data;
        }
        var contentType = (requestType == 0) ? 'application/x-www-form-urlencoded' : 'application/json';
        var headers = {
            'Content-Type': contentType,
            'cache-control': 'no-cache'
        };
        var len = apiHeaders.length;
        for (var y = 0; y < len; ++y) {
            var obj = apiHeaders[y];
            headers[obj.headerName] = obj.headerVal;
        }
        var options = {
            host: httpUrl.parse(url).hostname,
            port: httpUrl.parse(url).port,
            path: (httpMethod == 0) ? httpUrl.parse(url).pathname + '?' + getData : httpUrl.parse(url).pathname,
            Accept: '*!/!*',
            "User-Agent": "PostmanRuntime/7.13.0",
            "accept-encoding": "gzip, deflate",
            method: (httpMethod == 0) ? 'GET' : 'POST',
            rejectUnauthorized: false,
            headers: headers,
            timeout: 3000
        };
        try {
            var protocol = httpUrl.parse(url).protocol;
            var callHttp = (protocol != null && protocol == "https:") ? https : http;
            var httpReq = callHttp.request(options, function (httpResponse) {
                var responseData = [];
                httpResponse.on('data', function (data) {
                    try {
                        responseData.push(data);
                    } catch (e) {
                        errorLogger.error(e.message);
                    }
                });
                httpResponse.on('end', function () {
                    var data = Buffer.concat(responseData);
                    var objFile = fileType(data);
                    var headers = httpResponse.headers;
                    if (objFile != null && typeof objFile != 'undefined' && typeof objFile.ext != 'undefined') {
                        var fileDate = new Date();
                        var filename = (typeof postData.filename != 'undefined') ? postData.filename : fileDate.getTime();
                        headers['content-disposition'] = 'attachment; filename="' + filename + '.' + objFile.ext + '"';
                    }
                    res.header(headers);
                    res.send(data);
                });
                httpResponse.on('error', function (e) {
                    errorLogger.error(e);
                    res.status(404);
                    res.render('error', {
                        message: "Something went wrong.",
                        error: "Unable to render media"
                    });
                })
            });
            if (httpMethod == 1) {
                httpReq.write((requestType == 0) ? qs.stringify(postData) : JSON.stringify(postData));
            }
            httpReq.end();
        } catch (e) {
            errorLogger.error(e);
        }
    },
    generateApiKey: function () {
        return uuidv4();
    },
    getMediaType: function (url) {
        return new Promise(function (resolve, reject) {
            try {
                var protocol = httpUrl.parse(url).protocol;
                var callHttp = (protocol != null && protocol == "https:") ? https : http;
                callHttp.get(url, response => {
                    response.on('readable', () => {
                        const chunk = response.read(fileType.minimumBytes);
                        response.destroy();
                        resolve(fileType(chunk));
                        //=> {ext: 'gif', mime: 'image/gif'}
                    });
                    response.on('error', function (e) {
                        errorLogger.error(e);
                        reject(e);
                    });
                });
            } catch (e) {
                errorLogger.error(e);
                reject(e);
            }
        });
    },
    sendReportToClient: function (url, wamessageid, status, obj) {
        var strStatus = (status == 1) ? 'delivered' : 'read';
        var postData = {
            'messageid': wamessageid,
            'status': strStatus
        };
        var contentType = 'application/json';
        var headers = {
            'Content-Type': contentType,
            'cache-control': 'no-cache'
        };
        var options = {
            host: httpUrl.parse(url).hostname,
            port: httpUrl.parse(url).port,
            path: httpUrl.parse(url).pathname,
            method: 'POST',
            headers: headers,
            timeout: 3000
        };
        return new Promise(function (resolve, reject) {
            try {
                var protocol = httpUrl.parse(url).protocol;
                var callHttp = (protocol != null && protocol == "https:") ? https : http;
                var httpReq = callHttp.request(options, function (httpResponse) {
                    httpResponse.setEncoding('utf-8');
                    var responseData = "";
                    httpResponse.on('data', function (data) {
                        try {
                            responseData = data;
                        } catch (e) {
                            errorLogger.error(e.message);
                        }
                    });
                    httpResponse.on('end', function () {
                        if (httpResponse.statusCode == 200) {
                            resolve({
                                'code': 200,
                                'status': 'OK',
                                'row': obj
                            });
                        } else {
                            reject({
                                'code': httpResponse.statusCode,
                                'status': 'Error',
                                'row': obj
                            });
                        }
                    });
                    httpResponse.on('error', function (e) {
                        errorLogger.error(e);
                        reject(err);
                    });
                });
                httpReq.write(JSON.stringify(postData));
                httpReq.end()
            } catch (e) {
                errorLogger.error(e);
                reject(e);
            }
        });
    },
    mkisMobileInternationalWebhookUrl: function (url, attributes) {
        var pattern = /[^{{\}]+(?=}})/g;
        var matches = url.match(pattern);
        if (matches == null) {
            matches = [];
        }
        var len = matches.length;
        if (len > 0 && attributes != null) {
            for (var i = 0; i < len; ++i) {
                var attr = matches[i];
                var pattern = new RegExp('{\s*{\s*' + attr + '\s*}\s*}', 'gi');
                var attrVal = (typeof attributes[attr] != 'undefined') ? attributes[attr] : '';
                url = url.replace(pattern, attrVal);
            }
        }
        return url;
    },
    callWebhook: function (webhookurl, data, httpMethod, requestType, apiHeaders) {
        var host = httpUrl.parse(webhookurl).hostname;
        var api = httpUrl.parse(webhookurl).pathname;
        var httpMethod = parseInt(httpMethod);
        var requestType = parseInt(requestType);
        var postData = {};
        var getData = {};
        if (httpMethod == 0) {
            if (requestType == 0) {
                getData = data;
                webhookurl += '?' + qs.stringify(getData);
            } else {
                getData = data;
            }
        } else {
            postData = (requestType == 0) ? qs.stringify(data) : data;
        }
        return new Promise(function (resolve, reject) {
            var options = {
                url: api,
                method: (httpMethod == 1) ? 'POST' : 'GET',
                baseURL: host,
                timeout: 50000,
                responseType: 'json',
                responseEncoding: 'utf8',
                headers: apiHeaders
            };
            var protocol = httpUrl.parse(webhookurl).protocol;
            if (protocol != null && protocol == "https:") {
                if (host.indexOf("smsjust.com") !== -1) {
                    options.httpsAgent = new https.Agent({
                        keepAlive: true,
                        rejectUnauthorized: false,
                        secureProtocol: 'TLSv1_method'
                    });
                } else {
                    options.httpsAgent = new https.Agent({
                        keepAlive: true,
                        rejectUnauthorized: false
                    });
                }
            } else {
                options.httpAgent = new http.Agent({
                    keepAlive: true
                });
            }
            if (httpMethod == 1) { //POST
                options.data = postData;
            } else {
                options.params = getData;
            }
            try {
                const instance = axios.create(options);
                if (httpMethod == 1) { //POST
                    instance.post(webhookurl, postData).then(function (response) {
                        //console.log(response.config);
                        //console.log(response.data);
                        resolve(response.data);
                    }).catch(function (error) {
                        //console.log('Error in catch block POST method');
                        //console.log(error);
                        reject(error);
                    });
                } else { //GET
                    instance.get(webhookurl).then(function (response) {
                        //console.log(response.config);
                        //console.log(response.data);
                        resolve(response.data, {
                            getData
                        });
                    }).catch(function (error) {
                        //console.log('Error in catch block GET method');
                        //console.log(error);
                        reject(error);
                    });
                }
            } catch (e) {
                //console.log(e);
                //console.log('Error in catch block');
                reject(e);
            }
        });
    },
    callWhatsAppApiAxios: function (instanceUrl, api, data, httpMethod, requestType, apiHeaders) {
        var url = instanceUrl + api;
        var httpMethod = parseInt(httpMethod);
        var requestType = parseInt(requestType);
        var postData = {};
        var getData = {};
        if (httpMethod == 0) {
            if (requestType == 0) {
                getData = data;
            } else {
                getData = data;
            }
        } else {
            postData = (requestType == 0) ? qs.stringify(data) : data;
        }
        var contentType = (requestType == 0) ? 'application/x-www-form-urlencoded' : 'application/json';
        var headers = {
            'Content-Type': contentType,
            'cache-control': 'no-cache'
        };
        var len = apiHeaders.length;
        for (var y = 0; y < len; ++y) {
            var obj = apiHeaders[y];
            headers[obj.headerName] = obj.headerVal;
        }
        if (httpMethod == 1) {
            postData = (requestType == 0) ? qs.stringify(postData) : postData;
        }
        return new Promise(function (resolve, reject) {
            var options = {
                url: api,
                method: (httpMethod == 1) ? 'POST' : 'GET',
                baseURL: instanceUrl,
                timeout: 3000,
                responseType: 'json',
                responseEncoding: 'utf8',
                headers: headers
            };
            var protocol = httpUrl.parse(url).protocol;
            if (protocol != null && protocol == "https:") {
                options.httpsAgent = new https.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }) //secureProtocol: 'TLSv1_method'
            } else {
                options.httpAgent = new http.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            }
            if (httpMethod == 1) { //POST
                options.data = postData;
            } else {
                options.params = getData;
            }
            const instance = axios.create(options);
            try {
                if (httpMethod == 1) { //POST
                    instance.post(url, postData).then(function (response) {
                        /*console.log(response.data);
                        console.log(response.status);
                        console.log(response.statusText);
                        console.log(response.headers);
                        console.log(response.config);*/
                        resolve(response.data);
                    }).catch(function (error) {
                        //console.log('Error in catch block POST method');
                        //console.log(error);
                        reject(error);
                    });
                } else { //GET
                    instance.get(url, {
                        getData
                    }).then(function (response) {
                        /*console.log(response.data);
                        console.log(response.status);
                        console.log(response.statusText);
                        console.log(response.headers);
                        console.log(response.config);*/
                        resolve(response.data);
                    }).catch(function (error) {
                        //console.log('Error in catch block GET method');
                        //console.log(error);
                        reject(error);
                    });
                }
            } catch (e) {
                //console.log(e);
                //console.log('Error in catch block');
                reject(e);
            }
        });
    },
    uploadWhatsappMedia: function (instanceUrl, data, apiHeaders) {
        let api = '/v1/media';
        let url = instanceUrl + api;
        let headers = {
            'cache-control': 'no-cache'
        };
        let len = apiHeaders.length;
        for (let y = 0; y < len; ++y) {
            let obj = apiHeaders[y];
            headers[obj.headerName] = obj.headerVal;
        }
        return new Promise(function (resolve, reject) {
            var options = {
                url: api,
                method: 'POST',
                baseURL: instanceUrl,
                headers: headers,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            };
            options.data = data;
            let protocol = httpUrl.parse(url).protocol;
            if (protocol != null && protocol == "https:") {
                options.httpsAgent = new https.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            } else {
                options.httpAgent = new http.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            }
            const instance = axios.create(options);
            try {
                instance.post(url, data).then(function (response) {
                    resolve(response.data);
                }).catch(function (error) {
                    reject(error);
                });
            } catch (e) {
                reject(e);
            }
        });
    },
    downloadWhatsappMedia: function (instanceUrl, mediaId, apiHeaders) {
        let api = '/v1/media/' + mediaId;
        let url = instanceUrl + api;
        let headers = {
            'cache-control': 'no-cache'
        };
        let len = apiHeaders.length;
        for (let y = 0; y < len; ++y) {
            let obj = apiHeaders[y];
            headers[obj.headerName] = obj.headerVal;
        }
        return new Promise(function (resolve, reject) {
            var options = {
                url: api,
                method: 'GET',
                baseURL: instanceUrl,
                headers: headers,
                responseType: 'arraybuffer',
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            };
            let protocol = httpUrl.parse(url).protocol;
            if (protocol != null && protocol == "https:") {
                options.httpsAgent = new https.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            } else {
                options.httpAgent = new http.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            }
            const instance = axios.create(options);
            try {
                instance.get(url).then(function (response) {
                    resolve(response.data);
                }).catch(function (error) {
                    reject(error);
                });
            } catch (e) {
                reject(e);
            }
        });
    },
    deleteWhatsappMedia: function (instanceUrl, mediaId, apiHeaders) {
        let api = '/v1/media/' + mediaId;
        let url = instanceUrl + api;
        let headers = {
            'cache-control': 'no-cache'
        };
        let len = apiHeaders.length;
        for (let y = 0; y < len; ++y) {
            let obj = apiHeaders[y];
            headers[obj.headerName] = obj.headerVal;
        }
        return new Promise(function (resolve, reject) {
            var options = {
                url: api,
                method: 'DELETE',
                baseURL: instanceUrl,
                headers: headers,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            };
            let protocol = httpUrl.parse(url).protocol;
            if (protocol != null && protocol == "https:") {
                options.httpsAgent = new https.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            } else {
                options.httpAgent = new http.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            }
            const instance = axios.create(options);
            try {
                instance.delete(url).then(function (response) {
                    resolve(response.data);
                }).catch(function (error) {
                    reject(error);
                });
            } catch (e) {
                reject(e);
            }
        });
    },
    mkMessengerSessionId: function (bot, pageid, senderid) {
        var botid = (typeof bot.botid != 'undefined') ? bot.botid : '';
        var pageid = (typeof pageid != 'undefined') ? pageid : '';
        var senderid = (typeof senderid != 'undefined') ? senderid : '';
        if (botid != '' && pageid != '' && senderid != '') {
            var arr = botid.split(/\-/);
            var sessionid = (typeof arr[0] != 'undefined') ? arr[0] : '';
            sessionid += '_' + pageid + '_' + senderid;
            return 'mg' + sessionid;
        } else {
            return null;
        }
    },
    calculateMessageCount: function (actualCount, deductionCount) {
        if (actualCount == 0) {
            return 0;
        }
        if (deductionCount == 0) {
            return actualCount;
        }
        if (actualCount < deductionCount) {
            return 0;
        }
        return (actualCount - deductionCount);
    },
    cmprptDate: function (fromdate, todate) {
        const dateIsSame = moment(new Date(fromdate)).isSame(moment(new Date(todate)));
        if (!dateIsSame) {
            const dateIsBefore = moment(new Date(fromdate)).isBefore(moment(new Date(todate)));
            if (!dateIsBefore) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    checkNumberOfDays: function (fromdate, todate) {
        let returnValue = false;
        let a = moment(new Date(todate));
        let b = moment(new Date(fromdate));
        let days = a.diff(b, 'days'); // 1
        if (parseInt(days) > 30) {
            returnValue = true;
        }
        return returnValue;
    },
    callWhatsAppApiGET: function (instanceUrl, api, httpMethod, requestType, apiHeaders) {
        var url = instanceUrl + api;
        var httpMethod = parseInt(httpMethod);
        var requestType = parseInt(requestType);
        var getData = {};
        var httpMethod = 0;
        var requestType = 0;
               
        var contentType = (requestType == 0) ? 'application/x-www-form-urlencoded' : 'application/json';
        var headers = {
            'Content-Type': contentType,
            'cache-control': 'no-cache'
        };
        var len = apiHeaders.length;
        for (var y = 0; y < len; ++y) {
            var obj = apiHeaders[y];
            headers[obj.headerName] = obj.headerVal;
        }
        
        return new Promise(function (resolve, reject) {
            var options = {
                url: api,
                method: (httpMethod == 1) ? 'POST':'GET',
                baseURL: instanceUrl,
                timeout: 3000,
                responseType: 'json',
                responseEncoding: 'utf8',
                headers: headers,
            };
            var protocol = httpUrl.parse(url).protocol;
            if (protocol != null && protocol == "https:") {
                options.httpsAgent = new https.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }) //secureProtocol: 'TLSv1_method'
            } else {
                options.httpAgent = new http.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            }
            
                options.params = getData;
          
            const instance = axios.create(options);
            try {               
                instance.get(url, {
                    getData
                }).then(function (response) {
                    resolve(response.data);
                }).catch(function (error) {
                    reject(error);
                });            
            } catch (e) {
               return reject(e);
            }
        });
    },
    deleteWhatsappTemplate: function (data, whatsappAccountId, apiHeaders) {
        const instanceUrl = config.graphFacebookUrl;
        let url = `${instanceUrl}/v11.0/${whatsappAccountId}/message_templates?${qs.stringify(data)}`;
        let headers = {
            'cache-control': 'no-cache'
        };
        let len = apiHeaders.length;
        for (let y = 0; y < len; ++y) {
            let obj = apiHeaders[y];
            headers[obj.headerName] = obj.headerVal;
        }
        return new Promise(function (resolve, reject) {
            var options = {
                url: url,
                method: 'DELETE',
                baseURL: instanceUrl,
                headers: headers,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            };
            let protocol = httpUrl.parse(url).protocol;
            if (protocol != null && protocol == "https:") {
                options.httpsAgent = new https.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            } else {
                options.httpAgent = new http.Agent({
                    keepAlive: true,
                    rejectUnauthorized: false
                }); //secureProtocol: 'TLSv1_method'
            }
            const instance = axios.create(options);
            try {
                instance.delete(url ).then(function (response) {
                    resolve(response.data);
                }).catch(function (error) {
                    reject(error);
                });
            } catch (e) {
                reject(e);
            }
        });
    },
    fetchPlaceholders: function (placeholders) {
        var placeholderArr = JSON.parse(placeholders);
        var tempArr = [];
        for (var i = 0; i < placeholderArr.length; i++) {
            tempArr.push({
                "type": "text",
                "text": placeholderArr[i]
            });
        }

        return tempArr;
    }
};