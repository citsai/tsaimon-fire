// define firebase database and references
var fs = require('fs');
var vm = require('vm');
var content = fs.readFileSync(__dirname + '/firedb.js'); // put the Firebase db link is in this file
vm.runInThisContext(content);

var firebase = require('firebase');
var firedb = new firebase(firedbLink);
var fireHistory = new firebase(firedbLink + '/history');
var fireSchedule = new firebase(firedbLink + '/schedule');
var fireAlerts = new firebase(firedbLink + '/alerts');
var fireMailer = new firebase(firedbLink + '/mailer');
var fireRecent = new firebase(firedbLink + '/recent');
var fireCurrent = new firebase(firedbLink + '/current');

// initialize GE-SDK and required modules
var gea = require("gea-sdk");
var adapter = require("gea-adapter-usb");
var moment = require('moment');


// some global variables
var recentData = [];
var dbWrite = 0;
var dehum = false;

// Check if Firebase nodemailer email service info file exist or not and create one if not exists
firedb.once('value',function(snap) {
	if (!snap.hasChild('mailer')) {
		fireMailer.set({
			service: 'NA', 
			user: 'user email', 
			pass: 'password'
		});
	}
});
// Load the nodemailer data on any updates
var nodemailerData;
fireMailer.on('value', function(snap) {
	nodemailerData = snap.val();
	console.log('fireMailer data:',nodemailerData);
});

// Check if Firebase alerts dat file exist or not and create a dummy one if not exist
firedb.once('value',function(snap) {
	if (!snap.hasChild('alerts')) {
		fireAlerts.set({
			email: "youremail@server.com", 
			dayKwhrFlg: 0, 
			dayKwhrLmt: 5, 
			dayStbyFlg: 0, 
			dayStbyLmt: 50,
			modeChgFlg: 0,
			SPChgFlg: 0,
			errFlg: 0,
			htrElmntFlg: 0
		});
	}
});

// load the alert setup data on any changes
var alertData;
fireAlerts.on('value', function(snap) {
	alertData = snap.val();
	console.log('fireAlerts data:',alertData);
});

//initialize some variables for alert
var ModeOld = "";
var SPOld = "";
var dateOld = moment().date();	
var UEOld = "";
var LEOld = "";
var err1Old = 0;
var err2Old = 0;
var err3Old = 0;
var err4Old = 0;

// configure the gea bus application
var geapp = gea.configure({
    address: 0xcb,
});

