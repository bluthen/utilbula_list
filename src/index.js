import "typeface-roboto";
import React from "react";
import {render} from "react-dom";
import {observer} from "mobx-react";
import {observe, toJS} from "mobx";
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import state from './State';
import Button from '@material-ui/core/Button';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import uuidv4 from 'uuid/v4';
import _ from 'lodash';


function checkedKeys(l) {
    const ret = [];
    for (let k in l) {
        if (l.hasOwnProperty(k) && l[k]) {
            ret.push(k);
        }
    }
    return ret;
}


@observer
class App extends React.Component {

    itemChange(e) {
        const checked = e.currentTarget.checked;
        const index = parseInt(e.currentTarget.value, 10);
        const keys = Object.keys(state.list);
        state.list[keys[index]] = checked;
        saveState();
    }

    titleChange(e) {
        state.title = e.currentTarget.value;
        saveState();
    }

    textChange(e) {
        const s = e.currentTarget.value;
        const ssplit = s.split("\n");
        const list = {};

        let cKeys = checkedKeys(state.list);
        console.log(cKeys);
        for (let i = 0; i < ssplit.length; i++) {
            let label = ssplit[i].trimRight();
            while(list.hasOwnProperty(label)) {
                label += '\u200C';
            }
            if (label !== '') {
                let checked = false;
                if (cKeys.includes(label)) {
                    checked = true;
                } else if (state.oldChecks.includes(label)) {
                    checked = true;
                }
                list[label] = checked;
            }
        }

        cKeys = cKeys.concat(state.oldChecks);
        console.log('cKeys2:', cKeys);
        const oldChecks = [];
        for (let i = 0; i < cKeys.length; i++) {
            const key = cKeys[i];
            if (!(key in list)) {
                oldChecks.push(key);
            }
        }
        console.log('oldChecks:', oldChecks);

        state.oldChecks.replace(oldChecks);
        state.text = s;
        state.list = list;
        saveState();
    }

    showTextClicked() {
        state.hideText = false;
    }

    hideTextClicked() {
        state.hideText = true;
    }

    newListClicked() {
        window.location.hash = "";
    }

    render() {
        const list = [];
        const keys = Object.keys(state.list);
        const pattern = /^\s*/;
        let depth = 0;
        let depthSpaceLen = 0;
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const checked = state.list[key];
            let prefix = '';
            const spaceLen = key.match(pattern)[0].length;
            if (spaceLen > 0) {
                if (spaceLen > depthSpaceLen) {
                    depth += 1;
                } else if(spaceLen < depthSpaceLen) {
                    depth -= 1;
                }
                depthSpaceLen = spaceLen;
                if (depth < 0) {
                    depth = 0;
                    depthSpaceLen = 0;
                }
            } else {
                depth = 0;
                depthSpaceLen = 0;
            }
            prefix = '';
            for (let j= 0; j < depth; j++) {
                prefix += '\u00A0\u00A0\u00A0\u00A0';
            }
            list.push(
                <FormControlLabel key={'fcllistitem' + i}
                                  control={<>{prefix}<Checkbox key={'listitem' + i} checked={checked}
                                                               onChange={this.itemChange}
                                                               value={'' + i}/></>}
                                  label={key}
                />
            )
        }

        return <>
        <CssBaseline/>
        <Container>
            <Paper square style={{paddingLeft: '3ex', paddingRight: '3ex', height: '100%'}}>
                <br/><br/>
                <Grid container>
                    <Grid item xs={state.hideText ? 12 : 6}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend"
                                       style={{'fontSize': '200%'}}>{state.title ? state.title : 'Empty Title'}&nbsp;</FormLabel>
                            {list}
                        </FormControl><br/>
                        {state.hideText &&
                        <Button color="primary" variant="contained" onClick={this.showTextClicked}>Show Text
                            List</Button>
                        }
                    </Grid>
                    {!state.hideText &&
                    <>
                    <Grid item xs={6}>
                        <TextField id="standard-basic" label="List Title" value={state.title}
                                   onChange={this.titleChange}/><br/>
                        <TextareaAutosize style={{width: '100%'}}
                                          id="filled-multiline-static"
                                          placeholder="Enter list here"
                                          rowsMin={4}
                                          value={state.text}
                                          onChange={this.textChange}
                        />
                        <br/>
                        <Button color="primary" variant="contained" onClick={this.hideTextClicked}>Hide Text
                            List</Button>
                    </Grid>
                    </>
                    }
                </Grid>
                <br/><br/>
                <Grid container>
                    <Grid item xs={12} style={{textAlign: 'center'}}>
                        <Button color="primary" variant="contained" onClick={this.newListClicked}>New List</Button>
                    </Grid>
                    <Grid item xs={12} style={{textAlign: 'center'}}>
                        Remember to bookmark or save the url if you ever want to come back to this list.
                    </Grid>
                </Grid>
                <br/><br/>
            </Paper>
        </Container>
        </>
    }
}


render(
    <App/>,
    document.getElementById('root')
);


const start_time = new Date().getTime();

const saveState = _.debounce(() => {
    const url = 'https://{lambda_code}.execute-api.us-east-1.amazonaws.com/default/make_list';
    state.id = state.id + (new Date().getTime() - start_time);
    const stateJS = toJS(state);
    return fetch(url, {
        method: 'post',
        body: JSON.stringify({
            id: stateJS.id,
            text: stateJS.text,
            title: stateJS.title,
            list: stateJS.list,
            hash: stateJS.hash,
            version: "1.0.0",
            ts: new Date().getTime()
        })
    });
}, 500);

function stateHashUpdated() {
    // Load list if there is one
    state.text = "";
    state.title = '';
    state.list = {};
    state.id = -1;
    const url = 'https://{lambda_code}.execute-api.us-east-1.amazonaws.com/default/make_list';
    return fetch(url + '?hash=' + state.hash).then((response) => {
        if (!response.ok) {
            // Must be new list?
        } else {
            return response.json().then((d) => {
                if (d.hasOwnProperty('text') && d.hasOwnProperty('title') && d.hasOwnProperty('list') && d.hasOwnProperty('id')) {
                    state.text = d.text;
                    state.title = d.title;
                    state.list = d.list;
                    state.id = d.id;
                }
            }).then(() => {
                saveState();
            });
        }
    });
}

function setHTMLTitle() {
    document.title = 'List: ' + state.title;
}

observe(state, 'hash', stateHashUpdated);
observe(state, 'title', setHTMLTitle)

function hashUpdated() {
    const hash = window.location.hash.substring(1);
    if (hash === "") {
        window.location.hash = '#' + uuidv4();
    }
    state.hash = hash;
}

window.addEventListener('hashchange', hashUpdated);
hashUpdated();
