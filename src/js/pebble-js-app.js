// Called as soon as application is ready. It initializes data.
Pebble.addEventListener("ready", function(e) {
    console.log("Initializing thermostat data ...");
    initializeThermostatData();
});

// Receives a message from the watch with data to change temperature
Pebble.addEventListener("appmessage", function(e) {
    var temperatureChange = parseInt(e.payload.temperatureChange),
        thermostatIndex = parseInt(e.payload.thermostatIndex),
        thermostatId = e.payload.thermostatId;

    changeTemperature(thermostatId, temperatureChange, thermostatIndex);
});

// Changes the temperature of a thermostat adding temperatureChange to
// its current temperature. Returns error in case of failure.
function changeTemperature(thermostatId, temperatureChange, thermostatIndex){
    console.log("Requesting temperature change: " + temperatureChange
        + ", for thermostat: " + thermostatId);

    login(function(){
        getTemperature(thermostatId, function(currentTemperature, success){
            var thermostatData = {"thermostatIndex": thermostatIndex},
                newTemperature;

            if (!success){
                thermostatData.thermostatName = "Error";
                Pebble.sendAppMessage(thermostatData);
                return;
            }

            newTemperature = currentTemperature + temperatureChange;

            setTemperature(thermostatId, newTemperature, function(success){
                if (success){
                    thermostatData.thermostatTemperature =
                            encodeTemperature(newTemperature);
                }
                else {
                    thermostatData.thermostatName = "Error";
                }

                Pebble.sendAppMessage(thermostatData);
            });
        })
    });
}

// Gets the temperature of a thermostat
function getTemperature(thermostatId, callbackFn){
    ajaxCall({
        url: 'https://rs.alarmnet.com/TotalConnectComfort/Device/CheckDataSession/'
            + thermostatId,
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        callback: function(){
            var success = true,
                temperature = 0,
                response = this.responseText;

            try {
                temperature = JSON.parse(response).latestData.uiData.CoolSetpoint;
                console.log("Thermostat " + thermostatId
                    + " current temperature: " + temperature);
            }
            catch (e){
                console.error('Unable to get current temperature for thermostat '
                    + thermostatId + ". Error: " + e);
                console.log("Response text: " + response);
                success = false;
            }

            callbackFn(temperature, success);
        }
    });
}

// Sets the temperature of a thermostat
function setTemperature(thermostatId, temperature, callbackFn){
    ajaxCall({
        url: 'https://rs.alarmnet.com/TotalConnectComfort/Device/SubmitControlScreenChanges',
        params: JSON.stringify({
            DeviceID: parseInt(thermostatId),
            CoolSetPoint: temperature
        }),
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json; charset=UTF-8'
        },
        callback: function(){
            var response = this.responseText,
                success;

            try {
                success = response && JSON.parse(response).success;
                if (!success) {
                    throw response;
                }
                console.log("Temperature updated!");
            }
            catch (e){
                console.error('Unable to set temperature for thermostat '
                    + thermostatId + ". Error: " + e);
                success = false;
            }

            callbackFn(success);
        }
    });
}

// Logs in into the Honeywell site using the credentials saved in localStorage
function login(callbackFn){
    console.log("Connecting as user: "+localStorage.honeywellUsername);
    ajaxCall({
        url: 'https://rs.alarmnet.com/TotalConnectComfort/',
        params: 'UserName=' + localStorage.honeywellUsername
            + '&Password=' + localStorage.honeywellPassword
            + '&timeOffset=240',
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        callback: callbackFn
    });
}

// Initializes the thermostat data with login response data
function initializeThermostatData(){
    login(function(){
        var parsedResponse = parseLoginResponse(this.responseText),
            thermostats = parsedResponse.thermostats,
            thermostatsCount = thermostats.length,
            thermostat,
            i;

        if (thermostatsCount > 0){
            for (i = 0; i < thermostatsCount; i++){
                thermostat = {
                    "thermostatIndex": i,
                    "thermostatId": thermostats[i].id,
                    "thermostatName": thermostats[i].name,
                };

                // Get the target (desired) temperature per each thermostat and
                // send the data for each thermostat to the watch at 1 second intervals
                setTimeout(function(thermostatData){
                    getTemperature(thermostatData.thermostatId, function(temperature){
                        thermostatData.thermostatTemperature =
                            encodeTemperature(temperature);
                        Pebble.sendAppMessage(thermostatData);
                    });
                }, i*1000, thermostat);
            }
        }
        else {
            console.log("Error when trying to log in Honeywell site.");
            console.log("Response text: " + this.responseText);
            console.log("Response status: " + this.status);
            console.log("Response Errors: " + parsedResponse.errors.join());
        }
    });
}

