window.androidObj = function AndroidClass() {
};

function include(file) {

    var script = document.createElement('script');
    script.src = file;
    script.type = 'text/javascript';
    script.defer = true;

    document.getElementsByTagName('head').item(0).appendChild(script);

}

include('JSInteractionWrapper.js');
include('AndroidSpecific.js');
include('iOSSpecific.js');

/*
* Variable Declarations
* */
//const url_base = 'https://meghak2.divrt.co/';
const url_hardwareConfig = 'api/v2/getHardwareConfigByZcode';
const url_openGate = 'api/v2/openGate';
const url_decisionInfo = 'api/v2/decisionInfo';


let url_base = {
    get getURL() {
        // getter, the code executed on getting obj.propName
        if (pinaConfig.environment == "PROD") {
            return "https://pinaboxapi.divrt.co/";
        } else if (pinaConfig.environment == "TEST") {
            return "https://meghak2.divrt.co/"
        } else if (pinaConfig.environment == "UAT") {
            return "https://pinaboxapi-uat.divrt.co/"
        } else {
            return "https://pinaboxapi-dev.divrt.co/"
        }
    }
};

let loggerURL = {
    get getURL() {
        // getter, the code executed on getting obj.propName
        if (pinaConfig.environment == "PROD") {
            return "https://loggerapi.divrt.co/log";
        } else if (pinaConfig.environment == "UAT") {
            return "https://loggerapi-uat.divrt.co/log"
        } else {
            return "https://loggerapi-dev.divrt.co/log";
        }
    }
};

let pinaConfig, pinaConfigParams, pinaSdkParams, pinaClientParams, pinaMiscParams;
let getBeaconListResponse, beaconData, nfcData, qrCode, autoSelectMode, garageLocation = {}, loopData = {},
    loopDetectorMqttTopic, loopDetected = false, bleDetected = false, collectDecisionData = true, beaconHits = 0,
    beaconDistanceGreaterThanRequired = true, gateDecisionDeltaSec, cancelled = false, gate,
    scanToButtonGreenDeltaSec, atleastOneBeaconLessThanOneMtr = false, thresholdTimerExecuted = false,
    gateSelected = false,
    loopDetectors = [], minGateData = new Map(), maxGateData = new Map(), gateloopData = new Map(), maxDistance,
    beaconsMap = new Map(),
    altBeaconsMap = new Map(), beaconId, delta, differentiationDelta, loopDetectorSimulation = 0, commandId,
    scanToButtonClickDeltaSec,
    outcome = "", gateForBeacon = new Map(), decisionData = {}, buttonMode, presentButtonMode = '-1',
    minorId = new Map(), minorIdDebug = new Map(), minDistance = new Map(), lastDistance = new Map(),
    rangeWeightData = new Map(),
    rangeData = new Map(), deciTime = new Map(), deciDistance = new Map(), firstDistance = new Map(),
    firstTime = new Map(), loopValues = [],
    loopList = [],
    oneBeacon = 'X', otherBeacon = 'X', myLaneLoop = 'X', otherLaneLoop = 'X', lane = -1, currentLocation = {},
    prevQRMessage = '', batteryDataDictionaryArray = [], screenAppearanceTime, proximityDataArray = [],
    weightDataDict = {}, logArray = [], debugCount = 0, logStartTime = 0.0, beaconIdPedestrian,loopEnabledTime,bleEnabledTime,
    firstBleHitTime,techType = 'BLE',bookingID,uid,gateDatainitialised = false, entrance = "", specificationType = '',refId, reloadHwAndDisplay = false;

/*
* Methods to support Pedestrian
* */

function onClickGateIssues() {
    try {
        document.getElementById("container_main").classList.add('hide');
        document.getElementById("container_gate_issues").classList.remove('hide');
    } catch (e) {
        pushException("onClickGateIssues " + e.message)
    }
}

function onClickBackGateIssues() {
    try {
        document.getElementById("container_main").classList.remove('hide');
        document.getElementById("container_gate_issues").classList.add('hide');
    } catch (e) {
        pushException("onClickBackGateIssues " + e.message)
    }
}


function onClickPedestrian() {
    try {
        document.getElementById("main_container").classList.add('hide');
        document.getElementById("container_pedestrian").classList.remove('hide');
        if (beaconData != null && beaconData.beaconList != null && beaconData.beaconList.length > 0) {
            for (let i = 0; i < beaconData.beaconList.length; i++) {
                if (beaconData.beaconList[i].isPedestrian != null && beaconData.beaconList[i].isPedestrian.localeCompare("1") === 0) {
                    storeBeaconIdPedestrian(beaconData.beaconList[i].beaconId);
                    showOpenButtonPedestrian();
                    hideAwaitingPedestrian();

                }
            }
        }
    } catch (e) {
        pushException("onClickPedestrian " + e.message)
    }
}

function onClickBackPedestrian() {
    try {
        document.getElementById("main_container").classList.remove('hide');
        document.getElementById("container_pedestrian").classList.add('hide');
    } catch (e) {
        pushException("onClickBackPedestrian " + e.message)
    }
}


function showOpenButtonPedestrian() {
    try {
        document.getElementById("move_closer_text_pedestrian").style.color = "#FFFFFF";
        document.getElementById("button_enable_pedestrian").classList.remove('hide');
    } catch (e) {
        pushException("showOpenButtonPedestrian " + e.message)
    }
}

function hideAwaitingPedestrian() {
    try {
        document.getElementById("button_ble_pedestrian").classList.add('hide');
    } catch (e) {
        pushException("hideAwaitingPedestrian " + e.message)
    }
}


function hideOpenButtonPedestrian() {
    try {
        document.getElementById("button_enable_pedestrian").classList.add('hide');
    } catch (e) {
        pushException("showOpenButtonPedestrian " + e.message)
    }
}

function showAwaitingPedestrian() {
    try {
        document.getElementById("button_ble_pedestrian").classList.remove('hide');
    } catch (e) {
        pushException("hideAwaitingPedestrian " + e.message)
    }
}

function storeBeaconIdPedestrian(beaconId) {
    beaconIdPedestrian = beaconId;
}

function onClickBLEButtonPedestrian() {
    try {
        openGatePedestrian()
    } catch (e) {
        pushException("onClickBLEButton " + e.message)
    }
}

