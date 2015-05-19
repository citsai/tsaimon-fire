// Initialize conenction to firebase  make sure you modify the firedb.js file to diret to the Firebase Databse
var fireRecent =  new Firebase(firedbLink + '/recent');
var fireCurrent = new Firebase(firedbLink + '/current');
var fireSchedule = new Firebase(firedbLink + '/schedule');
var fireFaults = new Firebase(firedbLink + '/current/faults');

// DOM Ready =============================================================
$(document).ready(function() {
    $('#nickName').append('Unit: ' + nickName + ' (' + firedbLink + ')');
    // Update the current snapshot


    updateStatus();

	// Get chart
	setInterval(function(){
    if (!$('#checkPause').prop("checked")) {
		updateChart();
    }
	},15000);

	//Change SP on click
	$('#btnSPNew').on('click',function(){
//		alert("I clicked on SP button");
		changeSP();
	});

});

// Functions =============================================================

//*************************
// Go get data and display it
//*************************
function updateStatus() {
    // List any error count greater than 0
	fireFaults.orderByValue().startAt(1).on('value',function(snap) {
        $('#textFaults').val(''); // clear the text area
        snap.forEach(function(data) {
			switch (Number(data.key())) {
				case 0:
					fault = 'LE Failure (F9)';
					break;
				case 1:
					faultName = 'UE Failure (F10)';
					break;
				case 2:
					faultName = 'Compressor Failure (F3)';
					break;
				case 3:
					faultName = 'T2 Failure(F2)';
					break;
				case 4:
					faultName = 'T3a Failure (F5)';
					break;
				case 5:
					faultName = 'T3b Failure (F6)';
						break;
				case 6:
					faultName = 'T4 Failure (F7)';
					break;
				case 7:
					faultName = 'T5 Failure (F8)';
					break;
				case 8:
					faultName = 'Run Cond A Failure (FA)';
					break;
				case 9:
					faultName = 'Run Cond B Failure (FB)';
					break;
				case 10:
					faultName = 'Run Cond C Failure (FC)';
					break;
				case 11:
					faultName = 'Run Cond D Failure (FD)';
					break;
				case 12:
					faultName = 'Run Cond E Failure (FE)';
					break;
				case 13:
					faultName = 'Run Cond F Failure (FF)';
					break;
				case 14:
					faultName = 'Run Cond G Failure (FG)';
					break;
				case 15:
					faultName = 'Run Cond H Failure (FH)';
					break;
				case 16:
					faultName = 'Run Cond I Failure (FI)';
					break;
				case 17:
					faultName = 'Run Cond J Failure (FJ)';
					break;
				case 18:
					faultName = 'Run Cond L Failure (FL)';
					break;
				case 19:
					faultName = 'Fan Failure (F4)';
					break;
				case 20:
					faultName = 'Stuck Key (F13)';
					break;
				case 21:
					faultName = 'Flash Failure (F15)';
					break;
				case 22:
					faultName = 'Flash Write Fault (F15)';
					break;
				case 23:
					faultName = 'Flash Busy Fault (F15)';
					break;
				case 24:
					faultName = 'Uninitialized Flash Fault (F15)';
					break;
				case 25:
					faultName = 'Flash Bad Read Fault (F15)';
					break;
				case 26:
					faultName = 'Flash Static buffer Full (F15)';
					break;
				case 27:
					faultName = 'Flash buffer violation (F15)';
					break;
				case 28:
					faultName = 'Flash Record Count Config Error (F15)';
					break;
				case 29:
					faultName = 'Anode Depleted (F16)';
					break;
				case 30:
					faultName = 'Anode Miswire (F17)';
					break;
				case 31:
					faultName = 'All 3 Element Failed Current Test (F18)';
					break;
				case 32:
					faultName = 'Primary Heating source voltage fail (F19)';
					break;
				case 33:
					faultName = 'Condensate Drain Pan Sensor (F20)';
					break;
				case 34:
					faultName = 'UL Voltage Divider Fail (F23)';
					break;
				case 35:
					faultName = 'Dirty Filter (F14)';
					break;
				case 36:
					faultName = 'Dry Tank (F11)';
					break;
				case 37:
					faultName = 'Line Miswire (F12)';
					break;
				case 38:
					faultName = 'application Image CRC error (F21)';
					break;
				case 39:
					faultName = 'Parametric Image CRC Failure (F22)';
					break;
				default:
					faultName = "";
					break;
			}
			faultLine = "Fault " + faultName + " count = " + data.val();
            console.log(faultLine);
            $('#textFaults').val($('#textFaults').val() + faultLine + '\n');
        });
	});    
    // Fire update the current status
    fireCurrent.on('value',function(snap){
		SP0 = snap.val().SP;
//		var dehum0 = (snap.val().Dehum === "true"); // need top convert from string to boolean just in case
		T20 = snap.val().T2;
		T3a0 = snap.val().T3a;
		T3b0 = snap.val().T3b;
		T40 = snap.val().T4;
		T50 = snap.val().T5;	
		EEV0 = snap.val().EEV;
		Mode0 = snap.val().Mode;
		Flow0 = snap.val().Flow;
		Volt0 = snap.val().Volt;
		Amp0 = snap.val().Amp;
		Watt = Volt0 * Amp0;
		
		//Mode
		if (Mode0 === 0) {
			document.getElementById("inputHybrid").checked=true;
		}
		if (Mode0 == 1) {
			document.getElementById("inputStdElec").checked=true;
		}
		if (Mode0 == 2) {
			document.getElementById("inputHeatPump").checked=true;
		}
		if (Mode0 == 3) {
			document.getElementById("inputHighDemand").checked=true;
		}
		if (Mode0 == 4) {
			document.getElementById("inputVacation").checked=true;
		}
		//Heat
		$('#inputUE').prop('checked',snap.val().UE);
		$('#inputLE').prop('checked',snap.val().LE);
		$('#inputCOMP').prop('checked',snap.val().Comp);
		$('#inputFAN').prop('checked',snap.val().Fan);
		//Flow intepretation
		switch (Flow0) {
			case 0:
				flowStr='None';
				break;
			case 1:
				flowStr='Small';
				break;
			case 2:
				flowStr='Medium';
				break;
			case 3:
				flowStr='Medium';
				break;
			case 4:
				flowStr='Large';
				break;
			case 5:
				flowStr='Large';
				break;
			case 6:
				flowStr='Large';
				break;
			case 7:
				flowStr='Large';
				break;
			default:
				flowstr='Error value = '+Flow0;
				break;
		}
		//write the status to screen
//		$('#checkDehumStat').prop('checked',dehum0);
		$('#T2').html(T20);
		$('#T3a').html(T3a0);
		$('#T3b').html(T3b0);
		$('#T4').html(T40);
		$('#T5').html(T50);
		$('#EEV').html(EEV0);
		$('#Flow').html(flowStr);
		$('#Volt').html(Volt0);
		$('#Amp').html(Amp0);
		$('#Mode').html(Mode0);
		$('#Watt').html(Math.round(Watt));
		document.getElementById("inputSP").value = SP0;
    });
    
}


