//initialization
//var firebase = require('firebase');
//var firedb = new Firebase('https://tsaimon.firebaseIO.com');
var fireCurrent = [];
var fireSchedule = [];
fireBigBro = new Firebase('https://bigbrother.firebaseIO.com')
fireCurrent[0] =  new Firebase('https://tsaimon.firebaseIO.com/current');
fireSchedule[0] = new Firebase('https://tsaimon.firebaseIO.com/schedule');
fireCurrent[1] =  new Firebase('https://tsaimon-unit1.firebaseIO.com/current');
fireSchedule[1] =  new Firebase('https://tsaimon-unit1.firebaseIO.com/schedule');
fireCurrent[2] =  new Firebase('https://tsaimon-unit2.firebaseIO.com/current');
fireSchedule[2] =  new Firebase('https://tsaimon-unit2.firebaseIO.com/schedule');

var SP = [];
var T2 = [];
var Mode = [];
var Watt = [];
var Vol = [];

var noUnit = 3;
Vol[0] = 45;
Vol[1] = 45;
Vol[2] = 45;

// get the current data from all of the units
fireCurrent[0].on('value', function(snap){
    SP[0] = snap.val().SP;
    T2[0] = snap.val().T2;
    Mode[0] = snap.val().Mode;
    Watt[0] = Math.round(snap.val().Volt * snap.val().Amp);
});

fireCurrent[1].on('value', function(snap){
    SP[1] = snap.val().SP;
    T2[1] = snap.val().T2;
    Mode[1] = snap.val().Mode;
    Watt[1] = Math.round(snap.val().Volt * snap.val().Amp);
});
fireCurrent[2].on('value', function(snap){
    SP[2] = snap.val().SP;
    T2[2] = snap.val().T2;
    Mode[2] = snap.val().Mode;
    Watt[2] = Math.round(snap.val().Volt * snap.val().Amp);
});


// DOM Ready =============================================================
$(document).ready(function() {
	//Change SP on click

	$('#btnEntrySubmit').on('click',function(){
		entrySubmit(fireCurrent, fireSchedule);
	});
	$('#btnAbortSubmit').on('click',function(){
		abortSubmit();
	});
	$('#btnClearSubmit').on('click',function(){
		clearSubmit();
	});
	// Update Data and charts
//    setInterval(function() {
        updateChart();
        updateData();
//    }, 15000);
});


// Functions =============================================================

//*********************
// Submit Strategy
//********************
function entrySubmit() {
    var startTime;
    var endTime;
    var SPNew, ModeNew;
	startTime = moment($('#inputStartTime').val()).valueOf();
	endTime = moment($('#inputEndTime').val()).valueOf();
    // do basic error checking
    if (startTime > endTime) {
        alert (" error in time entry!");
        return false;
    }
    switch ($('#selStrtgy').val()) {
		case 'Standard Electric 140F (Load)':
			SPNew = 140;
			ModeNew = 1;
			break;
		case 'Setpoint 140F (Load)':
			SPNew =  140;
			ModeNew = ''
			break;
		case 'Standard Electric 130F (Load)':
			SPNew = 130;
			ModeNew = 1;
			break;
		case 'Setpoint 130F (Load)':
			SPNew = 130;
			ModeNew = '';
			break;
		case 'Heat Pump 110F (Shed)':
			SPNew = 110;
			ModeNew = 2;
			break;
		case 'Heat Pump 100F (Shed)':
			SPNew = 100;
			ModeNew = 2;
			break;
		case 'Vacation 50F (Shed)':
			SPNew = 50;
			ModeNew = 4;
			break;
		case 'Setpoint + 10F (Load)':
			SPNew = 10;
			ModeNew = '';
			break;
		case 'Setpoint - 10F (Shed)':
			SPNew = -10;
			ModeNew = '';
			break;
		default:
			SPNew = '';
			ModeNew = ''
			break;
	}
    for (var i=0; i < noUnit; i++) {
        if (SPNew === 10) {
            SPNew = SP[i] + 10;
            if (SPNew > 140) {
                SPNew = 140;
            }
        }
        if (SPNew == -10) {
            SPNew = SP[i] - 10;
            if (SPNew < 100) {
                SPNew = 100;
            }
        }
        if (SPNew === '') {
            SPNew = SP[i];
        }
        if (ModeNew === '') {
            ModeNew = Mode[i];
        }
        item = {'Time': startTime, 'SP': SPNew, 'Mode': ModeNew, Dehum: 0};
        itemBack = {'Time': endTime, 'SP': SP[i], 'Mode': Mode[i], Dehum: 0};
		fireSchedule[i].push(item);
		fireSchedule[i].push(itemBack);
    }
}
//**********************
//  Abort Current Event
//**********************
function abortSubmit() {
	//error checking
  // compile the list of clear schedule ranges

	for (i = 0; i<noUnit; i++) {
      fireSchedule[i].orderByChild('Time').limitToFirst(1).once('value', function(snap) {
          snap.forEach(function(row) {
              curTime = new Date().getTime();
              // Push the return mode/SP to now
              // remove the current return schedule
              snap.ref().child(row.key()).remove();
              item = {'Time': curTime, 'SP': row.val().SP, 'Mode': row.val().Mode, Dehum: 0};
              console.log(item);
              snap.ref().push(item);
          });
      });
  }
}

