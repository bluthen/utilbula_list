import {observable, toJS} from "mobx";
import uuidv4 from 'uuid/v4';


const state = observable({
    client_id: uuidv4(),
    text: "",
    id: -1,
    title: "",
    list: {},
    hash: "",
    oldChecks: [],
    hideText: false
});

window.debugState = state;
window.debugStateJS = function () {
    return toJS(state);
};

export default state;