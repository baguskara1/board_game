import { useState, useEffect } from 'react'

const ROLE_LIST = [
  "Werewolf", "Sorceress", "Wolf Cub", "Cursed", "Lycan",
  "Cupid", "Villager", "Mayor", "Doppelganger", "Guardian",
  "Diseased", "Hunter", "Priest", "Joker", "Spellcaster", "Seer"
]

const NIGHT_ORDER = [
  "Doppelganger", "Cupid", "Guardian", "Werewolf & Wolf Cub", "Sorceress", "Seer", "Spellcaster"
]

const TEAM_WEREWOLF = ['Werewolf', 'Wolf Cub', 'Sorceress', 'Cursed Werewolf']
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
  const [winner, setWinner] = useState(null)
  
  const [doppelTarget, setDoppelTarget] = useState(null)
  const [cupidPair, setCupidPair] = useState([])
  const [wwStatus, setWwStatus] = useState('NORMAL')
  const [wwPicks, setWwPicks] = useState([])
  const [hunterPrompt, setHunterPrompt] = useState(false)

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
    const deadPlayerName = players[index].name
    const deadPlayerRole = players[index].role
    const isActuallyDying = players[index].isAlive

    if (isActuallyDying && (deadPlayerRole === 'Hunter' || players[index].transformedTo === 'Hunter')) {
      setHunterPrompt(true)
    }

    const newPlayers = players.map((p, i) => {
      if (i === index) return { ...p, isAlive: !p.isAlive }
      
      if (isActuallyDying && p.isAlive && p.role === 'Doppelganger' && doppelTarget === deadPlayerName) {
        return { ...p, transformedTo: deadPlayerRole }
      }
      return p
    })
    
    setPlayers(newPlayers)
  }

  const handleExecution = (index) => {
    const p = players[index]
    if (p.role === 'Joker') {
      setWinner('JOKER')
    }
    if (p.role === 'Wolf Cub' || p.transformedTo === 'Wolf Cub') {
      setWwStatus('DOUBLE')
    }
    toggleAlive(index)
  }

  const startNight = (forcedDay) => {
    setPhase('NIGHT')
    setNightLogs({})
    setWwPicks([])
    setShowSummary(false)
    const currentDay = forcedDay || dayCount
    const activeRoles = players.filter(p => p.isAlive).map(p => p.role)
    
    let toCall = NIGHT_ORDER.filter(role => {
      if (role === "Werewolf & Wolf Cub") {
        return activeRoles.includes("Werewolf") || activeRoles.includes("Wolf Cub") || players.some(p => p.isAlive && p.transformedTo === 'Cursed Werewolf')
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
    if (role === "Werewolf & Wolf Cub") {
      if (wwStatus === 'SKIP') return
      
      let newPicks = []
      if (wwStatus === 'DOUBLE') {
        if (wwPicks.includes(target)) {
          newPicks = wwPicks.filter(p => p !== target)
        } else {
          if (wwPicks.length < 2) newPicks = [...wwPicks, target]
          else newPicks = [wwPicks[1], target]
        }
      } else {
        newPicks = wwPicks.includes(target) ? [] : [target]
      }
      
      setWwPicks(newPicks)
      
      if (newPicks.length > 0) {
        setNightLogs(prev => ({ ...prev, [role]: newPicks.join(' dan ') }))
      } else {
        const newLogs = { ...nightLogs }
        delete newLogs[role]
        setNightLogs(newLogs)
      }

      if (newPicks.includes(target)) {
        const targetPlayer = players.find(p => p.name === target)
        if (targetPlayer?.role === "Cursed") {
            setPlayers(players.map(p => p.name === target ? { ...p, transformedTo: 'Cursed Werewolf' } : p))
        }
      }
    } else {
      if (nightLogs[role] === target) {
        const newLogs = { ...nightLogs }
        delete newLogs[role]
        setNightLogs(newLogs)
      } else {
        setNightLogs(prev => ({ ...prev, [role]: target }))
      }
      
      if (role === "Doppelganger") {
        setDoppelTarget(target)
      }
    }
  }

  const getSummaryMessage = () => {
    const role = rolesToCall[currentRoleIndex]
    
    if (role === "Werewolf & Wolf Cub" && wwStatus === 'SKIP') {
      return "Kawanan Werewolf tidak bisa membunuh malam ini karena telah memakan Diseased kemarin"
    }

    const target = nightLogs[role]
    if (!target) return "Tidak ada aksi yang dilakukan"
    
    if (role === "Werewolf & Wolf Cub") {
      return `Kawanan Werewolf telah memutuskan untuk memangsa ${target}`
    }

    const targetPlayer = players.find(p => p.name === target)
    
    if (role === "Doppelganger") return `Doppelganger meniru ${target}. Perannya sebagai ${targetPlayer?.role}`
    if (role === "Cupid") return `Cupid telah menjadikan ${target} sebagai kekasihnya`
    if (role === "Guardian") return `Guardian berhasil melindungi ${target} dari serangan malam ini`
    if (role === "Sorceress" || role === "Seer") return `${role} melihat ${target} dengan role ${targetPlayer?.role}`
    if (role === "Spellcaster") return `Spellcaster membungkam vote kepada ${target}`
    return `${role} beraksi pada ${target}`
  }

  const getNightActionSummary = () => {
    const summaryList = []
    Object.entries(nightLogs).forEach(([roleKey, targetString]) => {
      let actorStr = players.filter(p => {
        if (roleKey === "Werewolf & Wolf Cub") return p.role === "Werewolf" || p.role === "Wolf Cub" || p.transformedTo === 'Cursed Werewolf'
        return p.role === roleKey || p.transformedTo === roleKey
      }).map(p => p.name).join(" dan ")

      if (!actorStr) actorStr = roleKey === "Werewolf & Wolf Cub" ? "Werewolf" : roleKey

      const targetNames = targetString.split(" dan ")
      
      targetNames.forEach(tName => {
        const targetPlayer = players.find(p => p.name === tName)
        const targetRole = targetPlayer ? (targetPlayer.transformedTo || targetPlayer.role) : "Unknown"

        if (roleKey === "Werewolf & Wolf Cub") {
          summaryList.push(`${actorStr} (Werewolf) membunuh ${tName} (${targetRole})`)
        } else if (roleKey === "Guardian") {
          summaryList.push(`${actorStr} (Guardian) melindungi ${tName} (${targetRole})`)
        } else if (roleKey === "Spellcaster") {
          summaryList.push(`${actorStr} (Spellcaster) membungkam ${tName} (${targetRole})`)
        } else if (roleKey === "Seer" || roleKey === "Sorceress") {
          summaryList.push(`${actorStr} (${roleKey}) melihat identitas ${tName} (${targetRole})`)
        } else if (roleKey === "Cupid") {
          summaryList.push(`${actorStr} (Cupid) menjadikan ${tName} (${targetRole}) sebagai kekasihnya`)
        } else if (roleKey === "Doppelganger") {
          summaryList.push(`${actorStr} (Doppelganger) meniru ${tName} (${targetRole})`)
        }
      })
    })
    return summaryList
  }

  const nextStep = () => {
    if (!showSummary) {
      setShowSummary(true)
    } else {
      const role = rolesToCall[currentRoleIndex]
      
      if (role === 'Cupid' && nightLogs['Cupid']) {
        const cupidPlayer = players.find(p => p.role === 'Cupid')
        if (cupidPlayer) {
          setCupidPair([cupidPlayer.name, nightLogs['Cupid']])
        }
      }

      setShowSummary(false)
      setCurrentRoleIndex(currentRoleIndex + 1)
    }
  }

  const goToDay = () => {
    setPhase('DAY')
    setTimeLeft(300)
    setIsTimerRunning(false)

    let nextWwStatus = 'NORMAL'
    const wwTargetsStr = nightLogs["Werewolf & Wolf Cub"] || ""
    const killedDiseased = wwTargetsStr.split(" dan ").some(name => {
      const p = players.find(x => x.name === name)
      return p && (p.role === 'Diseased' || p.transformedTo === 'Diseased')
    })
    
    if (killedDiseased) {
      nextWwStatus = 'SKIP'
    }
    
    setWwStatus(nextWwStatus)
  }

  const getBaseRoleColor = (role) => {
    if (TEAM_WEREWOLF.includes(role)) return COLOR_WEREWOLF
    if (TEAM_LONERS.includes(role)) return COLOR_LONERS
    return COLOR_VILLAGER
  }

  const getRoleColor = (player) => {
    const effectiveRole = player.transformedTo || player.role
    return getBaseRoleColor(effectiveRole)
  }

  const isPemainKekasih = (playerName) => {
    return cupidPair.includes(playerName)
  }

  const isSelectedForNightAction = (role, playerName) => {
    const targets = nightLogs[role]
    if (!targets) return false
    return targets.split(" dan ").includes(playerName)
  }

  if (winner === 'JOKER') {
    return (
      <div style={{ backgroundColor: 'rgb(5, 5, 5)', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'serif' }}>
        <h1 style={{ color: COLOR_LONERS, fontSize: '4rem' }}>Joker Menang</h1>
        <p>Warga telah tertipu dan mengeksekusi Joker</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', border: 'none' }}>Main Lagi</button>
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
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Nama Pemain" style={{ flex: 1, padding: '10px', backgroundColor: 'black', color: 'white', border: '1px solid rgb(68, 68, 68)' }} />
              <select value={roleInput} onChange={(e) => setRoleInput(e.target.value)} style={{ padding: '10px', backgroundColor: 'black', color: getBaseRoleColor(roleInput), border: '1px solid rgb(68, 68, 68)' }}>
                {ROLE_LIST.map(role => <option key={role} value={role} style={{ color: getBaseRoleColor(role) }}>{role}</option>)}
              </select>
              <button onClick={addPlayer} style={{ padding: '10px 20px', backgroundColor: 'rgb(102, 0, 0)', color: 'white', border: 'none', cursor: 'pointer' }}>Tambah</button>
            </div>
            {players.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgb(34, 34, 34)' }}>
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
                    <h3 style={{ color: 'lightgray' }}>
                      Sekarang Bangun: {rolesToCall[currentRoleIndex]}
                      {rolesToCall[currentRoleIndex] === 'Werewolf & Wolf Cub' && wwStatus === 'DOUBLE' ? ' (Pilih 2 Pemain - Wolf Cub Balas Dendam)' : ''}
                      {rolesToCall[currentRoleIndex] === 'Werewolf & Wolf Cub' && wwStatus === 'SKIP' ? ' (Terkena Efek Diseased - Skip)' : ''}
                    </h3>
                    
                    <div style={{ margin: '20px 0', border: '1px solid rgb(51, 51, 51)' }}>
                      {players.filter(p => p.isAlive).map((p, i) => (
                        <div key={i} onClick={() => handleAction(rolesToCall[currentRoleIndex], p.name)} style={{ padding: '12px', cursor: 'pointer', backgroundColor: isSelectedForNightAction(rolesToCall[currentRoleIndex], p.name) ? 'rgb(68, 68, 255)' : 'transparent', borderBottom: '1px solid rgb(34, 34, 34)' }}>
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
                <h3 style={{ color: 'rgb(255, 68, 68)' }}>Ringkasan Kejadian Malam:</h3>
                
                <div style={{ padding: '10px 0', marginBottom: '20px', borderBottom: '1px solid rgb(51, 51, 51)' }}>
                  {getNightActionSummary().map((text, i) => (
                    <div key={i} style={{ padding: '5px 0', fontSize: '0.9rem', color: 'lightgray' }}>{text}</div>
                  ))}
                  {getNightActionSummary().length === 0 && <div style={{ color: 'gray' }}>Tidak ada aksi malam ini</div>}
                </div>

                <h3 style={{ color: 'rgb(255, 68, 68)' }}>Status Pemain:</h3>
                {players.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgb(34, 34, 34)', opacity: p.isAlive ? 1 : 0.5 }}>
                    <span>
                      {p.name} ({p.role}) {p.transformedTo && <span style={{ color: 'yellow' }}>
                        {p.role === 'Cursed' ? `( cursed berubah menjadi werewolf )` : `( doppelganger berubah menjadi ${p.transformedTo} )`}
                      </span>}
                      {isPemainKekasih(p.name) && <span style={{ color: 'pink', fontSize: '0.8rem' }}> ( terkena efek cupid )</span>}
                    </span>
                    <button onClick={() => toggleAlive(i)} style={{ padding: '5px 10px', backgroundColor: p.isAlive ? 'rgb(102, 0, 0)' : 'rgb(51, 51, 51)', color: 'white', border: 'none', cursor: 'pointer' }}>{p.isAlive ? 'Bunuh' : 'Hidupkan'}</button>
                  </div>
                ))}
                <button onClick={goToDay} style={{ width: '100%', padding: '15px', backgroundColor: 'rgb(204, 204, 0)', color: 'black', marginTop: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Lanjut ke Pagi</button>
              </div>
            )}
          </div>
        )}

        {phase === 'DAY' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'rgb(204, 204, 0)' }}>Pagi {dayCount}</h2>
            <div style={{ fontSize: '3.5rem', margin: '20px 0' }}>{Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</div>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none' }}>{isTimerRunning ? 'Pause' : 'Start'}</button>
            
            {hunterPrompt && (
              <div style={{ backgroundColor: 'rgb(102, 0, 0)', color: 'white', padding: '15px', margin: '20px 0', borderRadius: '8px', border: '1px solid red' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Peringatan Hunter Mati</h3>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>Hunter telah terbunuh. Tanya pemain Hunter siapa yang ingin dia tembak mati lalu tekan tombol Eksekusi pada pemain tersebut di sesi voting</p>
                <button onClick={() => setHunterPrompt(false)} style={{ padding: '8px 15px', backgroundColor: 'white', color: 'rgb(102, 0, 0)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Tutup Peringatan</button>
              </div>
            )}

            <button onClick={() => setPhase('VOTING')} style={{ width: '100%', padding: '15px', backgroundColor: 'darkred', color: 'white', marginTop: '40px', border: 'none', cursor: 'pointer' }}>Masuk Sesi Voting</button>
          </div>
        )}

        {phase === 'VOTING' && (
          <div>
            <h2 style={{ color: 'rgb(255, 68, 68)' }}>Sesi Voting</h2>
            {hunterPrompt && (
              <div style={{ backgroundColor: 'rgb(102, 0, 0)', color: 'white', padding: '15px', margin: '20px 0', borderRadius: '8px', border: '1px solid red' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>Hunter telah terbunuh. Silakan eksekusi pemain yang ditembak Hunter</p>
                <button onClick={() => setHunterPrompt(false)} style={{ padding: '8px 15px', backgroundColor: 'white', color: 'rgb(102, 0, 0)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Selesai</button>
              </div>
            )}
            {players.filter(p => p.isAlive).map((p, i) => {
              const realIdx = players.findIndex(orig => orig.name === p.name)
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgb(34, 34, 34)' }}>
                  <span>
                    {p.name} ({p.role}) {p.transformedTo && <span style={{ color: 'yellow' }}>
                      {p.role === 'Cursed' ? `( cursed berubah menjadi werewolf )` : `( doppelganger berubah menjadi ${p.transformedTo} )`}
                    </span>}
                    {isPemainKekasih(p.name) && <span style={{ color: 'pink', fontSize: '0.8rem' }}> ( terkena efek cupid )</span>}
                  </span>
                  <button onClick={() => handleExecution(realIdx)} style={{ backgroundColor: 'rgb(102, 0, 0)', color: 'white', border: 'none', padding: '5px 15px', cursor: 'pointer' }}>Eksekusi</button>
                </div>
              )
            })}
            <button onClick={() => { setDayCount(dayCount + 1); startNight(dayCount + 1) }} style={{ width: '100%', padding: '15px', backgroundColor: 'rgb(0, 0, 68)', color: 'white', marginTop: '30px', border: 'none', cursor: 'pointer' }}>Malam Berikutnya</button>
          </div>
        )}
      </div>
    </div>
  )
}