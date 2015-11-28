var express = require('express');
var cfenv = require('cfenv');
var log4js = require('log4js');
var jsonParser = require('body-parser').json();

// Using hardcoded user repository
var userRepository = {
	"john.lennon":      { password: "12345" , displayName:"John Lennon"      , dob:"October 9, 1940"},
	"paul.mccartney":   { password: "67890" , displayName:"Paul McCartney"   , dob:"June 18, 1942"},
	"ringo.starr":      { password: "abcde" , displayName:"Ringo Starr"      , dob: "July 7, 1940"},
	"george.harrison":  { password: "fghij" , displayName: "George Harrison" , dob:"Feburary 25, 1943"}
}

var app = express();
var logger = log4js.getLogger("CustomIdentityProviderApp");
logger.info("Starting up");


app.post('/apps/:tenantId/:realmName/startAuthorization', jsonParser, function(req, res){
	var tenantId = req.params.tenantId;
	var realmName = req.params.realmName;
	var headers = req.body.headers;

	logger.debug("startAuthorization", tenantId, realmName, headers);

	var responseJson = {
		status: "challenge",
		challenge: {
			text: "Enter username and password"
		}
	};

	res.status(200).json(responseJson);
});

app.post('/apps/:tenantId/:realmName/handleChallengeAnswer', jsonParser, function(req, res){
	var tenantId = req.params.tenantId;
	var realmName = req.params.realmName;
	var challengeAnswer = req.body.challengeAnswer;


	logger.debug("handleChallengeAnswer", tenantId, realmName, challengeAnswer);

	var username = req.body.challengeAnswer["username"];
	var password = req.body.challengeAnswer["password"];

	var responseJson = { status: "failure" };

	var userObject = userRepository[username];
	if (userObject && userObject.password == password ){
		logger.debug("Login success for userId ::", username);
		responseJson.status = "success";
		responseJson.userIdentity = {
			userName: username,
			displayName: userObject.displayName,
			attributes: {
				dob: userObject.dob
			}
		}
	} else {
		logger.debug("Login failure for userId ::", username);
	}

	res.status(200).json(responseJson);
});

app.use(function(req, res, next){
	res.status(404).send("This is not the URL you're looking for");
});

var server = app.listen(cfenv.getAppEnv().port, function () {
	var host = server.address().address;
	var port = server.address().port;
	logger.info('Server listening at %s:%s', host, port);
});