function openGatePedestrian() {
    if (window.navigator.onLine == false) {
        alert("No network available. Please check your connection and try again")
        return
    }
    try {
        J2N_suspendClick();
        const url = url_base.getURL + url_openGate;
        showProgress(true);
        debugLog("openGatePedestrian");
        //native call
        let dataObject = JSON.stringify({
            "url": url,
            "data": {
                "beaconId": beaconIdPedestrian,
                "specification_type": specificationType,
                "pinaConfigParams": pinaConfigParams,
                "pinaClientParams": pinaClientParams,
                "pinaJSParams": pinaConfig.pinaJSParams
            },
            "jsIntent":"OPENGATEPEDESTRIAN"
        })
        J2N_fetchRequest(dataObject)
        //native call
    } catch (e) {
        showProgress(false);
        debugLog("openGatePedExcep " + e.message)
        J2N_postOnFailure("Failed to open door. Please try again");
        pushException("opeopenGatePedExcepnGate " + e.message)
    }
}

function onClickBLEButton() {
    try {
        scanToButtonClickDeltaSec = (Date.now() - scanToButtonClickDelta) / 1000.0;
        if (gate.localeCompare(beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID) === 0) {
            takeAction(1, gateForBeacon.get(gate), gate);
        } else if (beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length >= 2 && gate.localeCompare(beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[1].gateID) === 0) {
            takeAction(2, gateForBeacon.get(gate), gate);
        } else if (beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length >= 3 && gate.localeCompare(beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[2].gateID) === 0) {
            takeAction(3, gateForBeacon.get(gate), gate);
        }
    } catch (e) {
        pushException("onClickBLEButton " + e.message)
    }
}

function onClickGate1() {
    try {
        takeAction(1, gateForBeacon.get(beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID), beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID);
        scanToButtonClickDeltaSec = (Date.now() - scanToButtonClickDelta) / 1000.0;
    } catch (e) {
        pushException("onClickGate1 " + e.message)
    }
}

function onClickGate2() {
    try {
        takeAction(2, gateForBeacon.get(beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[1].gateID), beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID);
        scanToButtonClickDeltaSec = (Date.now() - scanToButtonClickDelta) / 1000.0;
    } catch (e) {
        pushException("onClickGate2 " + e.message)
    }
}

function onClickGate3() {
    try {
        takeAction(3, gateForBeacon.get(beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[2].gateID), beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID);
        scanToButtonClickDeltaSec = (Date.now() - scanToButtonClickDelta) / 1000.0;
    } catch (e) {
        pushException("onClickGate3 " + e.message)
    }
}

function onClickMoveForward() {
    try {
        document.getElementById("main_container").classList.remove('hide');
        document.getElementById("alert").classList.add('hide');
    } catch (e) {
        pushException("onClickMoveForward " + e.message)
    }
}

function onClickNFCButton() {
    J2N_startNFCScan();
}

function onClickStart() {

}

function onClickSimulate() {
}

function onClickQRButton() {
    try {
        /*
            if(currentLocation != undefined && currentLocation.lattitude != undefined){
                if(getDistanceFromLatLonInKm(garageLocation.latitude,garageLocation.longitude,currentLocation.lattitude,currentLocation.longitude) <= (qrCode.qrConfig.maxDistance/1000)){*/
        J2N_startQRScan()
        /* }else{
             showToast(qrCode.qrConfig.farAwayScan)
         }

     }else{
         showToast('Fetching location, please try again')
     }*/
    } catch (e) {
        pushException("onClickQRButton " + e.message)
    }
}


/*
* Methods to interact to html
* */

function showGateLayout() {
    try {
        document.getElementById("move_closer_text").style.color = "#FFFFFF";
        document.getElementById("multi_gate").classList.remove('hide');
        document.getElementById("left_btn").classList.remove('hide');
        document.getElementById("right_btn").classList.remove('hide');

        if (beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length > 2) {
            document.getElementById("middle_btn").classList.remove('hide');
        } else {
            document.getElementById("middle_btn").classList.add('hide');
        }

        if (getBeaconListResponse.data.isPedestrian != null && getBeaconListResponse.data.isPedestrian.localeCompare("1") === 0) {
            document.getElementById("left_btn").classList.add('hide');
        }
    } catch (e) {
        pushException("showGateLayout " + e.message)
    }
}

function hideOpenButton() {
    try {
        document.getElementById("button_enable").classList.add('hide');
    } catch (e) {
        pushException("hideOpenButton " + e.message)
    }
}

function hideGateLayout() {
    try {
        document.getElementById("multi_gate").classList.add('hide');

        document.getElementById("left_btn").classList.innerHTML = "";
        document.getElementById("middle_btn").classList.innerHTML = "";
        document.getElementById("right_btn").classList.innerHTML = "";
    } catch (e) {
        pushException("hideGateLayout " + e.message)
    }
}

function showOpenButton() {
    try {
        document.getElementById("move_closer_text").style.color = "#FFFFFF";
        document.getElementById("button_enable").classList.remove('hide');
    } catch (e) {
        pushException("showOpenButton " + e.message)
    }
}

function hideAwaiting() {
    try {
        if (scanToButtonGreenDeltaSec === 0.0) {
            debugLog("Hide Awaiting")
            scanToButtonGreenDeltaSec = (Date.now() - screenAppearanceTime) / 1000.0
        }

        document.getElementById("button_ble").classList.add('hide');
    } catch (e) {
        pushException("hideAwaiting " + e.message)
    }
}

function showAwaiting() {
    try {
        document.getElementById("button_ble").classList.remove('hide');
    } catch (e) {
        pushException("showAwaiting " + e.message)
    }
}

function showSimulation() {
    if ((pinaConfigParams.simulationMode != undefined && pinaConfigParams.simulationMode)) {
        document.getElementById("simulation").classList.remove('hide');
    } else {
        document.getElementById("simulation").classList.add('hide');
    }
}

function showDevMode() {
    if (pinaConfig.environment != undefined && pinaConfig.environment.localeCompare("PROD")) {
        document.getElementById("dev").classList.remove('hide');
    }else{
        document.getElementById("dev").classList.add('hide');
    }
}

function showGateIssues() {
    if(nfcData.status == 0 && qrCode.status == 0){
        document.getElementById("gate_issues").classList.add('hide');
    }
    
    if(nfcData.status == 0){
        document.getElementById("button_nfc").classList.add('hide');
    }
    if(qrCode.status == 0){
        document.getElementById("button_qr").classList.add('hide');
    }
    
    document.getElementById("loader").classList.add('hide');
    document.getElementById("container").classList.remove('hide');
    //pedestrianback
    document.getElementById("main_container").classList.remove('hide');
    document.getElementById("container_pedestrian").classList.add('hide');
    //gateissuesback
    document.getElementById("container_main").classList.remove('hide');
    document.getElementById("container_gate_issues").classList.add('hide');
//    //unhide awaiting door
//    document.getElementById("button_enable_pedestrian").classList.add('hide');
//    document.getElementById("button_ble_pedestrian").classList.remove('hide');
}

