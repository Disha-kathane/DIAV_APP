const crypto = require('crypto');

module.exports = (req, res) => {
    let phrase = JSON.stringify(req.body);
    // console.log("data:===============", data);
    // let ENC_KEY = crypto.randomBytes(16).toString('hex');
    const algorithm = 'aes-256-cbc';
    // const iv = crypto.randomBytes(8).toString('hex')


    const ENC_KEY = "d1e0v1e4l2o0p2m2e1n0t1a4p2i0o2f1"; // set random encryption key
    // const IV = "i1d0f1c4b2a0n2k2"; // set random initialisation vector
    const encrypter = crypto.createCipher("aes-256-cbc", ENC_KEY);
    let encryptedMsg = encrypter.update(phrase, "utf8", "hex");
    encryptedMsg += encrypter.final("hex");
    return encryptedMsg;
    // console.log(encryptedMsg)


}