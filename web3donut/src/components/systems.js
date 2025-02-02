import React, {useState} from 'react'
import { initIPFS, initOrbitDB,  getDB, getAllDatabases } from '../libs/databaseLib'
import { actions, useStateValue } from '../state'

function Systems () {
  const [appState, dispatch] = useStateValue();
  const [loading, setLoading] = useState(false);

  const fetchDB = async (address, type) => {
    setLoading(true)
    const db = await getDB(address)
    if (db) {
      let entries
      if (db.type === 'eventlog' || db.type === 'feed')
        entries = await db.iterator({ limit: 5 }).collect().reverse()
      else if (db.type === 'counter')
        entries = [{ payload: { value: db.value } }]
      else if (db.type === 'keyvalue')
        entries = Object.keys(db.all).map(e => ({ payload: { value: {key: e, value: db.get(e)} } }))
      else if (db.type === 'docstore')
        entries = db.query(e => e !== null, {fullOp: true}).reverse()
      else
        entries = [{ payload: { value: "TODO" } }]
    switch (type) {
      case 'access.manager':
        dispatch({ type: actions.DBGUIDE.SET_DBGUIDE, db, entries })
        break;
      case 'ipfsDAG':
        dispatch({ type: actions.DBDAGTEST.SET_DBDAGTEST, db, entries })
        break;
      case 'kvTests':
        dispatch({ type: actions.DBUSERS.SET_DBUSERS, db, entries })
        break;
      default:
        dispatch({ type: actions.DB.SET_DB, db, entries })
        break;
    }
    // console.log('DB ',type,'retrieved!  ')
    setLoading(false)
    }else{
      console.log(address, ' couldnt be found')
    }
  }



  async function initDatabases(){
    await fetchDB('/orbitdb/zdpuB2TjWHFxPnxng4EUYX3B6s67EjcfXGf2J6uFZE7PbazCF/ipfsObject', 'ipfsObject')
    await fetchDB('/orbitdb/zdpuAsWPoMa1tGvB83f8Kw17DzKnw7jQBE5NmfpFzRMJRE6Tk/ipfsDAG', 'ipfsDAG')
    await fetchDB("/orbitdb/zdpuAwtDbBCfDK7sDpxZn7Jgzj9WxfPgS8STaxWadKtnmTwrk/access.manager",'access.manager')
    await fetchDB('/orbitdb/zdpuB1HfZEqMk4Fu2M72Zef7tx3tpFJzcNdsUVCjfng6MtunB/kvTests', 'kvTests')
    }


  // useEffect(() => {
  //   fetchDB(address)
  // }, [dispatch, address]) //fetchDB as callback?

  React.useEffect(() => {

    initIPFS().then(async (ipfs) => {
      dispatch({ type: actions.SYSTEMS.SET_IPFS, ipfsStatus: 'Started'})
      // console.log(ipfs.id())
      // console.log(await ipfs.stats.repo())
      initOrbitDB(ipfs).then(async (databases) => {
        dispatch({ type: actions.SYSTEMS.SET_ORBITDB, orbitdbStatus: 'Started' })

        let publicKey = databases.identity.id;
        dispatch({type: actions.USER.SET_USER, publicKey})
        await initDatabases()
        const programs = await getAllDatabases()
        dispatch({ type: actions.PROGRAMS.SET_PROGRAMS, programs: programs.reverse() })
        dispatch({ type: actions.PROGRAMS.SET_PROGRAMS_LOADING, loading: false })

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
            <span>User:  </span>
            {appState.user?
            <span>{appState.user.slice(0,7)}..</span>
              : <span>Not connected</span>
            }
          </div>
          <div>
            <span>Databases - </span>
            {appState.db?
              <span>Connected</span>
              : <span>Not</span>
            }
              <button onClick={()=>initDatabases()}>Update</button>
          </div>
    </div>
  )
}

export default Systems
