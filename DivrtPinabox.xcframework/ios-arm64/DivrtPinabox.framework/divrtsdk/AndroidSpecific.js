function validateBeaconDataAndroid(jsonEncoded) {
    const beacon = JSON.parse(jsonEncoded)
    beaconsMap.set("" + beacon.uuid.toLowerCase() + "*" + beacon.major + "*" + beacon.minor, new Date().getTime());
    altBeaconsMap.set("" + beacon.uuid.toLowerCase() + "*" + beacon.major + "*" + beacon.minor, beacon);

    validateAvailableBeacons();
}

function validateAvailableBeacons() {
    if (beaconData != null && beaconData.beaconList != null && beaconData.beaconList.length > 0) {
        for (let i = 0; i < beaconData.beaconList.length; i++) {
            gateForBeacon.set(beaconData.beaconList[i].gateID, beaconData.beaconList[i].beaconId)
            if (beaconsMap.has(beaconData.mmid.toLowerCase() + "*" + beaconData.beaconList[i].majorid + "*" + beaconData.beaconList[i].minorid)) {

                if(!gateDatainitialised){
                    initGateData(beaconData.beaconList[i].entrance_id);
                }

                if (firstBleHitTime === 0.0) {
                    firstBleHitTime = (Date.now() - screenAppearanceTime) / 1000.0
                }

                let beacon;
                beacon = altBeaconsMap.get(beaconData.mmid.toLowerCase() + "*" + beaconData.beaconList[i].majorid + "*" + beaconData.beaconList[i].minorid);


                if(!bleDetected){
                    if (minorId.has(beaconData.beaconList[i].minorid)) {
                        lastDistance.set(beaconData.beaconList[i].minorid, beacon.distance);
                        if (minDistance.get(beaconData.beaconList[i].minorid) > beacon.distance) {
                            minDistance.set(beaconData.beaconList[i].minorid, beacon.distance);
                        }
                    } else {
                        minorId.set(beaconData.beaconList[i].minorid, beaconData.beaconList[i].minorid);
                        minDistance.set(beaconData.beaconList[i].minorid, beacon.distance);
                        lastDistance.set(beaconData.beaconList[i].minorid, beacon.distance);
                        firstDistance.set(beaconData.beaconList[i].minorid, beacon.distance);
                        firstTime.set(beaconData.beaconList[i].minorid, returnDelta());
                    }
                }

                if(!minorIdDebug.has(beaconData.beaconList[i].minorid)){
                    minorIdDebug.set(beaconData.beaconList[i].minorid, beaconData.beaconList[i].minorid);
                    debugLog(beaconData.beaconList[i].minorid)
                }

                if (beaconData.beaconList[i].isPedestrian != null && beaconData.beaconList[i].isPedestrian.localeCompare("1") === 0) {
                    /*
                    * Beacons if related to pedestrian are found
                    * */
                    storeBeaconIdPedestrian(beaconData.beaconList[i].beaconId);
                    showOpenButtonPedestrian();
                    hideAwaitingPedestrian();

                } else {

                    if (presentButtonMode.localeCompare('-1') === 0) {

                        for (let [entry, value] of minGateData) {
                            if (entry.includes(beaconData.beaconList[i].minorid)) {
                                if (value[1] > beacon.distance) {
                                    minGateData.set(entry, [value[0], beacon.distance]);
                                }
                            }
                        }

                        if (beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length <= 1) {

                            if (bleEnabledTime === 0.0) {
                                bleEnabledTime = (Date.now() - screenAppearanceTime) / 1000.0
                            }

                            debugLog("BLE Detected")
                            debugLog("Time Check: " + new Date().toUTCString())
                            bleDetected = true;
                            takeAction(undefined, undefined, undefined);
                        } else {
                            if (beacon.distance <= autoSelectMode.minimumBeaconThreshold) {
                                beaconHits++;
                                if (beaconHits === 1) {
                                    debugLog("ThresholdSuccess " + beaconData.beaconList[i].minorid + " " + beacon.distance + " " + returnDelta())
                                    debugLog("Timer Started delta: " + parseInt(autoSelectMode.decision_time) * 1000 || 5000);
                                    debugLog("Time Check: " + new Date().toUTCString())
                                    startCountDownTimer(true)
                                } else {
                                    startCountDownTimer(false)
                                }
                            } else {
                                debugLog("ThresholdFailure " + beaconData.beaconList[i].minorid + " " + beacon.distance + " " + returnDelta())
                            }

                            //if (beacon.getDistance() <= autoSelectMode.getMinimumSingleButtonThreshold()) {
                            atleastOneBeaconLessThanOneMtr = true;
                            //}
                        }

                    }

                }

            }
        }
    }
}

