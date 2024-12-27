module.exports = (req, res) => {
    let pincode = req.params.pincode;
    console.log('pincode==========================>' + pincode);
    let response = null;
    if (pincode != undefined && pincode.length > 0 && pincode.length == 6) {
        response = {
            code: 200,
            status: "success",
            type: "text",
            // type: "image",
            // url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
            // type: "document",
            // url: "https://www.clickdimensions.com/links/TestPDFfile.pdf",
            // type:"video",
            // url:"https://ucarecdn.com/044cf854-7f94-4b6b-b203-22901bca920e/ptspl.mp4",
            // data: { "1": { "type": "message", "message_text": "Your pincode is " + pincode + ". Thank you for providing the information. " } }
            data: "Your pincode is " + pincode + ". Thank you for providing the information. "
        };
    }
    else if (pincode.length == 0 || pincode.length < 6 || pincode.length > 6) {
        response = {
            code: 100,
            status: "failed",
            type:  "text",
            data: "Pincode is invalid. Please enter correct pincode."
            // data: { "1": { "type": "message", "message_text": "Pincode is invalid. Please enter correct pincode." } }
        };
    }
    else {
        response = {
            code: 100,
            status: "failed",
            type: "text",
            data: "Sorry, No Record Found"
            // data: { "1": { "type": "message", "message_text": "Sorry, No Record Found" } }
        };
    }
    res.send(response);
}