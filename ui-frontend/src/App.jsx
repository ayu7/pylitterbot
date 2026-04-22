import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { ActivityPage } from './pages/ActivityPage'
import { ControlsPage as DevicesPage } from './pages/ControlsPage'
import { robotService } from './services/robotService'
import './App.css'

function App() {
  const [robots, setRobots] = useState([])
  const [selectedRobotId, setSelectedRobotId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadRobots = async () => {
      try {
        setLoading(true)
        const robotList = await robotService.getRobots()
        if (robotList.length > 0) {
          setRobots(robotList)
          setSelectedRobotId(robotList[0].id)
        }
      } catch (err) {
        setError(`Failed to load robots: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadRobots()
  }, [])

  if (loading) {
    return <div className="app-container"><p>Loading...</p></div>
  }

  if (error) {
    return <div className="app-container"><p className="error-message">{error}</p></div>
  }

  if (robots.length === 0) {
    return (
      <div className="app-container">
        <p>No robots found. Please configure your Litter Robot account.</p>
      </div>
    )
  }

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>Litter Robot Control Center</h1>
          <nav className="app-nav">
            <Link to="/" className="nav-link">Activities</Link>
            <Link to="/devices" className="nav-link">Devices</Link>
          </nav>
        </header>

        {robots.length > 1 && (
          <div className="robot-selector">
            <label htmlFor="robot-select">Select Robot: </label>
            <select
              id="robot-select"
              value={selectedRobotId || ''}
              onChange={(e) => setSelectedRobotId(e.target.value)}
            >
              {robots.map((robot) => (
                <option key={robot.id} value={robot.id}>
                  {robot.name} ({robot.model})
                </option>
              ))}
            </select>
          </div>
        )}

        <main className="app-main">
          <Routes>
            <Route path="/" element={<ActivityPage robotId={selectedRobotId} />} />
            <Route path="/devices" element={<DevicesPage robotId={selectedRobotId} />} />
          </Routes>
        </main>

        <footer className="app-footer">
        </footer>
      </div>
    </Router>
  )
}

export default App
