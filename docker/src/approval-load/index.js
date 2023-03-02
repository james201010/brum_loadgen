var http = require('http');
var infoGen = require('./infoGen.js');

var loadHostName = process.env.LOADGEN_HOSTNAME;
var loadBaseUrl = process.env.LOADGEN_BASEURL;
var loadPort = process.env.LOADGEN_PORT;

callback = function(response) {
    var str = ''
    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function () {
        console.log(str);
    });

    response.on('error', function (err) {
        console.log("callback error");
        console.log(err);
    });  
}

var initalWaitMS = 60000;
var waitMS = 6000;
var mode;
var mode1 = "on-prem";
var mode2 = "cloud";

var counter = 0;
var loopCount = 10;

var loanApplication = function() {

    if (counter++ >= loopCount) {

        if (mode == mode1) {
            mode = mode2;
        }
        else {
            mode = mode1;
        }
        counter = 0;
    }

    console.log("Starting loanApplication");
    var loanInfo = infoGen.getLoanInfo();

    var options = {host: loadHostName, path: loadBaseUrl + '/loanApplication', port: loadPort, method: 'POST', headers: {'deployment': mode, 'Content-Type': 'application/json','Content-Length': Buffer.byteLength(JSON.stringify(loanInfo))}};
    var newReq = http.request(options, function(res) {
        console.log("statusCode: ", res.statusCode);
        res.on('data', function(d) {
            // console.log(d);
        });
    });

    newReq.write(JSON.stringify(loanInfo));
    newReq.end();

    console.log("loanApplication complete");

    setTimeout(function () {
        loanApplication();
    }, waitMS);    
} 

var loanVerifyDocumentation = function() {

    console.log("Starting loanVerifyDocumentation");

    var options = {host: loadHostName, path: loadBaseUrl + '/loanVerifyDocumentation', headers: {'deployment': mode}, port: loadPort};
    var newReq1 = http.request(options, callback);
    newReq1.end();

    console.log("loanVerifyDocumentation complete");

    setTimeout(function () {
        loanVerifyDocumentation();
    }, waitMS);
} 

var loanCreditCheck = function() {

    console.log("Starting loanCreditCheck");

    var options = {host: loadHostName, path: loadBaseUrl + '/loanCreditCheck', headers: {'deployment': mode}, port: loadPort};
    var newReq1 = http.request(options, callback);
    newReq1.end();

    console.log("loanCreditCheck complete");

    setTimeout(function () {
        loanCreditCheck();
    }, waitMS);
} 

var loanUnderwritingComplete = function() {

    console.log("Starting loanUnderwritingComplete");

    var options = {host: loadHostName, path: loadBaseUrl + '/loanUnderwritingComplete', headers: {'deployment': mode}, port: loadPort};
    var newReq1 = http.request(options, callback);
    newReq1.end();

    console.log("loanUnderwritingComplete complete");

    setTimeout(function () {
        loanUnderwritingComplete();
    }, waitMS);
} 

var loanApproved = function() {

    console.log("Starting loanApproved");

    var options = {host: loadHostName, path: loadBaseUrl + '/loanApproved', headers: {'deployment': mode}, port: loadPort};
    var newReq1 = http.request(options, callback);
    newReq1.end();

    console.log("loanApproved complete");

    setTimeout(function () {
        loanApproved();
    }, waitMS);
} 

exports.main = function() {

    mode = mode1;

    setTimeout(function () {
        loanApplication();
    }, waitMS+initalWaitMS);

    setTimeout(function () {
        loanVerifyDocumentation();
    }, waitMS+initalWaitMS);

    setTimeout(function () {
        loanCreditCheck();
    }, waitMS+initalWaitMS);

    setTimeout(function () {
        loanUnderwritingComplete();
    }, waitMS+initalWaitMS);

    setTimeout(function () {
        loanApproved();
    }, waitMS+initalWaitMS);
}
