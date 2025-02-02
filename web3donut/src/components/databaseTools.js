import React, {useState} from "react";
import { dagPreparation } from '../libs/databaseLib';
import ObjectCreator from './objectCreation';
// import {  useStateValue } from '../state'; //actions,

function DBTools(props) {
  const [open, setOpen] = useState(false);
  // const [appState] = useStateValue();//, dispatch
  const [ objectForm ,setObjectForm] = useState(false);
  const [uploadJson, setUploadJson] = useState(false);
  const [wrap, setWrap] = useState(true);

  // converge all input functions! manage different databases and inputs
  async function createEntry(key, value){
    // if (event) event.preventDefault()
    // if (value.length === 0) return
    let db = props.db;
    if(!value){
      value = document.getElementById('value').value;
    }
    if(!key){
      key = document.getElementById('key').value
    }
    if (db.type === 'eventlog') {
      let valueW;
      if (wrap){
        let wrappedCid = await dagPreparation({value:value})
        valueW = wrappedCid.toString();
        console.log('wrappedCid', valueW)
      }else{
        valueW = value;
      }
      //  Metadata of the log
      let timestamp = new Date();
      let ipfsCid = await dagPreparation({value:valueW,  timestamp:timestamp})
      // console.log(ipfsCid.toString())
      await db.add({key:key,value:ipfsCid.string})
    }else if(db.type === 'keyvalue'){
      await db.set(key,{value:value})
    }else if(db.type === 'docstore'){
      await db.put({_id:key, value:value});
    }else if(db.type === 'counter'){
      let fl
      try{
        fl = parseFloat(value)
      }catch{
        console.log('Please insert a number!')
        return
      }
      await db.inc(fl);
    }
    else{
      throw new Error('There was an error!')
    }
    // const allEntries = await db.iterator({ limit: 5 }).collect().reverse(); // iterator doesnt work for everyone
    // props.setEntries(allEntries);
    console.log('Saved!')
    setOpen(false);
  }


  async function wrapAndLog(obj){
    // const db = props.db
    let key = document.getElementById('key').value
    let cid = await dagPreparation(obj)
    console.log('cid obj',cid.toString())
    setUploadJson(false);
    createEntry(key, cid.toString())
    return cid;
  }

  async function uploadJsonDB(){
    const selectedFile = document.getElementById('fileInput').files[0];
    let obj
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    let reader = new FileReader();
    reader.readAsText(selectedFile);
    reader.onloadend = function () {
        console.log('Readed!', reader.readyState); // readyState will be 2
        if(extension === 'json'){
          obj = JSON.parse(reader.result);
        }else{
          obj = reader.result;
        }
        wrapAndLog(obj);
      };
    }

  return (
    <div>
      <button disabled={!props.canWrite} onClick={()=>setOpen(!open)}>Add to DB</button>
      <button disabled={!props.canWrite || props.db._type !== 'eventlog'} onClick={()=>setUploadJson(!uploadJson)}>Upload an object</button>
      <button disabled={!props.canWrite} onClick={()=>setObjectForm(!objectForm)}>Create an object</button>
      {open?
        <div>
        {(props.db._type === 'keyvalue' || props.db._type === 'eventlog')?
          <div>
            <input id='key' placeholder='key'></input><br />
            <input id='value' placeholder='value'></input><br />
            {props.db._type ==='eventlog'?
            <div>
            <input type='checkbox' value={wrap} checked={wrap} onChange={()=>setWrap(!wrap)}></input>Wrap value in a DAG
            </div>
            :null}
          </div>
        :null}
        {props.db._type === 'counter'?
          <input id='value' type='number' placeholder='number'></input>
        :null}

        {props.db._type === 'docstore'?
          <div>
            <input id='key' placeholder='id'></input>
            <input id='value' placeholder='value'></input><br />
            <input disabled id='query' placeholder='id(?)'></input>
            <button disabled onClick={()=>console.log('TODO! (needs input)')}>query</button>
          </div>
        :null}

        <button onClick={()=>{createEntry()}}>Add!</button>
        </div>
      :null}


      {uploadJson?
          <div>
            <input id='key' placeholder='key'></input><br />
            <input type="file"
              id="fileInput">
           </input><br />
           <input type='checkbox' value={wrap} checked={wrap} onChange={()=>setWrap(!wrap)}></input>Wrap value in a DAG
           {/*accept=".json"*/}
           <div>
            <button onClick={()=>uploadJsonDB()}>Upload!</button>
          </div>
          </div>
     :null}

     {objectForm?
       <ObjectCreator
          createEntry = {createEntry}
          wrap = {wrap}
          setWrap = {setWrap}
       />
       :null}

    </div>
  );
}

export default DBTools;
