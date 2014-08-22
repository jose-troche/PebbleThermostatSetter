Pebble.addEventListener("ready", function(e) {
    console.log("Pebble app ready");   
});

Pebble.addEventListener("appmessage", function(e) {
    var button = parseInt(e.payload.button);
    console.log("Button pressed: " + button);
    setDeltaTemperature(button);
});

function login(callbackFn){
    console.log("Logging in with user: "+localStorage.honeywellUsername);
    ajaxCall({
        url: 'https://rs.alarmnet.com/TotalConnectComfort/',
        /*params: JSON.stringify({
            UserName: localStorage.honeywellUsername,
            Password: localStorage.honeywellPassword,
            timeOffset: "240"
        }),*/
        params: 'UserName='+localStorage.honeywellUsername+'&Password='+localStorage.honeywellPassword+'&timeOffset=240',
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
            console.log(this.responseText);
        }
    });
}

function setDeltaTemperature(deltaTemperature){
    login(function(){
        var parsedResponse = parseLoginResponse(this.responseText),
            deviceId;

        if (parsedResponse.deviceIds.length > 0){
            deviceId = parsedResponse.deviceIds[0]; // Use first device
            getTemperature(deviceId, function(currentTemperature){
                setTemperature(deviceId, currentTemperature + deltaTemperature);
            })
        }
        else {
            console.log("Error when trying to log in Honeywell site.");
            console.log("Response text: " + this.responseText);
            console.log("Response status: " + this.status);
            console.log("Response Errors: " + parsedResponse.errors.join());
        }
    });
}

// Parses the login call response. Returns the deviceIds if the 
// call was successful. Otherwise returns the errors.
function parseLoginResponse(htmlString){
    var response = document.createElement("div"),
        deviceIds = [],
        errors = [],
        nodeList,
        nodeListLength,
        i;

    response.innerHTML = htmlString;
    nodeList = response.querySelectorAll('[data-id]');
    nodeListLength = nodeList.length;

    for (i = 0; i < nodeListLength; i++){
        deviceIds.push(nodeList[i].getAttribute('data-id'));
    }

    if (nodeListLength < 1){
        nodeList = response.getElementsByClassName('validation-summary-errors');
        nodeListLength = nodeList.length;
        for (i = 0; i < nodeListLength; i++){
            errors.push(nodeList[i].innerHTML);
        }
    }

    return {
        deviceIds: deviceIds,
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