//***************
// Change Setpoint
//***************
function changeSP() {
	switch ($('#selMode').val()) {
		case 'Hybrid':
			modeEnt = 0;
			break;
		case 'Heat Pump':
			modeEnt =  2;
			break;
		case 'High Demand':
			modeEnt = 3;
			break;
		case 'Standard Electric':
			modeEnt = 1;
			break;
		case 'Vacation':
			modeEnt = 4;
			break;
		default:
			modeEnt = "";
			break;
	}
	curTime = new Date().getTime();

	var SPNew = {
        Time: curTime,
		SP: $('#inputSPNew').val(),
		Mode: modeEnt,
		SP0: SP0,
//		Dehum: $('#checkDehum').prop('checked')
	};			
	fireSchedule.push(SPNew);
}

//***************
// Get chart data
//***************
function updateChart() {
	var fSP = [];
	var fT2 = [];
	var fT3a = [];
	var fT3b = [];
	var fT4 = [];
	var fT5 = [];
	var fEEV = [];
	var fUE = [];
	var fLE = [];
	var fCOMP = [];
	var fFAN = [];
	var fWatt = [];
    fireRecent.orderByChild('TimeStamp').on('child_added',function(snap) {
		now = snap.val().TimeStamp;
		fSP.push([now, snap.val().SP]);
		fT2.push([now, snap.val().T2]);
		fT3a.push([now, snap.val().T3a]);
		fT3b.push([now, snap.val().T3b]);
		fT4.push([now, snap.val().T4]);
		fT5.push([now, snap.val().T5]);
		fEEV.push([now, snap.val().EEV]);
		fUE.push([now, snap.val().UE]);
		fLE.push([now, snap.val().LE]);
		fCOMP.push([now, snap.val().Comp*0.5]);
		fFAN.push([now, snap.val().Fan*0.25]);
		fWatt.push([now, snap.val().Volt*snap.val().Amp]);
	});

    // wait 5 seconds for firebase to get the data before charting it.it
    setTimeout(function() {
		$(function () {
			Highcharts.setOptions({
				global: {
					useUTC:false
				}
			});

			$('#myChart2').highcharts({
				chart: {
					type: 'line',
					alignTicks: false,
					zoomType: 'x',
					panning: true,
					panKey: 'shift'
				},
				title: {
					text: moment().format('ll')
				},
				xAxis: {
					type: 'datetime'
				},
				yAxis: [{
					labels: {
						format: '{value}F'
					},
					title: {
						text: 'T3a, T3b, T5'
					},
				}, {// Secondary yAxis
					gridLineWidth: 0,
					title:  {
						text: 'EEV Position/Watt'
					},
					min: 0,
					max: 700,
					opposite: true
				}, {// Third yAxis
					gridLineWidth: 0,
					labels: {
						format: '{value}F'
					},
					title: {
						text: 'SP, T2, T4'
					},
					min: 50
				},{// Fourth yAxis
					gridLineWidth: 0,
					title:  {
						text: 'Heating Source On/Off'
					},
					min: 0,
					max: 4,
					opposite: true
				}],					
						
				tooltip:  {
					crosshairs: true,
					shared: true
				},
				plotOptions: {
					series:	{
						animation: false,
						fillOpacity: 0.2
					},
				},
				series: [{
					name: 'SP',
					yAxis: 2,
					color: 'orangered',
					data: fSP
					},{
					name: 'T2',
					yAxis: 2,
					color: 'orange',
					data: fT2
					},{
					name: 'T3a',
					color: 'blue',
					data: fT3a
					},{
					name: 'T3b',
					color: 'cyan',
					data: fT3b
					},{
					name: 'T4',
					color: 'red',
					yAxis: 2,
					data: fT4
					},{
					name: 'T5',
					color: 'olive',
					data: fT5
					},{
					name: 'EEV',
					yAxis: 1,
					color: 'grey',
					data: fEEV
					},{
					name: 'UE',
					yAxis: 3,
					color: '#FF0000',
					data: fUE,
					type: 'area'
					},{
					name: 'LE',
					yAxis: 3,
					color: '#FFFF00',
					data: fLE,
					type: 'area'
					},{
					name: 'COMP',
					yAxis: 3,
					color: '#40FF00',
					data: fCOMP,
					type: 'area'
					},{
					name: 'FAN',
					yAxis: 3,
					color: '#7FFFD4',
					data: fFAN,
					type: 'area'
					},{
					name: 'Watt',
					yAxis: 1,
					color: 'black',
					data: fWatt
				}]
			});
		});        
    }, 5000);
}
