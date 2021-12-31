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

/*
* Variable Declarations
* */
const url_validate = 'api/v1/validate/coupon/';

let url_base = {
    get getURL() {
        // getter, the code executed on getting obj.propName
        if (pinaConfig.environment == "PROD") {
            return "https://pinaboxapi.divrt.co/";
        } else if (pinaConfig.environment == "TEST") {
            return  "https://meghak2.divrt.co/"
        } else {
            return "https://pinaboxapi-dev.divrt.co/"
        }
    }
};

let pinaConfig, pinaSdkParams, validationParams, prevQRMessage = '';

function flushData() {
    try {
        pinaConfig = {};
        pinaSdkParams = {}
        prevQRMessage = ''
    } catch (e) {
        pushException("flushData " + e.message)
    }
}

function validateConfig(pinaConfigJson) {
    try {
        flushData()

        pinaConfig = JSON.parse(pinaConfigJson)
        if (isiOS()) {
            pinaSdkParams = pinaConfig.pinaSdkParams
            validationParams = pinaConfig.validationParams
        } else {
            pinaSdkParams = pinaConfig.pinaSdkParams.nameValuePairs;
            validationParams = pinaConfig.validationParams.nameValuePairs
        }

        document.getElementById("welcome_text").innerHTML = pinaSdkParams.locationName;
        showProgress(false);
        if (pinaSdkParams.gateButtonBgColor != undefined) {
            var elements = document.getElementsByClassName("proceed_btn")
            var back_btn = document.getElementsByClassName("back_btn")
            var submit_btn = document.getElementsByClassName("submit-btn")
            var loader = document.getElementsByClassName("loader")
            for (var i = 0; i < elements.length; i++) {
                elements[i].style.background = pinaSdkParams.gateButtonBgColor;
            }
            for (var i = 0; i < back_btn.length; i++) {
                back_btn[i].style.background = pinaSdkParams.gateButtonBgColor;
            }
            for (var i = 0; i < submit_btn.length; i++) {
                submit_btn[i].style.background = pinaSdkParams.gateButtonBgColor;
            }
            for (var i = 0; i < loader.length; i++) {
                back_btn[i].style.background = pinaSdkParams.gateButtonBgColor;
            }
        }

        if (pinaSdkParams.appIconImage != undefined) {
            document.getElementById("logo").src = pinaSdkParams.appIconImage;
        } else {
            document.getElementById("logo").src = "https://static-dev.divrt.co/images/spplogo.png";
        }

    } catch (e) {
        pushException("validatePinaConfig " + e.message)
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

function onClickGateIssues() {
    try {
        document.getElementById("container_main").classList.add('hide');
        document.getElementById("container_gate_issues").classList.remove('hide');
    } catch (e) {
        pushException("onClickGateIssues " + e.message)
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

function validateQR(message) {
    try {
        if (prevQRMessage.localeCompare(message) === 0) {

        } else {
            prevQRMessage = message;
            validate(prevQRMessage)
        }
    } catch (e) {
        J2N_val_postOnFailure("Please try again")
    }
}

function onClickScanButton(){
    J2N_val_startQRScan()
}

function onClickSubmitButton(){
validate(document.getElementById("validation_code").value)
}

function validate(validationCode) {
    try {
        J2N_val_suspendClick();
        const url = url_base.getURL + url_validate + validationParams.orderId;
        showProgress(true);
        fetch(url, {
            method: "POST",
            body: JSON.stringify({
                "coupon": validationCode,
                "zid": validationParams.zid,
                "secret_key": validationParams.secret_key
            }), headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(response => {
            showProgress(false);
            response.json().then(obj => {
                try {
                    if (obj.status) {

                        J2N_val_postOnSuccess(JSON.stringify(obj))
                    } else {

                        J2N_val_postOnFailure(JSON.stringify(obj))
                    }
                } catch (e) {
                    J2N_val_postOnFailure("Validation failure");
                }

            })

        }).catch(e => {
        });
    } catch (e) {
    }
}

