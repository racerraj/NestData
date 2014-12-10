function performLogin(email, password) {
  var payload = {
    "username" : email,
    "password" : password
  };
  
  var options = {
    "method"  : "post",
    "payload" : payload
  };

  var response = JSON.parse(UrlFetchApp.fetch('https://home.nest.com/user/login', options).getContentText());
  if ('error' in response) {
    throw "Invalid login credentials";
  }
  
  return response
}

function getData() {
  var login_auth = performLogin('<YOUR NEST USERNAME>','<YOUR NEST PASSWORD>');
             
  var headers = {
    "Authorization" : 'Basic '+login_auth['access_token'],
    "X-nl-user-id"  : login_auth['userid'],
    "X-nl-protocol-version" : '1',
    'Accept-Language': 'en-us',
    'Connection'    : 'keep-alive',
    'Accept'        : '*/*',
  };
  
  var options = {
    'headers' : headers
  };
  
  var request=UrlFetchApp.fetch(login_auth['urls']['transport_url']+'/v2/mobile/user.'+login_auth['userid'], options);
  var result=JSON.parse(request.getContentText());

  var structure_id = result['user'][login_auth['userid']]['structures'][0].split('.')[1]
  var device_id    = result['structure'][structure_id]['devices'][0].split('.')[1]

  var current_temp = ((result["shared"][device_id]["current_temperature"]*9)/5)+32;
  var target_temp  = ((result["shared"][device_id]["target_temperature"]*9)/5)+32;
  var humidity     = result["device"][device_id]["current_humidity"]/100;
  var hvac_alt_heat_state = result["shared"][device_id]["hvac_alt_heat_state"];
  var heater_state = result["shared"][device_id]["hvac_heater_state"];
  var hvac_ac_state = result["shared"][device_id]["hvac_ac_state"];
  var hvac_fan_state = result["shared"][device_id]["hvac_fan_state"];
  
  Logger.log("Current Temp: "+current_temp+", Target Temp: "+ target_temp +", Humidity: "+ humidity*100 + "%" );
  var time = new Date();
 
  var wxrequest=UrlFetchApp.fetch('http://api.openweathermap.org/data/2.5/weather?q=<YOUR ZIP CODE>');
  var wxresult=JSON.parse(wxrequest.getContentText());
  
  var outside_temp = (wxresult["main"]["temp"] - 273);
 
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];

  // Appends a new row with 3 columns to the bottom of the
  // spreadsheet containing the values in the array hvac_ac_state
  sheet.appendRow( [ time, current_temp, target_temp, outside_temp, humidity, heater_state, hvac_alt_heat_state, hvac_ac_state, hvac_fan_state ] );
}