function flushData() {
    try {
        garageLocation = {}
        loopData = {}
        loopDetected = false
        bleDetected = false;
        presentButtonMode = '-1';
        collectDecisionData = true
        beaconHits = 0
        beaconDistanceGreaterThanRequired = true
        cancelled = false
        gate = ''
        atleastOneBeaconLessThanOneMtr = false
        thresholdTimerExecuted = false
        gateSelected = false
        loopDetectors = []
        minGateData = new Map()
        maxGateData = new Map()
        gateDatainitialised = false
        gateloopData = new Map()
        beaconsMap = new Map()
        altBeaconsMap = new Map()
        loopDetectorSimulation = 0
        outcome = ""
        gateForBeacon = new Map()
        decisionData = {}
        minorId = new Map()
        minDistance = new Map()
        lastDistance = new Map()
        prevQRMessage = ''
        specificationType = ''

        scanToButtonGreenDelta = Date.now();
        scanToButtonClickDelta = Date.now();
        gateDecisionDelta = Date.now();
        screenAppearanceTime = Date.now()
        scanToButtonGreenDeltaSec = 0.0
        gateDecisionDeltaSec = 0.0
        scanToButtonClickDeltaSec = 0.0
        loopEnabledTime = 0.0
        bleEnabledTime = 0.0
        firstBleHitTime = 0.0
        bookingID = ''
        refId = ''
        uid = ''
        differentiationDelta = 0.0

        hideOpenButton()
        hideGateLayout()
        showAwaiting()
        hideOpenButtonPedestrian()
        showAwaitingPedestrian()
    } catch (e) {
        pushException("flushData " + e.message)
    }
}

function validateHardwareConfig(jsonEncoded) {
    try {
        getBeaconListResponse = JSON.parse(jsonEncoded);

        if (getBeaconListResponse != undefined) {
            initHardwareConfig()
        } else {
            getHardwareConfiguration()
        }
    } catch (e) {
        getHardwareConfiguration()
        pushException("validateHardwareConfig " + e.message)
    }
}


function prefetchHardwareConfiguration(pinaConfigJson, hardwareConfigJson) {
    validatePinaConfig(pinaConfigJson)
    if (hardwareConfigJson != undefined) {
        getBeaconListResponse = JSON.parse(hardwareConfigJson)
        initHardwareConfig();
        J2N_printLog(`~cachedHardWareConfigruation`);
    } else {
        //false --> do not load the dispalywebview after hwconfig response
        getHardwareConfiguration(false);
    }

}

function initSDKMethods() {

    if (getBeaconListResponse != undefined && pinaConfig.pinaConfigParams.gateType == getBeaconListResponse.data.type) {
        let loopData = {};
        loopData.serverUri = "tcp://mqtts.divrt.co:1883";
        loopData.clientId = "phpMQTT-subscriber";
        loopData.userName = pinaConfig.environment == "PROD" ? "divrt-mqtt-dev":"anveshtokala";
        loopData.password = pinaConfig.environment == "PROD" ? "parking":"parking1234";
        loopData.loopDetectorMqttTopic = getBeaconListResponse.data.loopData.loopConfig.mqtt_topic;
        loopList = getBeaconListResponse.data.loopData.loopsList;
        rangeData = new Map()
        
        if (isiOS()) {
            loopData.serverUri = pinaConfig.environment == "PROD" ? "mqtts.divrt.co":"broker.mqttdashboard.com";
            J2N_startLoopScan(JSON.stringify(loopData));
            debugLog("J2N_startLoopScan")
            let arrayRangesData = beaconData.beaconConfig.ranges
            let estimoteCloudDetailsModel = beaconData.beaconConfig.estimoteCloudDetails
            let data = { "arrayRangeCount": arrayRangesData, "estimoteCloudDetailsModel": estimoteCloudDetailsModel }
            J2N_startBeaconScan(JSON.stringify(data))
            debugLog("J2N_startBeaconScan")
        }
        if ((pinaConfigParams.simulationMode != undefined && pinaConfigParams.simulationMode) || (getBeaconListResponse.data.demoGarage != undefined && getBeaconListResponse.data.demoGarage.localeCompare("1") === 0)) {
            initLoopData();
            initBeaconData();
        }
    } else {
        //true --> do load the dispalywebview after hwconfig response
        getHardwareConfiguration(true);
    }
}

function displayWebViewAndStartSDK(pinaConfigJson, hardwareConfigJson) {
    try {
//        debugLog("This is prebundle JS")
        if (pinaConfigJson != undefined) {
            let newPinaConfig = JSON.parse(pinaConfigJson)
            if (newPinaConfig.pinaConfigParams.zid != pinaConfig.pinaConfigParams.zid) {
                getBeaconListResponse = undefined
            }
            validatePinaConfig(pinaConfigJson)
        }
        if (getBeaconListResponse != undefined && hardwareConfigJson != undefined) {
            getBeaconListResponse = JSON.parse(hardwareConfigJson)
            initHardwareConfig()
        }
        if (getBeaconListResponse != undefined && getBeaconListResponse.garageConfiguredServices.beacon == false) {
            document.getElementById("main_container").classList.add('hide');
            showProgress(true);
            J2N_startQRScan()
        }
        scanToButtonGreenDeltaSec = 0.0
        gateDecisionDeltaSec = 0.0
        scanToButtonClickDeltaSec = 0.0
        loopEnabledTime = 0.0
        bleEnabledTime = 0.0
        firstBleHitTime = 0.0
        debugLog("popupappear")
        showSimulation();
        showDevMode();
        if (pinaConfig.environment == "PROD" && pinaConfigParams.simulationMode == true) {
            alert("Simulation mode is restricted in Production. Please change DIVRT environment to DEV")
            return
        }
        
        initSDKMethods()
//        setTimeout(function () {
//            if (bleDetected == false && proximityDataArray.length == 0) {
//                J2N_printLog("bleDetected" + bleDetected)
//                debugLog("bleDetected" + bleDetected)
//                debugLog("reinitSDKMethods Timer")
//                initSDKMethods()
//            }
//        }, parseFloat(getBeaconListResponse.hardwareConfigInfo.reScanTimeout) * 1000 || 5000);

    } catch (e) {
        J2N_printLog(e.message)
        pushException("displayWebViewAndStartSDK " + e.message)
    }
}

