var lodash = require('lodash');
var uuidV4 = require('uuid/v4');

var maleFirstNames = ['Rob','Eric','Jeff','Alex','Tom','James','Steve','Matt','Ron','Andy','Tom'];
var femaleFirstNames = ['Gabriella','Lori','Michelle','Jill','Michelle','Leslie','Anne'];
var lastNames = ['Bolton','Querales','Johanson','Morgan','Rabaut','Fedotyev','Swanson','Dwyer','Knope','Haverford','Perkins'];
var customerTypes = [{"name": "Platinum", "discountRange": [20, 30]}, 
					 {"name": "Gold", "discountRange": [10, 20]},
					 {"name": "Silver", "discountRange": [5, 10]}];
var policyTypes = ["Liability", "Collision", "Comprehensive", "Personal Injury Protection"];
var locationCities = ['New York, NY','Chicago, IL','Philadelphia, PA','Columbus, OH','Atlanta, GA','Washington, DC','Boston, MA','Memphis, TN','Louisville, KY','Baltimore, MD'];
var vehicleTypes = ["Car","Car","Car","Car","Truck","Truck","Motorcycle"];
var ageRanges = ["16-24","25-34","25-34","25-34","35-54","35-54","35-54","35-54","55-64","55-64","55-64","65-79","65-79","80+"];

var driverGenders = ["M", "F"];

var carList = [
	{"make": "BMW", "model": "3 Series"}, {"make": "BMW", "model": "X5"}, {"make": "BMW", "model": ""},
	{"make": "Buick", "model": "Enclave"}, {"make": "Buick", "model": "Encore"}, {"make": "Buick", "model": "LaCrosse"},
	{"make": "Chevrolet", "model": "Camaro"}, {"make": "Chevrolet", "model": "Equinox"}, {"make": "Chevrolet", "model": "Traverse"},
	{"make": "Dodge", "model": "Grand Caravan"}, {"make": "Dodge", "model": "Charger"},
	{"make": "Ford", "model": "Focus"}, {"make": "Ford", "model": "Fusion"}, {"make": "Ford", "model": "Escape"},
	{"make": "Honda", "model": "Accord"}, {"make": "Honda", "model": "Civic"}, {"make": "Honda", "model": "Odessey"},
	{"make": "Hyundai", "model": "Accent"}, {"make": "Hyundai", "model": "Elantra"}, {"make": "Hyundai", "model": "Sonata"},
	{"make": "Kia", "model": "Optima"}, {"make": "Kia", "model": "Cadenza"}, {"make": "Kia", "model": "Sedona"},
	{"make": "Lexus", "model": "NS"}, {"make": "Lexus", "model": "ES"}, {"make": "Lexus", "model": "RX"},
	{"make": "Nissan", "model": "Maxima"}, {"make": "Nissan", "model": "Altima"}, {"make": "Nissan", "model": "Versa"},
	{"make": "Toyota", "model": "Camry"}, {"make": "Toyota", "model": "Corolla"}, {"make": "Toyota", "model": "RAV4"},
	{"make": "Volkswagen", "model": "Jetta"}, {"make": "Volkswagen", "model": "Passat"}, {"make": "Volkswagen", "model": "Golf"}
];

var motorcycleList = [
	{"make": "Toyota", "model": "Tundra"}, {"make": "Toyota", "model": "Tacoma"},
	{"make": "Ford", "model": "F-150"}, {"make": "Ford", "model": "F-250"},
	{"make": "Dodge", "model": "Ram"},
	{"make": "GMC", "model": "Sierra"},
	{"make": "Chevrolet", "model": "Silverado"},	
	{"make": "Nissan", "model": "Frontier"}	
];

var truckList = [
	{"make": "Yamaha", "model": "MT-10"},
	{"make": "Harley Davidson", "model": "Street 750"},
	{"make": "Kawasaki", "model": "Z125"},
	{"make": "Honda", "model": "CBR500R"},
	{"make": "BMW", "model": "S1000XR"},
	{"make": "Suzuki", "model": "GSX-R1000"},
	{"make": "Ducati", "model": "SuperSport"}
];


exports.getPolicyInfo = function() {

	var gender = lodash.sample(driverGenders);
	var firstName;

	if (gender == "M") {
		firstName = lodash.sample(maleFirstNames);
	}
	else {
		firstName = lodash.sample(femaleFirstNames);
	}

	var lastName = lodash.sample(lastNames);
	var locationCity = lodash.sample(locationCities);

	var customerType = lodash.sample(customerTypes);
	var discountAmount = lodash.random(customerType.discountRange[0], customerType.discountRange[1]);

	var vehicleType = lodash.sample(vehicleTypes);
	var vehicle;
	var policyAmount;
	var policyType = lodash.sample(policyTypes);

	if (vehicleType == "Car") {
		vehicle = lodash.sample(carList);
		policyAmount = lodash.random(5,80)*1000;
	}
	else if (vehicleType == "Truck") {
		vehicle = lodash.sample(truckList);
		policyAmount = lodash.random(5,60)*1000;
	}
	else {
		vehicle = lodash.sample(motorcycleList);
		policyAmount = lodash.random(5,30)*1000;
	}

	return {
		sessionId: uuidV4(),
		policyId: uuidV4(),
		driverFirstName: firstName,
		driverLastName: lastName,
		driverGender: gender,
		driverLocationCity: locationCity,
		driverAge: lodash.sample(ageRanges),
		customerType: customerType.name,
		vehicleType: vehicleType,
		vehicleMake: vehicle.make,
		vehicleModel: vehicle.model,
		vehicleYear: lodash.random(2010,2018)+"",
		policyType: policyType,
		policyAmount: policyAmount,
		policyDiscountAmount: discountAmount
  	}

	// Introduce failures
	// We will set a step delay as -1 if we want this record to fail at a given step

	// if (lodash.random(0, 100) < 4) {
	// 	step2Delay = -1;
	// }

	// if (lodash.random(0, 100) < 25) {
	// 	// step3Delay = -1;
	// 	creditCheckPass = false;
	// }

	// if (lodash.random(0, 100) < 4) {
	// 	step4Delay = -1;
	// }

	// if (lodash.random(0, 100) < 4) {
	// 	step5Delay = -1;
	// }

	// if (loanType.id == 1) {
	// 	loanAmount = lodash.random(300, 1200)*1000;
	// }
	// else if (loanType.type == 1) {
	// 	loanAmount = lodash.random(100, 800)*1000;
	// }
	// else if (loanType.type == 2) {
	// 	loanAmount = lodash.random(10, 100)*1000;
	// }

	// if (loanType.id == 6) { // SB
	// 	loanAmount = lodash.random(1, 60)*50000;
	// 	step4Delay = lodash.random(300, 990);
	// }

	// if (locationCity == 'Chicago, IL') {
	// 	step3Delay = lodash.random(300, 600);
	// }
}




