// Initialize conenction to firebase
var fireHistory =  new Firebase(firedbLink + '/history');

// DOM Ready =============================================================
$(document).ready(function() {
	//Change SP on click
	$('#btnPrevWeek').on('click',function(){
		prevWeek();
	});
	$('#btnNextWeek').on('click',function(){
		nextWeek();
	});
	$('#btnCurrentWeek').on('click',function(){
		currentWeek();
	});	
	// Get chart
//	historicalChart();
});

// Functions =============================================================

function prevWeek() {
	// check if valid date
	if ($('#inputStartWeek').val() === "") {
		inpWeek = moment().startOf('isoweek').valueOf();
	} else {
		inpWeek = (moment($('#inputStartWeek').val()).valueOf())-3600*24*7*1000;
	}
	$(function(){
		$('#inputStartWeek').val(moment(inpWeek).format('YYYY-[W]WW'));
	});
	historicalChart(inpWeek);
}

function nextWeek() {
	// check if valid date
	if ($('#inputStartWeek').val() === "") {
		inpWeek = moment().startOf('isoweek').valueOf();
	} else {
		inpWeek = (moment($('#inputStartWeek').val()).valueOf())+3600*24*7*1000;
	}
	$(function(){
		$('#inputStartWeek').val(moment(inpWeek).format('YYYY-[W]WW'));
	});
	historicalChart(inpWeek);
}

function currentWeek() {
	// check if valid date
	if ($('#inputStartWeek').val() === "") {
		inpWeek = moment().startOf('isoweek').valueOf();
	} else {
		inpWeek = (moment($('#inputStartWeek').val()).valueOf());
	}
	$(function(){
		$('#inputStartWeek').val(moment(inpWeek).format('YYYY-[W]WW'));
	});
	historicalChart(inpWeek);
}

function historicalChart(inpWeek) {
// Put a dummy chart while loading
			$('#barDailySum').highcharts({
				chart: {
					type: 'column',
					alignTicks: false
				},
				title: {
					text: 'Daily Summary for Week: '+ moment(inpWeek).format('L')
				},
				xAxis: {
					categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Tot']
				},
				yAxis: [{
					min: 0,
					max: 100,
					endOnTick: true,
					title: {
						text: 'Total Time%'
					}},{
					min: 0,
					title: {
						text: 'WHrs'
					}
				}],
				tooltip: {
					pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
					shared: true
				},
				plotOptions: {
					column: {
						stacking: 'percent'
					},
					cursor: 'pointer',
					series: {
						point: {
							events: {
								click: function() {
									dayChart(this.category,inpWeek);
								}
							}
						}
					}
				},
				series: [{
				}]
			});
	chart = $('#barDailySum').highcharts();
	chart.showLoading();
// Go get the data
	startTime = Number(inpWeek);
	endTime = startTime + 3600*1000*24*7;
	var UE = [0,0,0,0,0,0,0,0];
	var LE = [0,0,0,0,0,0,0,0];
	var Comp = [0,0,0,0,0,0,0,0];
	var Watt = [0,0,0,0,0,0,0,0];
	var WHrs = [0,0,0,0,0,0,0,0];
	var stby = [0,0,0,0,0,0,0,0];
	var stbyTot = 0;
	var UETot = 0;
	var LETot = 0;
	var CompTot = 0;
	var WHrsTot = 0;


    // retrieving data for the Week
    fireHistory.orderByChild('TimeStamp').startAt(startTime).endAt(endTime).on("child_added", function(data) {
		// compile data for each day of the week
		day = moment(data.val().TimeStamp).isoWeekday();
		UE[day] = UE[day] + data.val().UE;
		LE[day] = LE[day] + data.val().LE;
		if (data.val().LE === 0) {
			Comp[day] = Comp[day] + data.val().Comp; // only count compressor if LE is not on.
		}
		if (data.val().UE === 0 && data.val().LE === 0 && data.val().Comp === 0) {
			stby[day] = stby[day] + 1;
		}
		Watt[day] = Watt[day] + data.val().Amp * data.val().Volt;
        //console.log('retrieving data');
    });

    // Delay for 5 seconds for firebase to retrieve the data
    setTimeout(function() {

	// compile total for the week and calculate Watt Hours
	for (i=1; i<8; i++) {
		stbyTot = stbyTot + stby[i];
		UETot = UETot + UE[i];
		LETot = LETot + LE[i];
		CompTot = CompTot + Comp[i];
		WHrs[i] = 60/3600*Watt[i];
		WHrsTot = WHrsTot + WHrs[i];
	}

	// graph Daily Summary Chart
	$(function () {
		$('#barDailySum').highcharts({
				chart: {
					type: 'column',
					alignTicks: false
				},
				title: {
					text: 'Daily Summary for Week: '+ moment(inpWeek).format('L')
				},
				xAxis: {
					categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Tot']
				},
				yAxis: [{
					min: 0,
					max: 100,
					endOnTick: true,
					title: {
						text: 'Total Time%'
					}},{
					min: 0,
					title: {
						text: 'WHrs'
					}
				}],
				tooltip: {
					pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
					shared: true
				},
				plotOptions: {
					column: {
						stacking: 'percent'
					},
					cursor: 'pointer',
					series: {
						point: {
							events: {
								click: function() {
									dayChart(this.category,inpWeek);
								}
							}
						}
					}
				},
				series: [{
					name: 'Standby',
					type: 'column',
					color: 'black',
					stack: 0,
					data: [stby[1],stby[2],stby[3],stby[4],stby[5],stby[6],stby[7],stbyTot]
				}, {
					name: 'Comp',
					type: 'column',
					color: 'green',
					stack: 0,
					data: [Comp[1],Comp[2],Comp[3],Comp[4],Comp[5],Comp[6],Comp[7],CompTot]
				}, {
					name: 'LE',
					type: 'column',
					color: 'yellow',
					stack: 0,
					data: [LE[1],LE[2],LE[3],LE[4],LE[5],LE[6],LE[7],LETot]
				}, {
					name: 'UE',
					type: 'column',
					color: 'red',
					stack: 0,
					data: [UE[1],UE[2],UE[3],UE[4],UE[5],UE[6],UE[7],UETot]
				},{
					name: 'WHrs',
					type: 'line',
					yAxis: 1,
					data: [WHrs[1],WHrs[2],WHrs[3],WHrs[4],WHrs[5],WHrs[6],WHrs[7]]
				}]
			});
	});

    }, 5000);
}


