let checkCondition = (result, bodyText, contactno, obj, next) => {
    let isCondition = null;
    let current_message_id = result.current_message_id;
    let _condition = result.payload._condition;

    let if_is_placeholder = result.payload.if_is_placeholder;
    let ctext_is_placeholder = result.payload.ctext_is_placeholder;
    let if_text = result.payload.if_text != null ? result.payload.if_text.toLowerCase() : null;
    let compaire_text = result.payload.compaire_text != null ? result.payload.compaire_text.toLowerCase() : null;
    let condition = result.payload.condition

    let if1_is_placeholder = result.payload.if1_is_placeholder;
    let ctext1_is_placeholder = result.payload.ctext1_is_placeholder;
    let if_text1 = result.payload.if_text1 != null ? result.payload.if_text1.toLowerCase() : null;
    let compaire_text1 = result.payload.compaire_text1 != null ? result.payload.compaire_text1.toLowerCase() : null;
    let condition1 = result.payload.condition1;

    async.waterfall([
        (conditionCallback) => {
            if (_condition == null || _condition == '') {
                if (if_is_placeholder == 0 && ctext_is_placeholder == 0) {
                    if (condition == "Equal") {
                        // if (if_text == compaire_text) {
                        if (if_text == bodyText.toLowerCase()) {
                            isCondition = "Yes";
                        }
                        else {
                            isCondition = "No";
                        }
                    }
                    else if (condition == "NotEqual") {
                        if (if_text != bodyText.toLowerCase()) {
                            isCondition = "Yes";
                        }
                        else {
                            isCondition = "No";
                        }
                    }
                    else if (condition == "KeywordContains") {
                        if (if_text.includes(bodyText.toLowerCase())) {
                            isCondition = "Yes";
                        }
                        else {
                            isCondition = "No";
                        }
                    }
                    else if (condition == "DoesNotContain") {
                        if (!if_text.includes(bodyText.toLowerCase())) {
                            isCondition = "Yes";
                        }
                        else {
                            isCondition = "No";
                        }
                    }
                    else if (condition == "StartsWith") {
                        if (if_text.startsWith(bodyText.toLowerCase())) {
                            isCondition = "Yes";
                        }
                        else {
                            isCondition = "No";
                        }
                    }
                    else if (condition == "DoesNotStartWith") {
                        if (!if_text.startsWith(bodyText.toLowerCase())) {
                            isCondition = "Yes";
                        }
                        else {
                            isCondition = "No";
                        }
                    }
                    else if (condition == "GreaterThan") {
                        if (parseInt(if_text) > parseInt(bodyText.toLowerCase())) {
                            isCondition = "Yes";
                        }
                        else {
                            isCondition = "No";
                        }
                    }
                    else if (condition == "LessThan") {
                        if (parseInt(if_text) < parseInt(bodyText.toLowerCase())) {
                            isCondition = "Yes";
                        }
                        else {
                            isCondition = "No";
                        }
                    }
                    conditionCallback(null, current_message_id, isCondition);
                }
                else if (if_is_placeholder == 1 && ctext_is_placeholder == 0) {
                    sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text, (err, result) => {
                        //console.log('CheckCondition 1 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                        if (condition == "Equal") {
                            // if (result[0].attrvalue = bodyText) {
                            //     isCondition = "Yes";
                            // }
                            if (result[0].attrvalue == compaire_text) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "NotEqual") {
                            if (result[0].attrvalue != compaire_text) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "KeywordContains") {
                            if (result[0].attrvalue.includes(compaire_text)) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "DoesNotContain") {
                            if (!result[0].attrvalue.includes(compaire_text)) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "StartsWith") {
                            if (result[0].attrvalue.startsWith(compaire_text)) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "DoesNotStartWith") {
                            if (!result[0].attrvalue.startsWith(compaire_text)) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "GreaterThan") {
                            if (parseInt(result[0].attrvalue) > parseInt(compaire_text)) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "LessThan") {
                            if (parseInt(result[0].attrvalue) < parseInt(compaire_text)) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }

                        conditionCallback(null, current_message_id, isCondition);
                    });
                }
                else if (if_is_placeholder == 1 && ctext_is_placeholder == 1) {
                    sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text, (err, result_1) => {
                        sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text, (err, result_2) => {
                            //console.log('CheckCondition 2 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                            if (condition == "Equal") {
                                // if (result[0].attrvalue = bodyText) {
                                //     isCondition = "Yes";
                                // }
                                if (result_1[0].attrvalue == result_2[0].attrvalue) {
                                    isCondition = "Yes";
                                }
                                else {
                                    isCondition = "No";
                                }
                            }
                            else if (condition == "NotEqual") {
                                if (result_1[0].attrvalue != result_2[0].attrvalue) {
                                    isCondition = "Yes";
                                }
                                else {
                                    isCondition = "No";
                                }
                            }
                            else if (condition == "KeywordContains") {
                                if (result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                    isCondition = "Yes";
                                }
                                else {
                                    isCondition = "No";
                                }
                            }
                            else if (condition == "DoesNotContain") {
                                if (!result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                    isCondition = "Yes";
                                }
                                else {
                                    isCondition = "No";
                                }
                            }
                            else if (condition == "StartsWith") {
                                if (result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                    isCondition = "Yes";
                                }
                                else {
                                    isCondition = "No";
                                }
                            }
                            else if (condition == "DoesNotStartWith") {
                                if (!result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                    isCondition = "Yes";
                                }
                                else {
                                    isCondition = "No";
                                }
                            }
                            else if (condition == "GreaterThan") {
                                if (parseInt(result_1[0].attrvalue) > parseInt(result_2[0].attrvalue)) {
                                    isCondition = "Yes";
                                }
                                else {
                                    isCondition = "No";
                                }
                            }
                            else if (condition == "LessThan") {
                                if (parseInt(result_1[0].attrvalue) < parseInt(result_2[0].attrvalue)) {
                                    isCondition = "Yes";
                                }
                                else {
                                    isCondition = "No";
                                }
                            }

                            conditionCallback(null, current_message_id, isCondition);
                        });
                    });
                }
                else if (if_is_placeholder == 0 && ctext_is_placeholder == 1) {
                    sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text, (err, result) => {
                        //console.log('CheckCondition 3 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                        if (condition == "Equal") {
                            // if (result[0].attrvalue = bodyText) {
                            //     isCondition = "Yes";
                            // }
                            if (if_text == result[0].attrvalue) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "NotEqual") {
                            if (if_text != result[0].attrvalue) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "KeywordContains") {
                            if (if_text.includes(result[0].attrvalue)) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "DoesNotContain") {
                            if (!if_text.includes(result[0].attrvalue)) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "StartsWith") {
                            if (if_text.startsWith(result[0].attrvalue)) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "DoesNotStartWith") {
                            if (!if_text.startsWith(result[0].attrvalue)) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "GreaterThan") {
                            if (parseInt(if_text) > parseInt(result[0].attrvalue)) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (condition == "LessThan") {
                            if (parseInt(if_text) < parseInt(result[0].attrvalue)) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }

                        conditionCallback(null, current_message_id, isCondition);
                    });
                }
            }
            else {
                async.waterfall([
                    function (andOrCallback) {
                        let _isAndCondition_1 = null;

                        if (if_is_placeholder == 0 && ctext_is_placeholder == 0) {
                            if (condition == "Equal") {
                                if (if_text == compaire_text) {
                                    _isAndCondition_1 = true;
                                }
                                else {
                                    _isAndCondition_1 = false;
                                }
                            }
                            else if (condition == "NotEqual") {
                                if (if_text != compaire_text) {
                                    _isAndCondition_1 = true;
                                }
                                else {
                                    _isAndCondition_1 = false;
                                }
                            }
                            else if (condition == "KeywordContains") {
                                if (if_text.includes(compaire_text)) {
                                    _isAndCondition_1 = true;
                                }
                                else {
                                    _isAndCondition_1 = false;
                                }
                            }
                            else if (condition == "DoesNotContain") {
                                if (!if_text.includes(compaire_text)) {
                                    _isAndCondition_1 = true;
                                }
                                else {
                                    _isAndCondition_1 = false;
                                }
                            }
                            else if (condition == "StartsWith") {
                                if (if_text.startsWith(compaire_text)) {
                                    _isAndCondition_1 = true;
                                }
                                else {
                                    _isAndCondition_1 = false;
                                }
                            }
                            else if (condition == "DoesNotStartWith") {
                                if (!if_text.startsWith(compaire_text)) {
                                    _isAndCondition_1 = true;
                                }
                                else {
                                    _isAndCondition_1 = false;
                                }
                            }
                            else if (condition == "GreaterThan") {
                                if (parseInt(if_text) > parseInt(compaire_text)) {
                                    _isAndCondition_1 = true;
                                }
                                else {
                                    _isAndCondition_1 = false;
                                }
                            }
                            else if (condition == "LessThan") {
                                if (parseInt(if_text) < parseInt(compaire_text)) {
                                    _isAndCondition_1 = true;
                                }
                                else {
                                    _isAndCondition_1 = false;
                                }
                            }

                            andOrCallback(null, _isAndCondition_1);
                        }
                        else if (if_is_placeholder == 1 && ctext_is_placeholder == 0) {
                            sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text, (err, result) => {
                                //console.log('CheckCondition 4 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                if (condition == "Equal") {
                                    if (result[0].attrvalue == compaire_text) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "NotEqual") {
                                    if (result[0].attrvalue != compaire_text) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "KeywordContains") {
                                    if (result[0].attrvalue.includes(compaire_text)) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "DoesNotContain") {
                                    if (!result[0].attrvalue.includes(compaire_text)) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "StartsWith") {
                                    if (result[0].attrvalue.startsWith(compaire_text)) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "DoesNotStartWith") {
                                    if (!result[0].attrvalue.startsWith(compaire_text)) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "GreaterThan") {
                                    if (parseInt(result[0].attrvalue) > parseInt(compaire_text)) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "LessThan") {
                                    if (parseInt(result[0].attrvalue) < parseInt(compaire_text)) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }

                                andOrCallback(null, _isAndCondition_1);
                            });
                        }
                        else if (if_is_placeholder == 1 && ctext_is_placeholder == 1) {
                            sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text, (err, result_1) => {
                                sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text, (err, result_2) => {
                                    //console.log('CheckCondition 5 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                    if (condition == "Equal") {
                                        if (result_1[0].attrvalue == result_2[0].attrvalue) {
                                            _isAndCondition_1 = true;
                                        }
                                        else {
                                            _isAndCondition_1 = false;
                                        }
                                    }
                                    else if (condition == "NotEqual") {
                                        if (result_1[0].attrvalue != result_2[0].attrvalue) {
                                            _isAndCondition_1 = true;
                                        }
                                        else {
                                            _isAndCondition_1 = false;
                                        }
                                    }
                                    else if (condition == "KeywordContains") {
                                        if (result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                            _isAndCondition_1 = true;
                                        }
                                        else {
                                            _isAndCondition_1 = false;
                                        }
                                    }
                                    else if (condition == "DoesNotContain") {
                                        if (!result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                            _isAndCondition_1 = true;
                                        }
                                        else {
                                            _isAndCondition_1 = false;
                                        }
                                    }
                                    else if (condition == "StartsWith") {
                                        if (result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                            _isAndCondition_1 = true;
                                        }
                                        else {
                                            _isAndCondition_1 = false;
                                        }
                                    }
                                    else if (condition == "DoesNotStartWith") {
                                        if (!result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                            _isAndCondition_1 = true;
                                        }
                                        else {
                                            _isAndCondition_1 = false;
                                        }
                                    }
                                    else if (condition == "GreaterThan") {
                                        if (parseInt(result_1[0].attrvalue) > parseInt(result_2[0].attrvalue)) {
                                            _isAndCondition_1 = true;
                                        }
                                        else {
                                            _isAndCondition_1 = false;
                                        }
                                    }
                                    else if (condition == "LessThan") {
                                        if (parseInt(result_1[0].attrvalue) < parseInt(result_2[0].attrvalue)) {
                                            _isAndCondition_1 = true;
                                        }
                                        else {
                                            _isAndCondition_1 = false;
                                        }
                                    }

                                    andOrCallback(null, _isAndCondition_1);
                                });
                            });
                        }
                        else if (if_is_placeholder == 0 && ctext_is_placeholder == 1) {
                            sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text, (err, result) => {
                                //console.log('CheckCondition 6 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text);
                                if (condition == "Equal") {
                                    if (if_text == result[0].attrvalue) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "NotEqual") {
                                    if (if_text != result[0].attrvalue) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "KeywordContains") {
                                    if (if_text.includes(result[0].attrvalue)) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "DoesNotContain") {
                                    if (!if_text.includes(result[0].attrvalue)) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "StartsWith") {
                                    if (if_text.startsWith(result[0].attrvalue)) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "DoesNotStartWith") {
                                    if (!if_text.startsWith(result[0].attrvalue)) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "GreaterThan") {
                                    if (parseInt(if_text) > parseInt(result[0].attrvalue)) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }
                                else if (condition == "LessThan") {
                                    if (parseInt(if_text) < parseInt(result[0].attrvalue)) {
                                        _isAndCondition_1 = true;
                                    }
                                    else {
                                        _isAndCondition_1 = false;
                                    }
                                }

                                andOrCallback(null, _isAndCondition_1);
                            });
                        }
                    },
                    function (_isAndCondition_1, andOrCallback) {
                        let _isAndCondition_2 = null;

                        if (if1_is_placeholder == 0 && ctext1_is_placeholder == 0) {
                            if (condition1 == "Equal") {
                                if (if_text1 == compaire_text1) {
                                    _isAndCondition_2 = true;
                                }
                                else {
                                    _isAndCondition_2 = false;
                                }
                            }
                            else if (condition1 == "NotEqual") {
                                if (if_text1 != compaire_text1) {
                                    _isAndCondition_2 = true;
                                }
                                else {
                                    _isAndCondition_2 = false;
                                }
                            }
                            else if (condition1 == "KeywordContains") {
                                if (if_text1.includes(compaire_text1)) {
                                    _isAndCondition_2 = true;
                                }
                                else {
                                    _isAndCondition_2 = false;
                                }
                            }
                            else if (condition1 == "DoesNotContain") {
                                if (!if_text1.includes(compaire_text1)) {
                                    _isAndCondition_2 = true;
                                }
                                else {
                                    _isAndCondition_2 = false;
                                }
                            }
                            else if (condition1 == "StartsWith") {
                                if (if_text1.startsWith(compaire_text1)) {
                                    _isAndCondition_2 = true;
                                }
                                else {
                                    _isAndCondition_2 = false;
                                }
                            }
                            else if (condition1 == "DoesNotStartWith") {
                                if (!if_text1.startsWith(compaire_text1)) {
                                    _isAndCondition_2 = true;
                                }
                                else {
                                    _isAndCondition_2 = false;
                                }
                            }
                            else if (condition1 == "GreaterThan") {
                                if (parseInt(if_text1) > parseInt(compaire_text1)) {
                                    _isAndCondition_2 = true;
                                }
                                else {
                                    _isAndCondition_2 = false;
                                }
                            }
                            else if (condition1 == "LessThan") {
                                if (parseInt(if_text1) < parseInt(compaire_text1)) {
                                    _isAndCondition_2 = true;
                                }
                                else {
                                    _isAndCondition_2 = false;
                                }
                            }

                            andOrCallback(null, _isAndCondition_1, _isAndCondition_2);
                        }
                        else if (if1_is_placeholder == 1 && ctext1_is_placeholder == 0) {
                            sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text1, (err, result) => {
                                //console.log('CheckCondition 7 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text1);
                                if (condition1 == "Equal") {
                                    if (result[0].attrvalue == compaire_text1) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "NotEqual") {
                                    if (result[0].attrvalue != compaire_text1) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "KeywordContains") {
                                    if (result[0].attrvalue.includes(compaire_text1)) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "DoesNotContain") {
                                    if (!result[0].attrvalue.includes(compaire_text1)) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "StartsWith") {
                                    if (result[0].attrvalue.startsWith(compaire_text1)) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "DoesNotStartWith") {
                                    if (!result[0].attrvalue.startsWith(compaire_text1)) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "GreaterThan") {
                                    if (parseInt(result[0].attrvalue) > parseInt(compaire_text1)) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "LessThan") {
                                    if (parseInt(result[0].attrvalue) < parseInt(compaire_text1)) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }

                                andOrCallback(null, _isAndCondition_1, _isAndCondition_2);
                            });
                        }
                        else if (if1_is_placeholder == 1 && ctext1_is_placeholder == 1) {
                            sendService.fetchLastTextMessageWithPlaceholder(contactno, if_text1, (err, result_1) => {
                                sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text1, (err, result_2) => {
                                    //console.log('CheckCondition 8 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text1);
                                    if (condition1 == "Equal") {
                                        if (result_1[0].attrvalue == result_2[0].attrvalue) {
                                            _isAndCondition_2 = true;
                                        }
                                        else {
                                            _isAndCondition_2 = false;
                                        }
                                    }
                                    else if (condition1 == "NotEqual") {
                                        if (result_1[0].attrvalue != result_2[0].attrvalue) {
                                            _isAndCondition_2 = true;
                                        }
                                        else {
                                            _isAndCondition_2 = false;
                                        }
                                    }
                                    else if (condition1 == "KeywordContains") {
                                        if (result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                            _isAndCondition_2 = true;
                                        }
                                        else {
                                            _isAndCondition_2 = false;
                                        }
                                    }
                                    else if (condition1 == "DoesNotContain") {
                                        if (!result_1[0].attrvalue.includes(result_2[0].attrvalue)) {
                                            _isAndCondition_2 = true;
                                        }
                                        else {
                                            _isAndCondition_2 = false;
                                        }
                                    }
                                    else if (condition1 == "StartsWith") {
                                        if (result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                            _isAndCondition_2 = true;
                                        }
                                        else {
                                            _isAndCondition_2 = false;
                                        }
                                    }
                                    else if (condition1 == "DoesNotStartWith") {
                                        if (!result_1[0].attrvalue.startsWith(result_2[0].attrvalue)) {
                                            _isAndCondition_2 = true;
                                        }
                                        else {
                                            _isAndCondition_2 = false;
                                        }
                                    }
                                    else if (condition1 == "GreaterThan") {
                                        if (parseInt(result_1[0].attrvalue) > parseInt(result_2[0].attrvalue)) {
                                            _isAndCondition_2 = true;
                                        }
                                        else {
                                            _isAndCondition_2 = false;
                                        }
                                    }
                                    else if (condition1 == "LessThan") {
                                        if (parseInt(result_1[0].attrvalue) < parseInt(result_2[0].attrvalue)) {
                                            _isAndCondition_2 = true;
                                        }
                                        else {
                                            _isAndCondition_2 = false;
                                        }
                                    }

                                    andOrCallback(null, _isAndCondition_1, _isAndCondition_2);
                                });
                            });
                        }
                        else if (if1_is_placeholder == 0 && ctext1_is_placeholder == 1) {
                            sendService.fetchLastTextMessageWithPlaceholder(contactno, compaire_text1, (err, result) => {
                                //console.log('CheckCondition 9 ==================>attrvalue : ' + result[0].attrvalue + ', compare_text : ' + compaire_text1);
                                if (condition1 == "Equal") {
                                    if (if_text1 == result[0].attrvalue) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "NotEqual") {
                                    if (if_text1 != result[0].attrvalue) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "KeywordContains") {
                                    if (if_text1.includes(result[0].attrvalue)) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "DoesNotContain") {
                                    if (!if_text1.includes(result[0].attrvalue)) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "StartsWith") {
                                    if (if_text1.startsWith(result[0].attrvalue)) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "DoesNotStartWith") {
                                    if (!if_text1.startsWith(result[0].attrvalue)) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "GreaterThan") {
                                    if (parseInt(if_text1) > parseInt(result[0].attrvalue)) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }
                                else if (condition1 == "LessThan") {
                                    if (parseInt(if_text1) < parseInt(result[0].attrvalue)) {
                                        _isAndCondition_2 = true;
                                    }
                                    else {
                                        _isAndCondition_2 = false;
                                    }
                                }

                                andOrCallback(null, _isAndCondition_1, _isAndCondition_2);
                            });
                        }
                    },
                    function (_isAndCondition_1, _isAndCondition_2, andOrCallback) {
                        if (_condition == "AND") {
                            if (_isAndCondition_1 && _isAndCondition_2) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        else if (_condition == "OR") {
                            if (_isAndCondition_1 || _isAndCondition_2) {
                                isCondition = "Yes";
                            }
                            else {
                                isCondition = "No";
                            }
                        }
                        andOrCallback(null, isCondition);
                    }
                ], (err, result) => {
                    conditionCallback(null, current_message_id, isCondition);
                });
            }
        },
        (current_message_id, isCondition, conditionCallback) => {
            sendService.checkConditionInNodeOption(current_message_id, isCondition, contactno, (err, _result) => {
                if (_result[0] != undefined) {
                    let conditionFlowTmpPayload = JSON.parse(_result[0].node_body);
                    let conditionFlowType = _result[0].typenode;
                    let tempPayload = null;
                    if (conditionFlowType == "Message") {
                        console.log("type_node: _result[0].typenode==============================>" + _result[0].typenode,)
                        tempPayload = {
                            flow_id: result.flow_id,
                            next_message_id: _result[0].next_message_id,
                            current_message_id: _result[0].id,
                            contactno: contactno,
                            type_node: _result[0].typenode,
                            is_node_option: 0,
                            placeholder: _result[0].placeholder,
                            nextMessageResult: {
                                is_placeholder: _result[0].is_placeholder,
                                is_validator: _result[0].is_validator,
                                validator: _result[0].validator,
                                is_webhook: _result[0].is_webhook,
                                webhook: _result[0].webhook,
                                error_message: _result[0].error_message
                            },
                            is_variant: 0,
                            obj: obj,
                            conditionFlowTmpPayload: conditionFlowTmpPayload
                        }

                        Object.keys(conditionFlowTmpPayload).forEach(function (key) {
                            let value = conditionFlowTmpPayload[key];
                            //console.log('Keys===========================>' + value.type);
                            if (value.type == "message") {
                                tempPayload.conditionFlowTmpPayload = value.message_text;
                                tempPayload.type = 4;
                            }
                            if (value.type == "image") {
                                let imgPayload = {
                                    "link": value.media_url,
                                    "caption": value.message_text != undefined ? value.message_text : ''
                                }
                                tempPayload.conditionFlowTmpPayload = imgPayload;
                                tempPayload.type = 1;
                            }
                            if (value.type == "document") {
                                let docPayload = {
                                    "link": value.media_url,
                                    "filename": value.media_url.toString().split('/').pop()
                                }
                                tempPayload.conditionFlowTmpPayload = docPayload;
                                tempPayload.type = 0;
                            }
                        });

                    } else if (conditionFlowType == "Question") {
                        let isQuestionNodeOption = 0;
                        if (conditionFlowTmpPayload.variants != undefined) {
                            isQuestionNodeOption = 1;
                        }

                        let tempQuestionPayload = null;
                        let tempQuestionType = 0;

                        // //console.log('CONDITION ============================>'+result.flow_id, _result[0].next_message_id, _result[0].id, isQuestionNodeOption, _result[0].typenode, _result[0].placeholder);
                        if (conditionFlowTmpPayload.media_type == "image") {
                            let imgPayload = {
                                "link": conditionFlowTmpPayload.media_url,
                                "caption": conditionFlowTmpPayload.text != undefined ? conditionFlowTmpPayload.text : ''
                            }
                            tempQuestionPayload = imgPayload;
                            tempQuestionType = 1;
                        }
                        else if (conditionFlowTmpPayload.media_type == "video") {
                            let videoPayload = {
                                "link": conditionFlowTmpPayload.media_url,
                                "caption": conditionFlowTmpPayload.text != undefined ? conditionFlowTmpPayload.text : ''
                            }
                            tempQuestionPayload = videoPayload;
                            tempQuestionType = 2;
                        }
                        else {
                            tempQuestionPayload = conditionFlowTmpPayload.text;
                            tempQuestionType = 4;
                        }

                        tempPayload = {
                            flow_id: result.flow_id,
                            next_message_id: _result[0].next_message_id,
                            current_message_id: _result[0].id,
                            payload: tempQuestionPayload,
                            contactno: contactno,
                            type: tempQuestionType,
                            type_node: _result[0].typenode,
                            is_node_option: isQuestionNodeOption,
                            placeholder: _result[0].placeholder,
                            nextMessageResult: {
                                is_placeholder: _result[0].is_placeholder,
                                is_validator: _result[0].is_validator,
                                validator: _result[0].validator,
                                is_webhook: _result[0].is_webhook,
                                webhook: _result[0].webhook,
                                error_message: _result[0].error_message
                            },
                            is_variant: isQuestionNodeOption,
                            obj: obj,
                            conditionFlowTmpPayload: conditionFlowTmpPayload
                        }
                    } else if (conditionFlowType == "Button") {
                        let isButtonNodeOption = 1;
                        //console.log('Button===================>' + JSON.stringify(conditionFlowTmpPayload));

                        let conditionButtonMessagePayload = {
                            "interactive": {}
                        };

                        let _index1 = 1;
                        if (conditionFlowTmpPayload.buttons.length > 0) {
                            // if (conditionFlowTmpPayload.header_text != null) {
                            //     conditionButtonMessagePayload.interactive.header = {
                            //         "type": "text",
                            //         "text": conditionFlowTmpPayload.header_text
                            //     };
                            // }

                            if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'text') {
                                if (conditionFlowTmpPayload.header_text != null && conditionFlowTmpPayload.header_text.length > 0) {
                                    conditionButtonMessagePayload.interactive.header = {
                                        "type": "text",
                                        "text": conditionFlowTmpPayload.header_text
                                    };
                                }
                            }
                            else if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'document') {
                                if (conditionFlowTmpPayload.header_media_url != null) {
                                    conditionButtonMessagePayload.interactive.header = {
                                        "type": "document",
                                        "document": {
                                            "link": conditionFlowTmpPayload.header_media_url,
                                            "provider": {
                                                "name": "",
                                            },
                                            "filename": conditionFlowTmpPayload.header_media_url.substring(conditionFlowTmpPayload.header_media_url.lastIndexOf('/') + 1)
                                        }
                                    };
                                }
                            }
                            else if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'video') {
                                if (conditionFlowTmpPayload.header_media_url != null) {
                                    conditionButtonMessagePayload.interactive.header = {
                                        "type": "video",
                                        "video": {
                                            "link": conditionFlowTmpPayload.header_media_url,
                                            "provider": {
                                                "name": "",
                                            }
                                        }
                                    };
                                }
                            }
                            else if (conditionFlowTmpPayload.header_type != null && conditionFlowTmpPayload.header_type == 'image') {
                                if (conditionFlowTmpPayload.header_media_url != null) {
                                    conditionButtonMessagePayload.interactive.header = {
                                        "type": "image",
                                        "image": {
                                            "link": conditionFlowTmpPayload.header_media_url,
                                            "provider": {
                                                "name": "",
                                            }
                                        }
                                    };
                                }
                            }

                            if (conditionFlowTmpPayload.body_text != null) {
                                conditionButtonMessagePayload.interactive.body = {
                                    "text": conditionFlowTmpPayload.body_text
                                };
                            }
                            if (conditionFlowTmpPayload.footer_text != null) {
                                conditionButtonMessagePayload.interactive.footer = {
                                    "text": conditionFlowTmpPayload.footer_text
                                };
                            }
                            conditionButtonMessagePayload.interactive.type = "button";
                            conditionButtonMessagePayload.interactive.action = {
                                "buttons": []
                            }
                            //console.log('botMessagePayload==========>' + JSON.stringify(conditionButtonMessagePayload));
                            for (let f = 0; f < conditionFlowTmpPayload.buttons.length; f++) {
                                conditionButtonMessagePayload.interactive.action.buttons.push({
                                    "type": "reply",
                                    "reply": {
                                        "id": "id_" + _index1,
                                        "title": conditionFlowTmpPayload.buttons[f]
                                    }
                                });
                                _index1++;
                            }
                        }

                        tempPayload = {
                            flow_id: result.flow_id,
                            next_message_id: _result[0].next_message_id,
                            current_message_id: _result[0].id,
                            payload: conditionButtonMessagePayload.interactive,
                            contactno: contactno,
                            type: 9,
                            type_node: _result[0].typenode,
                            is_node_option: isButtonNodeOption,
                            placeholder: _result[0].placeholder,
                            nextMessageResult: {
                                is_placeholder: _result[0].is_placeholder,
                                is_validator: _result[0].is_validator,
                                validator: _result[0].validator,
                                is_webhook: _result[0].is_webhook,
                                webhook: _result[0].webhook,
                                error_message: _result[0].error_message
                            },
                            is_variant: isButtonNodeOption,
                            obj: obj,
                            conditionFlowTmpPayload: conditionFlowTmpPayload
                        }
                    } else if (conditionFlowType == "List") {
                        let isListNodeOption = 1;
                        let sections = conditionFlowTmpPayload.section_count;
                        let conditionListMessagePayload = {};

                        conditionListMessagePayload.interactive = {
                            "action": {}
                        };

                        if (conditionFlowTmpPayload.header_text != null && conditionFlowTmpPayload.header_text.length > 0) {
                            conditionListMessagePayload.interactive = {
                                "header": {
                                    "type": "text",
                                    "text": conditionFlowTmpPayload.header_text
                                }
                            };
                        }

                        if (conditionFlowTmpPayload.footer_text != null) {
                            conditionListMessagePayload.interactive = {
                                "footer": {
                                    "text": conditionFlowTmpPayload.footer_text
                                }
                            };
                        }

                        if (conditionFlowTmpPayload.button_text != null) {
                            conditionListMessagePayload.interactive.action = {
                                "button": conditionFlowTmpPayload.button_text,
                                "sections": []
                            }
                        }

                        if (parseInt(sections) > 0) {
                            conditionListMessagePayload.interactive.type = "list";
                            for (let u = 0; u < sections; u++) {
                                conditionListMessagePayload.interactive.action.sections.push({
                                    "title": conditionFlowTmpPayload.sections[u + 1].section_text,
                                    "rows": []
                                });

                                let index = 1;
                                Object.keys(conditionFlowTmpPayload.sections[u + 1].rows).forEach(function (key) {
                                    var value = conditionFlowTmpPayload.sections[u + 1].rows[key];
                                    conditionListMessagePayload.interactive.action.sections[u].rows.push({
                                        "id": "id_" + index,
                                        "title": value.row_text,
                                        "description": value.description_text
                                    });
                                    index++;
                                });
                            }
                        }

                        if (conditionFlowTmpPayload.body_text != null) {
                            conditionListMessagePayload.interactive.body = {
                                "text": conditionFlowTmpPayload.body_text
                            }
                        }

                        //console.log('conditionListMessagePayload.interactive=====================>' + JSON.stringify(conditionListMessagePayload.interactive));

                        tempPayload = {
                            flow_id: result.flow_id,
                            next_message_id: _result[0].next_message_id,
                            current_message_id: _result[0].id,
                            payload: conditionListMessagePayload.interactive,
                            contactno: contactno,
                            type: 9,
                            type_node: _result[0].typenode,
                            is_node_option: isListNodeOption,
                            placeholder: _result[0].placeholder,
                            nextMessageResult: {
                                is_placeholder: _result[0].is_placeholder,
                                is_validator: _result[0].is_validator,
                                validator: _result[0].validator,
                                is_webhook: _result[0].is_webhook,
                                webhook: _result[0].webhook,
                                error_message: _result[0].error_message
                            },
                            is_variant: isListNodeOption,
                            obj: obj,
                            conditionFlowTmpPayload: conditionFlowTmpPayload
                        }
                    } if (conditionFlowType == "Condition") {
                        tempPayload = {
                            flow_id: result.flow_id,
                            next_message_id: _result[0].next_message_id,
                            current_message_id: _result[0].id,
                            payload: JSON.parse(_result[0].node_body),
                            contactno: contactno,
                            type: 700,
                            type_node: _result[0].typenode,
                            is_node_option: 0,
                            placeholder: _result[0].placeholder,
                            nextMessageResult: {
                                is_placeholder: _result[0].is_placeholder,
                                is_validator: _result[0].is_validator,
                                validator: _result[0].validator,
                                is_webhook: _result[0].is_webhook,
                                webhook: _result[0].webhook,
                                error_message: _result[0].error_message
                            },
                            is_variant: 0,
                            obj: obj,
                            conditionFlowTmpPayload: conditionFlowTmpPayload
                        }
                    }

                    conditionCallback(err, tempPayload);
                }
            });
        }
        
    ], (err, result) => {
        if (err) {
            next(err);
        } else {
            next(null, result);
        }
    });

}