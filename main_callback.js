let http = require('http');
let httpProxy = require('http-proxy');

let targets = [
    'http://127.0.0.1:5967',
    'http://127.0.0.1:5968',
    'http://127.0.0.1:5969'
]

// Create a proxy server with custom application logic
//
let proxy = httpProxy.createProxyServer({});

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
let server = http.createServer(function (req, res) {
    // You can define here your custom logic to handle the request
    // and then proxy the request.
    if (req.url === '/') {
        res.write('Cloud callback is running'); //write a response
        res.end(); //end the response
    }
    else {
        proxy.web(req, res, { target: targets[(Math.floor(Math.random() * 3))] });
    }
});

console.log("listening on port 80");
server.listen(80);

// process.on('uncaughtException', function (err) {
//     console.log(err);
// }); 