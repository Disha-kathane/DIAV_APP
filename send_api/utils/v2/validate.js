const ufs = require("url-file-size");

fileSize = async (mediaUrl) => {

    try {
        let urlFileSize = await ufs(mediaUrl);
        console.log({ urlFileSize });   //in bytes

        let urlFileSizeinKB = await Number(urlFileSize / 1024).toFixed(2);
        console.log('FileSize in KB: ' + urlFileSizeinKB + ' KB');
        let urlFileSizeinMB = await Number(urlFileSizeinKB / 1024).toFixed(2);
        console.log('FileSize in MB: ' + urlFileSizeinMB + ' MB');

        return {
            urlFileSizeinKB,
            urlFileSizeinMB
        };

    } catch (err) {
        return err;
    }

};
module.exports = {
    fileSize
}


