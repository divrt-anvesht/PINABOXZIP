function validateBeaconDataiOS(jsonEncoded) {

    let decodedData = JSON.parse(jsonEncoded);
    let rangeContents = decodedData.beaconDataDict
    let rangeString = decodedData.rangeString
    if (firstBleHitTime === 0.0) {
        debugLog("firstBleHitTime")
        firstBleHitTime = (Date.now() - screenAppearanceTime) / 1000.0
    }
    var rangeJsonObject = {};
    rangeJsonObject.time = (Date.now() - screenAppearanceTime) / 1000.0
    var proxiBeaconData = []
    for (let newBeacon of rangeContents) {
        proxiBeaconData.push({
            "major": newBeacon.major,
            "minor": newBeacon.minor,
            "id": newBeacon.identifier
        });
    }

    rangeJsonObject[rangeString] = proxiBeaconData;
    proximityDataArray.push(rangeJsonObject);

    batteryDataDictionaryArray = decodedData.batteryDataDict
    for (let beacon of rangeContents) {
        uuid = beacon.uuid
        major = beacon.major
        minor = beacon.minor
        identifier = beacon.identifier
        range = beacon.range
        console.log("current range =" + beacon.range + " minor=" + beacon.minor)
        if (rangeData.has(beacon.minor + "*" + beacon.range)) {
            console.log("rangeData includes range =" + beacon.range + " minor=" + beacon.minor)
        } else {
            rangeData.set(beacon.minor + "*" + beacon.range, new Date().getTime())
            beaconsMap.set("" + beacon.uuid.toLowerCase() + "*" + beacon.major + "*" + beacon.minor, new Date().getTime());
            altBeaconsMap.set("" + beacon.uuid.toLowerCase() + "*" + beacon.major + "*" + beacon.minor, beacon);
            var beaconAttendance = []
            if (beaconData != null && beaconData.beaconList != null && beaconData.beaconList.length > 0) {
                for (let i = 0; i < beaconData.beaconList.length; i++) {
                    gateForBeacon.set(beaconData.beaconList[i].gateID, beaconData.beaconList[i].beaconId)
                    if (beaconsMap.has(beaconData.mmid.toLowerCase() + "*" + beaconData.beaconList[i].majorid + "*" + beaconData.beaconList[i].minorid)) {
                        if(!gateDatainitialised){
                            initGateData(beaconData.beaconList[i].entrance_id);
                        }
                        beacon1 = altBeaconsMap.get(beaconData.mmid.toLowerCase() + "*" + beaconData.beaconList[i].majorid + "*" + beaconData.beaconList[i].minorid);
                    if (beaconData.beaconList[i].isPedestrian != null && beaconData.beaconList[i].isPedestrian.localeCompare("1") === 0) {
                        /*
                         * Beacons if related to pedestrian are found
                         * */
                        storeBeaconIdPedestrian(beaconData.beaconList[i].beaconId);
                        showOpenButtonPedestrian();
                        hideAwaitingPedestrian();
                        
                    } else {
                            
                            if (beaconAttendance.includes(beaconData.beaconList[i].minorid)) {
                                console.log(beaconData.beaconList[i].minorid + "Already iterated through beacon list,now ignore")
                                continue;
                            }
                            beaconAttendance.push(beaconData.beaconList[i].minorid)
                            
                            if (presentButtonMode.localeCompare('-1') === 0) {
                                
                                for (let [entry, value] of maxGateData) {
                                    if (entry.includes(beaconData.beaconList[i].minorid) && entry.includes(beacon.minor)) {
                                        console.log("Weight before =" + value[0] + " " + value[1])
                                        maxGateData.set(entry, [value[0], value[1] + (rangeWeightData.get(beacon.range) * beaconData.beaconList[i].weight)]);
                                        console.log("Weight after =" + value[0] + " " + (value[1] + (rangeWeightData.get(beacon.range) * beaconData.beaconList[i].weight)))
                                        var dict = {}
                                        dict[value[0]] = (value[1] + (rangeWeightData.get(beacon.range) * beaconData.beaconList[i].weight))
                                        weightDataDict[value[0]] = dict
                                    }
                                }
                                let isReachedMinimumBeaconThreshold = checkIfReachedMinimumBeaconThreshold()
                                if (beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length <= 1) {

                                    if (bleEnabledTime === 0.0) {
                                        bleEnabledTime = (Date.now() - screenAppearanceTime) / 1000.0
                                    }

                                    debugLog("single lane BLE Detected")
                                    debugLog("Time Check: " + new Date().toUTCString())
                                    bleDetected = true;
                                    takeAction(undefined, undefined, undefined);
                                } else {
                                    if (isReachedMinimumBeaconThreshold) {
                                        beaconHits++;
                                        if (beaconHits === 1) {
                                            debugLog("gatedeciTimer")
                                            startCountDownTimer(true);
                                        } else {
                                            startCountDownTimer(false);
                                        }
                                    } else {
                                        console.log("Not reached threshold")
                                    }
                                }
                                
                            }
                        }
                    }
                }
            }
        }

    }

}

