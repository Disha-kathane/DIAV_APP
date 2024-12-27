module.exports = (req, res) => {
    res.status(200).send({
        code: 200,
        status: "success",
        type: "text",
        data: "Cloud Callback is running"
    });
}