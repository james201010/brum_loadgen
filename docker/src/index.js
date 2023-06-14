var browserLoad = require("./browser-load/index.js");
var approvalLoad = require("./approval-load/index.js");
var loanLoad = require("./loan-load/index.js");
var supercarLoad = require("./supercar-load/index.js");
var teastoreload = require("./teastore-load/index.js");
//var policyLoad = require("./policy-load/index.js");


var enableBrowserLoad = process.env.ENABLE_BROWSER_LOAD || "0";
var enableApprovalLoad = process.env.ENABLE_APPROVAL_LOAD || "0";
var enableLoanLoad = process.env.ENABLE_LOAN_LOAD || "0";
var enableSupercarLoad = process.env.ENABLE_SUPERCAR_LOAD || "0";
var enableTeastoreLoad = process.env.ENABLE_TEASTORE_LOAD || "0";
//var enablePolicyLoad = process.env.ENABLE_POLICY_LOAD || "0";


var main = function() {
    
    if (enableBrowserLoad == "1") {
        browserLoad.main()
    }
    else if (enableApprovalLoad == "1") {
        approvalLoad.main()
    }
    else if (enableLoanLoad == "1") {
        loanLoad.main()
    }
    else if (enableSupercarLoad == "1") {
        supercarLoad.main()
    }
    else if (enableTeastoreLoad == "1") {
        teastoreload.main()
    }


//    else if (enablePolicyLoad == "1") {
//        policyLoad.main()
//    }

}

main();
