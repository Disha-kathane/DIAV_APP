module.exports = (code, message) => {
    let codestatus;
    let Message;
    let result;


    if (code != 200 && message == null) {
        let errArray =
            [
                { "WA001": "User is inactive" },
                { "WA002": "Authentication failed" },
                { "WA003": "Mobile number(from or to) is required" },
                { "WA004": "Valid mobile number (from or to) is required with country code" },
                { "WA005": "Message type is required" },
                { "WA006": "Message is required" },
                { "WA007": "Media URL is required" },
                { "WA008": "Media URL is invalid" },
                { "WA009": "Media ID is invalid" },
                { "WA011": "Invalid image url" },
                { "WA012": "Invalid video url" },
                { "WA013": "Invalid audio url" },
                { "WA014": "Media ID is invalid" },
                { "WA015": "Text is required" },
                { "WA016": "Text cannot exceed 4096 characters" },
                { "WA017": "Latitude is required" },
                { "WA018": "Longitude is required" },
                { "WA019": "Address is required" },
                { "WA020": "Name is required" },
                { "WA021": "Latitude / Longitude is invalid" },
                { "WA022": "Contacts body is required" },
                { "WA023": "Name body is required" },
                { "WA024": "First Name is required" },
                { "WA025": "Last Name is required" },
                { "WA026": "Sticker URL is required" },
                { "WA027": "Template ID is required" },
                { "WA028": "Template ID is invalid" },
                { "WA029": "Mobile number is required" },
                { "WA030": "Phone is required" },
                { "WA031": "Placeholder count mismatch" },
                { "WA033": "Interactive body is required" },
                { "WA034": "Header is missing" },
                { "WA035": "Dynamic URL placeholder is missing" },
                { "WA036": "Insufficient balance" },
                { "WA037": "Quick reply count mismatch" },
                { "WA038": "Invalid image size" },
                { "WA039": "Invalid document size" },
                { "WA040": "Invalid message type" },
                { "WA041": "Invalid sticker url" },
                { "WA042": "Invalid video size" },
                { "WA043": "Invalid audio size" },
                { "WA044": "Invalid sticker size" },
                { "WA045": "Invalid CatlogId" },
                { "WA046": "Wabanumber does not belong to requested user" },
                { "WA101": "Invalid payload" },
                { "WA047": "Invalid Retailer_id's found in payload" },
                { "WA048": "status Should be pending,processing,partially_shipped,shipped,completed,canceled" },
                { "WA049": "Status Should be pending" },
                { "WA050": "Location Paramter not allowed" },
                { "WA051": "Buttons are not allowed inside this template" },
                { "WA052": "Location parameters are required" }
            ];

        errArray.forEach(function (item) {
            Object.keys(item).forEach(function (key) {
                if (key == code) {
                    codestatus = key;
                    Message = item[key];
                }
            });
        });
        result = {
            code: codestatus,
            status: "FAILED",
            message: Message,
            data: {}
        };

    } else {
        result = {
            code: code,
            status: "FAILED",
            message: message,
            data: {}
        };
    }

    return result;
};