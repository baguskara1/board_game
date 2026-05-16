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
  const savedState = JSON.parse(localStorage.getItem('werewolf_game_state') || '{}')

  const [players, setPlayers] = useState(savedState.players || [])
  const [nameInput, setNameInput] = useState('')
  const [roleInput, setRoleInput] = useState('Villager')
  const [phase, setPhase] = useState(savedState.phase || 'SETUP')
  const [dayCount, setDayCount] = useState(savedState.dayCount || 1)
  const [timeLeft, setTimeLeft] = useState(savedState.timeLeft !== undefined ? savedState.timeLeft : 300)
  const [isTimerRunning, setIsTimerRunning] = useState(savedState.isTimerRunning || false)
  const [rolesToCall, setRolesToCall] = useState(savedState.rolesToCall || [])
  const [currentRoleIndex, setCurrentRoleIndex] = useState(savedState.currentRoleIndex || 0)
  const [nightLogs, setNightLogs] = useState(savedState.nightLogs || {})
  const [showSummary, setShowSummary] = useState(savedState.showSummary || false)
  const [winner, setWinner] = useState(savedState.winner || null)
  
  const [doppelTarget, setDoppelTarget] = useState(savedState.doppelTarget || null)
  const [cupidPair, setCupidPair] = useState(savedState.cupidPair || [])
  const [wwStatus, setWwStatus] = useState(savedState.wwStatus || 'NORMAL')
  const [wwPicks, setWwPicks] = useState(savedState.wwPicks || [])
  const [hunterPrompt, setHunterPrompt] = useState(savedState.hunterPrompt || false)
  
  const [gameHistory, setGameHistory] = useState(savedState.gameHistory || [])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyStack, setHistoryStack] = useState(savedState.historyStack || [])

  const [editingIndex, setEditingIndex] = useState(null)
  const [editNameInput, setEditNameInput] = useState('')

  useEffect(() => {
    let interval = null
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (isTimerRunning && timeLeft === 0) {
      setIsTimerRunning(false)
      playAlarm()
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timeLeft])

  useEffect(() => {
    const gameState = {
      players, phase, dayCount, timeLeft, isTimerRunning, rolesToCall,
      currentRoleIndex, nightLogs, showSummary, winner, doppelTarget,
      cupidPair, wwStatus, wwPicks, hunterPrompt, gameHistory, historyStack
    }
    localStorage.setItem('werewolf_game_state', JSON.stringify(gameState))
  }, [players, phase, dayCount, timeLeft, isTimerRunning, rolesToCall, currentRoleIndex, nightLogs, showSummary, winner, doppelTarget, cupidPair, wwStatus, wwPicks, hunterPrompt, gameHistory, historyStack])

  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 1.5)
    } catch (e) {
      console.log('Audio tidak didukung')
    }
  }

  const saveSnapshot = () => {
    const snapshot = {
      players, phase, dayCount, timeLeft, isTimerRunning, rolesToCall,
      currentRoleIndex, nightLogs, showSummary, winner, doppelTarget,
      cupidPair, wwStatus, wwPicks, hunterPrompt, gameHistory
    }
    setHistoryStack(prev => [...prev.slice(-14), snapshot])
  }

  const handleUndo = () => {
    if (historyStack.length === 0) return
    const last = historyStack[historyStack.length - 1]
    
    setPlayers(last.players)
    setPhase(last.phase)
    setDayCount(last.dayCount)
    setTimeLeft(last.timeLeft)
    setIsTimerRunning(last.isTimerRunning)
    setRolesToCall(last.rolesToCall)
    setCurrentRoleIndex(last.currentRoleIndex)
    setNightLogs(last.nightLogs)
    setShowSummary(last.showSummary)
    setWinner(last.winner)
    setDoppelTarget(last.doppelTarget)
    setCupidPair(last.cupidPair)
    setWwStatus(last.wwStatus)
    setWwPicks(last.wwPicks)
    setHunterPrompt(last.hunterPrompt)
    setGameHistory(last.gameHistory)
    
    setHistoryStack(prev => prev.slice(0, -1))
  }

  const handleResetGame = () => {
    if (window.confirm("Hapus semua data dan mulai permainan baru?")) {
      localStorage.removeItem('werewolf_game_state')
      window.location.reload()
    }
  }

  const addPlayer = () => {
    if (!nameInput) return
    saveSnapshot()
    setPlayers([...players, { name: nameInput, role: roleInput, isAlive: true, transformedTo: null }])
    setNameInput('')
  }

  const removePlayer = (index) => {
    saveSnapshot()
    const newPlayers = players.filter((_, i) => i !== index)
    setPlayers(newPlayers)
  }

  const saveEdit = (index) => {
    if (!editNameInput.trim()) return
    saveSnapshot()
    const newPlayers = [...players]
    newPlayers[index].name = editNameInput.trim()
    setPlayers(newPlayers)
    setEditingIndex(null)
    setEditNameInput('')
  }

  const toggleAlive = (index) => {
    saveSnapshot()
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
    saveSnapshot()
    const p = players[index]
    
    setGameHistory(prev => [...prev, { 
      phaseLabel: `Siang ${dayCount} - Hasil Voting`, 
      logs: [`${p.name} (${p.transformedTo || p.role}) telah dieksekusi.`] 
    }])

    if (p.role === 'Joker') {
      setWinner('JOKER')
    }
    if (p.role === 'Wolf Cub' || p.transformedTo === 'Wolf Cub') {
      setWwStatus('DOUBLE')
    }
    
    const deadPlayerName = p.name
    const deadPlayerRole = p.role
    const isActuallyDying = p.isAlive

    if (isActuallyDying && (deadPlayerRole === 'Hunter' || p.transformedTo === 'Hunter')) {
      setHunterPrompt(true)
    }

    const newPlayers = players.map((pl, i) => {
      if (i === index) return { ...pl, isAlive: !pl.isAlive }
      if (isActuallyDying && pl.isAlive && pl.role === 'Doppelganger' && doppelTarget === deadPlayerName) {
        return { ...pl, transformedTo: deadPlayerRole }
      }
      return pl
    })
    
    setPlayers(newPlayers)
  }

  const startNight = (forcedDay) => {
    saveSnapshot()
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
    saveSnapshot()
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
    
    if (role === "Doppelganger") return `Doppelganger meniru ${target} Perannya sebagai ${targetPlayer?.role}`
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
    saveSnapshot()
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
    saveSnapshot()
    setPhase('DAY')
    setTimeLeft(300)
    setIsTimerRunning(false)

    const summary = getNightActionSummary()
    setGameHistory(prev => [...prev, { 
      phaseLabel: `Malam ${dayCount}`, 
      logs: summary.length > 0 ? summary : ["Tidak ada aksi yang membuahkan hasil atau dilakukan"] 
    }])

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

  const isProtectedByGuardian = (playerName) => {
    return nightLogs['Guardian'] === playerName
  }

  const isSelectedForNightAction = (role, playerName) => {
    const targets = nightLogs[role]
    if (!targets) return false
    return targets.split(" dan ").includes(playerName)
  }

  if (winner === 'JOKER') {
    return (
      <div style={{ backgroundColor: 'rgb(5, 5, 5)', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'serif', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: COLOR_LONERS, fontSize: 'clamp(2.5rem, 5vw, 4rem)', margin: '0 0 20px 0' }}>Joker Menang</h1>
        <p style={{ fontSize: '1.2rem', margin: '0 0 30px 0' }}>Warga telah tertipu dan mengeksekusi Joker</p>
        <button onClick={handleResetGame} style={{ padding: '15px 30px', backgroundColor: COLOR_LONERS, color: 'white', border: 'none', cursor: 'pointer', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', width: '100%', maxWidth: '300px' }}>Selesai dan Main Lagi</button>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'rgb(5, 5, 5)', color: 'lightgray', minHeight: '100vh', padding: '15px', fontFamily: 'serif', boxSizing: 'border-box' }}>
      <style>
        {`
          * { box-sizing: border-box }
          body, html { margin: 0 padding: 0 background-color: rgb(5, 5, 5) }
          input, select, button { font-family: serif }
        `}
      </style>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={handleUndo} disabled={historyStack.length === 0} style={{ padding: '10px 15px', backgroundColor: historyStack.length === 0 ? '#333' : 'rgb(0, 102, 204)', color: 'white', border: 'none', borderRadius: '4px', cursor: historyStack.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Kembali Batal Aksi</button>
        <button onClick={() => setShowHistoryModal(!showHistoryModal)} style={{ padding: '10px 15px', backgroundColor: 'rgb(153, 102, 0)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Lihat Riwayat</button>
        <button onClick={handleResetGame} style={{ padding: '10px 15px', backgroundColor: '#333', color: 'rgb(255, 68, 68)', border: '1px solid rgb(255, 68, 68)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Reset Data</button>
      </div>

      {showHistoryModal && (
        <div style={{ backgroundColor: 'rgb(17, 17, 17)', padding: '20px', borderRadius: '8px', border: '1px solid rgb(153, 102, 0)', maxWidth: '600px', margin: '0 auto 20px auto' }}>
          <h2 style={{ color: 'rgb(255, 204, 0)', marginTop: 0 }}>Catatan Riwayat</h2>
          {gameHistory.length === 0 && <p style={{ color: 'gray' }}>Belum ada riwayat tersimpan</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {gameHistory.map((history, idx) => (
              <div key={idx} style={{ paddingBottom: '10px', borderBottom: '1px solid rgb(51, 51, 51)' }}>
                <h4 style={{ color: 'white', margin: '0 0 5px 0' }}>{history.phaseLabel}</h4>
                {history.logs.map((log, lIdx) => (
                  <div key={lIdx} style={{ fontSize: '0.9rem', color: 'lightgray' }}>{log}</div>
                ))}
              </div>
            ))}
          </div>
          <button onClick={() => setShowHistoryModal(false)} style={{ width: '100%', padding: '10px', marginTop: '15px', backgroundColor: 'rgb(51, 51, 51)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Tutup Riwayat</button>
        </div>
      )}

      <h1 style={{ color: 'darkred', textAlign: 'center', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', margin: '10px 0 20px 0' }}>Werewolf But As A HOST</h1>
      
      <div style={{ backgroundColor: 'rgb(17, 17, 17)', padding: '20px', borderRadius: '8px', border: '1px solid rgb(102, 0, 0)', maxWidth: '600px', width: '100%', margin: '0 auto' }}>
        
        {phase === 'SETUP' && (
          <div>
            <h2 style={{ color: 'white', marginTop: 0 }}>Fase Persiapan</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '25px' }}>
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Nama Pemain" style={{ flex: '1 1 100%', minWidth: '140px', padding: '12px', backgroundColor: 'black', color: 'white', border: '1px solid rgb(68, 68, 68)', borderRadius: '4px' }} />
              <select value={roleInput} onChange={(e) => setRoleInput(e.target.value)} style={{ flex: '1 1 100%', minWidth: '140px', padding: '12px', backgroundColor: 'black', color: getBaseRoleColor(roleInput), border: '1px solid rgb(68, 68, 68)', borderRadius: '4px' }}>
                {ROLE_LIST.map(role => <option key={role} value={role} style={{ color: getBaseRoleColor(role) }}>{role}</option>)}
              </select>
              <button onClick={addPlayer} style={{ flex: '1 1 100%', padding: '12px', backgroundColor: 'rgb(102, 0, 0)', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>Tambah Pemain</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {players.map((p, i) => (
                <div key={i} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'black', border: '1px solid rgb(34, 34, 34)', borderRadius: '4px', gap: '10px' }}>
                  {editingIndex === i ? (
                    <div style={{ display: 'flex', flex: '1 1 100%', gap: '10px' }}>
                      <input value={editNameInput} onChange={(e) => setEditNameInput(e.target.value)} style={{ flex: 1, padding: '8px', backgroundColor: 'rgb(34, 34, 34)', color: 'white', border: 'none', borderRadius: '4px' }} />
                      <button onClick={() => saveEdit(i)} style={{ padding: '8px 12px', backgroundColor: 'rgb(0, 102, 204)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Simpan</button>
                      <button onClick={() => setEditingIndex(null)} style={{ padding: '8px 12px', backgroundColor: 'rgb(102, 0, 0)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Batal</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ flex: '1 1 auto', wordBreak: 'break-word', paddingRight: '10px' }}>{p.name}</span>
                      <span style={{ flex: '0 0 auto', color: getRoleColor(p), fontWeight: 'bold' }}>{p.role}</span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => { setEditingIndex(i) setEditNameInput(p.name) }} style={{ padding: '5px 10px', backgroundColor: 'rgb(51, 51, 51)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>Edit</button>
                        <button onClick={() => removePlayer(i)} style={{ padding: '5px 10px', backgroundColor: 'rgb(102, 0, 0)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>Hapus</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            {players.length > 0 && <button onClick={() => startNight(1)} style={{ width: '100%', padding: '15px', backgroundColor: 'darkred', color: 'white', marginTop: '25px', cursor: 'pointer', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem' }}>Mulai Permainan</button>}
          </div>
        )}

        {phase === 'NIGHT' && (
          <div>
            <h2 style={{ color: 'rgb(68, 68, 255)', marginTop: 0 }}>Malam {dayCount}</h2>
            {currentRoleIndex < rolesToCall.length ? (
              <div style={{ padding: '20px', backgroundColor: 'rgb(0, 0, 34)', border: '1px solid rgb(68, 68, 255)', borderRadius: '8px' }}>
                {!showSummary ? (
                  <>
                    <h3 style={{ color: 'lightgray', margin: '0 0 15px 0', fontSize: '1.1rem', lineHeight: '1.4' }}>
                      Sekarang Bangun<br/>
                      <span style={{ color: 'white', fontSize: '1.5rem' }}>{rolesToCall[currentRoleIndex]}</span>
                      {rolesToCall[currentRoleIndex] === 'Werewolf & Wolf Cub' && wwStatus === 'DOUBLE' && <div style={{ color: 'rgb(255, 68, 68)', fontSize: '0.9rem', marginTop: '5px' }}>Pilih 2 Pemain Wolf Cub Balas Dendam</div>}
                      {rolesToCall[currentRoleIndex] === 'Werewolf & Wolf Cub' && wwStatus === 'SKIP' && <div style={{ color: 'rgb(255, 255, 68)', fontSize: '0.9rem', marginTop: '5px' }}>Terkena Efek Diseased Skip</div>}
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '20px 0' }}>
                      {players.filter(p => p.isAlive).map((p, i) => (
                        <div key={i} onClick={() => handleAction(rolesToCall[currentRoleIndex], p.name)} style={{ padding: '15px', cursor: 'pointer', backgroundColor: isSelectedForNightAction(rolesToCall[currentRoleIndex], p.name) ? 'rgb(68, 68, 255)' : 'rgba(0, 0, 0, 0.5)', border: '1px solid rgb(51, 51, 51)', borderRadius: '4px', wordBreak: 'break-word' }}>
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <h3 style={{ color: 'rgb(255, 68, 68)', marginTop: 0 }}>Aksi Tercatat</h3>
                    <p style={{ fontSize: '1.1rem', color: 'white', lineHeight: '1.5', margin: '0' }}>{getSummaryMessage()}</p>
                  </div>
                )}
                <button onClick={nextStep} style={{ width: '100%', padding: '15px', backgroundColor: 'rgb(68, 68, 255)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px', fontSize: '1.1rem' }}>{showSummary ? 'Konfirmasi Lanjut' : 'Peran Berikutnya'}</button>
              </div>
            ) : (
              <div>
                <h3 style={{ color: 'rgb(255, 68, 68)', marginTop: 0 }}>Ringkasan Kejadian Malam</h3>
                
                <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgb(51, 51, 51)', borderRadius: '8px' }}>
                  {getNightActionSummary().map((text, i) => (
                    <div key={i} style={{ padding: '8px 0', fontSize: '0.95rem', color: 'lightgray', borderBottom: i === getNightActionSummary().length - 1 ? 'none' : '1px solid rgb(34, 34, 34)', wordBreak: 'break-word', lineHeight: '1.4' }}>{text}</div>
                  ))}
                  {getNightActionSummary().length === 0 && <div style={{ color: 'gray', textAlign: 'center', padding: '10px 0' }}>Tidak ada aksi malam ini</div>}
                </div>

                <h3 style={{ color: 'rgb(255, 68, 68)' }}>Status Pemain</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {players.map((p, i) => (
                    <div key={i} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'black', border: '1px solid rgb(34, 34, 34)', borderRadius: '4px', opacity: p.isAlive ? 1 : 0.5, gap: '10px' }}>
                      <span style={{ flex: '1 1 auto', wordBreak: 'break-word', lineHeight: '1.4' }}>
                        <span style={{ fontWeight: 'bold', textDecoration: p.isAlive ? 'none' : 'line-through' }}>{p.name}</span>
                        <br/>
                        <span style={{ fontSize: '0.9rem', color: 'gray' }}>{p.role}</span>
                        {p.transformedTo && <span style={{ color: 'yellow', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                          {p.role === 'Cursed' ? `cursed berubah menjadi werewolf` : `doppelganger berubah menjadi ${p.transformedTo}`}
                        </span>}
                        {isPemainKekasih(p.name) && <span style={{ color: 'pink', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>terkena efek cupid</span>}
                        {isProtectedByGuardian(p.name) && <span style={{ color: 'cyan', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>terlindungi oleh guardian</span>}
                      </span>
                      <button onClick={() => toggleAlive(i)} style={{ flex: '0 0 auto', padding: '8px 15px', backgroundColor: p.isAlive ? 'rgb(102, 0, 0)' : 'rgb(51, 51, 51)', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{p.isAlive ? 'Bunuh' : 'Hidupkan'}</button>
                    </div>
                  ))}
                </div>
                <button onClick={goToDay} style={{ width: '100%', padding: '15px', backgroundColor: 'rgb(204, 204, 0)', color: 'black', marginTop: '25px', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '1.1rem' }}>Lanjut ke Pagi</button>
              </div>
            )}
          </div>
        )}

        {phase === 'DAY' && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'rgb(204, 204, 0)', marginTop: 0 }}>Pagi {dayCount}</h2>
            <div style={{ fontSize: 'clamp(3rem, 10vw, 4rem)', margin: '30px 0', fontWeight: 'bold', fontFamily: 'monospace', color: timeLeft === 0 ? 'red' : 'lightgray' }}>{Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}</div>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} style={{ width: '100%', maxWidth: '200px', padding: '15px', cursor: 'pointer', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: isTimerRunning ? 'rgb(51, 51, 51)' : 'white', color: isTimerRunning ? 'white' : 'black' }}>{isTimerRunning ? 'Pause' : 'Start Timer'}</button>
            
            {hunterPrompt && (
              <div style={{ backgroundColor: 'rgb(102, 0, 0)', color: 'white', padding: '20px', margin: '30px 0', borderRadius: '8px', border: '2px solid red', textAlign: 'left' }}>
                <h3 style={{ margin: '0 0 15px 0', color: 'yellow' }}>Peringatan Hunter Mati</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '1rem', lineHeight: '1.5' }}>Hunter telah terbunuh Tanya pemain Hunter siapa yang ingin dia tembak mati lalu tekan tombol Eksekusi pada pemain tersebut di sesi voting</p>
                <button onClick={() => setHunterPrompt(false)} style={{ width: '100%', padding: '12px', backgroundColor: 'white', color: 'rgb(102, 0, 0)', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}>Tutup Peringatan</button>
              </div>
            )}

            <button onClick={() => setPhase('VOTING')} style={{ width: '100%', padding: '15px', backgroundColor: 'darkred', color: 'white', marginTop: '40px', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem' }}>Masuk Sesi Voting</button>
          </div>
        )}

        {phase === 'VOTING' && (
          <div>
            <h2 style={{ color: 'rgb(255, 68, 68)', marginTop: 0 }}>Sesi Voting</h2>
            {hunterPrompt && (
              <div style={{ backgroundColor: 'rgb(102, 0, 0)', color: 'white', padding: '15px', margin: '0 0 20px 0', borderRadius: '8px', border: '2px solid red' }}>
                <p style={{ margin: '0 0 15px 0', fontSize: '1rem', lineHeight: '1.4' }}>Hunter telah terbunuh Silakan eksekusi pemain yang ditembak Hunter terlebih dahulu</p>
                <button onClick={() => setHunterPrompt(false)} style={{ width: '100%', padding: '12px', backgroundColor: 'white', color: 'rgb(102, 0, 0)', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}>Selesai Eksekusi Hunter</button>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {players.filter(p => p.isAlive).map((p, i) => {
                const realIdx = players.findIndex(orig => orig.name === p.name)
                return (
                  <div key={i} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'black', border: '1px solid rgb(34, 34, 34)', borderRadius: '4px', gap: '10px' }}>
                    <span style={{ flex: '1 1 auto', wordBreak: 'break-word', lineHeight: '1.4' }}>
                      <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                      <br/>
                      <span style={{ fontSize: '0.9rem', color: 'gray' }}>{p.role}</span>
                      {p.transformedTo && <span style={{ color: 'yellow', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                        {p.role === 'Cursed' ? `cursed berubah menjadi werewolf` : `doppelganger berubah menjadi ${p.transformedTo}`}
                      </span>}
                      {isPemainKekasih(p.name) && <span style={{ color: 'pink', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>terkena efek cupid</span>}
                      {isProtectedByGuardian(p.name) && <span style={{ color: 'cyan', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>terlindungi oleh guardian</span>}
                    </span>
                    <button onClick={() => handleExecution(realIdx)} style={{ flex: '0 0 auto', backgroundColor: 'rgb(102, 0, 0)', color: 'white', border: 'none', padding: '10px 15px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Eksekusi</button>
                  </div>
                )
              })}
            </div>
            
            <button onClick={() => { setDayCount(dayCount + 1) startNight(dayCount + 1) }} style={{ width: '100%', padding: '15px', backgroundColor: 'rgb(0, 0, 68)', color: 'white', marginTop: '30px', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem' }}>Lanjut Malam Berikutnya</button>
          </div>
        )}
      </div>
    </div>
  )
}