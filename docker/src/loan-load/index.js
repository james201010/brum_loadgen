var eumUtilities = require("eum-utilities");
var beacons = require("./beacons.js");
var lodash = require("lodash");

var loadHostName = process.env.LOADGEN_HOSTNAME;
var loadBaseUrl = process.env.LOADGEN_BASEURL;
var loadPort = process.env.LOADGEN_PORT;


//var appBaseUrl = "http://web-front-end:8080/rest";
var appBaseUrl = "http://" + loadHostName + ":" + loadPort + loadBaseUrl;
var beaconHost = process.env.APPDYNAMICS_EUM_HOST;
var brumKey = process.env.APPDYNAMICS_EUM_KEY;
var disableCloudApp = process.env.DISABLE_CLOUD_APP || "1";

loggerConfig = {
    logLevel : process.env.LOG_LEVEL || "info",
    logConsole : process.env.LOG_CONSOLE || "true",
    logFile :  process.env.LOG_FILE || "false"
}

var users = [];
var indexOfUsers = 0;
var getPagesForSession = function(sessionGuid, isCloud, traffic, speed, loopCount) {

    var pageList = [];
    var pageSuffix = "";
    var deployment = "on-prem";
    
    var dropOnPrem = [6,12,14,19];
    var dropCloud = [5,6,7,7];
    var dropArray = dropOnPrem;
    
    if (isCloud) {
        pageSuffix = "-cloud";
        deployment = "cloud";
        dropArray = dropCloud;
    }


// three pages in a straight line with pageList.push

    pageList.push({ host : appBaseUrl,
                    page : "/loanApplication",
                    traffic: traffic,
                    speed: speed,
                    drop : dropArray[0],
                    beacon : "standardBeacon",
                    method: "post",
                    headers: {"deployment": deployment, "sessionId": sessionGuid}
                });
    
    pageList.push({ host : appBaseUrl,
                    page : "/loanVerifyDocumentation",
                    traffic: "light",
                    speed: "normal",
                    drop : dropArray[1],
                    beacon : "standardBeacon",
                    method: "get",
                    headers: {"deployment": deployment, "sessionId": sessionGuid}
                });

    pageList.push({ host : appBaseUrl,
                    page : "/loanCreditCheck"+pageSuffix,
                    traffic: traffic,
                    speed: speed,
                    drop : dropArray[2],
                    beacon : "standardBeacon",
                    method: "get",
                    headers: {"deployment": deployment, "sessionId": sessionGuid}
                });


// these two branch, one up and one down

//	if (lodash.random(1, 10) % 10 == 0) {
//	    pageList.push({ host : appBaseUrl,
//		        page : "/loanUnderwritingComplete",
//		        traffic: traffic,
//		        speed: speed,
//		        drop : dropArray[2],
//		        beacon : "standardBeacon",
//		        method: "get",
//		        headers: {"deployment": "on-prem", "sessionId": sessionGuid}
//		    });
//	}

//	
//	if (lodash.random(1, 10) % 5 == 0) {
//	    pageList.push({ host : appBaseUrl,
//		        page : "/loanApproved",
//		        traffic: traffic,
//		        speed: speed,
//		        drop : dropArray[2],
//		        beacon : "standardBeacon",
//		        method: "get",
//		        headers: {"deployment": "on-prem", "sessionId": sessionGuid}
//		    });
//	}



// these two continue in the straight path

	for (var i = 1; i <= loopCount; i++) {

        pageList.push({ host : appBaseUrl,
                        page : "/loanUnderwritingComplete"+pageSuffix,
                        traffic: traffic,
                        speed: speed,
                        drop : dropArray[3],
                        beacon : "standardBeacon",
                        method: "get",
                        headers: {"deployment": deployment, "sessionId": sessionGuid, "tradeNumber": i}
                    });

        pageList.push({ host : appBaseUrl,
                        page : "/loanApproved"+pageSuffix,
                        traffic: traffic,
                        speed: speed,
                        drop : dropArray[3],
                        beacon : "standardBeacon",
                        method: "get",
                        headers: {"deployment": deployment, "sessionId": sessionGuid, "tradeNumber": i}
                    });   
    }

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

            var requestStart = Date.now();
            
            eumUtilities.requestPage(nextPage.method, nextPage.host+nextPage.page+"?traffic="+nextPage.traffic+"&speed="+nextPage.speed, null, nextPage.headers, null, 60000).then(function(result) {

                logger.info("Page successfully returned ", {url : nextPage.host + nextPage.page, statusCode : result.statusCode});

                if (appInitialized == false && result.statusCode && result.statusCode < 400) {
                    logger.info("appInitialized = true");
                    appInitialized = true;
                }

                if (appInitialized) {

                    if (nextPage.beacon && brumKey) {

                        var requestEnd = Date.now();
                        var beacon = beacons[nextPage.beacon]();
                        updateStandardBrowserBeacon(beacon, session, nextPage);

                        var correlationInfo = eumUtilities.correlationHeaders(result.headers);

                        eumUtilities.updateCorrelationInBrowserBeacon(beacon, correlationInfo);
                        eumUtilities.updateMetrics(beacon, (requestEnd - requestStart));
                        eumUtilities.browserCapabilities(beacon, session.browser);

                        eumUtilities.sendBrowserBeacon(beacon, session.browser.agent, beaconHost, brumKey).then(function(result) {
                            logger.info("beacon sent for " + nextPage.host + nextPage.page);
                        }).catch(function(reason) {
                            logger.error("beacon error for " + nextPage.host + nextPage.page, reason);
                        });
                    }
                
                    setTimeout(function() {
                        processNextPage(session);
                    }, lodash.random(2000, 8000));
                }

            }).catch(function(reason) {
                logger.error("Error requesting application page : " + nextPage.host + nextPage.page, reason);
            });

        }
    }
}

