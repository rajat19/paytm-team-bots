var SLACK_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('SLACK_ACCESS_TOKEN');
var SPREAD_SHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREAD_SHEAT_ID');
var SHEET_NAME = PropertiesService.getScriptProperties().getProperty('SHEET_NAME');

var POST_MESSAGE_ENDPOINT = 'https://slack.com/api/chat.postMessage';
var spreadsheet = SpreadsheetApp.openById(SPREAD_SHEET_ID);
var sheet = spreadsheet.getSheetByName(SHEET_NAME);

function getHelpTexts() {
  var helpText = "You can use this service in following ways:"+
    "\n 1. list or help-service (shows list of boxes available)"+
    "\n 1. using ip [IP] eg. using ip 10.254.1.2" +
    "\n 2. using [SERVICE_NAME] [ENV] eg. using supercash-internal dev2"+
    "\n 3. notusing [SERVICE_NAME] [ENV] eg. notusing promotion dev2  (This command could be used by you only if box is already assigned to you)";
    
    return {"text": helpText};
}

function hasTimePassed(sheetDate) {
  var margin = 8 * 60 * 60 * 1000;
  if (new Date().getTime() > (new Date(sheetDate).getTime() + margin)) {
    return true;
  }
  return false;
}

function getServices() {
  var rows = sheet.getDataRange().getValues();
  var text = "Following are the currently available services: \n";
  for(var i=1; i<rows.length; i++) {
    text += "service = "+rows[i][0] + ", env = "+rows[i][1]+" (ip: "+rows[i][2]+")";
    if (rows[i][3]) {
      if (rows[i][4] && !hasTimePassed(rows[i][4])) {
        text += " acquired by " + rows[i][3];
      }
    }
    text +="\n";
  }
  return {"text": text};
}

function clearUserAndTime(row) {
  sheet.getRange(row, 4, 1, 2).clearContent();
}

function updateUserAndTime(row, username, time) {
  clearUserAndTime(row);
  var ss = SpreadsheetApp.openById(SPREAD_SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  sheet.getRange(row, 4, 1, 1).setValue(username);
  sheet.getRange(row, 5, 1, 1).setValue(time);
}

function validateMessage(splitmsg) {
  if (splitmsg[0] == "help") {
    return getHelpTexts();
  }
  if (splitmsg[0] == "help-service" || splitmsg[0] == "list") {
    return getServices();
  }
  if (splitmsg[0] != "using" && splitmsg[0] != "notusing") {
    return {"text": "Please start your message with \"using\" or \"notusing\" keyword, it is currently "+splitmsg[0]};
  }
  if (splitmsg.length > 3) {
    return {"text": "Please abstain from using extra words, the bot is not intelligent enough. Try @supercashbot help for more details"};
  }
  
  if (splitmsg.length == 1) {
    return {"text": "Maybe you didn't type any service name or ip"};
  }
  if (splitmsg[1] == 'ip' && splitmsg.length == 2) {
    return {"text": "Please enter ip, as it is not present in your message"};
  }
  return null;
}

function processMessage(msg, username) {

function doPost(e) {
  var event = JSON.parse(e.postData.contents).event;
  if (event.hasOwnProperty('bot_id')) {
    return;
  }
  var eventText = event.text;
  // post2Slack()
}



function doPostOld(e){
  // return ContentService.createTextOutput(JSON.parse(e.postData.contents).challenge);
  var event = JSON.parse(e.postData.contents).event;
  // log('POST event: ' + JSON.stringify(event));
  
  if(event.hasOwnProperty('bot_id')){
    return;
  }else if(event.text.match(/dog/)){
    postGiphy2Slack(event, ['cute', 'corgi', 'dog']);
  }else if(event.text.match(/corgi/)){
    postGiphy2Slack(event, ['cute', 'corgi']);
  }else if(event.text.match(/butt/)){
    postGiphy2Slack(event, ['cute', 'corgi', 'butt']);
  }else if(event.text.match(/shake/)){
    postGiphy2Slack(event, ['cute', 'corgi', 'shake']);
  }else if(event.text.match(/shiba/)){
    postGiphy2Slack(event, ['cute', 'shiba']);
  }
}


function postGiphy2Slack(event, keywords){
  var url = getGiphyUrl(keywords);
  var random_params = Math.floor(Math.random() * TEXTS.length);
  var payload = {token:SLACK_ACCESS_TOKEN, channel:event.channel, text:TEXTS[random_params] + '\n' + url};
  UrlFetchApp.fetch(POST_MESSAGE_ENDPOINT, {method: 'post', payload:payload});
}


function getGiphyUrl(keywords){
  var url = 'http://api.giphy.com/v1/gifs/search?q=' + keywords.join('%20') + '&api_key=' + GIPHY_API_KEY;
  var response = JSON.parse(UrlFetchApp.fetch(url));
  var random_params = Math.floor(Math.random() * response["data"].length);
  return response["data"][random_params]["bitly_gif_url"];
}