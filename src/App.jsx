import { useState, useEffect } from 'react'

const ROLE_LIST = [
  "Werewolf", "Sorceress", "Wolf Cub", "Cursed", "Lycan",
  "Cupid", "Villager", "Mayor", "Doppelganger", "Guardian",
  "Diseased", "Hunter", "Priest", "Joker", "Spellcaster", "Seer"
]

const NIGHT_ORDER = [
  "Doppelganger", "Cupid", "Guardian", "Werewolf & Wolf Cub", "Sorceress", "Seer", "Spellcaster"
]

// Aturan Tim dan Warna
const TEAM_WEREWOLF = ['Werewolf', 'Wolf Cub', 'Sorceress'];
const TEAM_LONERS = ['Joker'];
const COLOR_WEREWOLF = 'rgb(255, 68, 68)'; // Merah
const COLOR_LONERS = 'rgb(153, 50, 204)'; // Ungu
const COLOR_VILLAGER = 'rgb(0, 204, 102)'; // Hijau

export default function App() {
  const [players, setPlayers] = useState([])
  const [nameInput, setNameInput] = useState('')
  const [roleInput, setRoleInput] = useState('Villager')
  const [phase, setPhase] = useState('SETUP')
  const [dayCount, setDayCount] = useState(1)
  const [timeLeft, setTimeLeft] = useState(300)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [rolesToCall, setRolesToCall] = useState([])
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0)
  const [nightLogs, setNightLogs] = useState({})
  const [showSummary, setShowSummary] = useState(false)
  const [cupidPicks, setCupidPicks] = useState([])

  useEffect(() => {
    let interval = null
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timeLeft])

  const addPlayer = () => {
    if (!nameInput) return
    setPlayers([...players, { name: nameInput, role: roleInput, isAlive: true }])
    setNameInput('')
  }

  const toggleAlive = (index) => {
    const newPlayers = [...players]
    newPlayers[index].isAlive = !newPlayers[index].isAlive
    setPlayers(newPlayers)
  }

  const startNight = (forcedDay) => {
    setPhase('NIGHT')
    setNightLogs({})
    setCupidPicks([])
    setShowSummary(false)
    const currentDay = forcedDay || dayCount
    const activeRoles = players.filter(p => p.isAlive).map(p => p.role)
    
    let toCall = NIGHT_ORDER.filter(role => {
      if (role === "Werewolf & Wolf Cub") {
        return activeRoles.includes("Werewolf") || activeRoles.includes("Wolf Cub")
      }
      return activeRoles.includes(role)
    })
    
    if (currentDay > 1) {
      toCall = toCall.filter(role => role !== 'Doppelganger' && role !== 'Cupid')
    }
    setRolesToCall(toCall)
    setCurrentRoleIndex(0)
  }

  const handleAction = (role, target) => {
    if (role === "Cupid") {
      if (cupidPicks.length === 0) {
        setCupidPicks([target])
      } else if (cupidPicks.length === 1 && cupidPicks[0] !== target) {
        const combinedTargets = `${cupidPicks[0]} dan ${target}`
        setNightLogs(prev => ({ ...prev, [role]: combinedTargets }))
        setCupidPicks([...cupidPicks, target])
      }
    } else {
      setNightLogs(prev => ({ ...prev, [role]: target }))
    }
  }

  const getSummaryMessage = () => {
    const role = rolesToCall[currentRoleIndex]
    const target = nightLogs[role]
    
    if (!target) {
      return "Tidak ada aksi yang dilakukan."
    }
    
    const targetPlayer = players.find(p => p.name === target)
    
    if (role === "Doppelganger") {
      return `Doppelganger meniru ${target}. Perannya sebagai ${targetPlayer?.role}.`
    }
    if (role === "Cupid") {
      return `Cupid telah memasangkan ${target} sebagai kekasih.`
    }
    if (role === "Guardian") {
      return `Guardian berhasil melindungi ${target} dari serangan malam ini.`
    }
    if (role === "Werewolf & Wolf Cub") {
      if (targetPlayer?.role === "Cursed") {
        return `Catatan Penting: Kawanan Werewolf menerkam ${target} yang merupakan Cursed. ${target} tidak mati dan sekarang terinfeksi menjadi Werewolf.`
      }
      return `Kawanan Werewolf telah memutuskan untuk memangsa ${target}.`
    }
    if (role === "Sorceress" || role === "Seer") {
      return `${role} telah menggunakan kemampuannya kepada ${target} dengan role ${targetPlayer?.role}.`
    }
    if (role === "Spellcaster") {
      return `Spellcaster telah menggunakan skillnya untuk membungkam vote kepada ${target}.`
    }
    return `${role} telah menggunakan kemampuannya kepada ${target}.`
  }

  const nextStep = () => {
    if (!showSummary) {
      setShowSummary(true)
    } else {
      setShowSummary(false)
      setCupidPicks([])
      setCurrentRoleIndex(currentRoleIndex + 1)
    }
  }

  // Fungsi Pembantu Pewarnaan
  const getRoleColor = (role) => {
    if (TEAM_WEREWOLF.includes(role)) return COLOR_WEREWOLF;
    if (TEAM_LONERS.includes(role)) return COLOR_LONERS;
    return COLOR_VILLAGER;
  };

  // Fungsi Pembantu Kekasih Cupid
  const getKekasihCupidNames = () => {
    const combinedNames = nightLogs['Cupid'];
    if (!combinedNames) return [];
    return combinedNames.split(' dan ').map(name => name.trim());
  };

  const isPemainKekasih = (playerName) => {
    return getKekasihCupidNames().includes(playerName);
  };

  return (
    <div style={{ backgroundColor: 'rgb(5, 5, 5)', color: 'lightgray', minHeight: '100vh', padding: '2rem', fontFamily: 'serif' }}>
      <h1 style={{ color: 'darkred', textAlign: 'center' }}>Game Master Dashboard</h1>
      
      <div style={{ backgroundColor: 'rgb(17, 17, 17)', padding: '2rem', borderRadius: '8px', border: '1px solid rgb(102, 0, 0)', maxWidth: '600px', margin: '0 auto' }}>
        
        {phase === 'SETUP' && (
          <div>
            <h2 style={{ color: 'white' }}>Fase Persiapan</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Nama Pemain" style={{ flex: 1, padding: '10px', backgroundColor: 'black', color: 'white', border: '1px solid rgb(68, 68, 68)' }} />
              <select value={roleInput} onChange={(e) => setRoleInput(e.target.value)} style={{ padding: '10px', backgroundColor: 'black', color: 'white', border: '1px solid rgb(68, 68, 68)' }}>
                {ROLE_LIST.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
              <button onClick={addPlayer} style={{ padding: '10px 20px', backgroundColor: 'rgb(102, 0, 0)', color: 'white', border: 'none', cursor: 'pointer' }}>Tambah</button>
            </div>
            {players.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgb(34, 34, 34)' }}>
                <span>
                  {p.name}
                  {isPemainKekasih(p.name) && (
                    <span style={{ color: 'rgb(255, 136, 170)', fontSize: '0.8rem', marginLeft: '5px' }}>( Terikat dengan cupid)</span>
                  )}
                </span>
                <span style={{ color: getRoleColor(p.role) }}>{p.role}</span>
              </div>
            ))}
            {players.length > 0 && <button onClick={() => startNight(1)} style={{ width: '100%', padding: '15px', backgroundColor: 'darkred', color: 'white', marginTop: '20px', cursor: 'pointer', border: 'none' }}>Mulai Permainan</button>}
          </div>
        )}

        {phase === 'NIGHT' && (
          <div>
            <h2 style={{ color: 'rgb(68, 68, 255)' }}>Malam {dayCount}</h2>
            {currentRoleIndex < rolesToCall.length ? (
              <div style={{ padding: '20px', backgroundColor: 'rgb(0, 0, 34)', border: '1px solid rgb(68, 68, 255)', borderRadius: '8px' }}>
                {!showSummary ? (
                  <>
                    <h3 style={{ color: 'lightgray' }}>Sekarang Bangun:</h3>
                    <h2 style={{ color: 'white', fontSize: '2rem' }}>{rolesToCall[currentRoleIndex]}</h2>
                    <div style={{ margin: '20px 0', border: '1px solid rgb(51, 51, 51)', padding: '5px' }}>
                      {players.filter(p => p.isAlive).map((p, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleAction(rolesToCall[currentRoleIndex], p.name)}
                          style={{ 
                            padding: '12px', 
                            cursor: 'pointer', 
                            backgroundColor: nightLogs[rolesToCall[currentRoleIndex]] === p.name || cupidPicks.includes(p.name) ? 'rgb(68, 68, 255)' : 'transparent',
                            borderBottom: '1px solid rgb(34, 34, 34)'
                          }}
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <h3 style={{ color: 'rgb(255, 68, 68)' }}>Aksi Tercatat:</h3>
                    <p style={{ fontSize: '1.3rem', lineHeight: '1.6', color: 'white' }}>{getSummaryMessage()}</p>
                  </div>
                )}
                
                <button onClick={nextStep} style={{ width: '100%', padding: '15px', backgroundColor: 'rgb(68, 68, 255)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  {showSummary ? 'Konfirmasi Lanjut' : 'Peran Berikutnya'}
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ color: 'rgb(255, 68, 68)' }}>Ringkasan Malam Ini:</h3>
                {Object.entries(nightLogs).map(([role, target]) => {
                  const targetP = players.find(p => p.name === target)
                  const isCursedAttacked = role === 'Werewolf & Wolf Cub' && targetP?.role === 'Cursed'
                  const isCupid = role === 'Cupid'

                  return (
                    <div key={role} style={{ padding: '5px 0', fontSize: '0.9rem' }}>
                      <b><span style={{ color: getRoleColor(role) }}>{role}</span></b> menggunakan skill ke: {target}
                      {isCursedAttacked && <div style={{ color: 'rgb(255, 255, 68)', marginTop: '5px' }}>Catatan: Target adalah Cursed. Dia terinfeksi menjadi Werewolf dan batal mati.</div>}
                      {isCupid && <div style={{ color: 'rgb(255, 136, 170)', marginTop: '5px' }}>Catatan: Mereka resmi menjadi pasangan kekasih (Terikat dengan Cupid).</div>}
                    </div>
                  )
                })}
                <div style={{ borderTop: '1px solid rgb(51, 51, 51)', margin: '20px 0' }}></div>
                {players.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgb(34, 34, 34)', opacity: p.isAlive ? 1 : 0.5 }}>
                    <span style={{ textDecoration: p.isAlive ? 'none' : 'line-through' }}>
                      {p.name}
                      {isPemainKekasih(p.name) && (
                        <span style={{ color: 'rgb(255, 136, 170)', fontSize: '0.8rem', marginLeft: '5px' }}>( Terikat dengan cupid)</span>
                      )}
                      {" "}
                      (<span style={{ color: getRoleColor(p.role) }}>{p.role}</span>)
                    </span>
                    <button onClick={() => toggleAlive(i)} style={{ padding: '5px 10px', backgroundColor: p.isAlive ? 'rgb(102, 0, 0)' : 'rgb(34, 34, 34)', color: 'white', cursor: 'pointer', border: 'none' }}>{p.isAlive ? 'Bunuh' : 'Hidupkan'}</button>
                  </div>
                ))}
                <button onClick={() => { setPhase('DAY'); setTimeLeft(300); setIsTimerRunning(false) }} style={{ width: '100%', padding: '15px', backgroundColor: 'rgb(204, 204, 0)', color: 'black', marginTop: '20px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}>Lanjut ke Pagi</button>
              </div>
            )}
          </div>
        )}

        {phase === 'DAY' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'rgb(204, 204, 0)' }}>Pagi {dayCount}</h2>
            <div style={{ fontSize: '3.5rem', margin: '25px 0', fontWeight: 'bold' }}>{Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</div>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} style={{ padding: '12px 25px', cursor: 'pointer' }}>{isTimerRunning ? 'Pause' : 'Start'}</button>
            <h3 style={{ color: 'white', marginTop: '20px' }}>Pemain Mati Hari Ini:</h3>
            {players.filter(p => !p.isAlive).length === 0 && <p style={{ color: 'lightgray' }}>Tidak ada pemain yang mati.</p>}
            {players.filter(p => !p.isAlive).map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgb(34, 34, 34)', opacity: 0.7 }}>
                  <span style={{ textDecoration: 'line-through' }}>
                    {p.name}
                    {isPemainKekasih(p.name) && (
                      <span style={{ color: 'rgb(255, 136, 170)', fontSize: '0.8rem', marginLeft: '5px' }}>( Terikat dengan cupid)</span>
                    )}
                    {" "}
                    (<span style={{ color: getRoleColor(p.role) }}>{p.role}</span>)
                  </span>
                  <p style={{ color: 'lightgray' }}>Mati</p>
                </div>
            ))}
            <button onClick={() => setPhase('VOTING')} style={{ width: '100%', padding: '15px', backgroundColor: 'darkred', color: 'white', marginTop: '40px', cursor: 'pointer', border: 'none' }}>Masuk Sesi Voting</button>
          </div>
        )}

        {phase === 'VOTING' && (
          <div>
            <h2 style={{ color: 'rgb(255, 68, 68)' }}>Sesi Voting</h2>
            {players.filter(p => p.isAlive).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgb(34, 34, 34)' }}>
                <span>
                  {p.name}
                  {isPemainKekasih(p.name) && (
                    <span style={{ color: 'rgb(255, 136, 170)', fontSize: '0.8rem', marginLeft: '5px' }}>( Terikat dengan cupid)</span>
                  )}
                  {" "}
                  (<span style={{ color: getRoleColor(p.role) }}>{p.role}</span>)
                </span>
                <button onClick={() => toggleAlive(players.findIndex(orig => orig.name === p.name))} style={{ backgroundColor: 'rgb(102, 0, 0)', color: 'white', cursor: 'pointer', border: 'none' }}>Eksekusi</button>
              </div>
            ))}
            <button onClick={() => { setDayCount(dayCount + 1); startNight(dayCount + 1) }} style={{ width: '100%', padding: '15px', backgroundColor: 'rgb(0, 0, 68)', color: 'white', marginTop: '30px', cursor: 'pointer', border: 'none' }}>Lanjut Malam Berikutnya</button>
          </div>
        )}
      </div>
    </div>
  )
}