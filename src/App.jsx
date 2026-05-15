import { useState, useEffect } from 'react'

const ROLE_LIST = [
  "Werewolf", "Sorceress", "Wolf Cub", "Cursed", "Lycan",
  "Cupid", "Villager", "Mayor", "Doppelganger", "Guardian",
  "Diseased", "Hunter", "Priest", "Joker", "Spellcaster", "Seer"
]

const NIGHT_ORDER = [
  "Doppelganger", "Cupid", "Guardian", "Werewolf", "Wolf Cub", "Sorceress", "Seer", "Priest", "Spellcaster"
]

const ROLE_INSTRUCTIONS = {
  "Doppelganger": "Pilih satu pemain untuk ditiru perannya",
  "Cupid": "Pilih dua pemain untuk dipasangkan sebagai kekasih",
  "Guardian": "Pilih satu pemain untuk dilindungi malam ini",
  "Werewolf": "Pilih satu pemain untuk dibunuh malam ini",
  "Wolf Cub": "Bangun bersama Werewolf untuk mengetahui rekan",
  "Sorceress": "Pilih satu pemain untuk mencari tahu apakah dia Seer",
  "Seer": "Pilih satu pemain untuk dilihat perannya",
  "Priest": "Pilih 1 pemain untuk didoakan (Hanya 1x). Target Villager = Priest mati. Target Werewolf = Werewolf mati",
  "Spellcaster": "Pilih satu pemain untuk dibungkam besok pagi"
}

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
    const currentDay = forcedDay || dayCount
    const activeRoles = players.filter(p => p.isAlive).map(p => p.role)
    
    let toCall = NIGHT_ORDER.filter(role => activeRoles.includes(role))
    
    if (currentDay > 1) {
      toCall = toCall.filter(role => role !== 'Doppelganger' && role !== 'Cupid')
    }
    
    setRolesToCall(toCall)
    setCurrentRoleIndex(0)
  }

  const selectActionTarget = (role, targetName) => {
    setNightLogs(prev => ({ ...prev, [role]: targetName }))
  }

  const getInstructionText = (role) => {
    if (dayCount === 1) {
      if (role === 'Doppelganger' || role === 'Cupid') {
        return ROLE_INSTRUCTIONS[role]
      }
      return "Malam Pertama: Hanya perkenalan diri ke Host. Jangan lakukan aksi dulu."
    }
    return ROLE_INSTRUCTIONS[role] || "Bangun dan lakukan aksi"
  }

  const handleNextNight = () => {
    const nextDay = dayCount + 1
    setDayCount(nextDay)
    startNight(nextDay)
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
                <h3 style={{ color: '#aaa' }}>Sekarang Bangun:</h3>
                <h2 style={{ color: '#fff', fontSize: '2rem' }}>{rolesToCall[currentRoleIndex]}</h2>
                <p style={{ color: '#aaa', fontSize: '1.1rem' }}>{getInstructionText(rolesToCall[currentRoleIndex])}</p>
                
                <div style={{ margin: '20px 0', border: '1px solid #333', padding: '5px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#666', padding: '5px' }}>Pilih target aksi:</p>
                  {players.filter(p => p.isAlive).map((p, i) => (
                    <div 
                      key={i} 
                      onClick={() => selectActionTarget(rolesToCall[currentRoleIndex], p.name)}
                      style={{ 
                        padding: '12px', 
                        cursor: 'pointer', 
                        backgroundColor: nightLogs[rolesToCall[currentRoleIndex]] === p.name ? '#4444ff' : 'transparent',
                        borderBottom: '1px solid #222'
                      }}
                    >
                      {p.name} {nightLogs[rolesToCall[currentRoleIndex]] === p.name && '✔️'}
                    </div>
                  ))}
                </div>
                
                <button onClick={() => setCurrentRoleIndex(currentRoleIndex + 1)} style={{ width: '100%', padding: '15px', backgroundColor: '#4444ff', color: '#fff', border: 'none', cursor: 'pointer' }}>Peran Berikutnya</button>
              </div>
            ) : (
              <div>
                <h3 style={{ color: '#ff4444' }}>Ringkasan Aksi Malam:</h3>
                {Object.entries(nightLogs).map(([role, target]) => (
                  <div key={role} style={{ padding: '5px 0', fontSize: '0.9rem' }}>• {role} memilih: <b>{target}</b></div>
                ))}
                <hr style={{ borderColor: '#333', margin: '20px 0' }} />
                <p style={{ color: '#aaa', marginBottom: '10px' }}>Atur pemain yang mati:</p>
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
            <p style={{ color: '#aaa' }}>Silakan umumkan siapa yang mati dan mulai diskusi.</p>
            <div style={{ fontSize: '3.5rem', margin: '25px 0', fontWeight: 'bold' }}>{Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setIsTimerRunning(!isTimerRunning)} style={{ padding: '12px 25px', cursor: 'pointer' }}>{isTimerRunning ? 'Pause' : 'Start'}</button>
              <button onClick={() => setTimeLeft(300)} style={{ padding: '12px 25px', cursor: 'pointer' }}>Reset</button>
            </div>
            <button onClick={() => setPhase('VOTING')} style={{ width: '100%', padding: '15px', backgroundColor: '#8b0000', color: '#fff', marginTop: '40px', cursor: 'pointer', border: 'none', fontSize: '1.1rem' }}>Masuk Sesi Voting</button>
          </div>
        )}

        {phase === 'VOTING' && (
          <div>
            <h2 style={{ color: '#ff4444' }}>Sesi Voting</h2>
            <p style={{ color: '#aaa', marginBottom: '15px' }}>Klik tombol eksekusi untuk pemain yang digantung.</p>
            {players.filter(p => p.isAlive).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #222' }}>
                <span>{p.name} ({p.role})</span>
                <button onClick={() => toggleAlive(players.findIndex(orig => orig.name === p.name))} style={{ backgroundColor: '#660000', color: '#fff', cursor: 'pointer', border: 'none', padding: '5px 10px' }}>Eksekusi</button>
              </div>
            ))}
            <button onClick={handleNextNight} style={{ width: '100%', padding: '15px', backgroundColor: '#000044', color: '#fff', marginTop: '30px', cursor: 'pointer', border: '1px solid #444', fontSize: '1.1rem' }}>Lanjut Malam Berikutnya</button>
          </div>
        )}
      </div>
    </div>
  )
}