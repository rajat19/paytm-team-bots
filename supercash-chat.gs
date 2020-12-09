var SPREAD_SHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREAD_SHEAT_ID');
var SHEET_NAME = PropertiesService.getScriptProperties().getProperty('SHEET_NAME');

var spreadsheet = SpreadsheetApp.openById(SPREAD_SHEET_ID);
var sheet = spreadsheet.getSheetByName(SHEET_NAME);

function testFunction() {
  // var ss = SpreadsheetApp.openById(SPREAD_SHEET_ID);
  // var sheet = ss.getSheets()[0];
  // Logger.log(loopThrough("using supercash-internal dev1"));
  // Logger.log(loopThrough("help"));
  // Logger.log(loopThrough("using ip 10.254.14.15"));
  // Logger.log(loopThrough("using promotion"));
  // Logger.log(loopThrough("notusing ip 10.254.19.106", "Rajat Srivastava"));
}

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
  var splitmsg = msg.split(" ").filter(x => x!="");
  var vm = validateMessage(splitmsg);
  if (vm != null) return vm;
  
  var usageType = 1; // 1 for using, 0 for notusing
  if (splitmsg[0] == "notusing") {
    usageType = 0;
  }
  var messageWithoutUsage = msg.substr(msg.indexOf(" ") + 1);
  var ss = SpreadsheetApp.openById(SPREAD_SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  var rows = sheet.getDataRange().getValues();
  var searchedRow = -1;
  if (!splitmsg[2]) {
    splitmsg[2] = "staging";
  }
  var serviceName = "";
  for(var i=0; i<rows.length; i++) {
    if (splitmsg[1] == "ip") {
      Logger.log("Searching row "+rows[i][2] + " matching with "+splitmsg[2]);
      if (rows[i][2] == splitmsg[2]) {
        searchedRow = i;
        serviceName = "ip "+rows[i][2];
        break;
      }
    } else {
      if(rows[i][0] == splitmsg[1] && rows[i][1] == splitmsg[2]) {
        searchedRow = i;
        serviceName = "service "+rows[i][0] + " " + rows[i][1]; 
        break;
      }
    }
  }
  if (searchedRow != -1) {
    Logger.log('Found row index: ' + searchedRow);
    var assignedUser = rows[searchedRow][3];
    if (usageType == 0) {
      if (!assignedUser) {
        return {"text": "No one is using "+messageWithoutUsage};
      }
      if (assignedUser == username) {
        clearUserAndTime(searchedRow + 1);
        return {"text": "Unassigned "+serviceName};
      }
      return {"text": "The service is used by "+assignedUser+", Please ask them to mark the service as not being used"};
    }
    if (rows[searchedRow][4]) {
      var d = rows[searchedRow][4];
      if (hasTimePassed(d)) {
        updateUserAndTime(searchedRow + 1, username, new Date());
        return {"text": "Assigned "+serviceName+" to "+username};
      }
      if (assignedUser == username) {
        updateUserAndTime(searchedRow + 1, username, new Date());
        return {"text": "The service is already assigned to you."};
      }
      return {"text": rows[searchedRow][3] + " is already using "+messageWithoutUsage};
    }
    updateUserAndTime(searchedRow + 1, username, new Date());
    return {"text": "Assigned "+serviceName+" to "+username};
  }
  return {"text": "No such service found. Please update google sheet or contact script admin"};
}

function getMessage(event) {
  var msg = event.message.text;
  if (event.space.type != 'DM') {
    msg = msg.substr(msg.indexOf(" ") + 1);
  }
  return msg;
}

/**
 * Responds to a MESSAGE event in Hangouts Chat.
 *
 * @param {Object} event the event object from Hangouts Chat
 */
function onMessage(event) {
  var name = "";

  if (event.space.type == "DM") {
    name = "You";
  } else {
    name = event.user.displayName;
  }
  var msg = getMessage(event);
  Logger.log(event.user.displayName+" typed "+event.message.text);
  return processMessage(msg, event.user.displayName);
}

/**
 * Responds to an ADDED_TO_SPACE event in Hangouts Chat.
 *
 * @param {Object} event the event object from Hangouts Chat
 */
function onAddToSpace(event) {
  var message = "";

  if (event.space.type == "DM") {
    message = "Thank you for adding me to a DM, " + event.user.displayName + "!";
  } else {
    message = "Thank you for adding me to " + event.space.displayName;
  }

  if (event.message) {
    // Bot added through @mention.
    message = message + " and you said: \"" + event.message.text + "\"";
  }

  return { "text": message };
}

/**
 * Responds to a REMOVED_FROM_SPACE event in Hangouts Chat.
 *
 * @param {Object} event the event object from Hangouts Chat
 */
function onRemoveFromSpace(event) {
  console.info("Bot removed from ", event.space.name);
}