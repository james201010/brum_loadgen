var infoGen = require('./infoGen.js');
var eumUtilities = require("eum-utilities");
var beacons = require("./beacons.js");
var lodash = require("lodash");
var needle = require('needle');

var loadHostName = process.env.LOADGEN_HOSTNAME;
var loadBaseUrl = process.env.LOADGEN_BASEURL;
var loadPort = process.env.LOADGEN_PORT;

var appBaseUrl = "http://" + loadHostName + ":" + loadPort + loadBaseUrl;
var beaconHost = process.env.APPDYNAMICS_EUM_HOST;
var brumKey = process.env.APPDYNAMICS_EUM_KEY;

//var appBaseUrl = "http://web-lb:80/rest/webFrontEnd";
//var beaconHost = process.env.EUM_HOST;
//var brumKey = process.env.EUM_KEY;
var appInitialized = false;

loggerConfig = {
    logLevel : process.env.LOG_LEVEL || "info",
    logConsole : process.env.LOG_CONSOLE || "true",
    logFile :  process.env.LOG_FILE || "false"
}

var getPagesForSession = function(sessionGuid, traffic, speed) {

    var pageList = [];
    var dropArray = [6,20,15,20];

    pageList.push({ host : appBaseUrl,
                    page : "/policyApplication",
                    traffic: traffic,
                    speed: speed,
                    drop : dropArray[0],
                    beacon : "standardBeacon",
                    method: "post",
                    headers: {"sessionId": sessionGuid, "Content-Type": "application/json"}
                });
    
    pageList.push({ host : appBaseUrl,
                    page : "/policyVehicleEntry",
                    traffic: traffic,
                    speed: speed,
                    drop : dropArray[1],
                    beacon : "standardBeacon",
                    method: "post",
                    headers: {"sessionId": sessionGuid, "Content-Type": "application/json"},
                    addFrontEndError: true
                });

    pageList.push({ host : appBaseUrl,
                    page : "/policyDriverEntry",
                    traffic: traffic,
                    speed: speed,
                    drop : dropArray[2],
                    beacon : "standardBeacon",
                    method: "post",
                    headers: {"sessionId": sessionGuid, "Content-Type": "application/json"},
                    addBackEndError: true
                });

    pageList.push({ host : appBaseUrl,
                    page : "/policyFetchDiscounts",
                    traffic: traffic,
                    speed: speed,
                    drop : dropArray[3],
                    beacon : "standardBeacon",
                    method: "post",
                    headers: {"sessionId": sessionGuid, "Content-Type": "application/json"}
                });

    pageList.push({ host : appBaseUrl,
                    page : "/policyGenerateQuote",
                    traffic: traffic,
                    speed: speed,
                    drop : dropArray[4],
                    beacon : "standardBeacon",
                    method: "post",
                    headers: {"sessionId": sessionGuid, "Content-Type": "application/json"}
                });

    return pageList;
}

var logger = eumUtilities.configLogger(loggerConfig, 'startup-');
logger.info("Startup variables", {
    appBaseUrl : appBaseUrl,
    beaconHost :  beaconHost,
    brumKey : brumKey,
    logLevel : loggerConfig.logLevel,
    logConsole : loggerConfig.logConsole,
    logFile : loggerConfig.logFile
});

var processNextPage = function(session) {

    if (session.pageList.length == 0) {
        logger.info("session.pageList.length == 0: " + session.sessionGuid);
    }
    else {
        var nextPage = session.pageList.shift();

        if (nextPage.drop && (lodash.random(1,100) < nextPage.drop)) {

            logger.info("Dropping session at page " + nextPage.page);

        }
        else {

            var addedResponseTime = 0;
            var addFrontEndError = false;
            var addBackEndError = false;

            if (nextPage.addFrontEndError && nextPage.addFrontEndError == true && session.browser.agent.indexOf("Firefox") > 0) {
                addedResponseTime = lodash.random(1000,5000);
                addFrontEndError = true;
                nextPage.speed = "veryslow";
                logger.info("Generating error at page " + nextPage.page);
            }

            if (nextPage.addBackEndError && nextPage.addBackEndError == true && session.policyInfo.customerType == "Platinum" && session.policyInfo.policyType == "Liability") {
                addBackEndError = true;
                session.policyInfo.addError = true;
            }

            var requestStart = Date.now();
            var options = {
                headers: nextPage.headers
            };

            needle.request(nextPage.method, nextPage.host+nextPage.page+"?traffic="+nextPage.traffic+"&speed="+nextPage.speed, session.policyInfo, options, function(err, result) {
            
                if (!err && result.statusCode == 200) {
                    logger.info("Page successfully returned ", {url : nextPage.host + nextPage.page, statusCode : result.statusCode});
                    if (appInitialized == false && result.statusCode && result.statusCode < 400) {
                        logger.info("appInitialized = true");
                        appInitialized = true;
                    }
                }
                else {
                    if (err) {
                        logger.error("Error requesting application page : " + nextPage.host + nextPage.page, err);
                    }
                    else {
                        logger.error("Error requesting application page : " + nextPage.host + nextPage.page, result.statusCode);
                    }
                }

                if (appInitialized) {

                    if (nextPage.beacon && brumKey) {

                        var requestEnd = Date.now();
                        var beacon = beacons[nextPage.beacon]();
                    
                        updateStandardBrowserBeacon(beacon, session, nextPage, false);

                        var correlationInfo = eumUtilities.correlationHeaders(result.headers);

                        eumUtilities.updateCorrelationInBrowserBeacon(beacon, correlationInfo);
                        updateMetrics(beacon, (addedResponseTime + requestEnd - requestStart), addFrontEndError);
                        eumUtilities.browserCapabilities(beacon, session.browser);

                        if (addFrontEndError) {
                            var errorSection = beacons["errorSection"]();
                            errorSection.ts = Date.now();
                            beacon.es.unshift(errorSection);
                        }

                        eumUtilities.sendBrowserBeacon(beacon, session.browser.agent, beaconHost, brumKey).then(function(result) {
                            logger.info("beacon sent for " + nextPage.host + nextPage.page);
                        }).catch(function(reason) {
                            logger.error("beacon error for " + nextPage.host + nextPage.page, reason);
                        });
                    }
                    
                    if (addBackEndError == false) {
                        setTimeout(function() {
                            processNextPage(session);
                        }, lodash.random(2000, 8000));                            
                    }                    
                }
            });
        }
    }
}