function checkIfReachedMinimumBeaconThreshold() {
    var reachedTheshold = false

    for (let [entry, value] of maxGateData) {
        let gateWeight = value[1];
        if (parseInt(gateWeight) >= parseInt(autoSelectMode.minimumBeaconThreshold)) {
            console.log("reachedTheshold" + gateWeight + "gate=" + value[0])
            reachedTheshold = true
            break;
        }
    }
    return reachedTheshold;

}


function selectGateiOS() {
    cancelled = false;
    estimateClicked = true;

    let lane1 = 1.0, lane2 = 1.0, lane3 = 1.0;

    let i = 0;
    for (let [entry, value] of maxGateData) {
        switch (i) {
            case 0:
                lane1 = value[1];
                i++;
                break;
            case 1:
                lane2 = value[1];
                i++;
                break;
            case 2:
                lane3 = value[1];
                i++;
                break;
        }
    }

    switch (beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList.length) {//beaconData.beaconConfig.lanesBeaconsMap.lanesCount
        case 1:
            delta = autoSelectMode.min_differentiation_delta;
            gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID;
            lane = 1;
            break;
        case 2:
            if (lane1 >= lane2) {
                delta = lane1 - lane2;
                gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID;
                lane = 1;
            } else {
                delta = lane2 - lane1;
                gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[1].gateID;
                lane = 2;
            }
            break;
        case 3:
            if (lane1 === 1.0) {
                delta = lane3 - lane2;
                if (lane2 >= lane3) {
                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[1].gateID;
                    lane = 2;
                } else {
                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[2].gateID;
                    lane = 3;
                }
            } else if (lane2 === 1.0) {
                delta = lane3 - lane1;
                if (lane1 >= lane3) {
                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID;
                    lane = 1;
                } else {
                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[2].gateID;
                    lane = 3;
                }
            } else if (lane3 === 1.0) {
                if (lane1 >= lane2) {
                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID;
                    lane = 1;
                } else {
                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[1].gateID;
                    lane = 2;
                }
            } else {

                if (lane1 >= lane2 && lane1 >= lane3) {
                    if (lane2 >= lane3) {
                        delta = lane1 - lane2;
                    } else {
                        delta = lane1 - lane3;
                    }

                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[0].gateID
                    lane = 1;
                } else if (lane2 >= lane1 && lane2 >= lane3) {
                    if (lane1 >= lane3) {
                        delta = lane2 - lane1;
                    } else {
                        delta = lane2 - lane3;
                    }

                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[1].gateID;
                    lane = 2;

                } else if (lane3 >= lane2 && lane3 >= lane1) {
                    if (lane1 >= lane2) {
                        delta = lane3 - lane1;
                    } else {
                        delta = lane3 - lane2;
                    }

                    gate = beaconData.beaconConfig.lanesBeaconsMap.lanesToBeaconList[2].gateID;
                    lane = 3;
                }
            }
            break;
    }

    delta = delta > 0 ? delta : -delta;
    differentiationDelta = delta;

    if (delta != null && (delta >= autoSelectMode.min_differentiation_delta)) {//TODO cross check
        oneBeacon = '1';
        otherBeacon = '0'
    } else {
        oneBeacon = '1';
        otherBeacon = '1'
    }

}
