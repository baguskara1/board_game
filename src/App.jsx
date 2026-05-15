import { useState, useEffect } from 'react'

const ROLE_LIST = [
  "Werewolf", "Sorceress", "Wolf Cub", "Cursed", "Lycan",
  "Cupid", "Villager", "Mayor", "Doppelganger", "Guardian",
  "Diseased", "Hunter", "Priest", "Joker", "Spellcaster", "Seer"
]

const NIGHT_ORDER = [
  "Doppelganger", "Cupid", "Guardian", "Werewolf", "Wolf Cub", "Sorceress", "Seer", "Priest", "Spellcaster"
]

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
    let toCall = NIGHT_ORDER.filter(role => activeRoles.includes(role))
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
        setNightLogs(prev => ({ ...prev, [role]: `${cupidPicks[0]} & ${target}` }))
        setCupidPicks([...cupidPicks, target])
      }
    } else {
      setNightLogs(prev => ({ ...prev, [role]: target }))
    }
  }

  const getSummaryMessage = () => {
    const role = rolesToCall[currentRoleIndex]
    const target = nightLogs[role]
    if (!target && role !== "Cupid") return "Tidak ada aksi yang dilakukan."
    
    const targetPlayer = players.find(p => p.name === target)
    
    switch(role) {
      case "Doppelganger": return `Doppelganger resmi meniru ${target}. Peran akan berubah saat ${target} mati.`
      case "Cupid": return `Cupid telah memasangkan ${target} sebagai kekasih abadi.`
      case "Guardian": return `Guardian berhasil melindungi ${target} dari serangan malam ini.`
      case "Werewolf": return `Werewolf telah memutuskan untuk memangsa ${target}.`
      case "Seer": return `Seer telah melihat identitas asli ${target}. Dia adalah seorang ${targetPlayer?.role}.`
      case "Priest": 
        const isEvil = targetPlayer?.role.includes("Wolf") || targetPlayer?.role === "Sorceress"
        return isEvil ? `Doa Priest terkabul! ${target} (Werewolf) akan tewas.` : `Doa meleset! Priest akan tewas karena ${target} adalah warga baik.`
      default: return `${role} telah menggunakan kemampuannya kepada ${target}.`
    }
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

  return (
    <div style={{ backgroundColor: '#050505', color: '#d3d3d3', minHeight: '100vh', padding: '2rem', fontFamily: 'serif' }}>
      <h1 style={{ color: '#8b0000', textAlign: 'center' }}>Game Master Dashboard</h1>
      
      <div style={{ backgroundColor: '#111', padding: '2rem', borderRadius: '8px', border: '1px solid #660000', maxWidth: '600px', margin: '0 auto' }}>
        
        {phase === 'SETUP' && (
          <div>
            <h2 style={{ color: '#fff' }}>Fase Persiapan</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Nama Pemain" style={{ flex: 1, padding: '10px', backgroundColor: '#000', color: '#fff', border: '1px solid #444' }} />
              <select value={roleInput} onChange={(e) => setRoleInput(e.target.value)} style={{ padding: '10px', backgroundColor: '#000', color: '#fff', border: '1px solid #444' }}>
                {ROLE_LIST.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
              <button onClick={addPlayer} style={{ padding: '10px 20px', backgroundColor: '#660000', color: '#fff', border: 'none', cursor: 'pointer' }}>Tambah</button>
            </div>
            {players.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #222' }}>
                <span>{p.name}</span> <span style={{ color: '#ff4444' }}>{p.role}</span>
              </div>
            ))}
            {players.length > 0 && <button onClick={() => startNight(1)} style={{ width: '100%', padding: '15px', backgroundColor: '#8b0000', color: '#fff', marginTop: '20px', cursor: 'pointer' }}>Mulai Permainan</button>}
          </div>
        )}

        {phase === 'NIGHT' && (
          <div>
            <h2 style={{ color: '#4444ff' }}>Malam {dayCount}</h2>
            {currentRoleIndex < rolesToCall.length ? (
              <div style={{ padding: '20px', backgroundColor: '#000022', border: '1px solid #4444ff', borderRadius: '8px' }}>
                {!showSummary ? (
                  <>
                    <h3 style={{ color: '#aaa' }}>Sekarang Bangun:</h3>
                    <h2 style={{ color: '#fff', fontSize: '2rem' }}>{rolesToCall[currentRoleIndex]}</h2>
                    <div style={{ margin: '20px 0', border: '1px solid #333', padding: '5px' }}>
                      {players.filter(p => p.isAlive).map((p, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleAction(rolesToCall[currentRoleIndex], p.name)}
                          style={{ 
                            padding: '12px', 
                            cursor: 'pointer', 
                            backgroundColor: nightLogs[rolesToCall[currentRoleIndex]] === p.name || cupidPicks.includes(p.name) ? '#4444ff' : 'transparent',
                            borderBottom: '1px solid #222'
                          }}
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <h3 style={{ color: '#ff4444' }}>Aksi Tercatat:</h3>
                    <p style={{ fontSize: '1.3rem', lineHeight: '1.6', color: '#fff' }}>{getSummaryMessage()}</p>
                  </div>
                )}
                
                <button onClick={nextStep} style={{ width: '100%', padding: '15px', backgroundColor: '#4444ff', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  {showSummary ? 'Konfirmasi & Lanjut' : 'Peran Berikutnya'}
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ color: '#ff4444' }}>Ringkasan Malam Ini:</h3>
                {Object.entries(nightLogs).map(([role, target]) => (
                  <div key={role} style={{ padding: '5px 0', fontSize: '0.9rem' }}>• <b>{role}</b> menggunakan skill ke: <b>{target}</b></div>
                ))}
                <hr style={{ borderColor: '#333', margin: '20px 0' }} />
                {players.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #222', opacity: p.isAlive ? 1 : 0.5 }}>
                    <span style={{ textDecoration: p.isAlive ? 'none' : 'line-through' }}>{p.name} ({p.role})</span>
                    <button onClick={() => toggleAlive(i)} style={{ padding: '5px 10px', backgroundColor: p.isAlive ? '#660000' : '#222', color: '#fff', cursor: 'pointer' }}>{p.isAlive ? 'Bunuh' : 'Hidupkan'}</button>
                  </div>
                ))}
                <button onClick={() => { setPhase('DAY'); setTimeLeft(300); setIsTimerRunning(false) }} style={{ width: '100%', padding: '15px', backgroundColor: '#cccc00', color: '#000', marginTop: '20px', fontWeight: 'bold', cursor: 'pointer' }}>Lanjut ke Pagi</button>
              </div>
            )}
          </div>
        )}

        {phase === 'DAY' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#cccc00' }}>Pagi {dayCount}</h2>
            <div style={{ fontSize: '3.5rem', margin: '25px 0', fontWeight: 'bold' }}>{Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</div>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} style={{ padding: '12px 25px', cursor: 'pointer' }}>{isTimerRunning ? 'Pause' : 'Start'}</button>
            <button onClick={() => setPhase('VOTING')} style={{ width: '100%', padding: '15px', backgroundColor: '#8b0000', color: '#fff', marginTop: '40px', cursor: 'pointer', border: 'none' }}>Masuk Sesi Voting</button>
          </div>
        )}

        {phase === 'VOTING' && (
          <div>
            <h2 style={{ color: '#ff4444' }}>Sesi Voting</h2>
            {players.filter(p => p.isAlive).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #222' }}>
                <span>{p.name} ({p.role})</span>
                <button onClick={() => toggleAlive(players.findIndex(orig => orig.name === p.name))} style={{ backgroundColor: '#660000', color: '#fff', cursor: 'pointer', border: 'none' }}>Eksekusi</button>
              </div>
            ))}
            <button onClick={() => { setDayCount(dayCount + 1); startNight(dayCount + 1); }} style={{ width: '100%', padding: '15px', backgroundColor: '#000044', color: '#fff', marginTop: '30px', cursor: 'pointer' }}>Lanjut Malam Berikutnya</button>
          </div>
        )}
      </div>
    </div>
  )
}