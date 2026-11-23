const AUTH_KEYS = require('./keys.json');

function valid(key) {
    return Object.hasOwn(AUTH_KEYS, key)
}

function valid_user(key) {
    return valid(key) && AUTH_KEYS[key].type == "user"
}

function valid_printer(key) {
    return valid(key) && AUTH_KEYS[key].type == "printer"
}

function name(key) {
    return AUTH_KEYS[key].name
}

function control_flow(key, validator, validator_err, res, callback) {
    if(validator(key)) {
        callback();
    } else {
        if(valid(key)) res.status(403).send({error: validator_err})
        else res.status(401).send({error: "IAK"}) // "IAK" => Invalid Auth Key
    }
}

// "NAU" => Not A User
const user_control_flow = (key, res, callback) => control_flow(key, valid_user, "NAU", res, callback);

// "NAP" => Not A Printer
const printer_control_flow = (key, res, callback) => control_flow(key, valid_printer, "NAP", res, callback);

module.exports = {valid_user, user_control_flow, valid_printer, printer_control_flow, name}