function validatePinaConfig(pinaConfigJson) {
    try {
        flushData()

        pinaConfig = JSON.parse(pinaConfigJson)
        if (isiOS()) {
            pinaConfigParams = pinaConfig.pinaConfigParams
            pinaSdkParams = pinaConfig.pinaSdkParams
            pinaClientParams = pinaConfig.pinaClientParams;
            /*pinaMiscParams = pinaConfig.pinaMiscParams.nameValuePairs;*/
        } else {
            pinaConfigParams = pinaConfig.pinaConfigParams.nameValuePairs;
            pinaSdkParams = pinaConfig.pinaSdkParams.nameValuePairs;
            pinaClientParams = pinaConfig.pinaClientParams.nameValuePairs;
            pinaMiscParams = pinaConfig.pinaMiscParams.nameValuePairs;
        }

        document.getElementById("welcome_text").innerHTML = pinaSdkParams.helpText;
        document.getElementById("move_closer_text").style.color = pinaSdkParams.gateButtonBgColor || "#F2555C";
        if (pinaConfigParams.gateType.localeCompare("IN") === 0) {
            document.getElementById("move_closer_text").innerHTML = "Move closer to the gate to enter";
        } else {
            document.getElementById("move_closer_text").innerHTML = "Move closer to the gate to exit";
        }
        //getHardwareConfiguration(); //ToDo Anvesh Do you need it here?

        showDevMode();

        if (pinaSdkParams.gateButtonBgColor != undefined) {
            var elements = document.getElementsByClassName("proceed_btn")
            var elements1 = document.getElementsByClassName("multi_gate_btn")
            var back_btn = document.getElementsByClassName("back_btn")
            var loader = document.getElementsByClassName("loader")
            for (var i = 0; i < elements.length; i++) {
                elements[i].style.background = pinaSdkParams.gateButtonBgColor;
            }
            for (var i = 0; i < elements1.length; i++) {
                elements1[i].style.background = pinaSdkParams.gateButtonBgColor;
            }
            for (var i = 0; i < back_btn.length; i++) {
                back_btn[i].style.background = pinaSdkParams.gateButtonBgColor;
            }
            for (var i = 0; i < loader.length; i++) {
                back_btn[i].style.background = pinaSdkParams.gateButtonBgColor;
            }

            document.getElementById("move_closer_text_pedestrian").style.color = pinaSdkParams.gateButtonBgColor;
            document.getElementById("move_closer_text").style.color = pinaSdkParams.gateButtonBgColor;
        }

        if (pinaSdkParams.appIconImage != undefined) {
            document.getElementById("logo").src = pinaSdkParams.appIconImage;
        } else {
            document.getElementById("logo").src = "https://static.divrt.co/images/pinabox/spp/spplogo.png";
        }

    } catch (e) {
        J2N_printLog(e.message)
        pushException("validatePinaConfig " + e.message)
    }
}


function validateLoopData(jsonEncoded) {
    try {
        const loop = JSON.parse(jsonEncoded)
        for (let i = 0; i < getBeaconListResponse.data.loopData.loopConfig.laneMqttTopics.length; i++) {
            if (loop.topic.localeCompare(getBeaconListResponse.data.loopData.loopConfig.laneMqttTopics[i].loop0Topic) === 0) {
                gateloopData.set(getBeaconListResponse.data.loopData.loopConfig.laneMqttTopics[i].gateID, loop.value)//111->1, 112->2

                if (gateDatainitialised && getBeaconListResponse.data.loopData.loopConfig.laneMqttTopics[i].entrance_id.localeCompare(entrance) === 0) {// && getBeaconListResponse.data.loopData.loopConfig.laneMqttTopics[i].entrance_id.localeCompare(entrance) === 0
                    if (loop.value === 1) {
                        loopDetected = true;
                        if (loopEnabledTime === 0.0) {
                            loopEnabledTime = (Date.now() - screenAppearanceTime) / 1000.0
                        }
                    }
                    if (presentButtonMode.toString().localeCompare('-1') === 0 && !(getBeaconListResponse.data.loopData.loopConfig.loopEnabled.localeCompare('0') === 0)) {
                        takeAction(undefined, undefined, undefined)
                    }
                }
                loop.time = returnDelta();
                loopValues.push(loop);

            }
        }
    } catch (e) {
        pushException("validateLoopData " + e.message)
    }
}

function validateLatLong(jsonEncoded) {
    try {
        const latLong = JSON.parse(jsonEncoded)
        currentLocation.latitude = latLong.latitude;
        currentLocation.longitude = latLong.longitude;
        J2N_printLog("latLong.latitude" + latLong.latitude)
        J2N_printLog("latLong.longitude" + latLong.longitude)
    } catch (e) {
        pushException("validateLatLong " + e.message)
    }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    try {
        let R = 6371;
        let dLat = deg2rad(lat2 - lat1);
        let dLon = deg2rad(lon2 - lon1);
        let a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = R * c; // Distance in KM
        return d;
    } catch (e) {
        pushException("getDistanceFromLatLonInKm " + e.message)
    }
}

function deg2rad(deg) {
    try {
        return deg * (Math.PI / 180)
    } catch (e) {
        pushException("deg2rad " + e.message)
    }
}


function validateNFC(message) {
    try {
        beaconId = message;
        techType = 'NFC';
        specificationType = '2'
        openGate()
        /*message = message.replace("en", "")
        let array = message.split("/");

        let beaconsMap = new Map();
        beaconsMap.set("" + array[2].toLowerCase() + "*" + array[3] + "*" + array[4], "" + new Date().getTime());

        let found = false;
        if (nfcData != null && nfcData.nfcList.length > 0) {
            for (let i = 0; i < nfcData.nfcList.length; i++) {
                if (beaconsMap.has(beaconData.mmid.toLowerCase() + "*" + nfcData.nfcList[i].majorid + "*" + nfcData.nfcList[i].minorid)) {
                    if (!found) {
                        found = true;
                        beaconId = nfcData.nfcList[i].beaconId;
                        techType = 'NFC';
                        openGate()
                        return;
                    }
                }
            }
        }

        if (!found) {
            J2N_postOnFailure("Wrong NFC scanned")
        }*/
    } catch (e) {
        J2N_printLog(e.message);
        J2N_postOnFailure("Wrong NFC scanned")
        pushException("validateNFC " + e.message)
    }

}