/**
 * Update Metrics
 *
 * PLT - Page Load Time | End User Reponse Time
 * FBT - First Byte Time
 * DRT - HTML Download and DOM Building
 * DOM - DOM Ready
 * PRT - Resource Fetch Time
 * FET - Front End Time (only appears in snapshots for browsers that ????)
 *
 * RAT - Response Available Time -> time for request to be sent to server and first byte back from server
 * DDT - HTML Download Time
 * DPT - DOM Building Time
 *
 * @param {object} beacon default beacon
 * @param {integer} HTMLDownloadTime time recorded to download page by script
 */
var updateMetrics = function(beacon, HTMLDownloadTime, addDOMBuildTime) {

    HTMLDownloadTime = (HTMLDownloadTime > 20) ? HTMLDownloadTime : 20;
    beacon.es[0].mc.FBT = HTMLDownloadTime; // First Byte Time
    beacon.es[0].mc.DRT = lodash.random(100, 250); // HTML Download and DOM Building
    beacon.es[0].mc.PRT = lodash.random(5, 500); // Resource Fetch Time

    if (addDOMBuildTime) {
        beacon.es[0].mc.PRT = beacon.es[0].mc.PRT + lodash.random(2000, 5000); // Resource Fetch Time
    }

    beacon.es[0].mc.DOM = beacon.es[0].mc.FBT + beacon.es[0].mc.DRT;
    beacon.es[0].mc.PLT = beacon.es[0].mc.DOM + beacon.es[0].mc.PRT;
    beacon.es[0].mc.FET = beacon.es[0].mc.DRT + beacon.es[0].mc.PRT;

    if (beacon.es[0].mx) {
        beacon.es[0].mx.FBT = HTMLDownloadTime;
        beacon.es[0].mx.DRT = beacon.es[0].mc.DRT;
        beacon.es[0].mx.DDT = lodash.random(2, 30);
        beacon.es[0].mx.PRT = beacon.es[0].mc.PRT

        beacon.es[0].mx.DPT = beacon.es[0].mx.DRT - beacon.es[0].mx.DDT;
        beacon.es[0].mx.RAT = beacon.es[0].mx.FBT - beacon.es[0].mx.SCT;
        beacon.es[0].mx.DOM = beacon.es[0].mx.FBT + beacon.es[0].mx.DRT;
        beacon.es[0].mx.PLT = beacon.es[0].mx.DOM + beacon.es[0].mx.PRT;
        beacon.es[0].mx.FET = beacon.es[0].mx.DRT + beacon.es[0].mx.PRT;
    }

    if (beacon.es[0].rt) {
        beacon.es[0].rt.r.forEach(function(resource, i) {
            if (i === 0) {
                resource.m[10] = beacon.es[0].mx.FBT + beacon.es[0].mx.DDT;
                resource.m[9] = resource.m[10] - 2;
            } else {
                resource.o += HTMLDownloadTime;
            }
        });
    }

}

var updateStandardBrowserBeacon = function(beacon, session, pageData, hasError) {

    var ts = Date.now();
    beacon.es[0].ts = ts;
    beacon.es[0].mx.ts = ts;
    beacon.es[0].mc.ts = ts;
    beacon.es[0].rt.t = ts;
    beacon.gs[0] = eumUtilities.createBrowserGUID();
    beacon.ai = session.sessionGuid;
    beacon.ge = session.geo;
    beacon.es[0].pl = pageData.page;

    beacon.up[2] = pageData.page;
    beacon.es[0].ud = session.policyInfo;

    if (hasError) {
        beacon.es[0].mc.EPM = 1;
        beacon.es[0].mx.EPM = 1;
    }

    return beacon;
}

var generateSessions = function() {

    var waitTime = 7500;
    var sessionCount = 2;
    var traffic = "light";
    var speed = "normal";
    
    for (var i = 0; i < sessionCount; i++) {
        var session = eumUtilities.getBrowserSessionData();
        session.pageList = getPagesForSession(session.sessionGuid, traffic, speed);
        session.policyInfo = infoGen.getPolicyInfo();
        processNextPage(session);
    }

    setTimeout(function() {generateSessions();}, waitTime);
}

exports.main = function() {
    generateSessions();
}
