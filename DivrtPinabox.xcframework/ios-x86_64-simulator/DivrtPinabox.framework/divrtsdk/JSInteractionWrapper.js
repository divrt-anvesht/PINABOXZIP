let handler;

function isiOS() {

    let iOS = [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod'
        ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document)

    if (iOS == true) {
        handler = window.webkit.messageHandlers
    } else {
        handler = Android;
    }
    return iOS
}

function J2N_startQRScan(){
    console.log("BB")
    isiOS() ?  handler.J2N_startQRScan.postMessage("") : handler.J2N_startQRScan()
}

function J2N_startNFCScan(){
    isiOS() ?  handler.J2N_startNFCScan.postMessage("") : handler.J2N_startNFCScan()
}

function J2N_startBeaconScan(data){
    if(isiOS()) {
        handler.J2N_startBeaconScan.postMessage(data);
    }

}

function J2N_startLoopScan(data){
    isiOS() ?  handler.J2N_startLoopScan.postMessage(data) : handler.J2N_startLoopScan(data)
}

function J2N_postOnSuccess(data){
    isiOS() ? handler.J2N_postOnSuccess.postMessage(data) : handler.J2N_postOnSuccess(data)
}

function J2N_postOnFailure(data){
    isiOS() ? handler.J2N_postOnFailure.postMessage(data) : handler.J2N_postOnFailure(data)
}

function J2N_postOnInfo(data){
    isiOS() ? handler.J2N_postOnInfo.postMessage(data) : handler.J2N_postOnInfo(data)
}

function J2N_suspendClick(){
    isiOS() ? handler.J2N_suspendClick.postMessage("") : handler.J2N_suspendClick()
}

function J2N_printLog(data){
    isiOS() ? handler.J2N_printLog.postMessage(data) : handler.J2N_printLog(data)
}

function J2N_forceJSupdate(data){
    isiOS() ? handler.J2N_forceJSupdate.postMessage(data) : handler.J2N_forceJSupdate(data)
}


function J2NpostLogs(){
    debugLog("popupdism")
    let proxyJsonDict = baseParametersProximity()
    let data = JSON.stringify(proxyJsonDict)
    isiOS() ? handler.J2NpostLogs.postMessage(data) : handler.J2NpostLogs(data)
}


function N2J_postQRData(data){
    validateQR(data)
}

function N2J_postNFCData(data){
    validateNFC(data)
}

function N2J_postBeaconData(data){
    isiOS() ? validateBeaconDataiOS(data) : validateBeaconDataAndroid(data);
}

function N2J_postLoopData(data){
    validateLoopData(data)
}

function N2J_postLocationData(data){
    validateLatLong(data)
}

function N2J_init(hardwareConfig){
    isiOS() ? prefetchHardwareConfiguration(hardwareConfig) : validateHardwareConfig(hardwareConfig)
}

/*
* First method called when Webview is visible
* */
function N2J_launch(pinaConfig, hardwareConfig){
    isiOS() ? displayWebViewAndStartSDK(pinaConfig, hardwareConfig) : validatePinaConfig(pinaConfig)
    
}

function N2J_pushLogs(){
    J2NpostLogs()
}

function N2J_debugLog(message){
    debugLog(message)
}


/*
* Validations
* */

function N2J_val_launch(pinaConfig){
    validateConfig(pinaConfig)
}


function J2N_val_postOnSuccess(data){
    isiOS() ? handler.J2N_val_postOnSuccess.postMessage(data) : handler.J2N_postOnSuccess(data)
}

function J2N_val_postOnFailure(data){
    isiOS() ? handler.J2N_val_postOnFailure.postMessage(data) : handler.J2N_postOnFailure(data)
}

function J2N_val_startQRScan(){
    console.log("BB")
    isiOS() ?  handler.J2N_val_startQRScan.postMessage("") : handler.J2N_startQRScan()
}

function J2N_val_suspendClick(){
    isiOS() ? handler.J2N_val_suspendClick.postMessage("") : handler.J2N_suspendClick()
}