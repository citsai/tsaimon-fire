// Initialize conenction to firebase
var fireAlerts = new Firebase(firedbLink + '/alerts');


// DOM Ready =============================================================
$(document).ready(function() {
    //Change email to send alerts
	$('#btnChangeEmail').on('click',function(){
		changeEmail();

	//Change ALert parameters
	});
	$('#btnSubmitAlert').on('click',function(){
		submitAlert();
	});

	//Load the alert page
	alertLoad();
});

// Functions =============================================================

//Change email
function changeEmail() {
	email = $('#inputEmail').val();
	if (email.indexOf('@') > -1 && email.indexOf('.') > -1) {
		fireAlerts.child('email').set(email);
		alert('changing alert email to ' + $('#inputEmail').val());
	} else {
		alert('email not valid');
	}
}

// redraw and populate the emails and alerts that are active
function alertLoad() {
	//alert('reloading alert page');
	fireAlerts.on('value', function(snap) {
		$('#inputEmail').val(snap.val().email);
		$('#checkEnergyOver').prop('checked',snap.val().dayKwhrFlg);
		$('#inputKwhrLimit').val(snap.val().dayKwhrLmt);
		$('#checkStandbyLow').prop('checked',snap.val().dayStbyFlg);
		$('#inputStbyLimit').val(snap.val().dayStbyLmt);
		$('#checkFault').prop('checked',snap.val().errFlg);
		$('#checkModeChanged').prop('checked',snap.val().modeChgFlg);
		$('#checkSPChanged').prop('checked',snap.val().SPChgFlg);
		$('#checkElementUse').prop('checked',snap.val().htrElmntFlg);
	});
}

//Change and apply alerts
function submitAlert() {
	// do some basic checking of inputs
	if ($('#inputKWhrLimit').val() < 0 || $('#inputKWhrLimit').val() > 100) {
		alert('Invalid Daily Energy Value.  Please check.');
		return;
	}
	if ($('#inputStbyLimit').val() < 0 || $('#inputStbyLimit').val() > 100) {
		alert('Invalid Standby time%.  Please check.');
		return;
	}
	// construct alert object
	var json = {
	    email: $('#inputEmail').val(),
		dayKwhrFlg: $('#checkEnergyOver:checked').length,
		dayKwhrLmt: Number($('#inputKwhrLimit').val()),
		dayStbyFlg: $('#checkStandbyLow:checked').length,
		dayStbyLmt: Number($('#inputStbyLimit').val()),
		modeChgFlg: $('#checkModeChanged:checked').length,
		SPChgFlg: $('#checkSPChanged:checked').length,
		errFlg: $('#checkFault:checked').length,
		htrElmntFlg: $('#checkElementUse:checked').length};
	// write the values to Firebase
	fireAlerts.set(json);
	alert('Alerts has Changed Successfully!');
}
