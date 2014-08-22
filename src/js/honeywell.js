
location.href = 'https://rs.alarmnet.com/TotalConnectComfort/';

/*function(){
            console.log(this.status);
            console.log(this.getAllResponseHeaders());
        }*/

function login(callbackFn){
    console.log("Logging in with user: "+localStorage.honeywellUsername);
    ajaxCall({
        url: 'https://rs.alarmnet.com/TotalConnectComfort/',
        params: 'UserName='+localStorage.honeywellUsername+'&Password='+localStorage.honeywellPassword+'&timeOffset=240',
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        callback: callbackFn
    });
}

function getTemperature(callbackFn){
    ajaxCall({
        url: 'https://rs.alarmnet.com/TotalConnectComfort/Device/CheckDataSession/520081',
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        callback: function(){
            callbackFn(JSON.parse(this.responseText).latestData.uiData.CoolSetpoint)
        }
    });
}

function setTemperature(temperature){
    ajaxCall({
        url: 'https://rs.alarmnet.com/TotalConnectComfort/Device/SubmitControlScreenChanges',
        params: JSON.stringify({
            DeviceID: 520081,
            CoolSetPoint: temperature
        }),
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json; charset=UTF-8'
        },
        callback: function(){
            console.log(JSON.parse(this.responseText));
        }
    });
}

function setDealtaTemperature(deltaTemperature){
    login(1, 2, function(){
        getTemperature(function(currentTemperature){
            setTemperature(currentTemperature + deltaTemperature)
        })
    });
}

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
