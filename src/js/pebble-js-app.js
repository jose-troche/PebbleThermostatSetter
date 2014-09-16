Pebble.addEventListener("ready", function(e) {
    console.log("Initializing thermostat data ...");
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
                    "thermostatTemperature": thermostats[i].temperature
                };
                setTimeout(function(thermostatData){
                    getTemperature(thermostatData.thermostatId, function(temperature){
                        thermostatData.thermostatTargetTemperature = temperature.toString();
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
});

Pebble.addEventListener("appmessage", function(e) {
    var temperatureChange = parseInt(e.payload.temperatureChange),
        thermostatId = e.payload.thermostatId;
    console.log("Temperature Change: " + temperatureChange + ". Device: " + thermostatId);
    setDeltaTemperature(thermostatId, temperatureChange);
});

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

function getTemperature(deviceId, callbackFn){
    ajaxCall({
        url: 'https://rs.alarmnet.com/TotalConnectComfort/Device/CheckDataSession/' + deviceId,
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        callback: function(){
            try {
                var temperature = JSON.parse(this.responseText).latestData.uiData.CoolSetpoint;
                console.log("Device " + deviceId + " current temperature: " + temperature);
                callbackFn(temperature);
            }
            catch (e){
                console.error('Unable to get current temperature for device ' + deviceId + ". Error: " + e);
                console.log("Response text: " + this.responseText);
            }
        }
    });
}

function setTemperature(deviceId, temperature){
    ajaxCall({
        url: 'https://rs.alarmnet.com/TotalConnectComfort/Device/SubmitControlScreenChanges',
        params: JSON.stringify({
            DeviceID: parseInt(deviceId),
            CoolSetPoint: temperature
        }),
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json; charset=UTF-8'
        },
        callback: function(){
            var response = this.responseText,
                success = response && JSON.parse(response).success;
            if (success){
                console.log("Target Temperature updated!");
                Pebble.sendAppMessage({"thermostatTargetTemperature": temperature.toString()});
            }
            else {
                console.log("Target Temperature failed to update. responsense:" + response);
            }
        }
    });
}

function setDeltaTemperature(deviceId, deltaTemperature){
    login(function(){
        getTemperature(deviceId, function(currentTemperature){
            setTemperature(deviceId, currentTemperature + deltaTemperature);
        })
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
            temperature: parseInt(nodeList[i].querySelector('.tempValue').innerText.trim()),
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

// -------------- Configuration ----------------
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