// Parses the login call response. Returns the thermostats data if the
// call was successful. Otherwise returns the errors.
function parseLoginResponse(htmlString){
    var response = document.createElement("div"),
        thermostats = [],
        errors = [],
        nodeList,
        nodeListLength,
        i;

    response.innerHTML = htmlString;
    nodeList = response.querySelectorAll('[data-id]');
    nodeListLength = nodeList.length;

    for (i = 0; i < nodeListLength; i++){
        thermostats.push({
            id: nodeList[i].getAttribute('data-id'),
            indoorTemperature: parseInt(nodeList[i].querySelector('.tempValue')
                .innerText.trim()),
            name: nodeList[i].querySelector('.location-name').innerText.trim()
                .toLowerCase().replace(/^./, function(m){return m.toUpperCase();})
        });
    }

    if (nodeListLength < 1){
        nodeList = response.getElementsByClassName('validation-summary-errors');
        nodeListLength = nodeList.length;
        for (i = 0; i < nodeListLength; i++){
            errors.push(nodeList[i].innerHTML);
        }
    }

    return {
        thermostats: thermostats,
        errors: errors
    }
}

// Converts temperature to string and adds symbol °
function encodeTemperature(temperature){
    return temperature + "\u00B0"; // Unicode for °
}

// -------------- Configuration ----------------
// This configuration section generates an html 
// form on the fly to save into HTML5 local storage
// the username and password of the Honeywell
// website that receives commands to query and
// update the thermostat data.
// Once they are saved, they are used by default
// to submit those commands

Pebble.addEventListener("showConfiguration", function() {
  console.log("Showing configuration");
  Pebble.openURL('data:text/html,<html> <head> <meta name="viewport" content="width=device-width, initial-scale=1"> <style> * {font-family:verdana; font-size: 20px} input {border: 2px solid #a1a1a1; border-radius: 5px;} label, .grp {display: block; padding: 5px;} h1 {background: #85A3FF; padding: 10px} </style> </head> <body> <h1>Honeywell Site Credentials</h1> <form action="pebblejs://close#"> <div class="grp"><label>Username:</label><input type="email" name="u" placeholder="user@email.com" value="'+(localStorage.honeywellUsername||'')+'" ></div> <div class="grp"><label>Password:</label><input type="password" name="p"></div> <div class="grp" style="padding-top:30px;"> <input type="submit" onclick="var f=document.forms[0], params={\'username\': f.u.value, \'password\': f.p.value}; f.action += encodeURIComponent(JSON.stringify(params));"> <input type="submit" value="Cancel"> </div> </form> </body> </html><!--.html');
});

Pebble.addEventListener("webviewclosed", function(e) {
  var params = JSON.parse(decodeURIComponent(e.response));

  // Store credentials in a localStorage object
  if (params.username && params.password){
    localStorage.honeywellUsername = params.username;
    localStorage.honeywellPassword = params.password;
    console.log("Stored credentials for: " + localStorage.honeywellUsername);
  }
});
// ----------- End of Configuration -------------


// A helper function to make ajax Calls
function ajaxCall(options){
    var xhr = new XMLHttpRequest(),
        method = (options.method || 'GET').toUpperCase(),
        headers = options.headers,
        params = options.params,
        url = options.url + (method === 'GET' && params ? '?' + params : '');

    xhr.open(method, url);

    // Set headers
    if (headers){
        Object.keys(headers).forEach(function(key){
            xhr.setRequestHeader(key, headers[key]);
        });
    }

    xhr.onload = options.callback;
    xhr.onerror = function(e){ console.error(e); }

    xhr.send(method === 'POST' ? params : null);
}