function validateQR(message) {
    try {
        if (prevQRMessage.localeCompare(message) === 0) {

        } else {
            prevQRMessage = message;
            beaconId = prevQRMessage;
            techType = 'QR';
            specificationType = '3';
            openGate()
            
            /*let array = message.split("/");

            let beaconsMap = new Map();
            beaconsMap.set("" + array[2].toLowerCase() + "*" + array[3] + "*" + array[4], "" + new Date().getTime());


            let found = false;
            if (qrCode != null && qrCode.qrList.length > 0) {
                for (let i = 0; i < qrCode.qrList.length; i++) {
                    if (beaconsMap.has(beaconData.mmid.toLowerCase() + "*" + qrCode.qrList[i].majorid + "*" + qrCode.qrList[i].minorid)) {
                        if (!found) {
                            found = true;
                            beaconId = qrCode.qrList[i].beaconId;
                            techType = 'QR';
                            openGate()
                            return;
                        }
                    }
                }
            }

            if (!found) {
                J2N_postOnFailure("Wrong code scanned, please try again")
            }*/
        }
    } catch (e) {
        J2N_printLog(e.message);
        J2N_postOnFailure("Wrong code scanned, please try again")
        pushException("validateQR " + e.message)
    }

}


/*
*
* '''''1'''''2'''''3[loopdetect]
*                   Single/multi + take action
*
* '''''1''''2''''''''3[loopNotdetect]''''''4'''''5''[loopDetect+3sec logic done]
*                                                   Single/multi + take action
* */

function takeAction(laneClicked, beaconIdTemp, gateId) {
    try {
        if ((pinaConfigParams.simulationMode != undefined && pinaConfigParams.simulationMode) || (getBeaconListResponse.data.demoGarage != undefined && getBeaconListResponse.data.demoGarage.localeCompare("1") === 0)) {
            debugLog("simulationMode=true")
            if (presentButtonMode.localeCompare('-1') === 0) {
                presentButtonMode = '1';
                isiOS() ? selectGateiOS() : selectGateAndroid();
                hideAwaiting()
                showOpenButton()
                hideGateLayout()
            } else {
                if (gateId != undefined) {
                    beaconId = beaconIdTemp;
                    openGate()
                }
            }
        } else if (gateDatainitialised) {
            if (getBeaconListResponse.data.loopData.loopConfig.loopEnabled.localeCompare('0') === 0) {
                if (presentButtonMode.localeCompare('-1') === 0) {
                    isiOS() ? selectGateiOS() : selectGateAndroid();
                    hideAwaiting()
                    // showOpenButton()
                    if (beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length > 1) {
                        showGateLayout()
                        hideOpenButton()
                    } else {
                        showOpenButton()
                        hideGateLayout()
                    }
                    presentButtonMode = '1';
                } else {
                    if (laneClicked != undefined) {
                        beaconId = beaconIdTemp;
                        openGate();
                    }
                }
            } else {
                try { //-1->Disabled 0->oepnGate 1->single 2->multi 3-> moveForward
                    beaconId = beaconIdTemp;
                    myLaneLoop = '0';
                    otherLaneLoop = '0';

                    if (presentButtonMode.localeCompare('-1') === 0 && (!loopDetected || !bleDetected)) {
                        return;
                    } else {
                        if (presentButtonMode.localeCompare('-1') === 0 && loopDetected && bleDetected) {
                            isiOS() ? selectGateiOS() : selectGateAndroid();
                        }

                        if (gateDecisionDeltaSec === 0.0) {
                            gateDecisionDeltaSec = (Date.now() - screenAppearanceTime) / 1000.0
                        }

                        let lane1LoopState = "-1";
                        let lane2LoopState = "-1";
                        let lane3LoopState = "-1";

                        let k = 0;
                        for (let [entry, value] of gateloopData) {
                            if (k === 0) {
                                lane1LoopState = "" + value;
                                k++;
                            } else if (k === 1) {
                                lane2LoopState = "" + value;
                                k++;
                            } else if (k === 2) {
                                lane3LoopState = "" + value;
                                k++;
                            }
                        }

                        let laneTemp = laneClicked != undefined ? laneClicked : lane;

                        switch (laneTemp) {
                            case 1:
                                if (lane1LoopState.localeCompare('1') === 0)
                                    myLaneLoop = 1;
                                if (lane2LoopState.localeCompare('1') === 0 || lane3LoopState.localeCompare('1') === 0)
                                    otherLaneLoop = 1
                                break;
                            case 2:
                                if (lane2LoopState.localeCompare('1') === 0)
                                    myLaneLoop = 1;
                                if (lane1LoopState.localeCompare('1') === 0 || lane3LoopState.localeCompare('1') === 0)
                                    otherLaneLoop = 1
                                break;
                            case 3:
                                if (lane3LoopState.localeCompare('1') === 0)
                                    myLaneLoop = 1;
                                if (lane1LoopState.localeCompare('1') === 0 || lane2LoopState.localeCompare('1') === 0)
                                    otherLaneLoop = 1
                                break;
                            default:
                                break;
                        }

                        let loopListData;

                        if (loopList != null && loopList.length > 0) {
                            for (let i = 0; i < loopList.length; i++) {
                                if ((loopList[i].oneBeacon.localeCompare('X') === 0 || loopList[i].oneBeacon.localeCompare(oneBeacon) === 0)
                                    && (loopList[i].otherBeacon.localeCompare('X') === 0 || loopList[i].otherBeacon.localeCompare(otherBeacon) === 0)
                                    && (loopList[i].myLaneLoop.localeCompare('X') === 0 || loopList[i].myLaneLoop.localeCompare(myLaneLoop) === 0)
                                    && (loopList[i].otherLaneLoop.localeCompare('X') === 0 || loopList[i].otherLaneLoop.localeCompare(otherLaneLoop) === 0)
                                    && (loopList[i].presentButtonMode.localeCompare(presentButtonMode) === 0)) {

                                    loopListData = loopList[i];

                                    if (outcome === "" || gateId != undefined) {
                                        if (gateId != undefined) {
                                            outcome = outcome + loopListData.outcome.replace('#', gateId);
                                        } else if (gate != undefined) {
                                            outcome = outcome + loopListData.outcome.replace('#', gate);
                                        }
                                    }

                                    switch (loopListData.action) {
                                        case '-1':
                                            presentButtonMode = loopListData.action;
                                            break;
                                        case '0':
                                            if (gateId != undefined) {
                                                openGate();
                                            }
                                            break;
                                        case '1':
                                            buttonMode = 'single'
                                            hideAwaiting()
                                            showOpenButton()
                                            hideGateLayout()
                                            presentButtonMode = loopListData.action;
                                            break;
                                        case '2':
                                            buttonMode = 'multi'
                                            hideAwaiting()
                                            showGateLayout()
                                            hideOpenButton()
                                            presentButtonMode = loopListData.action;
                                            break;
                                        case '3':
                                            document.getElementById("main_container").classList.add('hide');
                                            document.getElementById("alert").classList.remove('hide');
                                            break;
                                        default:
                                            break;
                                    }


                                    return;

                                }
                            }
                        }
                    }


                } catch (e) {
                    J2N_printLog(e.message)
                    pushException("takeAction inner " + e.message)
                }
            }
        }
    } catch (e) {
        pushException("takeAction " + e.message)
    }
}