// Plot detail data for a particular day
function dayChart(dayStr,inpWeek) {
	oneDay = 3600*24*1000;
	// decode the day into unix time stamp and establish day range
	switch(dayStr) {
		case 'Mon':
			startTime = inpWeek;
			endTime = startTime + oneDay;
			break;
		case 'Tue':
			startTime = inpWeek + oneDay;
			endTime = startTime + oneDay;
			break;
		case 'Wed':
			startTime = inpWeek + 2*oneDay;
			endTime = startTime + oneDay;
			break;
		case 'Thu':
			startTime = inpWeek + 3*oneDay;
			endTime = startTime + oneDay;
			break;
		case 'Fri':
			startTime = inpWeek + 4*oneDay;
			endTime = startTime + oneDay;
			break;
		case 'Sat':
			startTime = inpWeek + 5*oneDay;
			endTime = startTime + oneDay;
			break;
		case 'Sun':
			startTime = inpWeek + 6*oneDay;
			endTime = startTime + oneDay;
			break;
		case 'Tot':
			startTime = inpWeek;
			endTime = startTime + 7*oneDay;
			break;
		default:
			return;
	}
// Put some dummy chart while getting data
			$('#dayChartSum').highcharts({
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
						text: 'T3a, T3b, T5'
					},
				}, {// Secondary yAxis
					gridLineWidth: 0,
					title:  {
						text: 'EEV Position/Watts'
					},
					min: 0,
					max: 500,
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
						animation: false
					}
				},
				series: [{
				}]
			});
    //show "loading"
	chart = $('#dayChartSum').highcharts();
	chart.showLoading();

	//Start preparing the chart data
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
	// Go get the firebase daily data
   fireHistory.orderByChild('TimeStamp').startAt(startTime).endAt(endTime).on("child_added", function(data) {
			now = data.val().TimeStamp;
			fSP.push([now, data.val().SP]);
			fT2.push([now, data.val().T2]);
			fT3a.push([now, data.val().T3a]);
			fT3b.push([now, data.val().T3b]);
			fT4.push([now, data.val().T4]);
			fT5.push([now, data.val().T5]);
			fEEV.push([now, data.val().EEV]);
			fUE.push([now, data.val().UE]);
			fLE.push([now, data.val().LE]);
			fCOMP.push([now, data.val().Comp*0.5]);
			fFAN.push([now, data.val().Fan*0.25]);
			fWatt.push([now, data.val().Volt*data.val().Amp]);
   });

// wait 5 seconds for Firebase to finish
    setTimeout(function(){

		//Chart it!
		$(function () {
			Highcharts.setOptions({
				global: {
					useUTC:false
				}
			});
			$('#dayChartSum').highcharts({
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
						text: 'T3a, T3b, T5'
					},
				}, {// Secondary yAxis
					gridLineWidth: 0,
					title:  {
						text: 'EEV Position/Watts'
					},
					min: 0,
					max: 500,
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
