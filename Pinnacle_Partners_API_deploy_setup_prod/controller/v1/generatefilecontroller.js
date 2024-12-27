let fs = require('fs');


module.exports = (req, res) => {
    console.log(JSON.stringify(req.body));
    let filedata = req.body.data;
    let documentid = req.body.id;
    let mediatype = req.body.mediatype;

    fs.writeFile('/home/Pinnacle_Partners_API/assets/watemplates/' + documentid + '.' + mediatype, filedata, { encoding: 'binary' }, function (err) {
        if (err) {
            console.log(err);
        } else {
            res.send({
                code: 200,
                status: "success",
                type: mediatype,
                url: "https://partners.pinbot.ai/public/watemplates/" + documentid + "." + mediatype
            });
        }
    });
};