/*
* API Calls
* */

function showProgress(flag) {
    try {
        var element = document.getElementById('loader')
        if (flag) {
            element.classList.remove('hide')
        } else {
            element.classList.add('hide')
        }
    } catch (e) {
        pushException("showProgress " + e.message)
    }
}

function getHardwareConfiguration(refreshHwConfig) {
    
    try {
        const url = url_base.getURL + url_hardwareConfig;
        showProgress(true);
        debugLog("getHardwareConfiguration")
        //native call
        let dataObject = JSON.stringify({
            "url": url,
            "data": {
                "pinaConfigParams": pinaConfigParams,
                "pinaJSParams": pinaConfig.pinaJSParams
            },
            "jsIntent":"GETHARDWARECONFIG"
        })
        J2N_fetchRequest(dataObject)
        reloadHwAndDisplay = refreshHwConfig
        //native call
    } catch (e) {
        showProgress(false);
        debugLog("gethwExcep " + e.message)
        pushException("gethwExcep " + e.message)
    }
}

function initHardwareConfig() {
    try {
        beaconData = getBeaconListResponse.data.beaconData;
        nfcData = getBeaconListResponse.data.nfcData;
        qrCode = getBeaconListResponse.data.qrData;


        /*
        * Pedestrian code
        * */

        if (getBeaconListResponse.data.isPedestrian != null && getBeaconListResponse.data.isPedestrian.localeCompare("1") === 0) {
            document.getElementById("pedestrian_flow").classList.remove('invisible');
        } else {
            document.getElementById("pedestrian_flow").classList.add('invisible');
        }

        /*
        * */

        if (isiOS()) {
            let arrayRangesData = beaconData.beaconConfig.ranges
            for (let i = 0; i < arrayRangesData.length; i++) {
                rangeWeightData.set(arrayRangesData[i].radius, arrayRangesData[i].weight)
            }
        }

        autoSelectMode = beaconData.beaconConfig.autoSelectMode;
        autoSelectMode.minimumBeaconThreshold = beaconData.beaconConfig.minimumBeaconThreshold;
        autoSelectMode.minimumSingleButtonThreshold = beaconData.beaconConfig.minimumBeaconThreshold;

        maxDistance = parseInt(qrCode.qrConfig.maxDistance);

        garageLocation.name = "Point B";
        garageLocation.latitude = parseFloat(getBeaconListResponse.data.garageLatitude);
        garageLocation.longitude = parseFloat(getBeaconListResponse.data.garageLongitude);


        //loopDetectorMqttTopic = getBeaconListResponse.data.loopData.laneMqttTopics[0].loop0Topic;
        loopDetectors = getBeaconListResponse.data.loopData.loopList;


        /*if (getBeaconListResponse.data.loopData.loopConfig.loopEnabled.localeCompare('0')) {
            let loopData = {};
            loopData.topic = getBeaconListResponse.data.loopData.loopConfig.laneMqttTopics[0].loop0Topic;
            loopData.value = 1
            getLoopData(JSON.stringify(loopData))
        }*/

        for (let i = 0; i < beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length; i++) {
            gateloopData.set(beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[i].gateID, 0);
        }


        let loopData = {};
        loopData.serverUri = "tcp://mqtts.divrt.co:1883";
        loopData.clientId = "phpMQTT-subscriber";
        loopData.userName = "divrt-mqtt-dev";
        loopData.password = "parking";
        loopData.loopDetectorMqttTopic = getBeaconListResponse.data.loopData.loopConfig.mqtt_topic;
        loopList = getBeaconListResponse.data.loopData.loopsList;
        
        showGateIssues()
    } catch (e) {
        J2N_printLog(e.message)
        pushException("initHardwareConfig " + e.message)
    }
}

function openGate() {
    if (pinaConfig.environment == "PROD" && pinaConfigParams.simulationMode == true) {
        alert("Simulation mode is restricted in Production. Please change DIVRT environment to DEV")
        return
    }
    if (window.navigator.onLine == false) {
        alert("No network available. Please check your connection and try again")
        return
    }
    try {
        J2N_suspendClick();
        const url = url_base.getURL + url_openGate;
        showProgress(true);
        debugLog("openGate")
        //native call
        let dataObject = JSON.stringify({
            "url": url,
            "data": {
                "beaconId": beaconId,
                "specification_type": specificationType,
                "pinaConfigParams": pinaConfigParams,
                "pinaClientParams": pinaClientParams,
                "pinaJSParams": pinaConfig.pinaJSParams
            },
            "jsIntent":"OPENGATE"
        })
        J2N_fetchRequest(dataObject)
        //native call
    } catch (e) {
        showProgress(false);
        debugLog("openGateExcep " + e.message)
        J2N_postOnFailure("Failed to open gate. Please try again");
        pushException("openGateExcep " + e.message)
    }
}