// bind to the adapter to access the bus
geapp.bind(adapter, function (bus) {
    console.log("bind was successful");
	bus.on("appliance",function(appliance) {
		// firebase - limit the 5 sec data to last 30 minutes
		fireRecent.on('value',function(dataSnapshot) {
			noRec = dataSnapshot.numChildren();
			if (noRec > 360) {
				fireRecent.orderByChild("TimeStamp").limitToFirst(noRec-360).once("value",function(snap){
					snap.forEach(function(row) {
						fireRecent.child(row.key()).remove();
					});
				});
			}
		});
		//get Model Data
		var model=4;
		appliance.send([0x01],[],function(data) {
			console.log("Software#: ",data[0]);
			model = data[0];
		});


// The big loop...
		setInterval(function(){
//**** alternate method using sequential blocking *******
			Flow = require('gowiththeflow');
			Flow().par(function(next){
				//get hyperterminal data from appliance
				appliance.send(0x56,[],function(data1) {
					next(null,data1);				
				});
			}).par(function(next){
				// Get additional for mode
				appliance.send([0xDE],[0x10],function(data2) {
					next(null,data2);
				});
			}).seq(function(next,err,res){
			// write Hyperterminal data to databases
					timeStamp = new Date().getTime();
					UE = res[0][0];
					LE = res[0][1];
					COMP = res[0][2];
					FAN = res[0][3];			
					SP = res[0][4];		
					T2 = (res[0][5]*256 + res[0][6])/10;
					T3a = (res[0][7]*256 + res[0][8])/10;
					T3b = (res[0][9]*256 + res[0][10])/10;
					T4 = (res[0][11]*256 + res[0][12])/10;
					T5 = (res[0][13]*256 + res[0][14])/10;
					Amp = res[0][15]/10;
					Volt = res[0][16]*256 + res[0][17];
					EEV = res[0][18]*256 + res[0][19];
					Flow = res[0][20];			
//					Mode = res[0][21];  //Deleted due to different modes being used in the new Geospring...	
					Mode = res[1][8];
					if (model < 4) {
						Mode = Mode - 1;  // Off set for G2 models.
					}
					console.log(timeStamp,UE,LE,COMP,FAN,SP,T2,T3a,T3b,T4,T5,Amp,Volt,EEV,Flow,Mode,dehum);

					// Update Firebase recent data
					fireRecent.push({'TimeStamp':timeStamp,'UE':UE,'LE':LE,'Comp':COMP,'Fan':FAN,'SP':SP,'T2':T2,'T3a':T3a,'T3b':T3b,'T4':T4,'T5':T5,'Amp':Amp,'Volt':Volt,'EEV':EEV,'Flow':Flow,'Mode':Mode,'Dehum':dehum});
					// Update Firebase current data
					fireCurrent.set({'TimeStamp':timeStamp,'UE':UE,'LE':LE,'Comp':COMP,'Fan':FAN,'SP':SP,'T2':T2,'T3a':T3a,'T3b':T3b,'T4':T4,'T5':T5,'Amp':Amp,'Volt':Volt,'EEV':EEV,'Flow':Flow,'Mode':Mode,'Dehum':dehum});
						
					// check for initial startup for alerts
					if (SPOld === "") {
						SPOld = SP;
						ModeOld = Mode;
						UEOld = UE;
						LEOld = LE;
					}
					alertChk(SP,Mode,UE,LE,appliance);
					// Check to see if need to change SP/Modes
						// Check firebase Schedule
						fireSchedule.orderByChild('Time').endAt(timeStamp).limitToFirst(1).once('child_added', function(snap) {
							console.log(snap.val());
							if (snap.val() != "") {
								if (snap.val().SP != SP || snap.val().Mode != Mode || snap.val().Dehum != dehum) {
									console.log(snap.val().SP, SP, snap.val().Mode, Mode);
									// Change Mode
									if ([snap.val().Mode] == 4) {
										console.log('went to vacation mode');
										appliance.send(0xDF, [0x14,snap.val().Mode,99,50]);
									} else {
										console.log('went to regular modes'); 
										appliance.send(0xDF, [0x14, snap.val().Mode]);
										// Change SP
										appliance.send(0xA5,[snap.val().SP]);
										// Change SH for dehum
										if (snap.val().Dehum) {
											appliance.send(0xEA,[15]);
											dehum = snap.val().Dehum;
//											console.log('changed to dehum mode');
										} else {
											appliance.send(0xEA,[10]);
											dehum = snap.val().Dehum;
//											console.log('changed back to non-dehum mode');
										}	
									}
									// delete the executed schedule record
									fireSchedule.child(snap.key()).remove();
									console.log('changed SP to ',snap.val().SP,' changed mode to:',snap.val().Mode, 'dehum: ',snap.val().Dehum);
								}
							}
						});
												
						// only write to the database every minute
						dbWrite = dbWrite +1;
						if (dbWrite == 12) {
							// Write to firebase
							fireHistory.push({
								'TimeStamp': timeStamp,
								'UE': UE,
								'LE': LE,
								'Comp': COMP,
								'Fan': FAN,
								'SP': SP,
								'T2': T2,
								'T3a': T3a,
								'T3b': T3b,
								'T4': T4,
								'T5':T5,
								'Amp': Amp,
								'Volt': Volt,
								'EEV': EEV,
								'Flow': Flow,
								'Mode': Mode
							});
							dbWrite = 0; // reset db write counter
							console.log('writing to db');
						}
				next();
			});
		},5000);
	});
});


