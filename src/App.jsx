import { useState, useEffect } from 'react'

const ROLE_LIST = [
  "Werewolf", "Sorceress", "Wolf Cub", "Cursed", "Lycan",
  "Cupid", "Villager", "Mayor", "Doppelganger", "Guardian",
  "Diseased", "Hunter", "Priest", "Joker", "Spellcaster", "Seer"
]

const NIGHT_ORDER = [
  "Doppelganger", "Cupid", "Guardian", "Werewolf & Wolf Cub", "Sorceress", "Seer", "Spellcaster"
]

const TEAM_WEREWOLF = ['Werewolf', 'Wolf Cub', 'Sorceress']
const TEAM_LONERS = ['Joker']
const COLOR_WEREWOLF = 'rgb(255, 68, 68)'
const COLOR_LONERS = 'rgb(153, 50, 204)'
const COLOR_VILLAGER = 'rgb(0, 204, 102)'

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
  const [winner, setWinner] = useState(null)

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
    setPlayers([...players, { name: nameInput, role: roleInput, isAlive: true, transformedTo: null }])
    setNameInput('')
  }

  const toggleAlive = (index) => {
    const deadPlayerName = players[index].name;
    const deadPlayerRole = players[index].role;
    const isKilling = players[index].isAlive;

    const newPlayers = players.map((p, i) => {
      if (i === index) return { ...p, isAlive: !p.isAlive };
      
      // Logika Transformasi Doppelganger: Jika targetnya mati, dia berubah
      if (isKilling && p.isAlive && p.role === 'Doppelganger' && nightLogs['Doppelganger'] === deadPlayerName) {
        return { ...p, transformedTo: deadPlayerRole };
      }
      return p;
    });
    
    setPlayers(newPlayers);
  }

  const handleExecution = (index) => {
    if (players[index].role === 'Joker') {
      setWinner('JOKER')
    }
    toggleAlive(index)
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
      
      // Logika Transformasi Cursed: Jika diterkam Werewolf, langsung berubah
      if (role === "Werewolf & Wolf Cub") {
        const targetPlayer = players.find(p => p.name === target);
        if (targetPlayer?.role === "Cursed") {
            setPlayers(players.map(p => p.name === target ? { ...p, transformedTo: 'Werewolf' } : p));
        }
      }
    }
  }

  const getSummaryMessage = () => {
    const role = rolesToCall[currentRoleIndex]
    const target = nightLogs[role]
    if (!target) return "Tidak ada aksi yang dilakukan"
    
    const targetPlayer = players.find(p => p.name === target)
    
    if (role === "Doppelganger") return `Doppelganger meniru ${target}. Perannya sebagai ${targetPlayer?.role}`
    if (role === "Cupid") return `Cupid telah memasangkan ${target} sebagai kekasih`
    if (role === "Guardian") return `Guardian berhasil melindungi ${target} dari serangan malam ini`
    if (role === "Werewolf & Wolf Cub") {
      if (targetPlayer?.role === "Cursed") return `Catatan: Kawanan Werewolf menerkam ${target} (Cursed). Dia berubah menjadi Werewolf`
      return `Kawanan Werewolf telah memutuskan untuk memangsa ${target}`
    }
    if (role === "Sorceress" || role === "Seer") return `${role} melihat ${target} dengan role ${targetPlayer?.role}`
    if (role === "Spellcaster") return `Spellcaster membungkam vote kepada ${target}`
    return `${role} beraksi pada ${target}`
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

  const getRoleColor = (player) => {
    const effectiveRole = player.transformedTo || player.role;
    if (TEAM_WEREWOLF.includes(effectiveRole)) return COLOR_WEREWOLF
    if (TEAM_LONERS.includes(effectiveRole)) return COLOR_LONERS
    return COLOR_VILLAGER
  }

  const isPemainKekasih = (playerName) => {
    const combinedNames = nightLogs['Cupid'] || "";
    return combinedNames.split(' dan ').map(name => name.trim()).includes(playerName);
  }

  if (winner === 'JOKER') {
    return (
      <div style={{ backgroundColor: 'rgb(5, 5, 5)', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'serif' }}>
        <h1 style={{ color: COLOR_LONERS, fontSize: '4rem' }}>Joker Menang!</h1>
        <p>Warga telah tertipu dan mengeksekusi Joker.</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>Main Lagi</button>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'rgb(5, 5, 5)', color: 'lightgray', minHeight: '100vh', padding: '2rem', fontFamily: 'serif' }}>
      <h1 style={{ color: 'darkred', textAlign: 'center' }}>Game Master Dashboard</h1>
      
      <div style={{ backgroundColor: 'rgb(17, 17, 17)', padding: '2rem', borderRadius: '8px', border: '1px solid rgb(102, 0, 0)', maxWidth: '600px', margin: '0 auto' }}>
        
        {phase === 'SETUP' && (
          <div>
            <h2 style={{ color: 'white' }}>Fase Persiapan</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Nama Pemain" style={{ flex: 1, padding: '10px', backgroundColor: 'black', color: 'white', border: '1px solid #444' }} />
              <select value={roleInput} onChange={(e) => setRoleInput(e.target.value)} style={{ padding: '10px', backgroundColor: 'black', color: 'white', border: '1px solid #444' }}>
                {ROLE_LIST.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
              <button onClick={addPlayer} style={{ padding: '10px 20px', backgroundColor: 'rgb(102, 0, 0)', color: 'white', border: 'none', cursor: 'pointer' }}>Tambah</button>
            </div>
            {players.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #222' }}>
                <span>{p.name}</span>
                <span style={{ color: getRoleColor(p) }}>{p.role}</span>
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
                    <h3 style={{ color: 'lightgray' }}>Sekarang Bangun: {rolesToCall[currentRoleIndex]}</h3>
                    <div style={{ margin: '20px 0', border: '1px solid #333' }}>
                      {players.filter(p => p.isAlive).map((p, i) => (
                        <div key={i} onClick={() => handleAction(rolesToCall[currentRoleIndex], p.name)} style={{ padding: '12px', cursor: 'pointer', backgroundColor: nightLogs[rolesToCall[currentRoleIndex]] === p.name || cupidPicks.includes(p.name) ? 'rgb(68, 68, 255)' : 'transparent', borderBottom: '1px solid #222' }}>
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <h3 style={{ color: 'rgb(255, 68, 68)' }}>Aksi Tercatat:</h3>
                    <p style={{ fontSize: '1.2rem', color: 'white' }}>{getSummaryMessage()}</p>
                  </div>
                )}
                <button onClick={nextStep} style={{ width: '100%', padding: '15px', backgroundColor: 'rgb(68, 68, 255)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>{showSummary ? 'Konfirmasi Lanjut' : 'Peran Berikutnya'}</button>
              </div>
            ) : (
              <div>
                <h3 style={{ color: 'rgb(255, 68, 68)' }}>Ringkasan & Status Pemain:</h3>
                {players.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #222', opacity: p.isAlive ? 1 : 0.5 }}>
                    <span>
                      {p.name} ({p.role}) {p.transformedTo && <span style={{ color: 'yellow' }}>(Change to {p.transformedTo})</span>}
                      {isPemainKekasih(p.name) && <span style={{ color: 'pink', fontSize: '0.8rem' }}> ( Terikat dengan cupid)</span>}
                    </span>
                    <button onClick={() => toggleAlive(i)} style={{ padding: '5px 10px', backgroundColor: p.isAlive ? 'rgb(102, 0, 0)' : '#333', color: 'white', border: 'none', cursor: 'pointer' }}>{p.isAlive ? 'Bunuh' : 'Hidupkan'}</button>
                  </div>
                ))}
                <button onClick={() => { setPhase('DAY'); setTimeLeft(300); setIsTimerRunning(false) }} style={{ width: '100%', padding: '15px', backgroundColor: 'rgb(204, 204, 0)', color: 'black', marginTop: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Lanjut ke Pagi</button>
              </div>
            )}
          </div>
        )}

        {phase === 'DAY' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'rgb(204, 204, 0)' }}>Pagi {dayCount}</h2>
            <div style={{ fontSize: '3.5rem', margin: '20px 0' }}>{Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</div>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} style={{ padding: '10px 20px', cursor: 'pointer' }}>{isTimerRunning ? 'Pause' : 'Start'}</button>
            <button onClick={() => setPhase('VOTING')} style={{ width: '100%', padding: '15px', backgroundColor: 'darkred', color: 'white', marginTop: '40px', border: 'none', cursor: 'pointer' }}>Masuk Sesi Voting</button>
          </div>
        )}

        {phase === 'VOTING' && (
          <div>
            <h2 style={{ color: 'rgb(255, 68, 68)' }}>Sesi Voting</h2>
            {players.filter(p => p.isAlive).map((p, i) => {
              const realIdx = players.findIndex(orig => orig.name === p.name);
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #222' }}>
                  <span>
                    {p.name} ({p.role}) {p.transformedTo && <span style={{ color: 'yellow' }}>(Change to {p.transformedTo})</span>}
                    {isPemainKekasih(p.name) && <span style={{ color: 'pink', fontSize: '0.8rem' }}> ( Terikat dengan cupid)</span>}
                  </span>
                  <button onClick={() => handleExecution(realIdx)} style={{ backgroundColor: 'rgb(102, 0, 0)', color: 'white', border: 'none', padding: '5px 15px', cursor: 'pointer' }}>Eksekusi</button>
                </div>
              );
            })}
            <button onClick={() => { setDayCount(dayCount + 1); startNight(dayCount + 1) }} style={{ width: '100%', padding: '15px', backgroundColor: 'rgb(0, 0, 68)', color: 'white', marginTop: '30px', border: 'none', cursor: 'pointer' }}>Malam Berikutnya</button>
          </div>
        )}
      </div>
    </div>
  )
}