//**********************
//  Clear Scheduled Event
//**********************
function clearSubmit() {
	//error checking
	// compile the list of clear schedule ranges
	for (i = 0; i<noUnit; i++) {
        fireSchedule[i].orderByChild('Time').limitToFirst(2).once('value', function(snap) {
            snap.forEach(function(row) {
                // Push the return mode/SP to now
                // remove the current return schedule
                console.log(row.key());
                snap.ref().child(row.key()).remove();
            });
        });
    }
}


//**********************
// Update data
//***********************

function updateData() {
// update the current total of all units
    setTimeout(function() {
        var totWatt = 0;
        var totStdby = 0;
        var cumTemp = 0;
        var totVol = 0;
    //    console.log(SP, T2, Watt);
        for (var i=0; i< noUnit; i++) {
            totWatt = totWatt + Watt[i];
            cumTemp = cumTemp + (T2[i] * Vol[i]);
            totVol = totVol + Vol[i];
            if (Watt[i] < 100) {
                totStdby++;
            }
        }
        console.log('total watt', totWatt);
        console.log('stdby%', totStdby/noUnit);
        console.log('Avg Water Temp:', cumTemp/totVol);
		$('#noUnit').html(noUnit);
		$('#percentStdby').html(Math.round((totStdby/noUnit)*100));
		$('#avgTemp').html(Math.round((cumTemp/totVol)*10)/10);
		$('#totVol').html(totVol);
		$('#totWatt').html(totWatt/1000);
// calculate scenario simulation
        stratSP140(noUnit, Watt, SP, T2, Mode, Vol);
        stratStd140(noUnit, Watt, SP, T2, Mode, Vol);
        stratSP110(noUnit, Watt, SP, T2, Mode, Vol);
        stratHP100(noUnit, Watt, SP, T2, Mode, Vol);

    }, 5000);
}