function alertChk(SP,Mode,UE,LE,appliance) {
//	console.log(alertData);
	if (alertData.SPChgFlg == 1 && SPOld != SP) {
		SPOld = SP;
		alertMsg = 'SP has changed to ' + SP;
		alertSend(alertMsg);
		console.log(alertMsg);
	}
	if (alertData.modeChgFlg == 1 && ModeOld != Mode) {
		ModeOld = Mode;
		switch (Mode) {
			case 0:
				mode = 'Hybrid';
				break;
			case 1:
				mode = 'Std Electric';
				break;
			case 2:
				mode = 'Heat Pump';
				break;
			case 3:
				mode = 'High Demand';
				break;
			case 4:
				mode = 'Vacation';
				break;
			default:
				mode = "";
				break;
		}
		alertMsg = 'Mode has changed to ' + mode;
		alertSend(alertMsg);
		console.log(alertMsg);
	}
	if (alertData.htrElmntFlg == 1 && UEOld != UE && Mode != 1){
		UEOld = UE;
		if (UE == 1) { 
			alertMsg = 'Upper Element Turned On';
			alertSend(alertMsg);
			console.log(alertMsg);
		}
	}
	if (alertData.htrElmntFlg == 1 && LEOld != LE && Mode != 1){
		LEOld = LE;
		if (LE == 1) { 
			alertMsg = 'Lower Element Turned On';
			alertSend(alertMsg);
			console.log(alertMsg);
		}
	}
	if (alertData.errFlg ==1) {
		appliance.send([0xDE],[0x14],function(fault) {
			if (err1Old != fault[1]) {
				err1Old = fault[1];
				if (fault[1] !== 0) {
					alertMsg = 'There is a new fault on byte1: ' + fault[1];
					alertSend(alertMsg);
					console.log(alertMsg);
				}
			}
			if (err2Old != fault[2]) {
				err2Old = fault[2];
				if (fault[2] !== 0) {
					alertMsg = 'There is a new fault on byte2: ' + fault[2];
					alertSend(alertMsg);
					console.log(alertMsg);
				}
			}
			if (err3Old != fault[3]) {
				err3Old = fault[3];
				if (fault[3] !== 0) {
					alertMsg = 'There is a new fault on byte3: ' + fault[3];
					alertSend(alertMsg);
					console.log(alertMsg);
				}
			}
			if (err4Old != fault[4]) {
				err4Old = fault[4];
				if (fault[4] !== 0) {
					alertMsg = 'There is a new fault on byte4: ' + fault[4];
					alertSend(alertMsg);
					console.log(alertMsg);
				}
			}
		});
	}

	if (alertData.dayKwhrFlg == 1 || alertData.dayStbyFlg == 1) {
		if (dateOld != moment().date()) { // need to check ok if new month?
			//compile KWHr data ans Stby% for the previous day
			dayStart = moment().startOf('day').valueOf() - 3600 * 24 * 1000;
			dayEnd = dayStart + 3600 * 24 * 1000;	

			var UE = 0;
			var LE = 0;
			var Comp = 0;
			var stby = 0;
			var Watt = 0;
			var KWHr = 0;

			fireHistory.orderByChild('TimeStamp').startAt(dayStart).endAt(dayEnd).on("child_added", function(data) {
			// compile data for each day of the week
				UE = UE + data.val().UE;
				LE = LE + data.val().LE;
				if (data.val().LE === 0) {
					Comp = Comp + data.val().Comp; // only count compressor if LE is not on.
				}
				if (data.val().UE === 0 && data.val().LE === 0 && data.val().Comp === 0) {
					stby = stby + 1;
				}
				Watt = Watt + data.val().Amp * data.val().Volt;
				//console.log('retrieving data');
			});

			// Delay for 5 seconds for firebase to retrieve the data
			setTimeout(function() {
				// convert to Standby% and KWHr
				stby = (stby/(UE+LE+Comp+stby))*100;
				KWHr = Watt * 60/3600/1000;
				// check for over limit
				if (alertData.dayKwhrFlg == 1 && KWHr>alertData.dayKwhrLmt) {
					alertMsg = moment(dayStart).format('L') + ' has energy usage of: ' + KWHr + ' KWHr';
					alertSend(alertMsg);
					console.log(alertMsg);
				}
				if (alertData.dayStbyFlg == 1 && stby<alertData.dayStbyLmt) {
					alertMsg = moment(dayStart).format('L') + ' has standby time of: ' + stby + ' %';
					alertSend(alertMsg);
					console.log(alertMsg);
				}					
			},5000);
			dateOld = moment().date(); // change the date to current after finish
		}
	}
}

function alertSend(alertMsg) {
	if (nodemailerData.service != 'NA') {
		var nodemailer = require('nodemailer');
		var transporter = nodemailer.createTransport({
			service: nodemailerData.service,
			auth: {
				user: nodemailerData.user,
				pass: nodemailerData.pass
			}
		});
	
		// send a email for alert
		transporter.sendMail({
			from: nodemailerData.user,
			to: alertData.email,
			subject: 'Tsaimon Alert',
			text: alertMsg
		});
	}
}
