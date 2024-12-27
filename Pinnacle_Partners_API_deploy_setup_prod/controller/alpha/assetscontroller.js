const { log } = require('console');
let fs = require('fs');


module.exports = (req, res) => {
    log('ASSETSCONTROLLER : ' + JSON.stringify(req.body));
    let filedata = req.body.data;
    let documentid = req.body.id;

    fs.writeFile('./assets/watemplates/' + documentid + '.pdf', filedata, { encoding: 'base64' }, function (err) {
        res.send({
            code: 200,
            status: "success",
            type: "document",
            url: "https://partners.pinbot.ai/public/watemplates/" + documentid + ".pdf"
        });
    });
};