//**********************
// Update chart
//***********************
function updateChart() {
    var fAvgTemp = [];
    var fStndby = [];
    var fTotWatt = [];
    endTime = new Date().getTime();
    startTime = endTime - 3600*24*1000; // get 24 hour of Data
    // get the data from datavbase
    fireBigBro.orderByChild('Time').startAt(startTime).endAt(endTime).on("child_added", function(data) {
		now = data.val().Time;
		fAvgTemp.push([now, data.val().AvgTemp]);
		fStndby.push([now, data.val().Stndby*100]);
		fTotWatt.push([now, data.val().TotWatt/1000]);
   });
    // wait 5 seconds for Firebase to finish retrieving
    setTimeout(function(){
		//Chart it!
		$(function () {
			Highcharts.setOptions({
				global: {
					useUTC:false
				}
			});
			$('#myChart1').highcharts({
				chart: {
					type: 'line',
					alignTicks: false,
					zoomType: 'x',
					panning: true,
					panKey: 'shift'
				},
				title: {
					text: moment(startTime).format('L')
				},
				xAxis: {
					type: 'datetime'
				},
				yAxis: [{
					labels: {
						format: '{value}F'
					},
					title: {
						text: 'Average Water Temp'
					},
				}, {// Secondary yAxis
					gridLineWidth: 0,
					title:  {
						text: 'KW'
					},
					min: 0,
					opposite: true
				}, {// Third yAxis
					gridLineWidth: 0,
					title: {
						text: '%Standby'
					},
					opposite: true,
					min: 0,
					max: 100
				}],
				tooltip:  {
					crosshairs: true,
					shared: true
				},
				plotOptions: {
					series:	{
						animation: false,
						fillOpacity: 0.2
					}
				},
				series: [{
					name: 'AvgTemp',
					color: 'orangered',
					data: fAvgTemp
					},{
					name: 'TotWatt',
					yAxis: 1,
					color: 'black',
					data: fTotWatt
					},{
					name: 'Stndby',
					yAxis: 2,
					color: '#40FF00',
					type: 'area',
					data: fStndby
				}]
			});
		});
    }, 5000);
}


function stratSP140(noUnit, Watt, SP, T2, Mode, Vol) {
    // Strategy: SP raised to 140
    var totWatE = 0;
    var totPower0 = 0;
    var totPower30 = 0;
    var totPower60 = 0;
    var totPower90 = 0;
    var totPower120 = 0;

    for (var i=0; i<noUnit; i++) {
        delDiff = 140 - T2[i];
        //total possible energy charged in water
        totWatE = totWatE + delDiff * Vol[i] * 8.34 * 0.0002931;
        // getting the energy use profile every 30 minutes
        if (Watt[i] >= 100) { // the case when it is already running
            //counting total energy @ t=0 minutes
            totPower0 = totPower0 + Watt[i]/1000;
            //counting total energy @ t=30 minutes
            if (Mode[i] == 1 || Watt[i] > 2000) {
                delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
                console.log('30 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower30 = totPower30 + 4.5;
                }
            } else {
                delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
                console.log('30 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower30 = totPower30 + 0.433;
                }
            }
            // counting total energy at t = 60 minutes
            if (Mode[i] ==1 || Watt[i] > 2000) {
                delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
                console.log('60 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower60 = totPower60 + 4.5;
                }
            } else {
                delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
                console.log('60 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower60 = totPower60 + 0.433;
                }
            }
            // counting total energy at t = 90 minutes
            if (Mode[i] ==1 || Watt[i] > 2000) {
                delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
                console.log('90 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower90 = totPower90 + 4.5;
                }
            } else {
                delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
                console.log('90 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower90 = totPower90 + 0.433;
                }
            }
            // counting total energy at t = 120 minutes
            if (Mode[i] ==1 || Watt[i] > 2000) {
                delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
                console.log('120 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower120 = totPower120 + 4.5;
                }
            } else {
                delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
                console.log('120 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower120 = totPower120 + 0.433;
                }
            }

        }
        if (delDiff > 12 && Watt[i] < 100) { // got to be greater than standby threshold to turn the water heater on.
            //counting total energy charged t=0;
            if (Mode[i] == 1) {
                totPower0 = totPower0 + 4.500;
            } else {
                totPower0 = totPower0 + 0.433;
            }
            // counting total energy at t=30 minutes
            if (Mode[i] ==1) {
                delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
                console.log('30 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower30 = totPower30 + 4.5;
                }
            } else {
                delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
                console.log('30 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower30 = totPower30 + 0.433;
                }
            }
            // counting total energy at t = 60 minutes
            if (Mode[i] ==1) {
                delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
                console.log('60 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower60 = totPower60 + 4.5;
                }
            } else {
                delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
                console.log('60 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower60 = totPower60 + 0.433;
                }
            }
            // counting total energy at t = 90 minutes
            if (Mode[i] ==1) {
                delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
                console.log('90 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower90 = totPower90 + 4.5;
                }
            } else {
                delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
                console.log('90 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower90 = totPower90 + 0.433;
                }
            }
            // counting total energy at t = 120 minutes
            if (Mode[i] ==1) {
                delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
                console.log('120 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower120 = totPower120 + 4.5;
                }
            } else {
                delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
                console.log('120 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower120 = totPower120 + 0.433;
                }
            }
        }
     }
    console.log(totWatE, totPower0,totPower30, totPower60, totPower90, totPower120);
	$('#SP140_KWH').html(Math.round(totWatE*100)/100);
	$('#SP140_0').html(totPower0);
	$('#SP140_30').html(totPower30);
	$('#SP140_60').html(totPower60);
	$('#SP140_90').html(totPower90);
	$('#SP140_120').html(totPower120);
}