/*
* Post logs
* */
function pushLogs() {
    try {
        let list = [];

        for (let [entry, value] of minorId) {
            let decisionBeacons = {};
            decisionBeacons.minorID = entry;
            decisionBeacons.lastDistance = lastDistance.get(entry);
            decisionBeacons.minDistance = minDistance.get(entry);
            decisionBeacons.firstDistance = firstDistance.get(entry);
            decisionBeacons.firstTime = firstTime.get(entry);
            list.push(decisionBeacons);
        }

        if (isiOS()) {
            decisionData.beaconData = Object.values(weightDataDict);
        } else {
            decisionData.beaconData = list;
        }
        decisionData.loopData = loopValues;
        decisionData.openedGate = beaconId;
        decisionData.differentiationDelta = differentiationDelta;
        decisionData.scanToButtonGreenDelta = scanToButtonGreenDeltaSec;
        decisionData.scanToButtonClickDelta = scanToButtonClickDeltaSec;
        decisionData.dateDecisionDelta = gateDecisionDeltaSec;
        decisionData.simulation_mode= pinaConfigParams.simulationMode;

        decisionData.buttonMode = buttonMode;
        decisionData.sequenceLogs = logArray;
        decisionData.proximitydata = proximityDataArray,
        decisionData.outcome = outcome;

        decisionData.bookingID = bookingID;
        decisionData.refId = refId;
        decisionData.uid = uid;
        decisionData.gateType = pinaConfigParams.gateType;
        decisionData.ostype = pinaConfigParams.ostype;
        decisionData.zid = pinaConfigParams.zid;
        decisionData.uniqueID = pinaConfigParams.uniqueID;
        decisionData.email = parseJwt(pinaClientParams.bearerToken);
        decisionData.techType = techType;
        decisionData.firstBleHitTime = firstBleHitTime;
        decisionData.bleEnabledTime = bleEnabledTime;
        decisionData.loopEnabledTime = loopEnabledTime
        decisionData.jsversion = pinaConfig.pinaJSParams.version
        decisionData.osversion =  pinaConfigParams.osversion


        const url = url_base.getURL + url_decisionInfo

        logger()

        fetch(url, {
            method: "POST",
            body: JSON.stringify(decisionData), headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(response => {
        }).catch(e => {
            pushException("pushLogs response " + e.message)
        });
    } catch (e) {
        pushException("pushLogs " + e.message)
    }
}

function startCountDownTimer(start) {
    try {
        if (start) {
            setTimeout(function () {
                if (bleEnabledTime === 0.0) {
                    bleEnabledTime = (Date.now() - screenAppearanceTime) / 1000.0
                }
                bleDetected = true;
                thresholdTimerExecuted = true;
                takeAction(undefined, undefined, undefined);
                debugLog("Timer Ended")
            }, parseFloat(autoSelectMode.decision_time) * 1000 || 3000);
        } else {
            if (thresholdTimerExecuted) {
                takeAction(undefined, undefined, undefined);
            }
        }
    } catch (e) {
        pushException("startCountDownTimer " + e.message)
    }
}

function pushException(message) {
    debugLog("Exception"+message);
    //native call
    let dataObject = JSON.stringify({
        "url": loggerURL.getURL,
        "data": {
            "exception": message,
            "prjId": 1,
            "srcId": 4,
            "refId": refId,
            "email": parseJwt(pinaClientParams.bearerToken),
            "uid": parseInt(pinaConfig.pinaConfigParams.uid) || -1
        },
        "jsIntent":"LOGGER"
    })
    J2N_fetchRequest(dataObject)
    //native call
}

function logger() {
    //native call
    let dataObject = JSON.stringify({
        "url": loggerURL.getURL,
        "data": {
            "decisionData": decisionData,
            "prjId": 1,
            "srcId": 4,
            "refId": refId,
            "email": parseJwt(pinaClientParams.bearerToken),
            "uid": parseInt(pinaConfig.pinaConfigParams.uid) || -1
        },
        "jsIntent":"LOGGER"
    })
    J2N_fetchRequest(dataObject)
    //native call
}

/*
* Initialise Pinaconfig & call getPinaconfig, ideally Pinaconfig will be called by HAL
* */
function initPinaModel() {
    try {
        pinaConfigParams = {}
        pinaConfigParams.zid = "62276";
        pinaConfigParams.gateType = "IN"
        pinaConfigParams.secret_key = "4f3765a60e61facd73cf757d1610e8f37be26c97323290971793feaf06b06982";
        pinaConfigParams.ostype = "Android";
        pinaConfigParams.uniqueID = "PinaTest";
        //pinaConfigParams.simulationMode = true;
        pinaSdkParams = {}
        pinaSdkParams.helpText = "Thank you for visiting ABC Garage"
        pinaClientParams = {}
        pinaMiscParams = {}
        decisionData.bookingID = pinaConfigParams.orderId;
        decisionData.refId = pinaConfigParams.orderId;
        decisionData.gateType = pinaConfigParams.gateType;
        decisionData.osTypeVer = pinaConfigParams.ostype;
        decisionData.simulation = pinaConfigParams.simulationMode;
        decisionData.zid = pinaConfigParams.zid;
        decisionData.uid = pinaConfigParams.uniqueID;
        document.getElementById("welcome_text").innerHTML = pinaSdkParams.helpText;
        scanToButtonGreenDelta = Date.now();
        scanToButtonClickDelta = Date.now();
        gateDecisionDelta = Date.now();
        getHardwareConfig(undefined);
    } catch (error) {
        J2N_printLog(error.message)
    }
}

function initBeaconData() {
    try {
        setTimeout(function () {
            hideAwaiting();
            showOpenButton();
            hideGateLayout();
            presentButtonMode = '1';
            gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID;
            for (let i = 0; i < beaconData.beaconList.length; i++) {
                gateForBeacon.set(beaconData.beaconList[i].gateID, beaconData.beaconList[i].beaconId)
            }
        }, 3000);
    } catch (error) {
        J2N_printLog(error.message)
    }
}

function initLoopData() {
    /*loopData.topic = getBeaconListResponse.data.loopData.loopConfig.laneMqttTopics[0].loop0Topic;
    loopData.value = 1
    validateLoopData(JSON.stringify(loopData))*/
}

function initNFC() {
    try {
        validateNFC("divrt://5350504C-5553-434F-5250-4F524154494F/12/121")
    } catch (error) {
        J2N_printLog(error.message)
    }
}

function initQR() {
    try {
        validateQR("divrt://5350504C-5553-434F-5250-4F524154494F/30003/111")
    } catch (error) {
        J2N_printLog(error.message)
    }
}


function baseParametersProximity() {

           
            decisionData.beaconData = Object.values(weightDataDict);
            decisionData.loopData = loopValues;
            decisionData.openedGate = beaconId;
            decisionData.differentiationDelta = differentiationDelta;
            decisionData.scanToButtonGreenDelta = scanToButtonGreenDeltaSec;
            decisionData.scanToButtonClickDelta = scanToButtonClickDeltaSec;
            decisionData.dateDecisionDelta = gateDecisionDeltaSec;
            decisionData.simulation_mode= pinaConfigParams.simulationMode;

            decisionData.buttonMode = buttonMode;
            decisionData.sequenceLogs = logArray;
            decisionData.proximitydata = proximityDataArray,
            decisionData.outcome = outcome;

            decisionData.bookingID = bookingID;
            decisionData.refId = refId;
            decisionData.uid = uid;
            decisionData.gateType = pinaConfigParams.gateType;
            decisionData.ostype = pinaConfigParams.ostype;
            decisionData.zid = pinaConfigParams.zid;
            decisionData.uniqueID = pinaConfigParams.uniqueID;
            decisionData.email = parseJwt(pinaClientParams.bearerToken);
            decisionData.techType = techType;
            decisionData.firstBleHitTime = firstBleHitTime;
            decisionData.bleEnabledTime = bleEnabledTime;
            decisionData.loopEnabledTime = loopEnabledTime
            decisionData.jsversion = pinaConfig.pinaJSParams.version
            decisionData.osversion =  pinaConfigParams.osversion

    return decisionData
}

function debugLog(key, curentEvent) {
    debugCount += 1

    let currentDateTime = Date.now() / 1000

    if (debugCount == 1) {
        logStartTime = currentDateTime;

        const log = "Start time "+new Date().toUTCString();
        logArray.push(log);

    }

    const log = debugCount+ " - "+ key + " - " + parseInt(currentDateTime - logStartTime);
    logArray.push(log);

}

function returnDelta() {
    let currentDateTime = Date.now() / 1000
    if (logStartTime == 0.0) {
        logStartTime = currentDateTime;
    }
    let logtime = parseInt(currentDateTime - logStartTime)
    return logtime;
}

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1])).email;
    } catch (e) {
        return "na";
    }
};