function selectGateAndroid() {

    delta = 0.0;
    cancelled = false;
    estimateClicked = true;

    let lane1Min = 10.0, lane2Min = 10.0, lane3Min = 10.0;

    let i = 0;
    for (let [entry, value] of minGateData) {
        switch (i) {
            case 0:
                lane1Min = value[1];
                i++;
                break;
            case 1:
                lane2Min = value[1];
                i++;
                break;
            case 2:
                lane3Min = value[1];
                i++;
                break;
        }
    }

    switch (beaconData.beaconConfig.lanesBeaconsMap.lanesCount) {
        case 1:
            delta = 10.0;
            gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID;
            lane = 1;
            break;
        case 2:
            delta = lane2Min - lane1Min;
            if (delta >= autoSelectMode.min_differentiation_delta) {
                gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID;
                lane = 1;
            } else {
                gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[1].gateID;
                lane = 2;
            }
            break;
        case 3:
            if (lane1Min === 10.0) {
                delta = lane3Min - lane2Min;
                if (delta >= autoSelectMode.min_differentiation_delta) {
                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[1].gateID;
                    lane = 2;
                } else {
                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[2].gateID;
                    lane = 3;
                }
            } else if (lane2Min === 10.0) {
                delta = lane3Min - lane1Min;
                if (delta >= autoSelectMode.min_differentiation_delta) {
                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID;
                    lane = 1;
                } else {
                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[2].gateID;
                    lane = 3;
                }
            } else if (lane3Min === 10.0) {
                delta = lane2Min - lane1Min;
                if (delta >= autoSelectMode.min_differentiation_delta) {
                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID;
                    lane = 1;
                } else {
                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[1].gateID;
                    lane = 2;
                }
            } else {

                if (lane1Min <= lane2Min && lane1Min <= lane3Min) {
                    if (lane2Min <= lane3Min) {
                        delta = lane1Min - lane2Min;
                    } else {
                        delta = lane1Min - lane3Min;
                    }

                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID
                    lane = 1;

                } else if (lane2Min <= lane1Min && lane2Min <= lane3Min) {
                    if (lane1Min < lane3Min) {
                        delta = lane2Min - lane1Min;
                    } else {
                        delta = lane2Min - lane3Min;
                    }

                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[1].gateID;
                    lane = 2;


                } else if (lane3Min <= lane2Min && lane3Min <= lane1Min) {
                    if (lane1Min <= lane2Min) {
                        delta = lane3Min - lane1Min;
                    } else {
                        delta = lane3Min - lane2Min;
                    }

                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[2].gateID;
                    lane = 3;

                }
            }
            break;
    }

    if (differentiationDelta == 0.0 && delta != 0.0) {
        differentiationDelta = delta;
    }

    if (delta != null && (delta >= autoSelectMode.min_differentiation_delta || delta <= -autoSelectMode.min_differentiation_delta) && !cancelled && atleastOneBeaconLessThanOneMtr) {//TODO cross check
        oneBeacon = '1';
        otherBeacon = '0'
    } else {
        oneBeacon = '1';
        otherBeacon = '1'
    }

}
