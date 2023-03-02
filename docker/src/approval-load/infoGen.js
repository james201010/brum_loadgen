var lodash = require('lodash');
var uuidV4 = require('uuid/v4');

var numbers = ['1','2','3','4','5','6','7','8','9','0'];

var firstNames = ['Rob','Eric','Gabriella','Jeff','Alex','Tom','Lori','Michelle','James','Steve','Matt','Jill','Ron','Andy','Michelle','Leslie','Anne','Tom'];
var lastNames = ['Bolton','Querales','Johanson','Morgan','Rabaut','Fedotyev','Swanson','Dwyer','Knope','Haverford','Perkins'];
var emailProviders = ['aol','hotmail','yahoo','gmail','icloud'];
var loanTypes = [{'name':'Conventional','type':1,'id':1},{'name':'FHA','type':1,'id':2},{'name':'ARM','type':1,'id':3},{'name':'Home-Equity','type':2,'id':4},{'name':'Auto','type':2,'id':5},{'name':'Small Business','type':3,'id':6}];
var locationCities = ['New York, NY','Chicago, IL','Philadelphia, PA','Columbus, OH','Atlanta, GA','Washington, DC','Boston, MA','Memphis, TN','Louisville, KY','Baltimore, MD'];
var creditCheckProvider = ["CC-World", "YourCredit", "Uni-Credit", "CreditExperts"];

exports.getLoanInfo = function() {

	var firstName = lodash.sample(firstNames);
	var lastName = lodash.sample(lastNames);
	var email = (firstName + '.' + lastName + '@' + lodash.sample(emailProviders) + '.com').toLowerCase();
	var accountId = 'ACC-'+lodash.sample(numbers) + lodash.sample(numbers) + lodash.sample(numbers) + lodash.sample(numbers) + lodash.sample(numbers) + lodash.sample(numbers) + lodash.sample(numbers) + lodash.sample(numbers);
	var loanType = lodash.sample(loanTypes);
	var loanAmount = 0;
	var locationCity = lodash.sample(locationCities);

	// Delays are in seconds
	var step2Delay = lodash.random(60, 120);
	var step3Delay = lodash.random(20, 30);
	var step4Delay = lodash.random(120, 180);
	var step5Delay = lodash.random(30, 60);
	var creditCheckPass = true;

	// Introduce failures
	// We will set a step delay as -1 if we want this record to fail at a given step

	if (lodash.random(0, 100) < 4) {
		step2Delay = -1;
	}

	if (lodash.random(0, 100) < 25) {
		// step3Delay = -1;
		creditCheckPass = false;
	}

	if (lodash.random(0, 100) < 4) {
		step4Delay = -1;
	}

	if (lodash.random(0, 100) < 4) {
		step5Delay = -1;
	}

	if (loanType.id == 1) {
		loanAmount = lodash.random(300, 1200)*1000;
	}
	else if (loanType.type == 1) {
		loanAmount = lodash.random(100, 800)*1000;
	}
	else if (loanType.type == 2) {
		loanAmount = lodash.random(10, 100)*1000;
	}

	if (loanType.id == 6) { // SB
		loanAmount = lodash.random(1, 60)*50000;
		step4Delay = lodash.random(300, 990);
	}

	if (locationCity == 'Chicago, IL') {
		step3Delay = lodash.random(300, 600);
	}

	return {
		loanId: uuidV4(),
		firstName: firstName,
		lastName: lastName,
		loanAmount: loanAmount,
		accountId: accountId,
		email: email,
		loanType: loanType.name,
		loanTypeId: loanType.id,
		step2Delay: step2Delay,
		step3Delay: step3Delay,
		step4Delay: step4Delay,
		step5Delay: step5Delay,
		originatingBank: 'Bank-'+lodash.random(1, 9),
		locationCity: locationCity,
		creditCheckPass: creditCheckPass,
		creditCheckProvider: lodash.sample(creditCheckProvider)
  	}
}