function initGateData(entranceId) {
    try {
    entrance = entranceId;
    let gateCount = 0;
    let gateMap = [];
    for (let i = 0; i < beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length; i++) {
        if (beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[i].entrance_id.localeCompare(entranceId) === 0) {
            gateMap[gateCount] = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[i];
            gateCount++;
        } else {
            gateloopData.delete(beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[i].gateID)
        }
    }
    beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList = gateMap;

    if (beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length == 1) {
        loopList = getBeaconListResponse.data.loopData.oneList
    } else {
        loopList = getBeaconListResponse.data.loopData.nList
    }


    for (let i = 0; i < beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length; i++) {

        var key = "";
        for (var j = 0; j < beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[i].attachment_minor_ids.length; j++) {
            key = key + "*" + beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[i].attachment_minor_ids[j];
        }

        minGateData.set(key, [beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[i].gateID, 10.0]);
        maxGateData.set(key, [beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[i].gateID, 0.0]);
    }

    document.getElementById("left_btn").innerHTML = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].name;

    if (beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length > 1) {
        document.getElementById("right_btn").innerHTML = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[1].name;
    }

    if (beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length > 2) {
        document.getElementById("middle_btn").innerHTML = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[2].name;
    } else {
        document.getElementById("middle_btn").innerHTML = '';
    }

    gateDatainitialised = true;

    for (let [entry, value] of gateloopData) {
        if (value === 1) {
            loopDetected = true;
            if (loopEnabledTime === 0.0) {
                loopEnabledTime = (Date.now() - screenAppearanceTime) / 1000.0
            }
        }
    }
        } catch (e) {
        pushException("onClickGateIssues " + e.message)
    }
}

function validateFetchSuccessResponse(data, jsIntent) {
    let obj = JSON.parse(data)
    switch (jsIntent) {
        case "OPENGATE":
            showProgress(false);
            try {
                if (obj.status) {
                    showAwaiting()
                    hideGateLayout()
                    hideOpenButton()
                    document.getElementById("welcome_text").innerHTML = "";
                    document.getElementById("move_closer_text").innerHTML = "Move closer to the gate to enter";
                    document.getElementById("container").classList.add('hide');
                    document.getElementById("loader").classList.remove('hide');
                    
                    bookingID = obj.refno
                    refId = obj.refno
                    uid = obj.uid
                    pushLogs();
                    J2N_postOnSuccess(JSON.stringify(obj))
                } else {
                    J2N_printLog(JSON.stringify(obj))
                    J2N_postOnFailure(JSON.stringify(obj))
                    pushLogs();
                }
            } catch (e) {
                debugLog("openGateExcep " + e.message)
                J2N_printLog("Open Gate failure" + e.message)
                J2N_postOnFailure("Gate open failure");
                pushException("openGateExcep" + e.message)
                pushLogs();
            }
            break;
            
        case "OPENGATEPEDESTRIAN":
            showProgress(false);
            try {
                if (obj.status) {
                    showAwaiting()
                    hideGateLayout()
                    hideOpenButton()
                    
                    onClickBackPedestrian();
                    onClickBackGateIssues();
                    document.getElementById("welcome_text").innerHTML = "";
                    document.getElementById("move_closer_text").innerHTML = "Move closer to the gate to enter";
                    
                    J2N_postOnInfo("Thank you for using pedestrian access")
                    pushLogs();
                } else {
                    J2N_printLog(JSON.stringify(obj))
                    J2N_postOnFailure(JSON.stringify(obj))
                    pushLogs();
                }
            } catch (e) {
                debugLog("openGatePedExcep " + e.message)
                J2N_printLog("Open Gate failure" + e.message)
                J2N_postOnFailure("Gate open failure");
                pushException("openGatePedExcep" + e.message)
                pushLogs();
            }
            break;
            
        case "GETHARDWARECONFIG":
            showProgress(false);
            let status = !!obj.status || false
            let message = obj.message || ""
            if (status == true) {
                getBeaconListResponse = obj;
                J2N_forceJSupdate(JSON.stringify(obj))
                initHardwareConfig();
                if (reloadHwAndDisplay) {
                    displayWebViewAndStartSDK();
                } else {
                    J2N_printLog(`~latestHardWareConfigruation`);
                }
            } else {
                //alert(message)
                debugLog("hardwarfalse=", message)
            }
            break;
    }
}

function validateFetchFailureResponse(data, jsIntent) {
    showProgress(false);
    switch (jsIntent) {
        case "OPENGATE":
            debugLog("openGatefail " + data)
            J2N_postOnFailure("Failed to open gate. Please try again");
            pushException("openGatefail " + data)
            break;
        case "OPENGATEPEDESTRIAN":
            debugLog("openGatePedfail " + e.message)
            J2N_postOnFailure("Failed to open door. Please try again");
            pushException("openGatePedfail " + e.message)
            break;
        case "GETHARDWARECONFIG":
            debugLog("gethwfailure" + e.message)
            pushException("gethwfailure" + e.message)
            break;
    }
}