function stratStd140(noUnit, Watt, SP, T2, Mode, Vol) {
    // Strategy: Put all in Std Electric Mode, SP raised to 140
    var totWatE = 0;
    var totPower0 = 0;
    var totPower30 = 0;
    var totPower60 = 0;
    var totPower90 = 0;
    var totPower120 = 0;

    for (var i=0; i<noUnit; i++) {
        delDiff = 140 - T2[i];
        //total possible energy charged in water
        totWatE = totWatE + delDiff * Vol[i] * 8.34 * 0.0002931;
        // getting the energy use profile 30 minutes
        if (delDiff > 12 || Watt[i] > 100) { // got to be greater than standby threshold to turn the water heater on or if it is already on.
            //counting total energy charged t=0;
            totPower0 = totPower0 + 4.5;
            // counting total energy at t=30 minutes
            delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
            console.log('30 minute delDiff',delDiff);
            if (delDiff > 0) {
                totPower30 = totPower30 + 4.5;
            }
            // counting total energy at t = 60 minutes
            delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
            console.log('60 minute delDiff',delDiff);
            if (delDiff > 0) {
                totPower60 = totPower60 + 4.5;
            }
            // counting total energy at t = 90 minutes
            delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
            console.log('90 minute delDiff',delDiff);
            if (delDiff > 0) {
                totPower90 = totPower90 + 4.5;
            }
            // counting total energy at t = 120 minutes
            delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
            console.log('120 minute delDiff',delDiff);
            if (delDiff > 0) {
                totPower120 = totPower120 + 4.5;
            }
        }
     }
    console.log(totWatE, totPower0,totPower30, totPower60, totPower90, totPower120);
	$('#StdSP140_KWH').html(Math.round(totWatE*100)/100);
	$('#StdSP140_0').html(totPower0);
	$('#StdSP140_30').html(totPower30);
	$('#StdSP140_60').html(totPower60);
	$('#StdSP140_90').html(totPower90);
	$('#StdSP140_120').html(totPower120);
}