var updateStandardBrowserBeacon = function(beacon, session, pageData) {

    var ts = Date.now();
    beacon.es[0].ts = ts;
    beacon.es[0].mx.ts = ts;
    beacon.es[0].mc.ts = ts;
    beacon.es[0].rt.t = ts;
    beacon.gs[0] = eumUtilities.createBrowserGUID();
    beacon.ai = session.sessionGuid;
    beacon.ge = session.geo;
    beacon.pl = pageData.page;

    beacon.up[2] = pageData.page;
    return beacon;
}

var listenersInitialized = false;
var appInitialized = false;

var initializeListeners = function() {

    eumUtilities.requestPage("get", "http://post-trade-processing:8080/rest/postTradeProcessing/init", null, null, null, 60000).then(function(result1) {
    
        if (result1.statusCode < 400) {

            eumUtilities.requestPage("get", "http://data-warehouse:8080/rest/dataWarehouse/init", null, null, null, 60000).then(function(result2) {
            
                if (result2.statusCode < 400) {
                    listenersInitialized = true;
                    logger.info("Listeners have been initialized.");
                }
        
            }).catch(function(reason1) {
                logger.error("Error requesting application page : http://data-warehouse:8080/rest/dataWarehouse/init", reason1);
            });
        }
    
    }).catch(function(reason2) {
        logger.error("Error requesting application page : http://post-trade-processing:8080/rest/postTradeProcessing/init", reason2);
    });
}

var generateSessions = function() {

    var minutes = new Date().getMinutes();
    var waitTime = 7500;

    if (minutes >= 58) {
        // do nothing
    }
    else {
        var baseSessionCount = 1;
        var moderateSessionCount = 3;
        var heavy1SessionCount = 4;
        var heavy2SessionCount = 5;
        var heavy3SessionCount = 6;

        var baseLoopCount = 3;
        var moderateLoopCount = 5;
        var heavy1LoopCount = 12;
        var heavy2LoopCount = 15;
        var heavy3LoopCount = 18;

        var timeFrame = 60;
        var minuteMod = minutes % timeFrame;
        var traffic = "light";
        var sessionCount = baseSessionCount;
        var loopCount = baseLoopCount;
        var speed = "normal";
        var random10 = lodash.random(1, 10);

        if (minuteMod < 18 && minuteMod > 9) {

            traffic = "heavy";

            if (minuteMod == 10 || minuteMod == 17) {
                traffic = "moderate";
                sessionCount = moderateSessionCount;
                loopCount = moderateLoopCount;
            }
            else if (minuteMod == 16) {
                sessionCount = heavy1SessionCount;
                loopCount = heavy1LoopCount;
            }
            else if (minuteMod == 15) {
                sessionCount = heavy2SessionCount;
                loopCount = heavy2LoopCount;
            }
            else {
                sessionCount = heavy3SessionCount;
                loopCount = heavy3LoopCount;
            }

            if (random10 % 5 == 0) {
                speed = "slow";
            }
            else if (random10 % 7 == 0) {
                speed = "veryslow";
            }
            else {
                speed = "normal";
            }
        }

        for (var i = 0; i < sessionCount; i++) {

            var session = eumUtilities.getBrowserSessionData();
            session.pageList = getPagesForSession(session.sessionGuid, false, traffic, speed, loopCount);
            processNextPage(session);

            if (isCloudTime()) {
                var cloudSession = eumUtilities.getBrowserSessionData();
                cloudSession.pageList = getPagesForSession(session.sessionGuid, true, traffic, speed, loopCount);
                processNextPage(cloudSession); 
            }
        }

        if (isCloudTime()) {
            waitTime = waitTime * 2;

            // make sure we initialize once per cycle in case they go to sleep
            if (minuteMod == 1 && listenersInitialized == true) {
                listenersInitialized = false;
            }

            if (listenersInitialized == false) {
                initializeListeners();
            }
        }        
    }

    setTimeout(function() {generateSessions();}, waitTime);
}

var isCloudTime = function() {

    if (disableCloudApp == "0") {

        var hours = new Date().getHours();
        
        if (hours % 2 == 1) {
            return true;
        }
        else {
            return false;
        }        
    }
}

exports.main = function() {
    
    if (!disableCloudApp) {
        disableCloudApp = "0";
    }

    generateSessions();
}
