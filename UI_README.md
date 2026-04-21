# Litter Robot UI

A modern web-based interface for controlling and monitoring your Litter Robot with real-time activity tracking.

## Features

### 📊 Activities Page (Home)
- View recent activities and events from your Litter Robot
- Automatically refreshes every 30 seconds
- Real-time activity log with timestamps
- Clean, scrollable list interface

### 🎮 Controls Page
- **Robot Status**: View current status, power state, and online status
- **Cycle Information**: Track waste drawer capacity and cycle count
- **Control Commands**:
  - Initiate immediate cleaning cycle
  - Toggle night light mode
  - Toggle panel lock
  - Power on/off control
- **Drawer Management**: Reset waste drawer counter when full
- **Status Monitoring**: Real-time updates every 10 seconds

## Project Structure

```
ui-backend/              # FastAPI backend server
  main.py              # FastAPI application with all routes
  requirements.txt     # Python dependencies
  .env.example         # Environment variables template

ui-frontend/            # React frontend application
  src/
    pages/            # Page components
      ActivityPage.jsx    # Recent activities display
      ControlsPage.jsx    # Robot control interface
    services/         # API communication
      robotService.js     # Robot API client
    styles/           # Component styles
      ActivityPage.css
      ControlsPage.css
    App.jsx           # Main application component
    App.css           # App-level styles
    main.jsx          # React entry point
    index.css         # Global styles
  index.html          # HTML entry point
  vite.config.js      # Vite configuration
  package.json        # JavaScript dependencies
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+ and npm
- Your Litter Robot account credentials

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd ui-backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Litter Robot credentials
   ```

5. **Run the server:**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd ui-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   The UI will be available at `http://localhost:3000`

## API Endpoints

### Health & Status
- `GET /health` - Check API health

### Robot Information
- `GET /robots` - List all available robots
- `GET /robots/{robot_id}/status` - Get detailed robot status

### Activities
- `GET /robots/{robot_id}/activities?limit=20` - Get recent activities

### Controls
- `POST /robots/{robot_id}/control` - Send control command
  - Actions: `clean`, `power_on`, `power_off`, `night_light_on`, `night_light_off`, `lock_on`, `lock_off`
- `POST /robots/{robot_id}/reset-drawer` - Reset waste drawer counter

## Configuration

### Environment Variables (.env)
```
LITTER_ROBOT_EMAIL=your_email@example.com
LITTER_ROBOT_PASSWORD=your_password
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False
```

## Development

### Running Both Servers

**Terminal 1 - Backend:**
```bash
cd ui-backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd ui-frontend
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd ui-frontend
npm run build
```
The built files will be in `ui-frontend/dist/`

**Backend:**
```bash
cd ui-backend
python -m pip install gunicorn
gunicorn -w 4 main:app
```

## Integration with pylitterbot

The backend is designed to integrate with the main `pylitterbot` library. Currently, it has placeholder API endpoints. To enable full functionality:

1. Update `ui-backend/main.py` to use the actual `pylitterbot` Session and Account classes
2. Populate endpoints with real robot data from your account
3. Implement actual control commands through the library

Example integration:
```python
from pylitterbot import Account

@app.on_event("startup")
async def startup_event():
    account = Account()
    await account.connect(email, password)
    global robots
    robots = account.robots
```

## Features Roadmap

- [ ] Real-time WebSocket updates for activities
- [ ] Historical analytics and statistics
- [ ] Pet information display
- [ ] Sleep schedule configuration
- [ ] Notifications and alerts
- [ ] Multi-robot support improvements
- [ ] Mobile app support

## Troubleshooting

### CORS Issues
Ensure both servers are running and the frontend is configured to proxy to the backend (see `vite.config.js`)

### API Connection Issues
- Check that the backend is running on `http://localhost:8000`
- Verify network connectivity between frontend and backend
- Check browser console for detailed error messages

### Robot Not Showing
- Verify credentials in `.env` are correct
- Ensure Litter Robot account has active robot(s)
- Check backend logs for authentication errors

## License

This project is part of the pylitterbot library. See the main project LICENSE for details.
