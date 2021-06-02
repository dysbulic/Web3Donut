import React, {useState} from 'react'
import { initIPFS, initOrbitDB,  getDB } from '../libs/databaseLib'
import { actions, useStateValue } from '../state'

function Systems () {
  const [appState, dispatch] = useStateValue();
  const [loading, setLoading] = useState(false);

  const fetchDB = async (address, type) => {
    setLoading(true)
    console.log('opening DB ',address)
    const db = await getDB(address)
    if (db) {
      let entries
      if (db.type === 'eventlog' || db.type === 'feed')
        entries = await db.iterator({ limit: 10 }).collect().reverse()
      else if (db.type === 'counter')
        entries = [{ payload: { value: db.value } }]
      else if (db.type === 'keyvalue')
        entries = Object.keys(db.all).map(e => ({ payload: { value: {key: e, value: db.get(e)} } }))
      else if (db.type === 'docstore')
        entries = db.query(e => e !== null, {fullOp: true}).reverse()
      else
        entries = [{ payload: { value: "TODO" } }]
      if(type === 'requests'){
        dispatch({ type: actions.DBREQUESTS.SET_DBREQUESTS, db, entries })
      }else{
        dispatch({ type: actions.DB.SET_DB, db, entries })
      }
      setLoading(false)
    }else{
      console.log(address, ' couldnt be found')
    }
  }

  async function initDatabases(){
    fetchDB('/orbitdb/zdpuArkzsrwpHS7ptLh4wq6YV2HfQEKSxPZGEmfNuWw8H8QYC/DBLOGS')
    fetchDB("/orbitdb/zdpuAwtDbBCfDK7sDpxZn7Jgzj9WxfPgS8STaxWadKtnmTwrk/access.manager",'requests')
      // "/orbitdb/zdpuAyFL4s5i1LTNUsP1e6nZhUcv2uGDoMQZTRgukD1DwkmDn/Web3Donut")// old original
  }

  // useEffect(() => {
  //   fetchDB(address)
  // }, [dispatch, address]) //fetchDB as callback?

  React.useEffect(() => {

    initIPFS().then(async (ipfs) => {
      dispatch({ type: actions.SYSTEMS.SET_IPFS, ipfsStatus: 'Started'})

      initOrbitDB(ipfs).then(async (databases) => {
        dispatch({ type: actions.SYSTEMS.SET_ORBITDB, orbitdbStatus: 'Started' })

        //initDatabases
        await initDatabases()

      })
    })
  }, [dispatch])// eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
          {loading?<h3>Loading..</h3>:null}
          <div>
            <span>IPFS - </span>
            {appState.ipfsStatus === 'Started'
              ? <span>Connected</span>
              : <span>Not</span>
            }
          </div>
          <div>
            <span>OrbitDB - </span>
            {appState.orbitdbStatus === 'Started'
              ? <span>Connected</span>
              : <span>Not</span>
            }
          </div>
          <div>
            <span>Databases - </span>
            {appState.db?
              <span>Connected</span>
              : <span>Not</span>
            }{' '}
            <button onClick={()=>initDatabases()}>Update</button>
          </div>
    </div>
  )
}

export default Systems
