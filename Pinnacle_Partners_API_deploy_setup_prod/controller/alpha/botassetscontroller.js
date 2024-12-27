let fs = require('fs');


module.exports = (req, res) => {

    let filedata = req.body.data;
    let documentid = req.body.id;
    let mediatype = req.body.mediatype;

    fs.writeFile('./assets/watemplates/'+documentid+'.'+mediatype, filedata, { encoding: 'base64' }, function (err) {
        res.send({
            code: 200,
            status: "success",
            type: mediatype,
            url: "https://partners.pinbot.ai/public/watemplates/"+documentid+"."+mediatype
        });
    });
}
