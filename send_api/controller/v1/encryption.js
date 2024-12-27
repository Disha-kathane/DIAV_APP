const crypto = require('crypto');

module.exports = (req, res) => {
    let phrase = JSON.stringify(req.body);
    const ENC_KEY = "d1e0v1e4l2o0p2m2e1n0t1a4p2i0o2f2"; // set random encryption key
    const encrypter = crypto.createCipher("aes-256-cbc", ENC_KEY);
    let encryptedMsg = encrypter.update(phrase, "utf8", "hex");
    encryptedMsg += encrypter.final("hex");
    // console.log(encryptedMsg)
    res.send(encryptedMsg)
}