function stratSP110(noUnit, Watt, SP, T2, Mode, Vol) {
    // Strategy: Put all  SP lowered to 110
    var totWatE = 0;
    var totPower0 = 0;
    var totPower30 = 0;
    var totPower60 = 0;
    var totPower90 = 0;
    var totPower120 = 0;

    for (var i=0; i<noUnit; i++) {
        delDiff = 110 - T2[i];
        //total possible energy charged in water
        totWatE = totWatE + delDiff * Vol[i] * 8.34 * 0.0002931;
        // getting the energy use profile every 30 minutes
        if ((delDiff > 0 && Watt[i] > 100) || (delDiff > 5)) { // got to be greater than standby threshold to turn the water heater on or if it is already on.
            //counting total energy charged t=0;
            if (Watt[i] > 100) {
                totPower0 = totPower0 + Watt[i]/1000;
            } else {
                totPower0 = totPower0 + 0.433;
            }
            // counting total energy at t=30 minutes
            if (Watt[i] > 2000){
                delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
                console.log('30 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower30 = totPower30 + 4.5;
                }
            } else {
                delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
                console.log('30 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower30 = totPower30 + 0.433;
                }
            }
            // counting total energy at t = 60 minutes
            if (Watt[i] > 2000){
                delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
                console.log('60 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower60 = totPower60 + 4.5;
                }
            } else {
                delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
                console.log('60 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower60 = totPower60 + 0.433;
                }
            }

            // counting total energy at t = 90 minutes
            if (Watt[i] > 2000){
                delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
                console.log('90 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower90 = totPower90 + 4.5;
                }
            } else {
                delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
                console.log('90 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower90 = totPower90 + 0.433;
                }
            }

            // counting total energy at t = 120 minutes
            if (Watt[i] > 2000){
                delDiff = delDiff - (0.5 * 4.5 * 0.98) / (Vol[i] * 8.34 * 0.0002931);
                console.log('120 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower120 = totPower120 + 4.5;
                }
            } else {
                delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
                console.log('120 minute delDiff',delDiff);
                if (delDiff > 0) {
                    totPower120 = totPower120 + 0.433;
                }
            }
        }
     }
    console.log(totWatE, totPower0,totPower30, totPower60, totPower90, totPower120);
	$('#SP110_KWH').html(Math.round(totWatE*100)/100);
	$('#SP110_0').html(totPower0);
	$('#SP110_30').html(totPower30);
	$('#SP110_60').html(totPower60);
	$('#SP110_90').html(totPower90);
	$('#SP110_120').html(totPower120);
}

function stratHP100(noUnit, Watt, SP, T2, Mode, Vol) {
    // Strategy: Put all in Std Electric Mode, SP raised to 140
    var totWatE = 0;
    var totPower0 = 0;
    var totPower30 = 0;
    var totPower60 = 0;
    var totPower90 = 0;
    var totPower120 = 0;

    for (var i=0; i<noUnit; i++) {
        delDiff = 100 - T2[i];
        //total possible energy charged in water
        totWatE = totWatE + delDiff * Vol[i] * 8.34 * 0.0002931;
        // getting the energy use profile 30 minutes
        if ((delDiff > 0 && Watt[i] > 100) || (delDiff > 5)) { // got to be greater than standby threshold to turn the water heater on or if it is already on.
            //counting total energy charged t=0;
            totPower0 = totPower0 + 0.433;
            // counting total energy at t=30 minutes
            delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
            console.log('30 minute delDiff',delDiff);
            if (delDiff > 0) {
                totPower30 = totPower30 + 0.433;
            }
            // counting total energy at t = 60 minutes
            delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
            console.log('60 minute delDiff',delDiff);
            if (delDiff > 0) {
                totPower60 = totPower60 + 0.433;
            }
            // counting total energy at t = 90 minutes
            delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
            console.log('90 minute delDiff',delDiff);
            if (delDiff > 0) {
                totPower90 = totPower90 + 0.433;
            }
            // counting total energy at t = 120 minutes
            delDiff = delDiff - (0.5 * 1.33) / (Vol[i] * 8.34 * 0.0002931);
            console.log('120 minute delDiff',delDiff);
            if (delDiff > 0) {
                totPower120 = totPower120 + 0.433;
            }
        }
     }
    console.log(totWatE, totPower0,totPower30, totPower60, totPower90, totPower120);
	$('#HP100_KWH').html(Math.round(totWatE*100)/100);
	$('#HP100_0').html(totPower0);
	$('#HP100_30').html(totPower30);
	$('#HP100_60').html(totPower60);
	$('#HP100_90').html(totPower90);
	$('#HP100_120').html(totPower120);
}

function schedVac(noUnit, SP, Mode) {
    curTime =  new Date().getTime();
    retTime = curTime + 3600 * 1000 * 2;
    for (var i=0; i < noUnit; i++) {
        item = {'Time': curTime, 'SP': SP[i], 'Mode': 4, Dehum: 0};
        itemBack = {'Time': retTime, 'SP': SP[i], 'Mode': Mode[i], Dehum: 0};
		fireSchedule[i].push(item);
		fireSchedule[i].push(itemBack);
    }
}
